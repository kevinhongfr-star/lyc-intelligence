# Phase 1.0 — Auth System Unification

**Status:** DRAFT — Pending Kevin approval  
**Priority:** P0 (blocks all portal work)  
**Estimated effort:** 1–2 days  
**Dependency:** None (foundational — must be done before Phase 1.1, 1.2, 1.3)

---

## 1. Problem Statement

The application has **two parallel authentication systems** providing inconsistent user state to different parts of the UI. This causes:

- **AppLayout (sidebar)** uses `useAuth` (React Context) → gets minimal user `{ id, email, name, icp, role }`
- **All 26+ pages** use `useAuthStore` (Zustand) → gets full profile `{ id, email, name, role, tier, icp, organization_id, subtype, ... }`
- **NexusPage** and **SettingsPage** use `useAuth` → may show different user state than the page content
- Role-based navigation is impossible because `useAuth` doesn't expose `tier` or `organization_id`

### Current State

| System | File | Export | Used By | User Shape |
|--------|------|--------|---------|------------|
| React Context | `src/contexts/AuthContext.tsx` | `useAuth()` | AppLayout, NexusPage, SettingsPage | `{ id, email, name, icp, role }` |
| Zustand Store | `src/stores/authStore.ts` | `useAuthStore()` | App.tsx (ProtectedRoute, AdminRoute), DashboardPage, 26+ pages | Full `UserProfile` with Supabase session |

### Why This Is Dangerous

1. AppLayout renders the sidebar based on `useAuth().user.role` which is set from hardcoded `ADMIN_EMAILS` or a simple profile lookup
2. ProtectedRoute/AdminRoute in App.tsx use `useAuthStore().profile.role` which comes from the actual Supabase profiles table
3. These two role sources can disagree → user sees sidebar items they shouldn't, or vice versa
4. The Context system has its own Supabase client instance (`sb`) separate from the Zustand store's client

---

## 2. Target State

**Single auth source:** `useAuthStore` (Zustand) is the only auth system.

- `src/contexts/AuthContext.tsx` → **deprecated**, then deleted
- `src/contexts/index.ts` → remove `useAuth` export (keep `CreditProvider`/`useCredits`)
- AppLayout → migrate from `useAuth()` to `useAuthStore()`
- NexusPage → migrate from `useAuth()` to `useAuthStore()`
- SettingsPage → migrate from `useAuth()` to `useAuthStore()`

---

## 3. Detailed Specification

### 3.1. Extend `useAuthStore` to Cover All `useAuth` Use Cases

The Zustand store already has everything needed. No new fields required. Verify that these are available:

```typescript
// From authStore.ts UserProfile interface:
{
  id: string;
  email: string;
  name: string;
  role: string | null;        // 'admin' | 'user' | (future: 'lyc_consultant', 'client_admin', etc.)
  tier: 'free' | 'pro' | 'council' | 'enterprise';
  icp: string | null;          // 'client' | 'consultant' | 'leader' | 'candidate'
  active_surface: string | null;
  organization_id: string | null;
  subtype: string | null;
  notion_profile_id: string | null;
  created_at: string;
  updated_at: string;
}
```

All three migrating components (AppLayout, NexusPage, SettingsPage) only need `user.email`, `user.name`, and `profile.role` — all already in the store.

### 3.2. Migrate AppLayout

**File:** `src/components/layout/AppLayout.tsx`

**Changes:**
```diff
- import { useAuth } from '@/contexts';
+ import { useAuthStore } from '@/stores/authStore';

  export function AppLayout() {
-   const { user, logout } = useAuth();
+   const { user, profile, signOut } = useAuthStore();
-   const userRole = (user as any)?.role || 'user';
+   const userRole = profile?.role || 'user';
    
    // Replace logout button:
-   <button onClick={logout}>
+   <button onClick={signOut}>
```

**Also:** AppLayout currently reads `user.email` for the sidebar footer — this should come from `user?.email` (Zustand user is the Supabase Auth User object which has `.email`).

### 3.3. Migrate NexusPage

**File:** `src/pages/NexusPage.tsx`

**Changes:**
```diff
- import { useAuth } from '@/contexts';
+ import { useAuthStore } from '@/stores/authStore';

  export function NexusPage() {
-   const { user } = useAuth();
+   const { user, profile } = useAuthStore();
    // user.email is available on the Supabase User object
    // profile.name is available for greeting
```

### 3.4. Migrate SettingsPage

**File:** `src/pages/SettingsPage.tsx`

**Changes:**
```diff
- import { useAuth } from '@/contexts';
+ import { useAuthStore } from '@/stores/authStore';

  export function SettingsPage() {
-   const { user } = useAuth();
+   const { user, profile } = useAuthStore();
```

### 3.5. Remove AuthContext

After all three components are migrated:

1. **Delete** `src/contexts/AuthContext.tsx`
2. **Update** `src/contexts/index.ts`:
   ```diff
   - export { AuthProvider, useAuth } from './AuthContext';
     export { CreditProvider, useCredits } from './CreditContext';
     export type { CreditTier, CreditInfo } from './CreditContext';
   ```
3. **Check** `src/main.tsx` — if `AuthProvider` wraps the app, remove it:
   ```diff
   - import { AuthProvider } from '@/contexts';
     // ...
     <ReactDOM.createRoot(...).render(
   -   <AuthProvider>
       <CreditProvider>
         <App />
       </CreditProvider>
   -   </AuthProvider>
     )
   ```

### 3.6. Verify No Other Imports

```bash
grep -rn "useAuth\b" src/ --include="*.tsx" --include="*.ts" | grep -v "useAuthStore"
```

This should return **zero results** after migration.

---

## 4. Acceptance Criteria

- [ ] `grep -rn "useAuth\b" src/` returns zero hits (excluding `useAuthStore`)
- [ ] `src/contexts/AuthContext.tsx` file deleted
- [ ] `src/contexts/index.ts` no longer exports `useAuth` or `AuthProvider`
- [ ] AppLayout sidebar shows correct user email and role
- [ ] NexusPage chat works with correct user identity
- [ ] SettingsPage displays correct user profile
- [ ] `npm run build` succeeds with zero errors
- [ ] No regression: all existing pages still load and authenticate correctly

---

## 5. Risk Assessment

| Risk | Mitigation |
|------|-----------|
| NexusPage uses `user` object differently (Context shape vs Supabase User shape) | Both have `.email`. Verify `.name` access — Zustand has it on `profile.name`, not `user.name` |
| AppLayout `logout()` vs authStore `signOut()` | Different function names. Update the button handler. |
| Missing `AuthProvider` in main.tsx causes crash | Check and remove the wrapper if present |

---

## 6. Files Changed

| File | Action |
|------|--------|
| `src/components/layout/AppLayout.tsx` | Modify: `useAuth` → `useAuthStore` |
| `src/pages/NexusPage.tsx` | Modify: `useAuth` → `useAuthStore` |
| `src/pages/SettingsPage.tsx` | Modify: `useAuth` → `useAuthStore` |
| `src/contexts/AuthContext.tsx` | **Delete** |
| `src/contexts/index.ts` | Modify: remove AuthContext exports |
| `src/main.tsx` | Possibly modify: remove `AuthProvider` wrapper |

---

## 7. Testing Checklist

1. Login via magic link → verify sidebar shows correct email
2. Navigate to Nexus → send a message → verify it works
3. Navigate to Settings → verify profile info displays
4. Logout from any page → verify redirect to /login
5. Refresh page → verify auth state persists (Zustand + Supabase session)
6. Check browser console for any auth-related errors

