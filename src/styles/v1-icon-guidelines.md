# V5.1 Icon Strategy Audit

## HARD RULE: NO ICON LIBRARY

The 8 design mockups use zero SVG icons. Everything is typographic or CSS-based. This is intentional — editorial minimalism. Icons would make it look like a generic SaaS app.

## Allowed "icons" (text marks or CSS only)

| Purpose       | Symbol            | Implementation      |
|---------------|-------------------|---------------------|
| Arrows        | `→` and `←`       | Text character      |
| Status dots   | colored circles   | CSS: border-radius 50% circles (6px diameter allowed — status dots ONLY, full radius is permitted for avatars/dots per V1.radiusFull rule) |
| Checks        | `✓`               | Text character      |
| Plus/minus    | `+` / `−`         | Text character      |
| Close         | `×`               | Text character      |
| Menu (mobile) | 3 horizontal lines | CSS borders/divs — hamburger |
| External link | `↗` (rare)        | Text character      |

## ONLY EXCEPTIONS
- Upload attachment button (if required): CSS-drawn simple shape — NOT SVG icon.
- Mobile hamburger: CSS-drawn 3 lines.
- Modal close X: text `×`.

## Audit results (V5.1 files)
All files built in V5.1 use text marks exclusively:
- → ✓ · × + used throughout (ErrorBoundary, modals, pages, CookieConsent, etc.)
- Zero usage of `lucide-react`, `Heroicons`, `FontAwesome` across V5.1 files.
- EmptyState component line-art SVGs are brand-compliant: sharp corners, teal stroke, zero radius.
- Status dots: CSS circles (V1.radiusFull applies only to avatars/dots per brand rules).

## LIBRARIES TO UNINSTALL (future work)
- `lucide-react` dependency should be removed in a post-go-live pass; currently still used in legacy admin/consultant modules outside V1/V2/V3/V4/V4.5/V5.1 scope.
