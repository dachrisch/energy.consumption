# Visual Design: Dual Y-Axis Monthly Charts

## Overview
This document provides visual representations and design specifications for the dual y-axis monthly charts feature.

---

## Current Design (Before)

```
┌─────────────────────────────────────────────────────────────────┐
│  Monthly Meter Readings - 2024                          [< 2024 >]│
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Power Meter Readings                                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Meter Reading (kWh)                                       │  │
│  │ 1300 ─                                   ●────────●       │  │
│  │      │                              ●────┘               │  │
│  │ 1200 ┤                         ●────┘                     │  │
│  │      │                    ●────┘                          │  │
│  │ 1100 ┤               ●────┘                               │  │
│  │      │          ●────┘                                    │  │
│  │ 1000 ●──────────┘                                         │  │
│  │      └─────────────────────────────────────────────────  │  │
│  │       Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Gas Meter Readings                                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Meter Reading (m³)                                        │  │
│  │  650 ─                                   ●────────●       │  │
│  │      │                              ●────┘               │  │
│  │  600 ┤                         ●────┘                     │  │
│  │      │                    ●────┘                          │  │
│  │  550 ┤               ●────┘                               │  │
│  │      │          ●────┘                                    │  │
│  │  500 ●──────────┘                                         │  │
│  │      └─────────────────────────────────────────────────  │  │
│  │       Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Legend: ●━━━ Actual  ○- - Interpolated  ○--- Extrapolated      │
└─────────────────────────────────────────────────────────────────┘
```

**Characteristics**:
- Single y-axis per chart (meter readings only)
- Line chart showing cumulative meter values
- Data quality indicators via line/point styles

---

## Enhanced Design (After)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Monthly Meter Readings - 2024                                  [< 2024 >]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Power Meter Readings                                                    │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Meter    │                                        │  Consumption  │  │
│  │ Reading  │                                        │  (kWh)        │  │
│  │ (kWh)    │                                        │               │  │
│  │ 1300 ─   │                          ●────────●   │          ─ 300│
│  │      │   │                     ●────┘            │           │   │
│  │ 1200 ┤   │                ●────┘     ┃           │          ─ 200│
│  │      │   │           ●────┘          ┃  ┃       │           │   │
│  │ 1100 ┤   │      ●────┘          ┃    ┃  ┃  ┃    │          ─ 100│
│  │      │   │ ●────┘               ┃ ┃  ┃  ┃  ┃ ┃  │           │   │
│  │ 1000 ●───┤                      ┃ ┃  ┃  ┃  ┃ ┃  │          ─ 0  │
│  │      └───┼──────────────────────────────────────┤───────────────│
│  │          Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec        │
│  └───────────────────────────────────────────────────────────────────┘
│            ┗━━━━━━━━━━━━━━━ Line (Meter) ━━━━━━━━━━━━━━━┛
│            ┗━━━━━ Bars (Consumption) ━━━━━┛
│                                                                           │
│  Gas Meter Readings                                                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Meter    │                                        │  Consumption  │  │
│  │ Reading  │                                        │  (m³)         │  │
│  │ (m³)     │                                        │               │  │
│  │  650 ─   │                          ●────────●   │          ─ 150│
│  │      │   │                     ●────┘            │           │   │
│  │  600 ┤   │                ●────┘     ┃           │          ─ 100│
│  │      │   │           ●────┘          ┃  ┃       │           │   │
│  │  550 ┤   │      ●────┘          ┃    ┃  ┃  ┃    │          ─ 50 │
│  │      │   │ ●────┘               ┃ ┃  ┃  ┃  ┃ ┃  │           │   │
│  │  500 ●───┤                      ┃ ┃  ┃  ┃  ┃ ┃  │          ─ 0  │
│  │      └───┼──────────────────────────────────────┤───────────────│
│  │          Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec        │
│  └───────────────────────────────────────────────────────────────────┘
│                                                                           │
│  Legend: ●━━━ Actual  ○- - Interpolated  ┃ Consumption  ┊ Derived       │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Enhancements**:
- **Dual y-axes**: Left (meter), Right (consumption)
- **Mixed chart**: Line (meter) + Bars (consumption)
- **Visual hierarchy**: Bars behind line, semi-transparent
- **Data correlation**: Easy to see meter state AND monthly usage

