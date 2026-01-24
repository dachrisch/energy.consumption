# Specification: UI Design & App Framing

## Overview
This track involves implementing a professional, cohesive UI design for the Energy Consumption Monitor. We will transition from simple page-by-page views to a structured application "frame" that guides the user's attention. This includes a persistent AppBar, responsive navigation, and standardized spacing/layout patterns using DaisyUI.

## Track Type
- Feature (UI/UX & Layout)

## Functional Requirements
- **Appbar:** Implement a persistent top header featuring the "EnergyMonitor" branding and a compact user avatar dropdown.
- **Responsive Navigation:**
    - **Mobile:** Dedicated bottom navigation bar for quick access to Dashboard, Meters, Readings, and Contracts.
    - **Desktop:** Integrated navigation links in the AppBar.
- **User Profile Menu:** DaisyUI dropdown from the avatar providing access to account details and Logout.
- **App Framing:**
    - **Desktop:** Centered "Global Card" layout (max-width: 1400px) with distinct shadows/borders to focus the content.
    - **Mobile:** Full-bleed layout with optimized touch targets.

## Non-Functional Requirements
- **Visual Consistency:** Standardize spacing using consistent Tailwind grid gaps (`gap-4` or `gap-6`) across all forms and grids.
- **Touch Accessibility:** Ensure all interactive elements (buttons, inputs) have a minimum touch target size of 44x44px.
- **Visual Hierarchy:** Use consistent card framing with subtle borders and shadows to separate logical sections of the app.

## Acceptance Criteria
- [ ] AppBar is present on all authenticated pages with branding and profile dropdown.
- [ ] Mobile bottom navigation allows switching between core modules.
- [ ] Desktop layout is centered and constrained within a visual "Global Card" frame.
- [ ] All forms and card grids use standardized spacing.
- [ ] Buttons and inputs meet minimum touch target requirements.
- [ ] UI remains stable and visually appealing across common mobile and desktop resolutions.

## Out of Scope
- Implementing advanced user settings or detailed profile editing.
- Modifying core backend logic or database schemas.
