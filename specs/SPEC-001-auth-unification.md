# SPEC-001: Auth Unification — Keep authStore, Delete AuthContext

**Decision**: Option A (Kevin approved 2026-05-30)
**Issues**: #100 (dual Supabase clients), #101 (no password check), #104 (broken logout)
**Estimate**: 1-2 hours

---

## Problem

Two independent auth systems with zero sync:
- **AuthContext** (`src/contexts/AuthContext.tsx`): Creates its own Supabase client. 3 consumers.
- **authStore** (`src/stores/authStore.ts`): Zustand store with its own Supabase client. 14 consumers.
- **supabaseApi.ts** (`src/services/supabaseApi.ts`): 3rd Supabase client for creditService.

Result:
- Logout via AppLayout calls `AuthContext.logout()` → clears AuthContext state only → authStore still thinks user is logged in → ProtectedRoute keeps them in
- AuthContext.login() has no password verification — just looks up email in profiles table and sets user
- Two Supabase client instances waste resources and can drift

## Target State

- **authStore** = single source of truth for all auth
- **AuthContext.tsx** = DELETED
- **supabaseApi.ts** `getSupabase()` = retained for read-only data queries (contacts, mandates, etc.) — NOT for auth or credit writes
- 3 files migrated from `useAuth()` → `useAuthStore()`

## Migration Map

### AuthContext API → authStore API

| AuthContext | authStore | Notes |
|-------------|-----------|-------|
| `useAuth()` | `useAuthStore()` | Hook swap |
| `user` (AuthContext: `{id, email, name, icp, role}`) | `user` (Supabase User) + `profile` (UserProfile) | Shape is different — see below |
| `login(email)` | `signInWithPassword(email, password)` or `signInWithMagicLink(email)` | AuthContext had no password; authStore does |
| `logout()` | `signOut()` | AuthContext just cleared local state; authStore calls supabase.auth.signOut() |
| `isLoading` | `isLoading` | Same |

### User shape migration

AuthContext returns: `{ id, email, name, icp, role }`
authStore returns: `user` (Supabase Auth User) + `profile` (UserProfile with 20+ fields)

Where consumers use `user.name` → `profile?.name`
Where consumers use `user.role` → `profile?.role`
Where consumers use `user.icp` → `profile?.icp`

## File-by-File Changes

### 1. `src/contexts/AuthContext.tsx` — DELETE

Entire file deleted.

### 2. `src/contexts/index.ts` — UPDATE

Remove `AuthProvider` and `useAuth` exports. Keep CreditProvider/useCredits.

```typescript
// BEFORE
export { AuthProvider, useAuth } from './AuthContext';
export { CreditProvider, useCredits } from './CreditContext';
export type { CreditTier, CreditInfo } from './CreditContext';

// AFTER
export { CreditProvider, useCredits } from './CreditContext';
export type { CreditTier, CreditInfo } from './CreditContext';
```

### 3. `src/main.tsx` — UPDATE

Remove `<AuthProvider>` wrapper. authStore initializes via `useAuthStore.initialize()` in App.tsx (already there).

```typescript
// BEFORE
import { AuthProvider } from './contexts';
<AuthProvider><App /></AuthProvider>

// AFTER
// Remove AuthProvider import entirely
<App />
```

### 4. `src/components/layout/AppLayout.tsx` — MIGRATE

```typescript
// BEFORE
import { useAuth } from '@/contexts';
const { user, logout } = useAuth();

// AFTER
import { useAuthStore } from '@/stores/authStore';
const { user, profile, signOut } = useAuthStore();
```

Template updates:
- `user?.name` → `profile?.name || user?.email?.split('@')[0]`
- `logout` → `signOut`
- `user?.email` → `user?.email` (same)
- `user?.role` → `profile?.role`

### 5. `src/pages/SettingsPage.tsx` — MIGRATE

```typescript
// BEFORE
import { useAuth } from '@/contexts';
const { user } = useAuth();

// AFTER
import { useAuthStore } from '@/stores/authStore';
const { user, profile } = useAuthStore();
```

Template updates:
- `user?.name` → `profile?.name || ''`
- `user?.email` → `user?.email || ''`
- `user?.role` → `profile?.role || ''`

### 6. `src/components/dashboard/ConsultantDashboard.tsx` — MIGRATE

```typescript
// BEFORE
import { useAuth } from '@/contexts';
const { user } = useAuth();

// AFTER
import { useAuthStore } from '@/stores/authStore';
const { user, profile } = useAuthStore();
```

Template updates:
- `user?.name?.split(' ')[0]` → `(profile?.name || user?.email?.split('@')[0] || 'there')?.split(' ')[0]`

## Verification Checklist

- [ ] `grep -rn "useAuth\|AuthProvider\|AuthContext" src/` → ZERO results (except maybe type comments)
- [ ] `grep -rn "from '@/contexts'" src/` → only CreditProvider/useCredits imports
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → success
- [ ] Login: email + password → authStore.signInWithPassword → session → redirect to dashboard
- [ ] Logout: click sign out → authStore.signOut → redirect to /login
- [ ] ProtectedRoute: unauthenticated → redirect to /login
- [ ] SettingsPage: shows user name/email/role from authStore.profile
- [ ] AppLayout sidebar: shows user name + credit display
- [ ] No orphaned Supabase client from deleted AuthContext

## Risk & Rollback

- Low risk: only 3 files to migrate, authStore already handles all auth flows
- Rollback: revert commit, restore AuthContext.tsx and contexts/index.ts
- Key concern: AuthContext.user had `icp` field; authStore profile has `icp` but under `profile.icp` not `user.icp` — verify all consumers
