# Product Guidelines - Energy Consumption Monitor

## Tone and Voice
- **Minimalist and Functional:** The application communicates with direct, no-nonsense language.
- **Efficiency-First:** Messaging is designed to get the user in and out as quickly as possible.
- **Clarity over Fluff:** Avoid marketing jargon; focus on clear labels and immediate feedback.

## Visual Identity
- **Clean Modernism:** A balanced use of white space and rounded components for a contemporary look.
- **Global Card Aesthetic:** On desktop, the application is presented within a centered, responsive card (max 1400px) to enhance focus and minimize eye travel.
- **Dark Mode First:** The primary interface is optimized for dark environments to reduce eye strain and preserve battery on mobile devices.
- **Material Design:** Leveraging Material Design principles for consistent depth, shadows, and touch interactions.
- **Responsive & Mobile-First:** Every UI element is designed for touch (min 44px target) before scaling. This includes a fixed bottom navigation bar for mobile and a horizontal top navigation bar for desktop.

## User Experience (UX) Philosophy
- **Action-Oriented Dashboard:** Front-load projections and critical cost data so users see high-value insights immediately upon login.
- **Input-Focused Design:** The "Add Reading" action is the most prominent and accessible part of the navigation to minimize friction.
- **Comparative Context:** Data is rarely shown in isolation; current consumption is always presented alongside historical trends or contract benchmarks.
- **Non-Blocking Feedback:** The application MUST NOT use native `alert()` or `confirm()` dialogs. All feedback and confirmations must be handled via non-intrusive Toast notifications or in-app modal components to maintain a seamless, professional experience.

## Accessibility and Support
- **Fluid Typography:** The UI uses dynamic font scaling (fluid scale) to ensure optimal readability across all device sizes without manual adjustment.
- **High Readability:** Focus on contrast ratios and legible typography for clear data interpretation.
- **Keyboard & Touch Parity:** All features are fully accessible via both precise touch gestures and standard keyboard navigation.
