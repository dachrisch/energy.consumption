# Visual Design Specifications V3: Interactive Timeline Slider

## Document Information
- **Feature**: Interactive Timeline Slider with Data Visualization
- **Design Phase**: Visual Mockups & Specifications
- **Date**: 2025-11-04
- **Status**: Ready for Approval
- **Target Platform**: Mobile-first (iOS/Android primary, Desktop secondary)

---

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Component Overview](#component-overview)
4. [Desktop Layout Mockup](#desktop-layout-mockup)
5. [Mobile Layout Mockup](#mobile-layout-mockup)
6. [Timeline Slider Details](#timeline-slider-details)
7. [Type Filter Details](#type-filter-details)
8. [Reset Button Details](#reset-button-details)
9. [States and Interactions](#states-and-interactions)
10. [Spacing and Dimensions](#spacing-and-dimensions)
11. [Typography](#typography)
12. [Accessibility](#accessibility)
13. [Responsive Breakpoints](#responsive-breakpoints)
14. [Animation Specifications](#animation-specifications)

---

## Design Philosophy

### Principles
1. **Mobile-First**: Design for touch interactions, then enhance for desktop
2. **Data-Driven**: Visual representation of data helps users understand their data range
3. **Quick Actions**: Preset buttons for common use cases, slider for precision
4. **Visual Hierarchy**: Clear distinction between primary (slider) and secondary (presets, checkboxes) controls
5. **Accessibility**: Full keyboard navigation, screen reader support, high contrast
6. **Performance**: Smooth 60fps interactions, instant visual feedback

### Design Goals
- Reduce clicks for common filtering tasks (Last 7/30 days)
- Make data range immediately visible through visualization
- Enable both quick presets and precise manual selection
- Support multi-type filtering (Power + Gas together)
- Maintain consistency with existing design system

---

## Color Palette

### Design System Colors

**Primary Colors** (from globals.css):
```css
Light Theme:
  --primary: #7c3aed (Purple 600)
  --primary-hover: #6d28d9 (Purple 700)
  --primary-active: #5b21b6 (Purple 800)
  --primary-foreground: #ffffff
  --primary-subtle: rgba(124, 58, 237, 0.1)

Dark Theme:
  --primary: #8b5cf6 (Purple 500)
  --primary-hover: #7c3aed (Purple 600)
  --primary-active: #6d28d9 (Purple 700)
  --primary-foreground: #ffffff
  --primary-subtle: rgba(139, 92, 246, 0.1)
```

**Energy Type Colors** (from energyTypes.ts):
```css
Power (Teal/Cyan):
  Border: rgb(75, 192, 192) - #4BC0C0
  Background: rgba(75, 192, 192, 0.5) - #4BC0C0 at 50% opacity

Gas (Red/Pink):
  Border: rgb(255, 99, 132) - #FF6384
  Background: rgba(255, 99, 132, 0.5) - #FF6384 at 50% opacity
```

**Secondary & UI Colors**:
```css
Light Theme:
  --background: #ffffff
  --foreground: #171717
  --border: #e5e7eb
  --secondary: #f3f4f6
  --secondary-hover: #e5e7eb

Dark Theme:
  --background: #0f172a
  --foreground: #f1f5f9
  --border: #334155
  --secondary: #475569
  --secondary-hover: #64748b
```

---

## Component Overview

### Complete Filter Component Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ EnergyTableFilters (Container)                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Timeline Filter Section                                     │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ Preset Buttons Row                                      │ │ │
│ │ │ [Last 7 days] [Last 30 days] [Last 90 days]           │ │ │
│ │ │ [This month] [This year] [All time]                    │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ Range Slider with Histogram Visualization              │ │ │
│ │ │ [Histogram bars + slider track + two handles]          │ │ │
│ │ │ [Start date label] ──────────────── [End date label]   │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Type Filter Section                                         │ │
│ │ Label: "Energy Type"                                        │ │
│ │ ☑ Power (with icon)    ☑ Gas (with icon)                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Reset Section                                               │ │
│ │ [↻ Reset Filters]  ⓘ 2 filters active                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Desktop Layout Mockup

### Full Desktop View (≥640px width)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            ENERGY TABLE FILTERS                              │
│                                                                              │
│  Timeline Filter                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ [Last 7 days] [Last 30 days] [Last 90 days] [This month]             │ │
│  │ [This year] [All time]                                                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │ 30│ █                                                                  │ │
│  │ 25│ █   █                                                              │ │
│  │ 20│ █   █     █                                                        │ │
│  │ 15│ █   █ █   █       █                                                │ │
│  │ 10│ █ █ █ █ █ █   █   █     █                                         │ │
│  │  5│ █ █ █ █ █ █ █ █ █ █ █ █ █   █ █   █                              │ │
│  │  0├─────────────────────────────────────────────────────────────────── │ │
│  │    │◉═══════════════════════════◉───────────────────────────────────  │ │
│  │    ▲                            ▲                                       │ │
│  │  2024-10-01                  2024-11-04                                │ │
│  │  (Start Date)                (End Date)                                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  Energy Type          Reset Filters                                         │
│  ☑ ⚡ Power      ☑ 🔥 Gas      [↻ Reset Filters]  ⓘ 2                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

Legend:
  █ = Histogram bars (Teal = Power, Pink/Red = Gas, stacked)
  ◉ = Draggable handles (circular, purple primary color)
  ═ = Selected range (purple primary color)
  ─ = Unselected range (gray border color)
  ☑ = Checked checkbox (purple primary)
  ☐ = Unchecked checkbox (gray border)
  ⚡ = Power icon (teal)
  🔥 = Gas icon (red/orange)
  ↻ = Reset icon
  ⓘ = Badge with count
```

### Detailed Preset Buttons (Desktop)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ Last 7 days │ │Last 30 days │ │Last 90 days │ │This month │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│  ┌───────────┐ ┌──────────┐                                     │
│  │This year  │ │All time  │                                     │
│  └───────────┘ └──────────┘                                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Normal State:
  Background: transparent (button-ghost style)
  Border: 2px solid var(--border)
  Text: var(--foreground)
  Padding: 0.5rem 1rem (8px 16px)
  Border-radius: 0.75rem (12px)
  Font-size: 0.875rem (14px)
  Font-weight: 500

Active/Selected State:
  Background: var(--primary) #7c3aed
  Border: 2px solid var(--primary)
  Text: var(--primary-foreground) #ffffff
  Box-shadow: var(--shadow-md)
  Transform: translateY(-1px)

Hover State (not active):
  Background: var(--background-hover)
  Border: 2px solid var(--border-hover)
  Transform: translateY(-1px)

Focus State:
  Outline: 3px solid var(--primary-subtle)
  Outline-offset: 2px
```

---

## Mobile Layout Mockup

### Full Mobile View (<640px width)

```
┌────────────────────────────────────────┐
│    ENERGY TABLE FILTERS                │
│                                        │
│  Timeline Filter                       │
│  ┌────────────────────────────────────┐│
│  │ [Last 7 days] [Last 30 days] →    ││
│  └────────────────────────────────────┘│
│    ↑ Horizontal scroll container       │
│                                        │
│  ┌────────────────────────────────────┐│
│  │                                    ││
│  │ 15│ █                              ││
│  │ 10│ █ █ █                          ││
│  │  5│ █ █ █ █ █ █                   ││
│  │  0├──────────────────────────      ││
│  │    │◉════════◉───────────          ││
│  │    ▲        ▲                       ││
│  │  10-01   11-04                     ││
│  │                                    ││
│  └────────────────────────────────────┘│
│                                        │
│  Energy Type                           │
│  ┌────────────────────────────────────┐│
│  │ ☑ ⚡ Power                         ││
│  └────────────────────────────────────┘│
│  ┌────────────────────────────────────┐│
│  │ ☑ 🔥 Gas                           ││
│  └────────────────────────────────────┘│
│                                        │
│  ┌────────────────────────────────────┐│
│  │ [↻ Reset Filters]  ⓘ 2            ││
│  └────────────────────────────────────┘│
│                                        │
└────────────────────────────────────────┘

Mobile Specific Features:
  - Preset buttons: Horizontal scrollable (scroll-snap)
  - Histogram: Fewer buckets (20-30 vs 60-100)
  - Date labels: Short format (MM-DD vs full date)
  - Type checkboxes: Full width, stacked vertically
  - Touch targets: All ≥ 44x44px
  - Slider handles: Larger (20px vs 16px)
```

### Preset Buttons Mobile Scroll

```
┌──────────────────────────────────────────────┐
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │Last 7 d. │ │Last 30 d.│ │Last 90 d.│→   │
│  └──────────┘ └──────────┘ └──────────┘    │
└──────────────────────────────────────────────┘
   ▲            ▲            ▲
   Visible      Scroll       Hidden
   (scroll-snap-align: start)

Container:
  Display: flex
  Overflow-x: auto
  Scroll-snap-type: x mandatory
  Gap: 0.5rem (8px)
  Padding: 0.5rem (8px)
  -webkit-overflow-scrolling: touch

Buttons:
  Scroll-snap-align: start
  Flex-shrink: 0
  Min-width: max-content
```

---

## Timeline Slider Details

### Histogram Visualization

#### Histogram Structure (SVG)

```xml
<svg width="100%" height="120" viewBox="0 0 800 120">
  <!-- Background grid lines (optional) -->
  <line x1="0" y1="100" x2="800" y2="100" stroke="#e5e7eb" stroke-width="1"/>
  <line x1="0" y1="75" x2="800" y2="75" stroke="#e5e7eb" stroke-width="0.5" opacity="0.5"/>
  <line x1="0" y1="50" x2="800" y2="50" stroke="#e5e7eb" stroke-width="0.5" opacity="0.5"/>
  <line x1="0" y1="25" x2="800" y2="25" stroke="#e5e7eb" stroke-width="0.5" opacity="0.5"/>

  <!-- Histogram bars (example: 60 buckets for desktop) -->
  <!-- Each bucket shows Power (bottom) + Gas (top) stacked -->

  <!-- Bucket 1 (Power: 5, Gas: 3) -->
  <rect x="0" y="80" width="12" height="20" fill="rgba(75, 192, 192, 0.7)" stroke="rgb(75, 192, 192)" stroke-width="1"/>
  <rect x="0" y="60" width="12" height="20" fill="rgba(255, 99, 132, 0.7)" stroke="rgb(255, 99, 132)" stroke-width="1"/>

  <!-- Bucket 2 (Power: 8, Gas: 2) -->
  <rect x="14" y="68" width="12" height="32" fill="rgba(75, 192, 192, 0.7)" stroke="rgb(75, 192, 192)" stroke-width="1"/>
  <rect x="14" y="60" width="12" height="8" fill="rgba(255, 99, 132, 0.7)" stroke="rgb(255, 99, 132)" stroke-width="1"/>

  <!-- ... repeat for all buckets ... -->

  <!-- Y-axis labels -->
  <text x="0" y="10" font-size="10" fill="#6b7280">30</text>
  <text x="0" y="35" font-size="10" fill="#6b7280">20</text>
  <text x="0" y="60" font-size="10" font-size="10" fill="#6b7280">10</text>
  <text x="0" y="105" font-size="10" fill="#6b7280">0</text>
</svg>
```

#### Histogram Specifications

**Desktop (≥640px)**:
- Width: 100% of container
- Height: 120px
- Buckets: 60-100 (based on data density)
- Bar gap: 2px
- Bar width: (containerWidth / bucketCount) - gap
- Y-axis: 0 to max(data)
- Show 4-5 Y-axis labels

**Mobile (<640px)**:
- Width: 100% of container
- Height: 100px
- Buckets: 20-30 (fewer for clarity)
- Bar gap: 1px
- Bar width: (containerWidth / bucketCount) - gap
- Y-axis: 0 to max(data)
- Show 3 Y-axis labels

**Stacked Bars**:
- Bottom bar: Power (teal #4BC0C0, 70% opacity)
- Top bar: Gas (pink #FF6384, 70% opacity)
- Stroke: Same color as fill, 100% opacity, 1px width
- Bars scale from bottom (y=100) upward

**Empty State** (no data):
```
┌────────────────────────────────────┐
│                                    │
│  No measurements available         │
│  ──────────────────────────────    │
│    Slider disabled                 │
│                                    │
└────────────────────────────────────┘
Text: var(--foreground-muted)
Background: var(--background)
```

### Slider Track & Range

#### Track Specifications

```
Unselected range (before start handle or after end handle):
  ─────────────────────────────────
  Height: 4px
  Background: var(--border) #e5e7eb (light), #334155 (dark)
  Border-radius: 2px
  Position: Overlayed on top of histogram at y=110px

Selected range (between handles):
  ═══════════════════════════════
  Height: 6px
  Background: var(--primary) #7c3aed (light), #8b5cf6 (dark)
  Border-radius: 3px
  Position: Same as track, but slightly thicker
  Box-shadow: 0 2px 4px rgba(124, 58, 237, 0.3)
```

#### Visual Layers (z-index)

```
Layer 1 (bottom):  Histogram bars (z-index: 1)
Layer 2:           Unselected track (z-index: 2)
Layer 3:           Selected range highlight (z-index: 3)
Layer 4 (top):     Slider handles (z-index: 4)
```

### Slider Handles

#### Handle Design

```
Normal State:
  ◉
  Shape: Circle
  Diameter: 20px (mobile), 16px (desktop)
  Background: var(--primary) #7c3aed
  Border: 3px solid var(--primary-foreground) #ffffff
  Box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15)
  Cursor: grab

Hover State:
  ⬤
  Diameter: 22px (mobile), 18px (desktop) - slight scale
  Background: var(--primary-hover) #6d28d9
  Box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25)
  Cursor: pointer
  Transition: all 150ms ease

Active/Dragging State:
  ⬤
  Diameter: 24px (mobile), 20px (desktop)
  Background: var(--primary-active) #5b21b6
  Box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3)
  Cursor: grabbing
  Scale: 1.2
  Transition: all 150ms ease

Focus State (keyboard):
  ◉
  Normal size + outline
  Outline: 3px solid var(--primary-subtle)
  Outline-offset: 3px
```

#### Handle Positioning

- Start handle: Position at left side of selected range
- End handle: Position at right side of selected range
- Both handles on top of track centerline
- Touch target area: 44x44px (extends beyond visual circle)
- Z-index: 4 (above everything else)

### Date Labels

#### Label Positioning

```
Desktop:
┌────────────────────────────────────────┐
│  ◉═══════════════════════◉             │
│  ▲                        ▲             │
│  October 1, 2024      November 4, 2024 │
│  (Start Date)         (End Date)       │
└────────────────────────────────────────┘

Mobile:
┌────────────────────────────────────────┐
│  ◉═══════════◉                         │
│  ▲           ▲                          │
│  10/01     11/04                       │
└────────────────────────────────────────┘
```

#### Label Specifications

**Desktop (≥640px)**:
- Format: `MMMM D, YYYY` (e.g., "October 1, 2024")
- Font-size: 0.875rem (14px)
- Font-weight: 500
- Color: var(--foreground-muted) #6b7280
- Position: 8px below handle center
- Text-align: center (aligned with handle)

**Mobile (<640px)**:
- Format: `MM/DD` (e.g., "10/01")
- Font-size: 0.75rem (12px)
- Font-weight: 500
- Color: var(--foreground-muted)
- Position: 6px below handle center
- Text-align: center

**Collision Handling**:
- If labels overlap: Show only start label
- Alternative: Stack labels vertically
- Minimum gap between labels: 40px

---

## Type Filter Details

### Checkbox Button Design

```
Unchecked State:
┌──────────────────────┐
│ ☐ ⚡ Power          │
└──────────────────────┘
  Background: transparent
  Border: 2px solid var(--border) #e5e7eb
  Border-radius: 0.75rem (12px)
  Padding: 0.75rem 1rem (12px 16px)
  Display: flex, align-items: center, gap: 0.5rem
  Cursor: pointer
  Min-height: 44px (touch target)

Checked State:
┌──────────────────────┐
│ ☑ ⚡ Power          │
└──────────────────────┘
  Background: var(--primary-subtle) rgba(124, 58, 237, 0.1)
  Border: 2px solid var(--primary) #7c3aed
  Color: var(--primary) #7c3aed (icon + text)
  Font-weight: 600
  Box-shadow: 0 0 0 3px var(--primary-subtle) (subtle glow)

Hover State (unchecked):
  Background: var(--background-hover) #f3f4f6
  Border: 2px solid var(--border-hover) #d1d5db
  Transform: translateY(-1px)

Hover State (checked):
  Background: rgba(124, 58, 237, 0.15)
  Border: 2px solid var(--primary-hover) #6d28d9
  Transform: translateY(-1px)

Focus State:
  Outline: 3px solid var(--primary-subtle)
  Outline-offset: 2px
```

### Checkbox Layout

**Desktop (≥640px)**:
```
Energy Type
┌─────────────────┐ ┌─────────────────┐
│ ☑ ⚡ Power     │ │ ☑ 🔥 Gas       │
└─────────────────┘ └─────────────────┘
```
- Display: flex, flex-direction: row
- Gap: 1rem (16px)
- Each button: flex: 1 (equal width)

**Mobile (<640px)**:
```
Energy Type
┌───────────────────────────────┐
│ ☑ ⚡ Power                    │
└───────────────────────────────┘
┌───────────────────────────────┐
│ ☑ 🔥 Gas                      │
└───────────────────────────────┘
```
- Display: flex, flex-direction: column
- Gap: 0.5rem (8px)
- Each button: width: 100%

### Icon Specifications

**Power Icon** (⚡):
- SVG size: 20x20px
- Color: rgb(75, 192, 192) #4BC0C0 (teal)
- Stroke-width: 2px
- Position: Inline with text, 8px margin-right

**Gas Icon** (🔥):
- SVG size: 20x20px
- Color: rgb(255, 99, 132) #FF6384 (pink/red)
- Fill: solid
- Position: Inline with text, 8px margin-right

---

## Reset Button Details

### Button Design

```
Normal State:
┌─────────────────┐  ⓘ 2
│ ↻ Reset Filters │
└─────────────────┘

  Class: button-secondary button-sm
  Background: var(--secondary) #f3f4f6 (light), #475569 (dark)
  Color: var(--secondary-foreground) #171717 (light), #f1f5f9 (dark)
  Border: 2px solid transparent
  Border-radius: 0.75rem (12px)
  Padding: 0.5rem 1rem (8px 16px)
  Font-size: 0.875rem (14px)
  Font-weight: 600
  Display: flex, align-items: center, gap: 0.5rem
  Cursor: pointer
  Transition: all 150ms ease

Hover State:
  Background: var(--secondary-hover) #e5e7eb (light), #64748b (dark)
  Transform: translateY(-1px)
  Box-shadow: var(--shadow-sm)

Active State:
  Transform: translateY(0)
  Box-shadow: none

Focus State:
  Outline: 3px solid var(--primary-subtle)
  Outline-offset: 2px

Disabled State (no filters active):
  Opacity: 0.5
  Cursor: not-allowed
  Transform: none
```

### Active Filter Badge

```
Badge (when count > 0):
  ⓘ 2

  Display: inline-flex
  Background: var(--primary) #7c3aed
  Color: var(--primary-foreground) #ffffff
  Border-radius: 9999px (fully rounded)
  Padding: 0.25rem 0.5rem (4px 8px)
  Font-size: 0.75rem (12px)
  Font-weight: 700
  Min-width: 24px
  Height: 24px
  Justify-content: center
  Align-items: center

Badge (when count = 0):
  Hidden (display: none)
```

### Reset Button Layout

**Desktop**:
```
┌──────────────────────────────────────┐
│  [↻ Reset Filters]  ⓘ 2             │
└──────────────────────────────────────┘
Flex: row, align-items: center, gap: 0.75rem
```

**Mobile**:
```
┌──────────────────────────────────────┐
│  [↻ Reset Filters]  ⓘ 2             │
└──────────────────────────────────────┘
Same as desktop
```

---

## States and Interactions

### Timeline Slider States

#### 1. Initial Load State
```
Timeline: Selected range = Last 30 days (preset active)
Type Filter: Both unchecked (show all)
Badge: Count = 1 (timeline active)

Timeline Slider:
  Start Handle: 30 days ago
  End Handle: Today
  Histogram: Full dataset visible
  Active Preset: "Last 30 days" (highlighted)
```

#### 2. User Drags Start Handle
```
Frame 1: mousedown/touchstart on start handle
  - Handle scales to 24px (mobile) / 20px (desktop)
  - Handle color changes to primary-active
  - Cursor changes to "grabbing"
  - Active preset deselects (if any)

Frame 2-N: mousemove/touchmove
  - Handle follows cursor/touch
  - Selected range updates in real-time (60fps)
  - Date label updates in real-time
  - Histogram doesn't change (static)
  - Parent component NOT notified yet (debounced)

Frame N+1: mouseup/touchend
  - Handle scales back to normal
  - Handle color changes to primary
  - Cursor changes to "grab"
  - 200ms debounce timer starts
  - After 200ms: Parent component notified → Data table updates
```

#### 3. User Clicks Preset Button
```
Frame 1: onClick "Last 7 days"
  - Button animates to active state (scale 1.05)
  - Previously active preset deselects

Frame 2-10 (300ms animation):
  - Both slider handles animate to new positions
  - Animation: cubic-bezier(0.4, 0, 0.2, 1)
  - Selected range expands/contracts smoothly
  - Date labels update during animation

Frame 11:
  - Animation complete
  - Button fully active (primary background)
  - Parent component notified → Data table updates
```

#### 4. User Toggles Type Checkbox
```
Frame 1: onClick Power checkbox
  - Checkbox toggles instantly (visual feedback)
  - Checkmark appears/disappears
  - Button background changes to primary-subtle
  - Border color changes to primary

Frame 2:
  - Parent component notified immediately
  - Data table filters update
  - Badge count updates (+1 or -1)
```

#### 5. User Clicks Reset Button
```
Frame 1: onClick Reset
  - Button animates (translateY)

Frame 2:
  - All filters reset:
    - Timeline: All time (no preset active)
    - Slider handles: Full range (min to max dates)
    - Type checkboxes: Both unchecked
    - Badge: Count = 0 (hidden)

Frame 3:
  - Parent component notified
  - Data table shows all data
```

### Focus/Keyboard Navigation States

#### Tab Order
1. Preset button 1 (Last 7 days)
2. Preset button 2 (Last 30 days)
3. Preset button 3 (Last 90 days)
4. Preset button 4 (This month)
5. Preset button 5 (This year)
6. Preset button 6 (All time)
7. Start handle (slider)
8. End handle (slider)
9. Power checkbox
10. Gas checkbox
11. Reset button

#### Slider Keyboard Controls

**Start Handle** (focused):
- **Arrow Left**: Move 1 day earlier
- **Arrow Right**: Move 1 day later
- **Page Down**: Move 7 days earlier
- **Page Up**: Move 7 days later
- **Home**: Move to minimum date
- **End**: Move to 1 day before end handle
- **Shift + Arrow**: Move 1 hour (fine control)

**End Handle** (focused):
- **Arrow Left**: Move 1 day earlier
- **Arrow Right**: Move 1 day later
- **Page Down**: Move 7 days earlier
- **Page Up**: Move 7 days later
- **Home**: Move to 1 day after start handle
- **End**: Move to maximum date
- **Shift + Arrow**: Move 1 hour (fine control)

**Checkboxes**:
- **Space**: Toggle checkbox
- **Enter**: Toggle checkbox

**Preset Buttons**:
- **Space**: Activate preset
- **Enter**: Activate preset

---

## Spacing and Dimensions

### Component Spacing

```
EnergyTableFilters Container:
  Padding: 1.5rem (24px) on desktop
  Padding: 1rem (16px) on mobile
  Border-radius: 0.75rem (12px)
  Border: 1px solid var(--border)
  Background: var(--background-card)
  Gap between sections: 1.5rem (24px)

Timeline Filter Section:
  Label "Timeline Filter":
    Font-size: 0.875rem (14px)
    Font-weight: 600
    Margin-bottom: 0.75rem (12px)

  Preset Buttons Container:
    Margin-bottom: 1rem (16px)
    Gap: 0.75rem (12px) desktop, 0.5rem (8px) mobile

  Slider Container:
    Height: 160px (desktop), 140px (mobile)
    Padding: 1rem (16px) all sides

Type Filter Section:
  Label "Energy Type":
    Font-size: 0.875rem (14px)
    Font-weight: 600
    Margin-bottom: 0.75rem (12px)

  Checkboxes Container:
    Gap: 1rem (16px) desktop, 0.5rem (8px) mobile

Reset Section:
  Align: flex-end (right side)
  Gap between button and badge: 0.75rem (12px)
```

### Touch Targets (Mobile)

All interactive elements must meet 44x44px minimum:

```
Element                 Visual Size    Touch Target
─────────────────────── ─────────────  ────────────
Preset button           auto × 36px    auto × 44px
Slider handle           20px circle    44x44px
Checkbox button         auto × 40px    auto × 44px
Reset button            auto × 36px    auto × 44px

Touch target achieved via:
  padding: calculation to reach 44px min
  OR
  ::before pseudo-element with larger hitbox
```

---

## Typography

### Font Families
```css
System Font Stack (from Geist):
  font-family: var(--font-geist-sans);
  /* Fallback: system-ui, -apple-system, ... */

Monospace (for dates if needed):
  font-family: var(--font-geist-mono);
```

### Type Scale

```css
Label Text (sections):
  font-size: 0.875rem (14px)
  font-weight: 600
  line-height: 1.25rem (20px)
  letter-spacing: -0.01em

Button Text:
  font-size: 0.875rem (14px)
  font-weight: 500
  line-height: 1.25rem (20px)

Date Labels (desktop):
  font-size: 0.875rem (14px)
  font-weight: 500
  line-height: 1.25rem (20px)

Date Labels (mobile):
  font-size: 0.75rem (12px)
  font-weight: 500
  line-height: 1rem (16px)

Badge Text:
  font-size: 0.75rem (12px)
  font-weight: 700
  line-height: 1rem (16px)

Histogram Y-axis Labels:
  font-size: 0.625rem (10px)
  font-weight: 400
  line-height: 1rem (16px)
```

---

## Accessibility

### ARIA Attributes

#### Range Slider (Start Handle)
```html
<div
  role="slider"
  aria-label="Start date"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow="25"
  aria-valuetext="October 1, 2024"
  aria-orientation="horizontal"
  tabindex="0"
  data-handle="start"
>
```

#### Range Slider (End Handle)
```html
<div
  role="slider"
  aria-label="End date"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow="75"
  aria-valuetext="November 4, 2024"
  aria-orientation="horizontal"
  tabindex="0"
  data-handle="end"
>
```

#### Preset Buttons
```html
<button
  aria-label="Select last 7 days"
  aria-pressed="true"
  type="button"
>
  Last 7 days
</button>
```

#### Checkboxes
```html
<label class="checkbox-button">
  <input
    type="checkbox"
    checked
    aria-label="Filter Power readings"
  />
  <span class="checkbox-visual"></span>
  <PowerIcon aria-hidden="true" />
  <span>Power</span>
</label>
```

#### Live Region (for screen readers)
```html
<div
  aria-live="polite"
  aria-atomic="true"
  class="sr-only"
>
  <!-- Announced when filters change -->
  Showing Power readings from October 1 to November 4, 2024
</div>
```

### Keyboard Navigation

**Focus Indicators**: All interactive elements must have visible focus state
```css
:focus-visible {
  outline: 3px solid var(--primary-subtle);
  outline-offset: 2px;
}
```

**Skip to Filter**: Optionally add skip link
```html
<a href="#energy-filters" class="skip-link">
  Skip to filters
</a>
```

### Screen Reader Support

**Hidden Visual Elements**:
```html
<span class="sr-only">
  Histogram showing 48 total measurements
</span>
```

**Descriptive Labels**: All inputs have clear labels

**State Announcements**: Use `aria-live` regions for dynamic updates

---

## Responsive Breakpoints

### Breakpoint Strategy

```css
/* Mobile First (default styles are mobile) */
Base: 0px - 639px
  - Stacked layout
  - Horizontal scroll for presets
  - Larger touch targets
  - Condensed histogram
  - Short date formats

/* Small Desktop */
@media (min-width: 640px) {
  - Wrapped preset buttons
  - Side-by-side checkboxes
  - Full histogram
  - Full date formats
  - Standard touch targets
}

/* Large Desktop */
@media (min-width: 1024px) {
  - More histogram buckets
  - Larger overall layout
  - More whitespace
}
```

### Component-Specific Breakpoints

**Preset Buttons**:
- Mobile (<640px): Horizontal scroll container
- Desktop (≥640px): Flex wrap, 2 rows

**Type Checkboxes**:
- Mobile (<640px): Vertical stack, full width
- Desktop (≥640px): Horizontal row, equal width

**Histogram**:
- Mobile (<640px): 20-30 buckets, 100px height
- Desktop (≥640px): 60-100 buckets, 120px height

**Date Labels**:
- Mobile (<640px): MM/DD format, 12px font
- Desktop (≥640px): MMMM D, YYYY format, 14px font

---

## Animation Specifications

### Animation Principles
1. **Duration**: 150-300ms (fast, not slow)
2. **Easing**: cubic-bezier(0.4, 0, 0.2, 1) (ease-in-out)
3. **Properties**: transform, opacity, colors (GPU-accelerated)
4. **No Layout Shift**: Animate transform, not width/height

### Specific Animations

#### Preset Button Activation
```css
@keyframes preset-activate {
  from {
    transform: scale(1);
    background-color: transparent;
  }
  to {
    transform: scale(1.02);
    background-color: var(--primary);
  }
}

Duration: 150ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)
```

#### Slider Handle Drag Start
```css
@keyframes handle-grab {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.2);
  }
}

Duration: 100ms
Easing: ease-out
```

#### Slider Range Animation (Preset Click)
```css
@keyframes range-expand {
  from {
    transform: scaleX(var(--start-width));
  }
  to {
    transform: scaleX(var(--end-width));
  }
}

Duration: 300ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)
```

#### Checkbox Toggle
```css
@keyframes checkbox-check {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

Duration: 200ms
Easing: ease-out
```

#### Badge Appear/Disappear
```css
@keyframes badge-appear {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

Duration: 150ms
Easing: cubic-bezier(0.34, 1.56, 0.64, 1) /* bounce */
```

### Performance Considerations
- Use `transform` and `opacity` only (GPU-accelerated)
- Avoid animating `width`, `height`, `margin`, `padding`
- Use `will-change` sparingly (only during active drag)
- Throttle drag updates to 60fps (16.67ms intervals)

---

## Dark Mode Support

All colors use CSS variables that automatically adapt:

### Light Mode
```css
Backgrounds: White, light gray
Foregrounds: Dark gray, black
Primary: Purple #7c3aed
Borders: Light gray
```

### Dark Mode
```css
Backgrounds: Dark blue-gray, black
Foregrounds: Light gray, white
Primary: Lighter purple #8b5cf6
Borders: Medium gray
```

**Histogram Colors**: Same in both modes (Power teal, Gas pink)

**Shadows**: Darker in dark mode (higher opacity)

---

## Design Tokens Summary

```javascript
// colors.js
export const DESIGN_TOKENS = {
  colors: {
    primary: {
      light: '#7c3aed',
      dark: '#8b5cf6',
    },
    power: {
      border: 'rgb(75, 192, 192)',
      background: 'rgba(75, 192, 192, 0.7)',
    },
    gas: {
      border: 'rgb(255, 99, 132)',
      background: 'rgba(255, 99, 132, 0.7)',
    },
  },
  spacing: {
    containerPadding: {
      mobile: '1rem',
      desktop: '1.5rem',
    },
    sectionGap: '1.5rem',
    buttonGap: {
      mobile: '0.5rem',
      desktop: '0.75rem',
    },
  },
  dimensions: {
    handleSize: {
      mobile: '20px',
      desktop: '16px',
    },
    histogramHeight: {
      mobile: '100px',
      desktop: '120px',
    },
    touchTarget: '44px',
    trackHeight: '4px',
    rangeHeight: '6px',
  },
  typography: {
    label: {
      size: '0.875rem',
      weight: 600,
    },
    button: {
      size: '0.875rem',
      weight: 500,
    },
    dateLabel: {
      desktop: {
        size: '0.875rem',
        weight: 500,
      },
      mobile: {
        size: '0.75rem',
        weight: 500,
      },
    },
  },
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
    },
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
```

---

## Implementation Checklist

### Phase 1: Component Structure
- [ ] Create RangeSlider folder structure
- [ ] Set up base component with props
- [ ] Implement responsive container
- [ ] Set up CSS variables

### Phase 2: Timeline Slider Visual
- [ ] Implement SVG histogram visualization
- [ ] Add data aggregation logic
- [ ] Render histogram bars (stacked Power + Gas)
- [ ] Add Y-axis labels
- [ ] Test with various data sizes

### Phase 3: Slider Functionality
- [ ] Implement slider track
- [ ] Implement slider handles (2)
- [ ] Add mouse drag functionality
- [ ] Add touch drag functionality
- [ ] Add keyboard navigation
- [ ] Implement range highlighting
- [ ] Add date labels

### Phase 4: Preset Buttons
- [ ] Create preset button grid/scroll
- [ ] Implement active state logic
- [ ] Add click handlers
- [ ] Animate slider when preset clicked
- [ ] Test responsive behavior

### Phase 5: Type Filter
- [ ] Create checkbox button components
- [ ] Implement multi-select logic
- [ ] Add icons (Power, Gas)
- [ ] Style checked/unchecked states
- [ ] Test responsive layout

### Phase 6: Reset Button & Badge
- [ ] Implement reset button with button-secondary
- [ ] Add reset icon
- [ ] Implement badge with count
- [ ] Add badge animations
- [ ] Test reset functionality

### Phase 7: Accessibility
- [ ] Add all ARIA attributes
- [ ] Implement keyboard navigation
- [ ] Add screen reader announcements
- [ ] Test with screen reader
- [ ] Verify focus indicators

### Phase 8: Performance
- [ ] Add memoization
- [ ] Implement throttling (drag)
- [ ] Implement debouncing (filter apply)
- [ ] Test with large datasets (1000+ records)
- [ ] Optimize re-renders

### Phase 9: Testing
- [ ] Write unit tests (services, utilities)
- [ ] Write hook tests
- [ ] Write component tests
- [ ] Write integration tests
- [ ] Write accessibility tests
- [ ] Manual QA (mobile + desktop)

### Phase 10: Polish
- [ ] Refine animations
- [ ] Test dark mode
- [ ] Cross-browser testing
- [ ] Performance profiling
- [ ] Final design review

---

## Approval Checklist

Before proceeding to implementation, please approve:

- [ ] Overall visual design and layout
- [ ] Color scheme (purple primary, teal Power, pink Gas)
- [ ] Histogram visualization style (stacked bars)
- [ ] Slider handle design (circular, purple)
- [ ] Preset button design and layout
- [ ] Checkbox button design (button-styled, not native)
- [ ] Reset button style (button-secondary)
- [ ] Mobile layout (horizontal scroll presets, stacked checkboxes)
- [ ] Desktop layout (wrapped presets, row checkboxes)
- [ ] Animation timing and easing
- [ ] Touch target sizes (44px minimum)
- [ ] Date label formats (full on desktop, short on mobile)
- [ ] Accessibility approach (ARIA, keyboard navigation)

---

## Questions for Stakeholder

1. **Histogram Style**: Confirm stacked bars (Power + Gas) is preferred over side-by-side or overlapping bars?
2. **Preset Animation**: Confirm 300ms animation for slider handles when preset is clicked?
3. **Empty State**: If no measurements exist, show "No data" message and disable slider?
4. **Badge Count Logic**: Confirm multi-select types count as 1 filter total (not 1 per type)?
5. **Mobile Scroll**: Confirm horizontal scroll for presets (with scroll-snap) is acceptable?

---

## Next Steps

1. **Review** this design document
2. **Approve** the visual design and specifications
3. **Answer** the 5 questions above
4. **Begin Implementation** Phase 2 (Data Aggregation & Utilities)
5. **Reference** this document throughout implementation for exact specifications

---

**Document Version**: 1.0
**Last Updated**: 2025-11-04
**Status**: ✅ Ready for Review
**Estimated Implementation**: 64-88 hours (8-11 days)