---

## Tooltip Design

### Current Tooltip
```
┌────────────────────────┐
│  February 2024         │
│  Power: 1,150 kWh      │
│  (Actual)              │
└────────────────────────┘
```

### Enhanced Tooltip
```
┌─────────────────────────────┐
│  February 2024              │
│  ────────────────────────   │
│  Meter Reading:             │
│    1,150 kWh (Actual)       │
│                             │
│  Consumption:               │
│    150 kWh                  │
└─────────────────────────────┘
```

**On January** (no previous data):
```
┌─────────────────────────────┐
│  January 2024               │
│  ────────────────────────   │
│  Meter Reading:             │
│    1,000 kWh (Actual)       │
│                             │
│  Consumption:               │
│    N/A (first month)        │
└─────────────────────────────┘
```

**On Derived Consumption**:
```
┌─────────────────────────────┐
│  March 2024                 │
│  ────────────────────────   │
│  Meter Reading:             │
│    1,300 kWh (Interpolated) │
│                             │
│  Consumption:               │
│    150 kWh (derived)        │
└─────────────────────────────┘
```

---

## Color Scheme

### Power (Teal)
- **Line**: `rgb(75, 192, 192)` - Solid teal
- **Bars**: `rgba(75, 192, 192, 0.6)` - Semi-transparent teal
- **Border**: `rgb(75, 192, 192)` - Teal border

### Gas (Pink/Red)
- **Line**: `rgb(255, 99, 132)` - Solid pink/red
- **Bars**: `rgba(255, 99, 132, 0.6)` - Semi-transparent pink/red
- **Border**: `rgb(255, 99, 132)` - Pink/red border

### Data Quality Indicators

**Meter Reading (Line)**:
```
Actual:        ●━━━━━●━━━━━●    (Solid line, filled circle)
Interpolated:  ○- - - ○- - -○    (Dashed line, hollow circle)
Extrapolated:  ○------○------○   (Long dashes, hollow circle)
```

**Consumption (Bar)**:
```
Actual:        ┃┃┃┃┃┃┃┃┃┃┃┃┃    (Solid border, solid fill)
Derived:       ┊┊┊┊┊┊┊┊┊┊┊┊┊    (Dashed border, solid fill)
```

---

## Layout Specifications

### Desktop (>1024px)

```
Chart Container: Full width, height: clamp(300px, 50vh, 500px)
┌─────────────────────────────────────────────────────────────┐
│ ┌─ Left Axis ───────────── Chart Area ───────── Right Axis ─┐
│ │               │                              │             │
│ │ Meter Reading │  [Line + Bars Visualization] │ Consumption │
│ │     (kWh)     │                              │    (kWh)    │
│ │               │                              │             │
│ └───────────────┴──────────────────────────────┴─────────────┘
│                         Month Labels                          │
│                   Jan  Feb  Mar  ...  Dec                     │
│                                                                │
│ Legend: ●━━━ Actual  ○- - Interpolated  ┃ Consumption         │
└─────────────────────────────────────────────────────────────┘

Fonts:
- Axis titles: 12px, bold
- Axis labels: 11px
- Tooltip: 14px title, 13px body
- Legend: 12px
```

### Tablet (768px - 1023px)

```
Similar to desktop but:
- Slightly smaller fonts (axis: 11px, tooltip: 13px)
- Legend at bottom (wraps if needed)
```

### Mobile (320px - 767px)

```
Chart Container: Full width, height: clamp(300px, 50vh, 500px)
┌───────────────────────────────────────────┐
│ ┌─L──────── Chart Area ──────────R─┐     │
│ │   │                          │   │     │
│ │ M │  [Line + Bars Viz]       │ C │     │
│ │ R │                          │ o │     │
│ │   │                          │ n │     │
│ └───┴──────────────────────────┴───┘     │
│      Jan Feb ... Dec                     │
│                                           │
│ Legend (bottom, compact):                │
│ ●Actual ○Interp ┃Cons                   │
└───────────────────────────────────────────┘

Fonts:
- Axis titles: HIDDEN (save space)
- Axis labels: 9px
- Tooltip: 12px title, 11px body
- Legend: 10px, abbreviated

Notes:
- "M R" = Meter Reading (no full title)
- "C o n" = Consumption (vertical if space)
- Bars minimum 8px width
- Touch targets: 44x44px
```

