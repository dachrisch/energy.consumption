# Changelog

High-level log of completed tasks and improvements to the Energy Consumption Monitor application.

---

## 2025-11-04

### Mobile UX Improvements

**Focus State Fix**
- Removed unwanted focus borders/box-shadows appearing on navigation items when clicked
- Applied fixes to desktop sidebar, mobile dropdown menu, and bottom navigation bar
- Added explicit CSS overrides: `outline: none; box-shadow: none; border-color: transparent`
- Validated fix using Chrome DevTools MCP server on both desktop and mobile viewports

**Hover State Fix for Touch Devices**
- Wrapped all CSS `:hover` pseudo-classes in `@media (hover: hover)` media queries
- Prevents "stuck hover" issue on mobile/touch devices where hover states persist after tapping
- Applied to 18 hover effects across:
  - sidebar.css (sidebar nav, breadcrumbs, mobile menu)
  - navigation.css (logo, hamburger button)
  - profile-menu.css (menu button, dropdown items, theme options)
  - button.css (all button variants, FAB, icon-only buttons)
- Reference: https://stackoverflow.com/questions/70375065/button-keeps-hover-effect-after-being-clicked-on-mobile-screens

**Files Modified:**
- `src/app/layout/sidebar.css`
- `src/app/layout/bottom-nav.css`
- `src/app/layout/navigation.css`
- `src/app/layout/profile-menu.css`
- `src/app/layout/button.css`

**Commits:**
- `d164083` - fix: wrap all hover effects in @media (hover: hover) to prevent stuck hover states on touch devices
