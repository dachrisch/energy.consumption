# Specification: Mobile-Responsive Inverted Chart View

## Overview
The current energy consumption charts are too wide for mobile devices. This track implements a mobile-optimized visualization strategy by switching to an **Inverted Line Chart** on small screens. By placing **Amount on the X-axis** and **Time on the Y-axis**, the application utilizes vertical scrolling space more effectively, ensuring high readability on narrow viewports.

## Functional Requirements
- **Responsive Presentation:**
    - Detect screen width and switch between the standard desktop chart and the inverted mobile chart.
    - Threshold: Mobile view triggers for screens < 768px.
- **Inverted Mobile Chart:**
    - **Axis Mapping:** X-axis represents consumption amount; Y-axis represents time/dates.
    - **Vertical Sorting:** Time progresses downwards, with the **Oldest dates at the top** and the Newest dates at the bottom (progressing like a feed or calendar).
    - **Chart Type:** Line chart (or Area chart for better visual weight) using Chart.js.
- **Data Fidelity:**
    - Display the same data points as the desktop view, but formatted for vertical consumption.
- **Key Data Visibility:**
    - The **Total Consumption** for the period must be prominently displayed as a summary above the chart.

## Non-Functional Requirements
- **Ergonomics:** Utilize the natural vertical scrolling of mobile devices.
- **Visual Consistency:** Maintain theme colors and line styling consistent with the "Modern Global Card" aesthetic.
- **Touch Interaction:** Tooltips should be optimized for vertical touch-tracking.

## Acceptance Criteria
- [ ] On screens < 768px, the chart renders with Time on the Y-axis and Amount on the X-axis.
- [ ] The Y-axis (Time) is sorted with the oldest entries at the top and newest at the bottom.
- [ ] The chart fills the width of the mobile card without horizontal overflow.
- [ ] Total consumption for the displayed period is clearly visible.
- [ ] On screens >= 768px, the standard horizontal line chart remains active.

## Out of Scope
- Redesigning the underlying data aggregation logic.
- Implementing a multi-axis comparison view (focus remains on single-series consumption).