---

## Bar Width Calculation

### Desktop (1920px viewport)
```
Chart width: ~1800px (accounting for margins)
12 months → ~150px per category
Bar width (60%): ~90px per bar
✓ Very comfortable, clear visibility
```

### Tablet (768px viewport)
```
Chart width: ~700px
12 months → ~58px per category
Bar width (60%): ~35px per bar
✓ Good visibility
```

### Mobile (375px viewport)
```
Chart width: ~340px
12 months → ~28px per category
Bar width (60%): ~17px per bar
✓ Sufficient, bars visible
Note: Can increase to 70-80% if needed
```

### Narrow Mobile (320px viewport)
```
Chart width: ~290px
12 months → ~24px per category
Bar width (60%): ~14px per bar
⚠️ Minimum acceptable, may need adjustment
Option: Increase barPercentage to 0.8 (19px)
```

---

## Data Quality Visualization

### Example Month with Mixed Data

```
February 2024:
- Previous (Jan): Meter = 1000 kWh (Actual)
- Current (Feb): Meter = 1150 kWh (Interpolated)
- Consumption: 150 kWh (Derived)

Visual Representation:
     ○- - - - Line segment (dashed, interpolated)
     ┊┊┊┊┊┊  Bar (dashed border, derived)

Tooltip:
┌─────────────────────────────┐
│  February 2024              │
│  Meter: 1,150 kWh           │
│    (Interpolated)           │
│  Consumption: 150 kWh       │
│    (derived)                │
└─────────────────────────────┘
```

---

## Negative Consumption Scenario

### Example: Meter Reset

```
March 2024:
- Previous (Feb): Meter = 1500 kWh
- Current (Mar): Meter = 50 kWh (meter reset)
- Consumption: -1450 kWh (negative!)

Visual Representation:
     ╷
     │    ●━━━●  Line (shows actual readings)
 ────┼────────
     │
     ▼ ┃
       ┃  Downward bar (below zero)
       ┃
       ┃

Tooltip:
┌─────────────────────────────────┐
│  March 2024                     │
│  Meter: 50 kWh (Actual)         │
│  Consumption: -1,450 kWh        │
│    ⚠️ Meter reading decreased   │
└─────────────────────────────────┘

Console Warning:
⚠️ Negative consumption detected for March (3): -1450
```

---

## Legend Design

### Desktop Legend (Top Position)

```
┌───────────────────────────────────────────────────────────┐
│  ●━━━ Actual   ○- - Interpolated   ○─── Extrapolated     │
│  ┃ Consumption   ┊ Derived Consumption                    │
└───────────────────────────────────────────────────────────┘
```

### Mobile Legend (Bottom Position, Compact)

```
┌───────────────────────────────┐
│ ●Act  ○Intrp  ○Extrp          │
│ ┃Cons  ┊Derived                │
└───────────────────────────────┘
```

**Alternative** (single row):
```
┌────────────────────────────────────────┐
│ ●Act ○Intrp ○Extrp ┃Cons ┊Der         │
└────────────────────────────────────────┘
```

---

## Accessibility Features

### Color Contrast
- Axis labels (black on white): Ratio 21:1 ✓
- Tooltip (white on black bg): Ratio 21:1 ✓
- Chart lines: Sufficient contrast against white background

### Non-Color Indicators
- Data quality: Shape (filled vs hollow) + Line style (solid vs dashed)
- Meter vs Consumption: Chart type (line vs bar)
- Color blindness safe: Shapes and patterns distinguishable

### Screen Reader
```html
<div aria-label="Power consumption chart for 2024. Shows monthly meter readings as a line chart and monthly consumption as bars. Use arrow keys to navigate between years.">
  <Line ... />
</div>
```

