# Specification: Mobile-Responsive Bottom Navigation

## Overview
This track implements a mobile-first navigation experience by introducing a persistent bottom navigation bar for small screens. This aligns with the "Professional Framing" goal by providing an ergonomic and app-like interface for mobile users while preserving the existing top-level navigation for desktop users.

## Functional Requirements
- **Responsive Visibility:** 
    - Display a Bottom Navigation bar only on mobile/small screen viewports (typically < 768px).
    - Hide the Top AppBar navigation links on mobile viewports (retaining the logo and user avatar).
- **Destinations:**
    - **Dashboard:** Link to `/dashboard`.
    - **Meters:** Link to `/meters`.
    - **Add Reading:** Link to `/add-reading`.
- **Visual Prioritization:**
    - The "Add Reading" action must be styled as a prominent, centered Floating Action Button (FAB) or elevated element to encourage quick data entry.
- **Active State:**
    - Visual indicators must clearly show which route is currently active (e.g., highlighting icons or labels).

## Non-Functional Requirements
- **Ergonomics:** Ensure the bottom bar follows 44px minimum touch target guidelines.
- **Visual Consistency:** Use DaisyUI/Tailwind CSS styling consistent with the existing theme.
- **Performance:** Navigation should be instantaneous via the SolidJS router.

## Acceptance Criteria
- [ ] Bottom navigation bar is visible on mobile and hidden on desktop.
- [ ] Top AppBar navigation links are hidden on mobile and visible on desktop.
- [ ] Clicking "Dashboard" navigates to `/dashboard`.
- [ ] Clicking "Meters" navigates to `/meters`.
- [ ] Clicking the prominent "Add Reading" button navigates to `/add-reading`.
- [ ] The active route is visually distinguished in the bottom bar.

## Out of Scope
- Redesigning the Profile or Login pages.
- Adding new navigation destinations not listed above.
