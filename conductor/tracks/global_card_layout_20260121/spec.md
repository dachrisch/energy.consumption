# Specification: Modern Global Card Layout & Mobile-First UX

## Overview
This track implements a comprehensive UI/UX overhaul to provide a modern, focused experience. On desktop, the entire application will be housed within a centered "global card" with responsive bounds. On mobile, the interface will be strictly mobile-first, prioritizing touch accessibility and thumb-friendly navigation.

## Functional Requirements
- **Global Card Layout (Desktop):**
    - The entire application (navigation, content, footer) is contained within a single card.
    - Card is centered horizontally and vertically on the screen.
    - Card width is responsive: 90% of the viewport width, capped at a maximum of 1400px.
- **Top Navigation (Desktop):**
    - Navigation menu items are placed in a horizontal bar at the top of the global card.
- **Bottom Navigation (Mobile):**
    - Navigation menu is moved to a fixed bottom bar for easier access.
- **Touch Optimization (Mobile):**
    - All interactive elements (buttons, inputs, links) must have a minimum touch target size of 44x44px.
- **Fluid Typography:**
    - Font sizes must scale smoothly between mobile and desktop breakpoints to maintain optimal readability.

## Non-Functional Requirements
- **Mobile-First CSS:** Styles must be written starting with mobile definitions and adding desktop overrides via media queries.
- **Responsiveness:** Seamless transition between mobile (bottom nav) and desktop (global card + top nav) layouts.
- **Accessibility:** Ensure the global card and navigation elements meet WCAG contrast and structure standards.

## Acceptance Criteria
- [ ] Application is centered in a card on desktop view.
- [ ] Application card does not exceed 1400px width.
- [ ] Desktop navigation is horizontal and located inside the card header.
- [ ] Mobile view displays a fixed bottom navigation bar.
- [ ] All buttons and inputs on mobile have at least 44px of height/width.
- [ ] Text remains readable and appropriately sized on all screen widths (fluid scale).

## Out of Scope
- Redesigning individual component logic (e.g., chart aggregation logic).
- Adding new functional pages or data models.