### Keyboard Navigation
- Tab: Focus year navigation controls
- Arrow keys: Change year (prev/next)
- Enter: Open year dropdown
- Arrow up/down: Navigate dropdown
- Enter/Space: Select year

---

## Responsive Breakpoints Summary

| Breakpoint | Width        | Axis Titles | Legend Pos | Font Sizes       | Bar Width |
|------------|--------------|-------------|------------|------------------|-----------|
| Mobile     | 320-767px    | Hidden      | Bottom     | 9-11px           | ~14-17px  |
| Tablet     | 768-1023px   | Visible     | Bottom     | 11-13px          | ~35px     |
| Desktop    | 1024px+      | Visible     | Top        | 11-14px          | ~90px     |

---

## State Variations

### Empty State
```
┌─────────────────────────────────────────┐
│  Monthly Meter Readings - 2024  [< >]   │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │                                    │ │
│  │      No meter readings available   │ │
│  │      for 2024.                     │ │
│  │                                    │ │
│  │      Try selecting a different     │ │
│  │      year or add energy readings.  │ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────┐
│  Monthly Meter Readings - 2024  [< >]   │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │                                    │ │
│  │          Loading chart...          │ │
│  │          [Spinner animation]       │ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Sparse Data (Gaps)
```
┌─────────────────────────────────────────┐
│  Power Meter Readings                    │
│  ┌────────────────────────────────────┐ │
│  │      │      ●       ●              │ │
│  │      │                             │ │
│  │      │     ┃   gap  ┃              │ │
│  │      ●                              │ │
│  │      └────────────────────────────┐ │
│  │       Jan ... Mar ... May ... Dec  │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ℹ️ Limited data available. Add more    │
│     readings for better tracking.       │
└─────────────────────────────────────────┘
```

---

## Animation & Interactions

### On Year Change
```
1. User clicks "Next year" button
2. Chart fades out slightly (opacity: 0.5, duration: 150ms)
3. Data recalculated (consumption)
4. Chart updates with new data
5. Chart fades in (opacity: 1, duration: 150ms)

Total transition: ~300ms
```

### On Hover (Desktop)
```
1. Mouse over bar or line point
2. Cursor changes to pointer
3. Tooltip appears (fade in: 100ms)
4. Hovered element highlighted (slightly brighter)
5. Tooltip follows mouse (if configured)
```

### On Touch (Mobile)
```
1. User taps bar or line point
2. Tooltip appears at top of chart
3. Tooltip persists until next tap or tap outside
4. No hover states (touch doesn't support hover)
```

---

## Chart.js Configuration Visual Reference

### Dataset Order (Z-Index)
```
Layer 3 (Top):    ●━━━━━●  Line (order: 2)
Layer 2:          ┃┃┃┃┃┃  Bars (order: 1)
Layer 1 (Bottom): ░░░░░░  Grid lines
```

### Axis Configuration
```
Left Y-Axis (y-left):
- Type: linear
- Position: left
- Grid: Visible
- Scale: Auto (meter reading range)

Right Y-Axis (y-right):
- Type: linear
- Position: right
- Grid: Hidden (drawOnChartArea: false)
- Scale: Auto (consumption range, starts at 0)

X-Axis:
- Type: category
- Labels: ["Jan", "Feb", ..., "Dec"]
- Grid: Hidden
```

---

## Summary

This enhanced design provides users with a comprehensive view of both their absolute meter state (cumulative readings) and relative usage patterns (monthly consumption) in a single, unified visualization. The dual y-axis approach maximizes information density while maintaining clarity and readability across all device sizes.

**Key Visual Principles**:
1. **Clarity**: Two y-axes clearly labeled, independent scales
2. **Hierarchy**: Bars behind line, consumption supports meter readings
3. **Consistency**: Colors, fonts, and patterns match existing charts
4. **Responsiveness**: Adapts gracefully from 320px to 1920px+
5. **Accessibility**: Color, shape, and pattern distinguish data types

---

**Document Version**: 1.0
**Last Updated**: 2025-11-06
**Author**: Claude (Requirements Analyst Agent)
