# Phase 1.7 — Design System Deduplication & TODO Resolution

**Status:** DRAFT — Pending Kevin approval  
**Priority:** P2 (code quality — no user-facing impact, but maintenance burden)  
**Estimated effort:** 1–2 days  
**Dependency:** None (can be done anytime)

---

## 1. Problem Statement

### 1.1. DS Object Duplication

The design system (DS) configuration object — containing colors, typography, and spacing tokens — is **duplicated inline across 12+ page files** instead of being defined once in a shared module. Each page has its own copy:

```typescript
// This pattern appears in multiple page files:
const DS = {
  colors: {
    bg: '#0F0F0F',
    surface: '#1A1A1A',
    // ...
  },
  typography: {
    // ...
  },
  spacing: {
    // ...
  }
};
```

**Impact:**
- Design changes require editing 12+ files
- Risk of inconsistency between pages
- Increased bundle size (minor)
- Impossible to do a platform-wide design refresh without mass editing

### 1.2. TODO / Placeholder Content

Several pages contain TODO comments, placeholder text, or incomplete UI that degrades the user experience:

| File | Issue |
|------|-------|
| Various pages | `// TODO:` comments visible in production code |
| Empty states | Some pages show "Coming soon" with no fallback |
| Mock data | Some components use hardcoded fake data |

---

## 2. Target State

- Single `src/design-tokens.ts` file with all DS values
- All pages import from the shared module
- Zero TODO comments in production pages
- All empty states have proper fallback UI
- No mock/hardcoded data visible to users

---

## 3. Detailed Specification

### 3.1. Create Shared Design Tokens

**New file:** `src/design/tokens.ts`

```typescript
// src/design/tokens.ts
export const DS = {
  colors: {
    bg: {
      primary: '#0F0F0F',
      secondary: '#1A1A1A',
      tertiary: '#252525',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A0A0A0',
      muted: '#6B6B6B',
    },
    accent: '#C108AB',
    accentHover: '#A0078F',
    border: '#2A2A2A',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  typography: {
    fontFamily: {
      serif: "'Playfair Display', Georgia, serif",
      sans: "'Inter', -apple-system, sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    size: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  radius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.15)',
  },
} as const;

// Type export for consumers
export type DSTokens = typeof DS;
```

### 3.2. Identify and Audit DS Duplication

**Scan command:**
```bash
grep -rn "const DS = {" src/pages/ --include="*.tsx"
```

For each file with a DS object:
1. Compare with the canonical `tokens.ts`
2. Replace inline DS with import
3. Verify no visual regression

### 3.3. Migration Pattern

**Before:**
```typescript
// src/pages/SomePage.tsx
const DS = { colors: { bg: '#0F0F0F', ... }, ... };

export function SomePage() {
  return <div style={{ background: DS.colors.bg }}>...</div>;
}
```

**After:**
```typescript
// src/pages/SomePage.tsx
import { DS } from '@/design/tokens';

export function SomePage() {
  return <div style={{ background: DS.colors.bg }}>...</div>;
}
```

### 3.4. CSS Variables Integration

The app already uses CSS variables for theming (`data-theme` attribute). The DS tokens should complement, not replace, CSS variables:

- **CSS variables** (`--bg-primary`, `--text-primary`, etc.) → for styles in CSS/Tailwind classes
- **DS tokens** (`DS.colors.bg.primary`) → for inline styles in components

Both should reference the same values. Add a sync check in CI:
```typescript
// src/design/sync-check.ts (development only)
// Verify CSS variables match DS tokens
```

### 3.5. TODO Resolution

**Scan command:**
```bash
grep -rn "TODO\|FIXME\|HACK\|XXX\|Coming soon\|Placeholder" src/ --include="*.tsx" --include="*.ts"
```

**Resolution approach per TODO type:**

| TODO Type | Action |
|-----------|--------|
| Feature not yet built | Either build it (if in scope) or remove the TODO and add a ticket |
| Bug to fix | Fix it or create a tracking issue |
| Performance optimization | Evaluate if needed; remove TODO if not |
| Design improvement | Implement or remove |
| "Coming soon" placeholder | Replace with proper empty state or remove the section |

### 3.6. Empty State Standardization

Create a shared empty state component:

**New file:** `src/components/ui/EmptyState.tsx`

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="mb-4 text-text-muted">{icon}</div>}
      <h3 className="text-lg font-medium text-text-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-text-muted max-w-md mb-4">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="text-accent hover:underline text-sm font-medium">
          {action.label}
        </button>
      )}
    </div>
  );
}
```

**Usage in pages:**
```typescript
// Instead of "Coming soon" or empty divs:
{mandates.length === 0 && (
  <EmptyState
    icon={<Briefcase className="w-12 h-12" />}
    title="No active mandates"
    description="Create your first mandate to get started."
    action={{ label: "Create Mandate", onClick: () => navigate('/platform/mandates/new') }}
  />
)}
```

### 3.7. Mock Data Removal

Scan for hardcoded mock data:
```bash
grep -rn "mock\|fake\|dummy\|sample\|placeholder" src/ --include="*.tsx" --include="*.ts" -i
```

Replace with:
- Real Supabase queries
- Proper loading states
- Empty states (see 3.6)

---

## 4. Acceptance Criteria

- [ ] `grep -rn "const DS = {" src/pages/` returns zero results
- [ ] All pages import DS from `@/design/tokens`
- [ ] `grep -rn "TODO\|FIXME" src/pages/` returns zero results
- [ ] All empty states use `EmptyState` component
- [ ] No "Coming soon" or "Placeholder" text visible to users
- [ ] No hardcoded mock data in production components
- [ ] `npm run build` succeeds with zero new warnings
- [ ] Visual check: all pages look identical before and after (no design regression)

---

## 5. Files Created / Modified

### Created
| File | Purpose |
|------|---------|
| `src/design/tokens.ts` | Canonical design tokens |
| `src/components/ui/EmptyState.tsx` | Shared empty state component |

### Modified
| File | Change |
|------|--------|
| `src/pages/*.tsx` (12+ files) | Remove inline DS, import from tokens |
| Various pages with TODOs | Resolve or remove TODOs |
| Various pages with empty states | Use `EmptyState` component |
| Various pages with mock data | Replace with real queries or empty states |

---

## 6. Execution Order

1. Create `tokens.ts` with canonical values
2. Migrate pages one by one (can be done incrementally)
3. After all migrations: verify no visual regression
4. Scan and resolve TODOs
5. Create `EmptyState` component
6. Replace all placeholder content
7. Final scan for mock data

