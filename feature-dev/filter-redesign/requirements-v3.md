# Requirements Specification: Filter Redesign V3 - Interactive Timeline Slider with Data Visualization

## Document Information
- **Feature Type**: UI Enhancement - MAJOR COMPLEX REDESIGN
- **Component**: `EnergyTableFilters` (`/src/app/components/energy/EnergyTableFilters.tsx`)
- **Related Page**: `/src/app/readings/page.tsx`
- **Status**: Requirements Defined - V3 ADVANCED REDESIGN
- **Date**: 2025-11-04
- **Version**: 3.0 (MAJOR - Complex Interactive Feature)
- **Previous Version**: V2 (Timeline Presets) - See `requirements-v2.md`
- **Complexity Level**: 🔴 **VERY HIGH** - Requires advanced UI/UX, data processing, and performance optimization

---

## Executive Summary

This is a **major evolution** of V2 requirements, transforming the timeline filter from simple preset buttons into a **sophisticated interactive range slider with real-time data visualization**. This adds significant complexity and requires careful architectural planning.

**V3 Key Changes from V2**:
- ✅ **KEEP**: Multi-select type filter (checkboxes for Power/Gas)
- ✅ **KEEP**: Reset button styling update (button-secondary)
- ✅ **KEEP**: Preset buttons (Last 7 days, Last 30 days, etc.)
- 🆕 **ADD**: Interactive dual-handle range slider (primary interaction)
- 🆕 **ADD**: Data visualization on slider track (measurement distribution)
- 🆕 **ADD**: Visual distinction between Power and Gas in slider visualization
- 🆕 **ADD**: Preset-to-slider synchronization (presets move slider handles)
- 🆕 **ADD**: Data aggregation and bucketing for visualization
- 🆕 **ADD**: Performance optimization for large datasets
- 🆕 **ADD**: Mobile-optimized touch interactions

**Impact Level**: 🔴 **VERY HIGH** - Complex feature requiring:
- Advanced component architecture
- Custom slider implementation or library integration
- Data aggregation and visualization logic
- Performance optimization strategies
- Extensive mobile UX design
- Comprehensive testing strategy

**Estimated Complexity**: 3-4x more complex than V2

---

## Problem Statement

### User Requirement (V3)

The user wants to upgrade the timeline filter from V2 (simple preset buttons) to a **visual, interactive timeline slider** that provides:

1. **Better visibility of data distribution**
   - See where measurements are concentrated over time
   - Identify gaps in data collection
   - Understand data density before filtering

2. **More precise date selection**
   - Manual fine-tuning of start/end dates via draggable handles
   - Not limited to preset ranges
   - Continuous range selection (any start/end date within dataset)

3. **Faster interaction for custom ranges**
   - Drag handles instead of clicking through date picker
   - Visual feedback of selected range
   - Instant preview of data impact

4. **Integrated experience with presets**
   - Presets still exist for quick selection
   - Presets animate slider handles to their positions
   - Slider is the primary, presets are secondary helpers

### User Pain Points (from V2 → V3)

**V2 Limitation**: Timeline presets are good for common ranges but:
- ❌ Cannot select custom ranges (e.g., "Jan 15 - Feb 10")
- ❌ No visibility into data distribution
- ❌ No visual indication of how much data is in each time period
- ❌ Difficult to understand dataset coverage at a glance

**V3 Solution**: Interactive slider with visualization:
- ✅ Visual data distribution (histogram/heatmap showing measurement counts)
- ✅ Draggable handles for custom range selection
- ✅ Presets as "jump to" helpers (animate slider handles)
- ✅ Continuous range selection across entire dataset
- ✅ Visual distinction between Power and Gas measurements

---

## Current Application State

**Existing Implementation** (as of V2):
- **File**: `/src/app/components/energy/EnergyTableFilters.tsx`
- **Features**: Timeline preset buttons, multi-select checkboxes, reset button
- **Data Access**: Parent provides `energyData` via props (all measurements)
- **Date Range Handling**: Calculated from preset selections
- **Type Filter**: Multi-select checkboxes (Power, Gas)

**Data Available for Visualization**:
```typescript
// Parent component has access to:
const { data: energyData } = useEnergyData(); // EnergyType[]

// Each energy reading contains:
type EnergyType = {
  _id: string;
  userId: string;
  date: Date;
  type: EnergyOptions; // "power" | "gas"
  amount: number;
};
```

**Existing Chart Visualization**:
- Chart.js used for line charts (`UnifiedEnergyChart.tsx`)
- Data aggregation already exists for monthly/yearly views
- Color coding: Power (blue), Gas (orange)

**Mobile Experience**:
- Touch targets: 44x44px minimum
- Horizontal scroll for preset buttons
- Responsive grid layout

---

## Platform Requirements

### Mobile (Primary)
**Target Platforms**: iOS and Android
**Minimum Requirements**:
- iOS: 13+
- Android: 8.0+
- Screen sizes: 320px - 428px width

**Mobile-Specific Slider Requirements** (NEW):
- ✅ **Touch targets**: Slider handles minimum 44x44px (larger than visual)
- ✅ **Drag precision**: Smooth dragging with touch events (not just mouse)
- ✅ **Haptic feedback** (optional): Vibration on handle snap (if supported)
- ✅ **Gesture support**: Pinch-to-zoom NOT needed, but drag must work smoothly
- ✅ **Visualization legibility**: Data visualization must be readable on small screens
- ✅ **Performance**: 60fps dragging on mid-range devices
- ✅ **Horizontal space**: Slider may extend beyond viewport width (horizontal scroll container)
- ✅ **Preset integration**: Preset buttons still in horizontal scroll container

### Desktop (Secondary)
**Minimum Requirements**:
- Browser support: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- Screen sizes: 1024px+ width

**Desktop-Specific Slider Requirements** (NEW):
- ✅ **Mouse interactions**: Hover states for handles, click-to-drag
- ✅ **Keyboard navigation**: Arrow keys to adjust handles (accessibility)
- ✅ **Track click**: Click on track to move nearest handle to that position
- ✅ **Tooltip on hover**: Show date when hovering over track/handles
- ✅ **Wheel scroll** (optional): Scroll to adjust handle position

### Responsive Design
**Breakpoints**:
- Mobile: 320px - 767px (primary)
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Responsive Slider Behavior**:
- **Mobile**:
  - Slider in horizontal scroll container if very wide
  - Handles large enough for touch (44x44px)
  - Visualization simplified (fewer data points/buckets)
  - Preset buttons above slider
- **Tablet**:
  - Slider may fit on screen or slightly scrollable
  - Medium detail visualization
- **Desktop**:
  - Full slider visible without scroll
  - High detail visualization (more data points/buckets)
  - Preset buttons inline with slider or above

---

## Functional Requirements

### FR-V3-1: Interactive Range Slider (NEW - CORE FEATURE)
**Priority**: 🔴 **CRITICAL** - Core V3 feature
**Status**: Not Implemented
**Complexity**: 🔴 **VERY HIGH**

**Description**:
An interactive dual-handle range slider that spans the full date range of the dataset, allowing users to select any custom date range by dragging start and end handles.

**Slider Specifications**:

**Range Calculation**:
```typescript
// Determine slider min/max from dataset
const allDates = energyData.map(item => item.date);
const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));

// Slider range spans from earliest to latest measurement
const sliderRange = {
  min: minDate,
  max: maxDate,
};

// Default handles (start at full range or "All time")
const defaultHandles = {
  start: minDate,
  end: maxDate,
};
```

**Handle Behavior**:
- **Two Handles**: Start date (left) and End date (right)
- **Draggable**: Both handles can be dragged independently
- **Constraints**:
  - Start handle cannot go past end handle
  - End handle cannot go before start handle
  - Handles constrained to slider min/max range
- **Snapping** (Decision Required):
  - **Option A**: Continuous (handles can be at any position, dates interpolated)
  - **Option B**: Snap to actual measurement dates only
  - **Recommendation**: **Option A** (continuous) for flexibility, with optional snap-to-data toggle
- **Visual Feedback**:
  - Active handle highlighted (larger, different color)
  - Track between handles highlighted (selected range)
  - Track outside handles dimmed/grayed out

**Interaction Methods**:
1. **Drag Handles**: Click/touch and drag handles to new positions
2. **Click Track**: Click on track to move nearest handle to that position
3. **Keyboard** (Desktop):
   - Tab to focus handle
   - Arrow keys (Left/Right) to adjust by 1 day
   - Shift + Arrow keys to adjust by 7 days (week)
   - Page Up/Down to adjust by 30 days (month)
4. **Preset Buttons**: Clicking preset animates handles to preset positions

**Date Display**:
- Show current selected dates below/beside handles
- Format: "Jan 15, 2024 - Feb 10, 2024" or "2024-01-15 to 2024-02-10"
- Update in real-time as handles are dragged
- **Mobile**: Simplified format or date picker icon

**Performance Requirements**:
- Smooth dragging: 60fps target
- No lag on datasets with 1000+ measurements
- Debounce filter application (apply filter on drag end, not during drag)
- Throttle visualization updates during drag

**State Management**:
```typescript
interface SliderState {
  startDate: Date;
  endDate: Date;
  isDragging: boolean;
  activeHandle: 'start' | 'end' | null;
}

const [sliderState, setSliderState] = useState<SliderState>({
  startDate: minDate,
  endDate: maxDate,
  isDragging: false,
  activeHandle: null,
});
```

**Acceptance Criteria**:
- ✅ Slider renders spanning full dataset date range
- ✅ Two handles (start/end) are draggable
- ✅ Handles cannot cross each other
- ✅ Selected range visually highlighted on track
- ✅ Current selected dates displayed clearly
- ✅ Smooth dragging on mobile (touch) and desktop (mouse)
- ✅ Keyboard navigation works (Tab + Arrow keys)
- ✅ Filter updates when handles are released (debounced)
- ✅ No performance issues with 1000+ measurements
- ✅ Works on mobile screens (320px width)

**Edge Cases**:
- ✅ No data: Slider disabled or hidden
- ✅ Single measurement: Slider shows single date (handles at same position)
- ✅ Very large range (multiple years): Slider scales appropriately
- ✅ Very small range (same day): Slider shows hours/times or single day
- ✅ Handle collision: Handles can touch but not cross

---

### FR-V3-2: Data Visualization on Slider Track (NEW - CORE FEATURE)
**Priority**: 🔴 **CRITICAL** - Core V3 feature
**Status**: Not Implemented
**Complexity**: 🔴 **VERY HIGH**

**Description**:
A visual representation of measurement distribution over time, displayed on/under the slider track as a "pictogram" showing where measurements are concentrated.

**Visualization Options** (Decision Required):

#### Option A: Mini Histogram (RECOMMENDED)
**Description**: Vertical bars showing measurement count per time bucket

**Visual**:
```
       ▃    ▅      ▂   ▇     ▄
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ^                           ^
 Start                       End
```

**Pros**:
- ✅ Clear visual representation of data density
- ✅ Easy to see gaps in data
- ✅ Can distinguish Power vs Gas (stacked or side-by-side bars)
- ✅ Familiar to users (common chart type)

**Cons**:
- ❌ May be cluttered on small screens with many buckets
- ❌ Requires data aggregation into time buckets

**Implementation**:
- SVG or Canvas for rendering
- Bars positioned behind slider track (z-index layering)
- Bar height represents measurement count in that bucket
- Color coding: Power (blue), Gas (orange), Both (stacked or blended)

---

#### Option B: Mini Line Chart / Sparkline
**Description**: Simplified line showing measurement value trend

**Visual**:
```
     ╱╲    ╱╲  ╱─╲
  ──╱──╲──╱──╲╱───╲─────
  ^                     ^
 Start                 End
```

**Pros**:
- ✅ Shows trend over time (increasing/decreasing values)
- ✅ Compact (single line)
- ✅ Can overlay Power and Gas lines

**Cons**:
- ❌ Less clear for showing data density (gaps)
- ❌ May be confusing if users expect count, not values
- ❌ Difficult to distinguish Power vs Gas on small screens

**Implementation**:
- SVG path for line
- Line behind slider track
- Two lines (Power blue, Gas orange) or single combined line

---

#### Option C: Heatmap / Intensity Bar
**Description**: Gradient or color intensity showing measurement density

**Visual**:
```
  ░░░▓▓░░▓▓▓░░░▓▓▓▓▓░░
  ━━━━━━━━━━━━━━━━━━━━━━
  ^                   ^
 Start               End
```

**Pros**:
- ✅ Very compact (single bar)
- ✅ Clear indication of data density
- ✅ No vertical space needed

**Cons**:
- ❌ Cannot easily distinguish Power vs Gas
- ❌ Less precise (gradient can be ambiguous)
- ❌ Accessibility concerns (color-only information)

**Implementation**:
- CSS gradient or SVG rectangles
- Color intensity based on measurement count
- Behind or as part of slider track

---

#### Option D: Dot Plot / Scatter
**Description**: Individual dots for each measurement

**Visual**:
```
  • •  ••• • •••• •  ••
  ━━━━━━━━━━━━━━━━━━━━━
  ^                   ^
 Start               End
```

**Pros**:
- ✅ Shows exact measurement positions
- ✅ Can color-code dots (Power blue, Gas orange)
- ✅ No aggregation needed (exact data)

**Cons**:
- ❌ Overwhelming with 1000+ measurements
- ❌ Overlapping dots at same date
- ❌ Not scalable for large datasets

**Implementation**:
- SVG circles for each measurement
- Requires filtering/sampling for large datasets
- Color-coded by type

---

**RECOMMENDATION: Option A - Mini Histogram**

**Rationale**:
1. **Best balance** of clarity, functionality, and visual appeal
2. **Clear data density indication** - easy to see where measurements are
3. **Type distinction** - can use stacked or side-by-side bars for Power/Gas
4. **Scalable** - data aggregation into buckets handles large datasets well
5. **Familiar** - users understand bar charts intuitively
6. **Mobile-friendly** - can reduce bucket count on small screens

**Implementation Details for Option A (Mini Histogram)**:

**Data Aggregation**:
```typescript
interface DataBucket {
  startDate: Date;
  endDate: Date;
  powerCount: number;
  gasCount: number;
  totalCount: number;
}

// Aggregate measurements into time buckets
const aggregateData = (
  data: EnergyType[],
  bucketCount: number
): DataBucket[] => {
  const minDate = Math.min(...data.map(d => d.date.getTime()));
  const maxDate = Math.max(...data.map(d => d.date.getTime()));
  const bucketSize = (maxDate - minDate) / bucketCount;

  const buckets: DataBucket[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = new Date(minDate + i * bucketSize);
    const bucketEnd = new Date(minDate + (i + 1) * bucketSize);

    const bucketData = data.filter(
      item => item.date >= bucketStart && item.date < bucketEnd
    );

    buckets.push({
      startDate: bucketStart,
      endDate: bucketEnd,
      powerCount: bucketData.filter(d => d.type === 'power').length,
      gasCount: bucketData.filter(d => d.type === 'gas').length,
      totalCount: bucketData.length,
    });
  }

  return buckets;
};
```

**Bucket Count (Responsive)**:
- **Mobile**: 20-30 buckets (fewer for readability)
- **Tablet**: 40-60 buckets
- **Desktop**: 60-100 buckets

**Visual Rendering** (SVG):
```tsx
<svg className="slider-visualization" width="100%" height="60">
  {buckets.map((bucket, index) => {
    const maxHeight = 40; // max bar height in pixels
    const maxCount = Math.max(...buckets.map(b => b.totalCount));
    const heightScale = maxHeight / maxCount;

    // Stacked bars: Power (bottom) + Gas (top)
    const powerHeight = bucket.powerCount * heightScale;
    const gasHeight = bucket.gasCount * heightScale;

    return (
      <g key={index}>
        {/* Power bar (blue) */}
        <rect
          x={`${(index / buckets.length) * 100}%`}
          y={maxHeight - powerHeight}
          width={`${(1 / buckets.length) * 100}%`}
          height={powerHeight}
          fill="rgba(59, 130, 246, 0.6)" // blue with transparency
        />
        {/* Gas bar (orange) stacked on top */}
        <rect
          x={`${(index / buckets.length) * 100}%`}
          y={maxHeight - powerHeight - gasHeight}
          width={`${(1 / buckets.length) * 100}%`}
          height={gasHeight}
          fill="rgba(249, 115, 22, 0.6)" // orange with transparency
        />
      </g>
    );
  })}
</svg>
```

**Alternative: Side-by-Side Bars** (instead of stacked):
```tsx
// Split bucket width in half: left = Power, right = Gas
<rect
  x={`${(index / buckets.length) * 100}%`}
  width={`${(0.5 / buckets.length) * 100}%`}
  height={powerHeight}
  fill="rgba(59, 130, 246, 0.6)"
/>
<rect
  x={`${((index + 0.5) / buckets.length) * 100}%`}
  width={`${(0.5 / buckets.length) * 100}%`}
  height={gasHeight}
  fill="rgba(249, 115, 22, 0.6)"
/>
```

**Recommendation**: **Stacked bars** - better space utilization, clearer total count

**Type Filter Integration**:
- When type filter is applied (e.g., only Power selected):
  - Show only Power bars in histogram
  - Gray out Gas bars or hide them
  - Update histogram in real-time when checkboxes change

**Acceptance Criteria**:
- ✅ Histogram renders on slider track background
- ✅ Bars represent measurement counts per time bucket
- ✅ Power (blue) and Gas (orange) visually distinguished (stacked bars)
- ✅ Bucket count responsive (fewer on mobile, more on desktop)
- ✅ Performance: Aggregation < 100ms for 1000+ measurements
- ✅ Histogram updates when type filter changes
- ✅ Bars positioned accurately along timeline
- ✅ No overlap with slider handles or track UI
- ✅ Readable on mobile screens (320px width)
- ✅ Accessible: Alternative text or ARIA labels for screen readers

---

### FR-V3-3: Preset Button to Slider Synchronization (UPDATED)
**Priority**: 🔴 **HIGH** - Integration feature
**Status**: Requires Implementation
**Complexity**: 🟡 **MEDIUM**

**Description**:
Timeline preset buttons (from V2) now act as "quick select" helpers that animate the slider handles to predefined positions.

**Previous Behavior (V2)**:
- Clicking preset button sets date range directly
- Active preset highlighted

**New Behavior (V3)**:
- Clicking preset button **animates slider handles** to preset positions
- Handles move smoothly from current position to preset positions
- Active preset highlighted when slider handles match preset range
- If user manually adjusts slider, preset deselects (custom range)

**Preset-to-Slider Mapping**:
```typescript
// When "Last 30 days" preset is clicked:
const preset = TIMELINE_PRESETS.find(p => p.id === "last-30-days");
const { start, end } = preset.calculateRange();

// Animate slider handles to these positions
animateSliderHandles({
  startDate: start,
  endDate: end,
  duration: 300, // ms
});

// Highlight "Last 30 days" button as active
setActivePreset("last-30-days");
```

**Active Preset Detection** (Reverse Sync):
```typescript
// When slider handles are manually adjusted:
const handleSliderChange = (startDate: Date, endDate: Date) => {
  // Check if current slider position matches any preset
  const matchingPreset = TIMELINE_PRESETS.find(preset => {
    const { start, end } = preset.calculateRange();
    return (
      isSameDay(startDate, start) &&
      isSameDay(endDate, end)
    );
  });

  // Update active preset (or null if custom range)
  setActivePreset(matchingPreset?.id || null);
};
```

**Animation** (Optional but Recommended):
```typescript
// Smooth animation using CSS transitions or JavaScript animation
const animateSliderHandles = (
  { startDate, endDate, duration }: AnimationConfig
) => {
  // Calculate start and end positions as percentage
  const startPercent = dateToPercent(startDate);
  const endPercent = dateToPercent(endDate);

  // Use CSS transition or React Spring for smooth animation
  setSliderState({
    startDate,
    endDate,
    isAnimating: true,
  });

  setTimeout(() => {
    setSliderState(prev => ({ ...prev, isAnimating: false }));
  }, duration);
};
```

**Preset Button Visual States**:
- **Active (matches slider)**: `bg-primary text-primary-foreground`
- **Inactive**: `bg-transparent border-2 border-border`
- **Hover**: `border-primary/50 bg-primary/5`
- **Disabled** (if no data in range): `opacity-30 cursor-not-allowed`

**Acceptance Criteria**:
- ✅ Clicking preset button animates slider handles to preset positions
- ✅ Animation smooth (300ms transition)
- ✅ Active preset highlighted when slider matches preset range
- ✅ Manual slider adjustment deselects active preset
- ✅ Preset buttons remain functional (V2 behavior preserved)
- ✅ No conflict between preset and manual slider adjustments
- ✅ Works on mobile (touch) and desktop (click)

---

### FR-V3-4: Multi-Select Type Filter (UNCHANGED from V2)
**Priority**: 🔴 **HIGH**
**Status**: V2 Requirement - Carried Forward
**Complexity**: 🟡 **MEDIUM**

**Description**: Multi-select checkboxes for Power and Gas (no "All" option).

**See V2 Requirements** (`requirements-v2.md` - FR-V2-2) for full details.

**V3 Integration**:
- Type filter affects histogram visualization (shows only selected types)
- Type filter combines with slider date range (AND logic)
- Badge count includes type filter (0-2 active filters)

**No changes from V2 specification.**

---

### FR-V3-5: Reset Functionality (UPDATED from V2)
**Priority**: 🟡 **MEDIUM**
**Status**: Requires Update
**Complexity**: 🟢 **LOW**

**Description**: Reset button clears all filters including slider position.

**Previous Behavior (V2)**:
```typescript
const handleResetFilters = () => {
  setSelectedTypes([]);
  setActiveTimeline(null);
};
```

**New Behavior (V3)**:
```typescript
const handleResetFilters = () => {
  setSelectedTypes([]);              // Clear type selections
  setActivePreset(null);              // Clear active preset
  setSliderState({                    // Reset slider to full range
    startDate: minDate,
    endDate: maxDate,
    isDragging: false,
    activeHandle: null,
  });
};
```

**Visual Feedback**:
- Slider handles animate back to full range (min/max)
- All checkboxes become unchecked
- All preset buttons become inactive
- Badge count returns to 0

**Acceptance Criteria**:
- ✅ Reset button clears type filter
- ✅ Reset button clears active preset
- ✅ Reset button resets slider to full date range
- ✅ Slider handles animate to min/max positions
- ✅ Badge count returns to 0
- ✅ Table shows all unfiltered data

---

### FR-V3-6: Active Filter Badge (UPDATED from V2)
**Priority**: 🟡 **MEDIUM**
**Status**: Requires Update
**Complexity**: 🟢 **LOW**

**Description**: Badge shows count of active filters (0-2).

**New Calculation (V3)**:
```typescript
const activeFilterCount = [
  selectedTypes.length > 0 ? 1 : 0,           // Type filter active
  isCustomRange(sliderState) ? 1 : 0,         // Custom slider range active
].reduce((sum, val) => sum + val, 0);

// Helper function
const isCustomRange = (state: SliderState): boolean => {
  // Range is custom if it's not the full dataset range
  return !(
    isSameDay(state.startDate, minDate) &&
    isSameDay(state.endDate, maxDate)
  );
};
```

**Alternative Calculation** (Count presets as active):
```typescript
const activeFilterCount = [
  selectedTypes.length > 0 ? 1 : 0,           // Type filter active
  activePreset !== null ? 1 : 0,              // Preset active (OR custom range)
].reduce((sum, val) => sum + val, 0);
```

**Recommendation**: First approach (custom range detection) - more accurate

**Acceptance Criteria**:
- ✅ Badge shows correct count (0-2)
- ✅ Custom slider range counts as active filter
- ✅ Full range (no filter) does not count
- ✅ Type filter with selections counts as 1
- ✅ Badge hidden when count = 0

---

### FR-V3-7: Responsive Layout (UPDATED from V2)
**Priority**: 🔴 **HIGH**
**Status**: Requires Major Update
**Complexity**: 🟡 **MEDIUM**

**Description**: Layout must accommodate slider visualization while maintaining mobile-first design.

**New Layout Structure (V3)**:

```
Mobile (1 column):
┌─────────────────────────────────────┐
│ Timeline Presets (Horizontal Scroll)│
│ [←─ 7d|30d|90d|M|Y|All ─→]         │
├─────────────────────────────────────┤
│ Interactive Slider + Visualization  │
│ ┌─────────────────────────────────┐ │
│ │   ▃▅▂▇▄   (Histogram)           │ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━    │ │
│ │ ◄────────────────────────────►  │ │
│ └─────────────────────────────────┘ │
│ Jan 15, 2024 - Feb 10, 2024        │
├─────────────────────────────────────┤
│ Type                                │
│ [✓] Power                           │
│ [✓] Gas                             │
├─────────────────────────────────────┤
│ [Reset] (1)                         │
└─────────────────────────────────────┘

Desktop (Grid):
┌────────────────────────────────────────────────┐
│ Timeline Presets                               │
│ [7d] [30d] [90d] [Month] [Year] [All]         │
├────────────────────────────────────────────────┤
│ Interactive Slider + Visualization             │
│ ┌──────────────────────────────────────────┐   │
│ │     ▃▅▂▇▄  (Histogram - More Detail)    │   │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │   │
│ │ ◄───────────────────────────────────►    │   │
│ └──────────────────────────────────────────┘   │
│ Jan 15, 2024 - Feb 10, 2024                    │
├────────────────────────────────────────────────┤
│ Type: [✓] Power  [✓] Gas  │  [Reset] (1)      │
└────────────────────────────────────────────────┘
```

**Slider Component Height**:
- **Mobile**: 80-100px (histogram + track + labels)
- **Desktop**: 80-120px (more detail in histogram)

**Grid Structure** (Updated):
```tsx
<div className="solid-container">
  <div className="flex flex-col gap-4">
    {/* Timeline Presets Section */}
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">Timeline</label>
      <div className="overflow-x-auto sm:overflow-visible">
        <div className="flex gap-2 sm:flex-wrap pb-2 sm:pb-0">
          {/* Preset buttons */}
        </div>
      </div>
    </div>

    {/* Interactive Slider Section (NEW) */}
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">Custom Range</label>
      <div className="relative">
        {/* Slider with visualization */}
        <RangeSlider
          min={minDate}
          max={maxDate}
          startValue={sliderState.startDate}
          endValue={sliderState.endDate}
          onChange={handleSliderChange}
          visualization={buckets}
        />
      </div>
      {/* Selected date range display */}
      <div className="text-xs text-muted-foreground text-center">
        {formatDateRange(sliderState.startDate, sliderState.endDate)}
      </div>
    </div>

    {/* Type + Reset Section (Unchanged from V2) */}
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      {/* Type checkboxes */}
      {/* Reset button + badge */}
    </div>
  </div>
</div>
```

**Acceptance Criteria**:
- ✅ Mobile: Slider in dedicated section, full-width
- ✅ Mobile: Preset buttons above slider in horizontal scroll
- ✅ Desktop: Slider full-width, presets above
- ✅ Slider visualization readable on all screen sizes
- ✅ No horizontal overflow issues
- ✅ Clear visual hierarchy (presets → slider → type/reset)

---

## Non-Functional Requirements

### NFR-V3-1: Performance (CRITICAL)
**Priority**: 🔴 **CRITICAL**
**Status**: New V3 Requirement
**Complexity**: 🔴 **VERY HIGH**

**Performance Targets**:

1. **Data Aggregation**:
   - Aggregate 1000 measurements into buckets: **< 100ms**
   - Aggregate 10,000 measurements: **< 500ms**
   - Use memoization to cache aggregation results

2. **Slider Rendering**:
   - Initial render: **< 200ms**
   - Re-render on type filter change: **< 100ms**
   - SVG/Canvas rendering: **< 50ms**

3. **Dragging Performance**:
   - Maintain **60fps** during handle drag
   - Throttle visualization updates during drag (max 30fps for viz)
   - Debounce filter application (apply on drag end, not during)

4. **Memory Usage**:
   - Aggregated data structure: **< 1MB** for typical dataset
   - No memory leaks on repeated slider interactions
   - Efficient cleanup of event listeners

**Optimization Strategies**:

**Strategy 1: Memoization**
```typescript
// Memoize aggregated bucket data
const buckets = useMemo(() => {
  return aggregateData(energyData, getBucketCount());
}, [energyData, isMobile]); // Only recalculate if data or screen size changes

// Memoize min/max dates
const { minDate, maxDate } = useMemo(() => {
  const dates = energyData.map(d => d.date.getTime());
  return {
    minDate: new Date(Math.min(...dates)),
    maxDate: new Date(Math.max(...dates)),
  };
}, [energyData]);
```

**Strategy 2: Throttling and Debouncing**
```typescript
// Throttle visualization updates during drag (30fps = ~33ms)
const throttledVizUpdate = useCallback(
  throttle((startDate, endDate) => {
    updateVisualization(startDate, endDate);
  }, 33),
  []
);

// Debounce filter application (apply after 200ms of no movement)
const debouncedFilterUpdate = useCallback(
  debounce((startDate, endDate) => {
    setDateRange({ start: startDate, end: endDate });
  }, 200),
  []
);
```

**Strategy 3: Virtual Scrolling (If Needed)**
- For very large datasets (10,000+ measurements), consider sampling data for visualization
- Show representative sample rather than all data points

**Strategy 4: Web Workers (Advanced)**
- Move data aggregation to Web Worker for large datasets
- Keeps UI thread responsive during heavy computation
- May be overkill for typical datasets (< 5000 measurements)

**Verification**:
- Use React DevTools Profiler
- Chrome Performance tab for FPS measurement
- Test with 1000, 5000, 10,000 measurement datasets
- Test on mid-range mobile devices (not just desktop)

**Acceptance Criteria**:
- ✅ No lag during slider dragging (60fps maintained)
- ✅ Data aggregation completes in < 100ms for 1000 measurements
- ✅ Filter updates apply smoothly (no jank)
- ✅ No memory leaks after 100+ slider interactions
- ✅ Works smoothly on mid-range mobile devices

---

### NFR-V3-2: Accessibility (CRITICAL)
**Priority**: 🔴 **CRITICAL**
**Status**: New V3 Requirement
**Complexity**: 🟡 **MEDIUM-HIGH**

**WCAG 2.1 AA Compliance**:

1. **Keyboard Navigation**:
   - ✅ **Tab to slider**: Focus on first handle (start)
   - ✅ **Tab again**: Focus on second handle (end)
   - ✅ **Arrow keys**: Adjust focused handle (Left/Right by 1 day)
   - ✅ **Shift + Arrow keys**: Larger adjustments (by 7 days)
   - ✅ **Page Up/Down**: Adjust by month (30 days)
   - ✅ **Home/End**: Jump to min/max date
   - ✅ **Enter**: Open date picker (optional enhancement)

2. **Screen Reader Support**:
   - ✅ Slider has `role="slider"` (dual-slider or range)
   - ✅ `aria-label` for each handle: "Start date handle", "End date handle"
   - ✅ `aria-valuemin`, `aria-valuemax`, `aria-valuenow` on each handle
   - ✅ `aria-valuetext` for human-readable dates: "January 15, 2024"
   - ✅ Histogram visualization has `aria-hidden="true"` or descriptive `aria-label`
   - ✅ Live region announces range changes: "Date range selected: Jan 15 to Feb 10, 2024"

3. **Visual Accessibility**:
   - ✅ **Color contrast**: Handles meet 3:1 contrast ratio with track
   - ✅ **Focus indicators**: Clear visible focus on handles (2px outline)
   - ✅ **Not color-only**: Histogram uses color + pattern (e.g., Power = solid, Gas = striped)
   - ✅ **High contrast mode**: Works in Windows high contrast mode
   - ✅ **Zoom**: Works at 200% browser zoom without breaking layout

4. **Touch Accessibility**:
   - ✅ Handles minimum 44x44px touch targets
   - ✅ Handle tap area larger than visual handle
   - ✅ No accidental drags (drag threshold before movement starts)

**ARIA Implementation Example**:
```tsx
<div
  role="group"
  aria-labelledby="slider-label"
  className="range-slider"
>
  <span id="slider-label" className="sr-only">
    Select date range
  </span>

  {/* Start handle */}
  <div
    role="slider"
    aria-label="Start date"
    aria-valuemin={minDate.getTime()}
    aria-valuemax={maxDate.getTime()}
    aria-valuenow={sliderState.startDate.getTime()}
    aria-valuetext={formatDate(sliderState.startDate)}
    tabIndex={0}
    onKeyDown={handleKeyDown}
    className="slider-handle slider-handle-start"
  />

  {/* End handle */}
  <div
    role="slider"
    aria-label="End date"
    aria-valuemin={minDate.getTime()}
    aria-valuemax={maxDate.getTime()}
    aria-valuenow={sliderState.endDate.getTime()}
    aria-valuetext={formatDate(sliderState.endDate)}
    tabIndex={0}
    onKeyDown={handleKeyDown}
    className="slider-handle slider-handle-end"
  />

  {/* Live region for announcements */}
  <div
    role="status"
    aria-live="polite"
    className="sr-only"
  >
    {sliderAnnouncementText}
  </div>
</div>
```

**Acceptance Criteria**:
- ✅ Full keyboard navigation works
- ✅ Screen reader announces handle positions and range
- ✅ Focus states visible on all handles
- ✅ Color contrast meets WCAG AA (3:1 for UI, 4.5:1 for text)
- ✅ Works in high contrast mode
- ✅ Passes axe-core automated accessibility audit
- ✅ Manual testing with NVDA/VoiceOver

---

### NFR-V3-3: Mobile Responsiveness (CRITICAL)
**Priority**: 🔴 **CRITICAL**
**Status**: New V3 Requirement
**Complexity**: 🔴 **HIGH**

**Mobile-Specific Requirements**:

1. **Touch Dragging**:
   - ✅ Smooth touch drag with no lag
   - ✅ Prevent page scroll during handle drag
   - ✅ Handle visual feedback on touch (highlight active handle)
   - ✅ Drag threshold: 5px minimum movement before drag starts (prevent accidental drags)
   - ✅ Haptic feedback on handle snap (optional, if supported)

2. **Slider Size**:
   - ✅ Handle size: 44x44px minimum (visible may be smaller, tap area larger)
   - ✅ Track height: 8-12px for easy targeting
   - ✅ Histogram height: 30-40px (readable bars)

3. **Visualization Simplification**:
   - ✅ Fewer buckets on mobile (20-30 vs 60-100 on desktop)
   - ✅ Larger bars (easier to see)
   - ✅ Optional: Tap histogram bar to jump handle to that range

4. **Horizontal Scrolling** (If Needed):
   - ✅ If slider is very wide, allow horizontal scroll
   - ✅ Scroll snap points for smooth scrolling
   - ✅ Fade effect at edges to indicate more content

5. **Tooltip/Date Display**:
   - ✅ Show current selected dates below slider (always visible)
   - ✅ Optional: Show date tooltip above active handle during drag
   - ✅ Format: Short date format on mobile ("Jan 15" vs "January 15, 2024")

**Touch Event Handling**:
```typescript
const handleTouchStart = (e: TouchEvent, handle: 'start' | 'end') => {
  e.preventDefault(); // Prevent page scroll
  setSliderState(prev => ({ ...prev, isDragging: true, activeHandle: handle }));

  const touch = e.touches[0];
  const startX = touch.clientX;

  // Store initial position for drag threshold
  dragStartRef.current = { x: startX, handle };
};

const handleTouchMove = (e: TouchEvent) => {
  if (!sliderState.isDragging) return;

  const touch = e.touches[0];
  const currentX = touch.clientX;

  // Check drag threshold (prevent accidental drags)
  const dragDistance = Math.abs(currentX - dragStartRef.current.x);
  if (dragDistance < 5) return; // 5px threshold

  // Calculate new date position
  const newDate = calculateDateFromPosition(currentX);

  // Throttled update (30fps for smooth performance)
  throttledHandleUpdate(newDate);
};

const handleTouchEnd = () => {
  setSliderState(prev => ({ ...prev, isDragging: false, activeHandle: null }));

  // Apply filter (debounced)
  debouncedFilterUpdate(sliderState.startDate, sliderState.endDate);
};
```

**Acceptance Criteria**:
- ✅ Smooth touch dragging on mobile (60fps)
- ✅ No page scroll during slider drag
- ✅ Handles large enough for touch (44x44px)
- ✅ Visualization readable on 320px screens
- ✅ Drag threshold prevents accidental drags
- ✅ Works on iOS Safari and Android Chrome
- ✅ No horizontal overflow issues

---

### NFR-V3-4: Browser Compatibility (UNCHANGED)
**Priority**: 🟡 **MEDIUM**

**Requirements** (same as V2):
- Chrome 90+ ✅
- Safari 14+ ✅
- Firefox 88+ ✅
- Edge 90+ ✅

**V3 Additional Considerations**:
- SVG rendering support (all modern browsers)
- CSS transforms for handle positioning (all modern browsers)
- Touch events (mobile browsers)
- ResizeObserver for responsive visualization (polyfill if needed)

---

### NFR-V3-5: Maintainability (CRITICAL)
**Priority**: 🔴 **CRITICAL**
**Status**: New V3 Requirement
**Complexity**: 🟡 **MEDIUM**

**Code Organization Principles**:

1. **Separation of Concerns**:
   - ✅ **Slider logic**: Separate component (`RangeSlider.tsx`)
   - ✅ **Visualization logic**: Separate component (`SliderVisualization.tsx`)
   - ✅ **Data aggregation**: Utility function (`aggregateData.ts`)
   - ✅ **Date calculations**: Utility functions (`dateUtils.ts`)

2. **Single Responsibility**:
   - ✅ `RangeSlider`: Handles drag interactions, state management
   - ✅ `SliderVisualization`: Renders histogram/visualization only
   - ✅ `EnergyTableFilters`: Orchestrates all filter components

3. **Testability**:
   - ✅ Pure functions for date calculations (easy to test)
   - ✅ Isolated components (can test slider without parent)
   - ✅ Mock data aggregation in tests

4. **Configurability**:
   - ✅ Bucket count configurable (responsive)
   - ✅ Visualization type configurable (future: switch histogram/heatmap/line)
   - ✅ Animation duration configurable
   - ✅ Color scheme configurable (from constants)

**File Structure** (V3):
```
src/app/components/energy/
├── EnergyTableFilters.tsx           # Main orchestrator (updated)
├── RangeSlider/
│   ├── RangeSlider.tsx              # NEW: Slider component
│   ├── SliderHandle.tsx             # NEW: Individual handle
│   ├── SliderTrack.tsx              # NEW: Slider track
│   ├── SliderVisualization.tsx      # NEW: Histogram visualization
│   └── __tests__/
│       ├── RangeSlider.test.tsx
│       ├── SliderVisualization.test.tsx
│       └── sliderUtils.test.ts
├── __tests__/
│   └── EnergyTableFilters.test.tsx  # Updated tests

src/app/utils/
├── sliderUtils.ts                   # NEW: Slider calculations
├── dataAggregation.ts               # NEW: Bucket aggregation
└── dateUtils.ts                     # Updated: Add slider helpers

src/app/constants/
├── timelinePresets.ts               # From V2 (unchanged)
└── slider.ts                        # NEW: Slider constants
```

**Acceptance Criteria**:
- ✅ Components follow SRP
- ✅ Slider logic separated from parent component
- ✅ Data aggregation is pure function (testable)
- ✅ Configuration constants extracted
- ✅ 100% test coverage for slider logic
- ✅ Clear file organization

---

## Technical Specifications

### Architecture

**Component Hierarchy** (V3):
```
EnergyTableFilters (Parent)
├── TimelinePresets (V2 - Unchanged)
│   └── Preset buttons
├── RangeSlider (NEW)
│   ├── SliderVisualization
│   │   └── Histogram bars (SVG)
│   ├── SliderTrack
│   │   └── Track background + selected range highlight
│   ├── SliderHandle (x2)
│   │   ├── Start handle
│   │   └── End handle
│   └── DateRangeDisplay
│       └── "Jan 15, 2024 - Feb 10, 2024"
├── TypeFilter (V2 - Unchanged)
│   └── Multi-select checkboxes
└── ResetButton (V2 - Updated logic)
    └── Reset + Badge
```

**Data Flow**:
```
Parent Component (readings/page.tsx)
  │
  ├─ energyData: EnergyType[] ──────┐
  │                                  │
  ▼                                  ▼
EnergyTableFilters              Data Aggregation
  │                                  │
  ├─ Calculate min/max dates         │
  ├─ Aggregate into buckets ◄────────┘
  │
  ▼
RangeSlider
  │
  ├─ Render visualization (buckets)
  ├─ Handle drag interactions
  ├─ Calculate date from position
  │
  ▼
Emit dateRange to Parent
  │
  ▼
Parent filters energyData
  │
  ▼
Table updates
```

---

### Data Models & Types

**New Types (V3)**:
```typescript
// src/app/types.ts

/**
 * Data bucket for histogram visualization
 */
export interface DataBucket {
  startDate: Date;
  endDate: Date;
  powerCount: number;
  gasCount: number;
  totalCount: number;
}

/**
 * Slider state
 */
export interface SliderState {
  startDate: Date;
  endDate: Date;
  isDragging: boolean;
  activeHandle: 'start' | 'end' | null;
}

/**
 * Range slider props
 */
export interface RangeSliderProps {
  min: Date;                          // Earliest date in dataset
  max: Date;                          // Latest date in dataset
  startValue: Date;                   // Current start date
  endValue: Date;                     // Current end date
  onChange: (start: Date, end: Date) => void;
  visualization: DataBucket[];        // Aggregated data for histogram
  disabled?: boolean;                 // Disable slider if no data
  bucketCount?: number;               // Number of buckets (responsive)
}

/**
 * Slider visualization props
 */
export interface SliderVisualizationProps {
  buckets: DataBucket[];
  width: number;                      // SVG width in pixels
  height: number;                     // SVG height in pixels
  typeFilter: EnergyOptions[];        // Show only selected types
}
```

---

### Component Library Recommendations

**Decision Required**: Build custom slider or use library?

#### Option A: Custom Slider (RECOMMENDED)
**Pros**:
- ✅ Full control over design and behavior
- ✅ Optimized for this specific use case
- ✅ No external dependency
- ✅ Easier to integrate with visualization

**Cons**:
- ❌ More development time (3-4 days)
- ❌ Need to handle all edge cases ourselves
- ❌ Accessibility requires careful implementation

**Recommendation**: **Custom slider** - The visualization integration and specific date-based behavior make a custom implementation more suitable than adapting a generic library.

---

#### Option B: rc-slider (Library)
**Library**: `rc-slider` (React range slider)
**Link**: https://www.npmjs.com/package/rc-slider

**Pros**:
- ✅ Mature, widely used library
- ✅ Handles drag interactions, accessibility
- ✅ Customizable styling
- ✅ Touch support

**Cons**:
- ❌ Designed for numeric values, not dates (requires mapping)
- ❌ Visualization would need custom overlay
- ❌ Less control over exact behavior
- ❌ Additional bundle size

**Verdict**: Not recommended - too much adaptation needed for date-based slider

---

#### Option C: react-slider (Library)
**Library**: `react-slider`
**Link**: https://www.npmjs.com/package/react-slider

**Pros**:
- ✅ Simple API
- ✅ Dual-handle support
- ✅ Customizable

**Cons**:
- ❌ Same issues as rc-slider (numeric focus)
- ❌ Less popular (fewer updates)

**Verdict**: Not recommended

---

**FINAL RECOMMENDATION: Build Custom Slider**

**Rationale**:
1. **Date-specific behavior**: Slider operates on dates, not numbers
2. **Visualization integration**: Custom histogram rendered as part of slider
3. **Performance control**: Optimize specifically for our data patterns
4. **No unnecessary dependencies**: Keep bundle size down
5. **Learning opportunity**: Team gains expertise in slider implementation

**Estimated Effort**: 3-4 days (slider component + visualization + testing)

---

### Visualization Library Recommendations

**Decision Required**: SVG, Canvas, or Chart library?

#### Option A: SVG (RECOMMENDED)
**Pros**:
- ✅ Declarative (React-friendly)
- ✅ Scalable (no pixelation)
- ✅ Easy to style with CSS
- ✅ Accessible (can add ARIA labels)
- ✅ No additional library needed

**Cons**:
- ❌ Performance degrades with 1000+ elements (unlikely for buckets)

**Recommendation**: **SVG** - Perfect for histogram with < 100 buckets

**Implementation**:
```tsx
<svg width="100%" height="60" className="slider-visualization">
  {buckets.map((bucket, i) => (
    <rect
      key={i}
      x={`${(i / buckets.length) * 100}%`}
      y={maxHeight - bucket.totalCount * scale}
      width={`${(1 / buckets.length) * 100}%`}
      height={bucket.totalCount * scale}
      fill="rgba(59, 130, 246, 0.6)"
    />
  ))}
</svg>
```

---

#### Option B: Canvas
**Pros**:
- ✅ Better performance for many elements
- ✅ Smooth animations

**Cons**:
- ❌ Imperative (harder to manage in React)
- ❌ Not scalable (pixelation on zoom)
- ❌ Less accessible

**Verdict**: Not needed - SVG is sufficient for < 100 buckets

---

#### Option C: Chart.js / D3
**Pros**:
- ✅ Powerful charting libraries
- ✅ Built-in features

**Cons**:
- ❌ Overkill for simple histogram
- ❌ Large bundle size
- ❌ Harder to integrate with slider

**Verdict**: Not recommended - SVG is simpler and sufficient

---

**FINAL RECOMMENDATION: SVG for Visualization**

---

## Edge Cases & Error Handling

### Edge Case 1: No Data Available
**Scenario**: User has no energy measurements yet

**Behavior**:
- Slider disabled (grayed out)
- Visualization shows empty state
- Message: "No data available for timeline"
- Preset buttons disabled
- Type filter still works (but shows no data)

**Acceptance**: ✅ No errors, clear messaging

---

### Edge Case 2: Single Measurement
**Scenario**: User has only 1 energy measurement

**Behavior**:
- Slider min/max at same date
- Both handles at same position (overlapping)
- Visualization shows single bar
- Date range display: "Jan 15, 2024" (single date)
- Dragging handles does nothing (only one date available)

**Acceptance**: ✅ Slider works but is effectively static

---

### Edge Case 3: Very Large Date Range (Multiple Years)
**Scenario**: Dataset spans 5+ years (e.g., 2019-2024)

**Behavior**:
- Slider spans full range
- Buckets aggregate by month or week (not days)
- Visualization shows overall trend
- Dragging handle precision: ±1 day (not pixel-perfect)
- Consider adding zoom or sub-range selection (future enhancement)

**Acceptance**: ✅ Slider works, may be less precise

**Mitigation**:
- Use logarithmic scale (optional)
- Add "Zoom to selection" feature (future)

---

### Edge Case 4: Very Small Date Range (Same Day)
**Scenario**: Multiple measurements on the same day

**Behavior**:
- Slider min/max same day
- Both handles overlap
- Visualization shows single bar with total count
- OR: Expand to show hours on x-axis (advanced)

**Acceptance**: ✅ Slider shows single day

**Recommendation**: Show single day; if hours needed, add time-of-day support (future)

---

### Edge Case 5: Gaps in Data
**Scenario**: Measurements missing for certain periods (e.g., no data for Feb 2024)

**Behavior**:
- Histogram shows empty bars (height = 0) for missing periods
- Slider still allows selection of those ranges
- Table shows no results when gap range selected
- No error or warning (gaps are valid)

**Acceptance**: ✅ Gaps visually clear in histogram

---

### Edge Case 6: Handle Collision
**Scenario**: User drags start handle to end handle position (or vice versa)

**Behavior**:
- Handles can touch but not cross
- When touching: startDate === endDate (same day range)
- Visual: Handles overlap (z-index: end handle on top)
- Filter: Shows data for that single date only

**Acceptance**: ✅ Same-day range is valid

---

### Edge Case 7: Type Filter Affects Visualization
**Scenario**: User selects only "Power", hiding "Gas"

**Behavior**:
- Histogram shows only Power bars (blue)
- Gas bars hidden or grayed out
- Slider range unchanged (still full dataset range)
- Handle positions unchanged

**Acceptance**: ✅ Visualization updates in real-time

---

### Edge Case 8: Rapid Slider Dragging
**Scenario**: User drags handle very quickly back and forth

**Behavior**:
- Throttle visualization updates (30fps)
- Debounce filter application (200ms after drag stops)
- No lag or jank
- Handle position always reflects user's current drag

**Acceptance**: ✅ Smooth performance, no state bugs

---

### Edge Case 9: Preset Button During Drag
**Scenario**: User clicks preset button while dragging slider

**Behavior**:
- Cancel ongoing drag
- Animate handles to preset positions
- Apply preset date range
- No conflict or state corruption

**Acceptance**: ✅ Preset takes precedence, drag canceled

---

### Edge Case 10: Browser Resize During Drag
**Scenario**: User resizes browser window while dragging slider

**Behavior**:
- Slider recalculates positions based on new width
- Handle date positions maintained (not pixel positions)
- Visualization re-renders with new bucket count (responsive)
- Drag continues smoothly (no interruption)

**Acceptance**: ✅ Responsive recalculation works

**Implementation**:
```typescript
useEffect(() => {
  const handleResize = () => {
    // Recalculate slider dimensions
    recalculateSliderLayout();
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

## Testing Strategy

### Test Categories (V3)

**Total Expected Tests**: ~70-100 tests (3x V2 test count)

#### 1. Range Slider Tests (NEW)
**Estimated**: 25-30 tests

- ✅ Slider renders with correct min/max range
- ✅ Handles render at initial positions
- ✅ Start handle can be dragged
- ✅ End handle can be dragged
- ✅ Handles cannot cross each other
- ✅ Handles constrained to min/max range
- ✅ Selected range highlighted on track
- ✅ Date display updates during drag
- ✅ Clicking track moves nearest handle
- ✅ Keyboard navigation works (Arrow keys)
- ✅ Keyboard shortcuts work (Shift+Arrow, Page Up/Down, Home/End)
- ✅ Touch drag works on mobile
- ✅ Drag threshold prevents accidental drags
- ✅ Filter updates on drag end (debounced)
- ✅ Animation works when preset clicked
- ✅ Slider disabled when no data
- ✅ Slider handles single measurement correctly
- ✅ Slider handles large date range (5+ years)
- ✅ Slider handles same-day range
- ✅ Handle collision (touching) works
- ✅ Rapid dragging doesn't cause bugs
- ✅ Browser resize recalculates correctly

#### 2. Data Visualization Tests (NEW)
**Estimated**: 15-20 tests

- ✅ Histogram renders with correct bucket count
- ✅ Buckets aggregate data correctly
- ✅ Power bars render (blue)
- ✅ Gas bars render (orange)
- ✅ Stacked bars calculate correctly
- ✅ Bar heights scale correctly (max height)
- ✅ Empty buckets render (height = 0)
- ✅ Visualization updates when type filter changes
- ✅ Visualization shows only selected types
- ✅ Visualization responsive (fewer buckets on mobile)
- ✅ SVG rendering performance (< 50ms)
- ✅ Data aggregation performance (< 100ms for 1000 measurements)
- ✅ Memoization works (no unnecessary recalculations)

#### 3. Preset-to-Slider Synchronization Tests (UPDATED)
**Estimated**: 10-12 tests

- ✅ Clicking preset animates slider handles
- ✅ Handles move to correct preset positions
- ✅ Active preset highlighted when slider matches
- ✅ Manual slider adjustment deselects preset
- ✅ Preset detection works (reverse sync)
- ✅ Animation duration correct (300ms)
- ✅ Preset during drag cancels drag
- ✅ All presets calculate correct ranges

#### 4. Multi-Select Type Filter Tests (FROM V2)
**Estimated**: 8-10 tests (unchanged from V2)

#### 5. Reset Functionality Tests (UPDATED)
**Estimated**: 6-8 tests

- ✅ Reset clears type filter
- ✅ Reset clears active preset
- ✅ Reset moves slider to full range
- ✅ Reset animates slider handles
- ✅ Badge count returns to 0
- ✅ Table shows all data after reset

#### 6. Active Filter Badge Tests (UPDATED)
**Estimated**: 5-6 tests

- ✅ Badge hidden when no filters active
- ✅ Badge shows 1 when only slider active (custom range)
- ✅ Badge shows 1 when only type filter active
- ✅ Badge shows 2 when both active
- ✅ Badge count correct with full slider range (not counted)

#### 7. Accessibility Tests (NEW)
**Estimated**: 10-12 tests

- ✅ Slider handles have correct ARIA attributes
- ✅ `aria-valuemin`, `aria-valuemax`, `aria-valuenow` correct
- ✅ `aria-valuetext` shows human-readable dates
- ✅ Keyboard navigation works (all shortcuts)
- ✅ Focus states visible
- ✅ Screen reader announces range changes
- ✅ Color contrast meets WCAG AA
- ✅ High contrast mode works

#### 8. Performance Tests (NEW)
**Estimated**: 5-8 tests

- ✅ Data aggregation < 100ms for 1000 measurements
- ✅ Slider render < 200ms
- ✅ Dragging maintains 60fps (manual test)
- ✅ No memory leaks after 100 interactions
- ✅ Throttling and debouncing work correctly

#### 9. Responsive Tests (UPDATED)
**Estimated**: 6-8 tests

- ✅ Mobile: Slider full-width, fewer buckets
- ✅ Desktop: Slider with more buckets
- ✅ Browser resize recalculates correctly
- ✅ Touch events work on mobile
- ✅ Mouse events work on desktop

#### 10. Edge Case Tests (NEW)
**Estimated**: 8-10 tests

- ✅ No data: Slider disabled
- ✅ Single measurement: Slider static
- ✅ Very large range: Slider scales
- ✅ Same-day range: Handles overlap correctly
- ✅ Gaps in data: Histogram shows empty bars
- ✅ Type filter changes during drag

---

**Total Tests**: ~70-100 tests
**Coverage Target**: 100% of slider and visualization logic

---

## Dependencies and Constraints

### New Dependencies (V3)

**NO NEW EXTERNAL LIBRARIES RECOMMENDED**

Build custom slider and visualization using:
- ✅ React (existing)
- ✅ TypeScript (existing)
- ✅ Tailwind CSS (existing)
- ✅ SVG (native browser support)

**Utility Functions Needed** (custom):
- `throttle` and `debounce` (create or use lodash if already installed)
- Date calculation utilities (extend existing `dateUtils.ts`)

**Check if already installed**:
```bash
# If lodash exists, use lodash.throttle and lodash.debounce
npm list lodash
```

**If not, create custom**:
```typescript
// src/app/utils/performance.ts
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  } as T;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  } as T;
};
```

---

### Breaking Changes from V2

**Parent Component Updates Required**:

**V2 → V3 Changes**:
1. **Props Update** (V2 props still work, but add new):
   ```typescript
   // V2 Props (unchanged)
   interface EnergyTableFiltersProps {
     selectedTypes: EnergyOptions[];
     setSelectedTypes: (types: EnergyOptions[]) => void;
     dateRange: { start: Date | null; end: Date | null };
     setDateRange: (range: { start: Date | null; end: Date | null }) => void;
     onReset: () => void;
   }

   // V3 Props (add energyData for visualization)
   interface EnergyTableFiltersProps {
     selectedTypes: EnergyOptions[];
     setSelectedTypes: (types: EnergyOptions[]) => void;
     dateRange: { start: Date | null; end: Date | null };
     setDateRange: (range: { start: Date | null; end: Date | null }) => void;
     onReset: () => void;
     energyData: EnergyType[];  // NEW: Required for slider visualization
   }
   ```

2. **Parent must pass energyData**:
   ```typescript
   // In readings/page.tsx
   const { data: energyData } = useEnergyData();

   <EnergyTableFilters
     selectedTypes={selectedTypes}
     setSelectedTypes={setSelectedTypes}
     dateRange={dateRange}
     setDateRange={setDateRange}
     onReset={handleResetFilters}
     energyData={energyData}  // NEW: Pass full dataset for visualization
   />
   ```

**No other breaking changes** - V2 functionality fully preserved

---

### Performance Constraints

**Target Devices**:
- **Desktop**: Any modern computer (no constraints)
- **Mobile**: Mid-range devices (e.g., iPhone 12, Samsung Galaxy A52)

**Dataset Size Limits**:
- **Optimal**: < 1000 measurements (instant performance)
- **Good**: 1000-5000 measurements (< 500ms aggregation)
- **Acceptable**: 5000-10,000 measurements (< 1s aggregation, possible lag)
- **Poor**: 10,000+ measurements (requires optimization: sampling, web workers)

**Recommendation**: Optimize for 5000 measurements (5 years of daily data)

---

## Timeline and Effort Estimation

### Complexity Breakdown

**V3 is 3-4x more complex than V2** due to:
- Custom slider implementation (drag interactions, touch support)
- Data aggregation and visualization
- Performance optimization (throttling, debouncing, memoization)
- Accessibility implementation (ARIA, keyboard navigation)
- Extensive testing (3x test count)

---

### Estimated Effort (Experienced Developer)

**Phase 1: Planning & Architecture** (4-6 hours)
- Finalize visualization type (histogram vs alternatives)
- Finalize slider library decision (custom vs library)
- Design component architecture
- Create data flow diagrams
- Define interfaces and types

**Phase 2: Data Aggregation & Utilities** (6-8 hours)
- Implement `aggregateData` function
- Implement date calculation utilities
- Implement throttle/debounce utilities
- Add types to `types.ts`
- Unit tests for utilities

**Phase 3: Slider Component** (16-20 hours)
- Build `RangeSlider` component
- Build `SliderHandle` component
- Build `SliderTrack` component
- Implement drag interactions (mouse + touch)
- Implement keyboard navigation
- Handle edge cases (collision, constraints)
- ARIA attributes and accessibility
- Unit tests for slider

**Phase 4: Visualization Component** (8-10 hours)
- Build `SliderVisualization` component
- Implement histogram rendering (SVG)
- Implement responsive bucket count
- Integrate with type filter
- Performance optimization (memoization)
- Unit tests for visualization

**Phase 5: Preset-Slider Integration** (4-6 hours)
- Implement preset-to-slider animation
- Implement reverse sync (slider-to-preset detection)
- Update preset button states
- Integration tests

**Phase 6: Parent Component Integration** (4-6 hours)
- Update `EnergyTableFilters` to orchestrate slider
- Update layout for slider section
- Update reset logic
- Update badge logic
- Pass energyData to slider

**Phase 7: Testing** (12-16 hours)
- Write 70-100 tests (slider, visualization, integration)
- Run coverage report (target 100%)
- Fix failing tests
- Performance testing (manual)
- Accessibility testing (axe-core + manual)

**Phase 8: QA & Polish** (8-12 hours)
- Manual testing on mobile devices (iOS, Android)
- Manual testing on desktop browsers
- Fix bugs and edge cases
- Performance optimization if needed
- Responsive tweaks
- Animation polish

**Phase 9: Documentation** (2-4 hours)
- Update CLAUDE.md
- Update user-guide.md
- Code comments and JSDoc
- Add to CHANGELOG.md

---

**Total Estimated Effort**: 64-88 hours (8-11 days for experienced developer)

**Comparison to V2**: V2 was 11-17 hours (1.5-2 days). V3 is **5-6x longer**.

---

## Open Questions

### Q1: Visualization Type - Final Decision
**Options**:
- **A**: Mini Histogram (RECOMMENDED)
- **B**: Mini Line Chart / Sparkline
- **C**: Heatmap / Intensity Bar
- **D**: Dot Plot / Scatter

**Recommendation**: **Option A (Histogram)**

**Decision Required**: Confirm with user/stakeholder

---

### Q2: Slider Snapping Behavior
**Options**:
- **A**: Continuous (handles can be at any position, dates interpolated) (RECOMMENDED)
- **B**: Snap to actual measurement dates only

**Recommendation**: **Option A** - More flexible for custom ranges

**Decision Required**: Confirm with user/stakeholder

---

### Q3: Bucket Count Strategy
**Options**:
- **A**: Fixed responsive buckets (20 mobile, 60 desktop) (RECOMMENDED)
- **B**: Dynamic buckets based on date range (e.g., 1 bucket per week)

**Recommendation**: **Option A** - Simpler, more predictable

**Decision Required**: Technical decision (low priority)

---

### Q4: Animation Duration
**Options**:
- **A**: 300ms (RECOMMENDED - standard)
- **B**: 200ms (faster)
- **C**: 500ms (slower, more noticeable)

**Recommendation**: **Option A (300ms)** - Standard animation duration

**Decision Required**: Design preference (low priority)

---

### Q5: Handle Visual Design
**Options**:
- **A**: Circular handles (RECOMMENDED - common pattern)
- **B**: Rectangular handles (tab-like)
- **C**: Arrow/triangle handles

**Recommendation**: **Option A (Circular)** - Familiar to users

**Decision Required**: Design decision (create mockup)

---

### Q6: Date Format Display
**Options**:
- **A**: "Jan 15, 2024 - Feb 10, 2024" (RECOMMENDED for desktop)
- **B**: "2024-01-15 to 2024-02-10" (ISO format)
- **C**: "15/01/2024 - 10/02/2024" (European format)
- **D**: Responsive: Short on mobile ("Jan 15 - Feb 10"), long on desktop

**Recommendation**: **Option D (Responsive)** - Best for both platforms

**Decision Required**: Confirm format preference

---

### Q7: Preset Button Placement
**Options**:
- **A**: Above slider (RECOMMENDED - V2 pattern)
- **B**: Inline with slider (side-by-side)
- **C**: Below slider

**Recommendation**: **Option A** - Consistent with V2, clear hierarchy

**Decision Required**: Confirm layout preference

---

### Q8: Empty State (No Data)
**Options**:
- **A**: Disable slider, show message (RECOMMENDED)
- **B**: Hide slider completely
- **C**: Show placeholder slider (non-functional)

**Recommendation**: **Option A** - Clear communication

**Decision Required**: UX decision

---

## Success Metrics

### Qualitative Metrics
- ✅ **User Satisfaction**: User explicitly approves V3 design
- ✅ **Visual Clarity**: Data distribution clearly visible in histogram
- ✅ **Interaction Quality**: Slider feels smooth and responsive
- ✅ **Accessibility**: Passes WCAG 2.1 AA compliance
- ✅ **Mobile UX**: Works smoothly on mobile devices (no lag, easy to use)

### Quantitative Metrics
- ✅ **Performance**: Data aggregation < 100ms for 1000 measurements
- ✅ **Dragging FPS**: Maintains 60fps during drag on mid-range devices
- ✅ **Test Coverage**: 100% coverage for slider and visualization logic
- ✅ **Bundle Size**: < 50KB increase (custom slider vs library)
- ✅ **Touch Target Compliance**: 100% of interactive elements ≥ 44x44px
- ✅ **Load Time**: Component renders in < 200ms

### Verification Checklist
- ✅ All functional requirements implemented
- ✅ All tests passing (70-100 tests)
- ✅ Manual QA on mobile (iOS, Android) and desktop (Chrome, Safari, Firefox)
- ✅ Accessibility audit passed (axe-core)
- ✅ Performance benchmarks met (1000 measurements < 100ms)
- ✅ User/stakeholder approval

---

## Risks and Mitigation

### Risk 1: Performance Degradation with Large Datasets
**Risk Level**: 🔴 **HIGH**
**Description**: Slider may lag with 10,000+ measurements

**Mitigation**:
- ✅ Implement memoization for data aggregation
- ✅ Throttle visualization updates during drag (30fps)
- ✅ Use ResizeObserver debouncing
- ✅ Test with large datasets early (5000, 10,000 measurements)
- ✅ Consider sampling for very large datasets (show representative sample)
- ✅ Web Workers for aggregation if needed (advanced)

---

### Risk 2: Complex Touch Interactions on Mobile
**Risk Level**: 🟡 **MEDIUM**
**Description**: Touch dragging may be difficult on small screens

**Mitigation**:
- ✅ Large touch targets (44x44px handles)
- ✅ Drag threshold to prevent accidental drags
- ✅ Clear visual feedback (highlight active handle)
- ✅ Test on real devices early
- ✅ Consider haptic feedback (if supported)

---

### Risk 3: Accessibility Compliance
**Risk Level**: 🟡 **MEDIUM**
**Description**: Custom slider may not meet WCAG AA without careful implementation

**Mitigation**:
- ✅ Follow WAI-ARIA slider pattern exactly
- ✅ Implement full keyboard navigation
- ✅ Test with screen readers (NVDA, VoiceOver)
- ✅ Run axe-core automated audit
- ✅ Manual accessibility testing

---

### Risk 4: Browser Compatibility Issues
**Risk Level**: 🟢 **LOW**
**Description**: SVG or touch events may not work in older browsers

**Mitigation**:
- ✅ Test in target browsers (Chrome 90+, Safari 14+, Firefox 88+, Edge 90+)
- ✅ Use feature detection for touch events
- ✅ SVG is widely supported (no polyfill needed)
- ✅ Fallback: Hide slider in unsupported browsers (show date picker instead)

---

### Risk 5: Development Timeline Overrun
**Risk Level**: 🟡 **MEDIUM**
**Description**: Estimated 8-11 days may be optimistic

**Mitigation**:
- ✅ Break into phases (build slider first, then add visualization)
- ✅ Set checkpoints (review after each phase)
- ✅ Have fallback plan (remove visualization if time-constrained, keep basic slider)
- ✅ Allocate buffer time (20% extra)

---

### Risk 6: Visualization Not Clear on Small Screens
**Risk Level**: 🟡 **MEDIUM**
**Description**: Histogram may be too cluttered on mobile

**Mitigation**:
- ✅ Reduce bucket count on mobile (20-30 vs 60-100)
- ✅ Test early on small screens (320px)
- ✅ Consider alternative visualization (heatmap) if histogram fails
- ✅ Optional: Hide visualization on very small screens, show slider only

---

## Out of Scope (V3)

### NOT Included in V3 ❌

1. **Custom Date Picker Integration**
   - Manual date entry via date picker (slider only)
   - Typing dates in text input

2. **Zoom/Pan on Slider**
   - Pinch-to-zoom on timeline
   - Pan to scroll through large date ranges
   - (Future enhancement for very large datasets)

3. **Tooltips on Histogram Bars**
   - Hovering over histogram bar shows count
   - Clicking bar to select that range
   - (Future enhancement)

4. **Multiple Slider Ranges**
   - Select non-contiguous date ranges
   - Multiple start/end handle pairs

5. **Saved Slider Positions**
   - LocalStorage persistence of slider state
   - "Remember my last selection"

6. **Advanced Aggregation Options**
   - User-selectable bucket size (daily, weekly, monthly)
   - Logarithmic scale for large ranges

7. **Real-Time Data Updates**
   - Slider updates when new measurements added without reload
   - WebSocket integration

8. **Animations for Data Changes**
   - Animated histogram bar height changes
   - Smooth transitions when type filter changes

---

## Implementation Checklist

### Pre-Implementation
- ✅ Review V3 requirements with user/stakeholder
- ✅ Confirm visualization type (histogram)
- ✅ Confirm slider behavior (continuous vs snap)
- ✅ Create design mockups (handle design, colors)
- ✅ Approve timeline and effort estimate

### Implementation
- ✅ Phase 1: Planning & Architecture (4-6 hours)
- ✅ Phase 2: Data Aggregation & Utilities (6-8 hours)
- ✅ Phase 3: Slider Component (16-20 hours)
- ✅ Phase 4: Visualization Component (8-10 hours)
- ✅ Phase 5: Preset-Slider Integration (4-6 hours)
- ✅ Phase 6: Parent Component Integration (4-6 hours)
- ✅ Phase 7: Testing (12-16 hours)
- ✅ Phase 8: QA & Polish (8-12 hours)
- ✅ Phase 9: Documentation (2-4 hours)

### Post-Implementation
- ✅ User acceptance testing
- ✅ Performance benchmarking
- ✅ Accessibility audit
- ✅ Documentation review
- ✅ CHANGELOG update

---

## Conclusion

**Status**: ✅ **REQUIREMENTS DEFINED - V3 MAJOR COMPLEX REDESIGN**

This document specifies a **major upgrade** from V2 to V3, transforming the timeline filter into an **interactive visual range slider**:

**V3 Core Features**:
1. ✅ **Interactive Dual-Handle Slider**: Drag start/end dates for custom ranges
2. ✅ **Data Visualization**: Histogram showing measurement distribution (Power/Gas)
3. ✅ **Preset Integration**: Preset buttons animate slider handles
4. ✅ **Multi-Select Type Filter**: Carried forward from V2 (checkboxes)
5. ✅ **Performance Optimized**: Smooth 60fps dragging, < 100ms aggregation
6. ✅ **Mobile-First**: Touch-optimized with large targets, responsive visualization
7. ✅ **Accessible**: Full WCAG 2.1 AA compliance (keyboard, screen reader)

**Impact**:
- 🔴 **VERY HIGH COMPLEXITY**: Custom slider implementation required
- 🔴 **5-6x V2 EFFORT**: 64-88 hours (8-11 days) vs V2's 11-17 hours
- 🔴 **Advanced Testing**: 70-100 tests vs V2's 35-40 tests
- 🔴 **Performance Critical**: Requires careful optimization for large datasets

**Recommendations**:
1. **Build Custom Slider**: Better control, no external dependencies
2. **Use SVG for Visualization**: Simple, scalable, accessible
3. **Histogram Visualization**: Best balance of clarity and functionality
4. **Continuous Slider**: More flexible than snap-to-data
5. **Phased Implementation**: Build slider first, then add visualization

**Next Steps**:
1. Review requirements with user/stakeholder
2. Confirm open questions (Q1-Q8)
3. Approve design mockups (create if needed)
4. Begin Phase 1: Planning & Architecture

---

**Document Status**: ✅ **READY FOR STAKEHOLDER REVIEW**

**Approval Required**: User/Stakeholder sign-off on:
- ✅ Visualization type (histogram)
- ✅ Slider behavior (continuous)
- ✅ Timeline estimate (8-11 days)
- ✅ Design mockups (to be created)

---

## Appendices

### A. Visualization Comparison Table

| Feature | Histogram | Line Chart | Heatmap | Dot Plot |
|---------|-----------|------------|---------|----------|
| **Shows data density** | ✅ Excellent | ⚠️ Indirect | ✅ Good | ✅ Excellent |
| **Shows trends** | ⚠️ Limited | ✅ Excellent | ❌ No | ❌ No |
| **Power/Gas distinction** | ✅ Stacked bars | ✅ Two lines | ❌ Difficult | ✅ Color-coded |
| **Mobile readability** | ✅ Good | ✅ Good | ✅ Good | ❌ Cluttered |
| **Performance** | ✅ Good | ✅ Good | ✅ Excellent | ⚠️ Poor (1000+ dots) |
| **Simplicity** | ✅ Simple | ⚠️ Moderate | ✅ Simple | ✅ Simple |
| **Recommendation** | ✅ **RECOMMENDED** | ⚠️ Alternative | ❌ Not ideal | ❌ Not scalable |

---

### B. Component File Structure

```
src/app/components/energy/
├── EnergyTableFilters.tsx                    # Main orchestrator (UPDATED)
├── RangeSlider/
│   ├── index.ts                              # Barrel export
│   ├── RangeSlider.tsx                       # NEW: Main slider component
│   ├── SliderHandle.tsx                      # NEW: Draggable handle
│   ├── SliderTrack.tsx                       # NEW: Slider track with range highlight
│   ├── SliderVisualization.tsx               # NEW: Histogram visualization (SVG)
│   ├── DateRangeDisplay.tsx                  # NEW: "Jan 15 - Feb 10, 2024"
│   ├── types.ts                              # NEW: Slider-specific types
│   ├── hooks/
│   │   ├── useSliderDrag.ts                  # NEW: Drag interaction logic
│   │   ├── useSliderKeyboard.ts              # NEW: Keyboard navigation logic
│   │   └── useSliderAnimation.ts             # NEW: Handle animation logic
│   └── __tests__/
│       ├── RangeSlider.test.tsx              # NEW: Main slider tests
│       ├── SliderHandle.test.tsx             # NEW: Handle tests
│       ├── SliderVisualization.test.tsx      # NEW: Visualization tests
│       └── sliderUtils.test.ts               # NEW: Utility tests

src/app/utils/
├── sliderUtils.ts                            # NEW: Date-to-position calculations
├── dataAggregation.ts                        # NEW: Bucket aggregation logic
├── performance.ts                            # NEW: throttle, debounce
└── dateUtils.ts                              # UPDATED: Add slider helpers

src/app/constants/
├── timelinePresets.ts                        # FROM V2 (unchanged)
├── slider.ts                                 # NEW: Slider constants
└── energyTypes.ts                            # EXISTING (unchanged)

src/app/types.ts                              # UPDATED: Add V3 types
```

---

### C. Performance Benchmarks (Target)

| Metric | Target | Dataset Size | Measurement |
|--------|--------|--------------|-------------|
| Data Aggregation | < 100ms | 1000 measurements | `performance.now()` |
| Data Aggregation | < 500ms | 5000 measurements | `performance.now()` |
| Initial Render | < 200ms | Any | React DevTools Profiler |
| Slider Drag (FPS) | 60fps | Any | Chrome Performance tab |
| Visualization Render | < 50ms | 100 buckets | `performance.now()` |
| Type Filter Update | < 100ms | Any | React DevTools Profiler |
| Preset Animation | 300ms | Any | CSS transition |
| Memory Usage | < 1MB | Any | Chrome Memory Profiler |

---

### D. Accessibility Checklist (WCAG 2.1 AA)

| Requirement | Status | Verification Method |
|-------------|--------|---------------------|
| Keyboard navigation (Tab) | ✅ Required | Manual testing |
| Keyboard navigation (Arrow keys) | ✅ Required | Manual testing |
| ARIA attributes (`role="slider"`) | ✅ Required | Code review + axe-core |
| `aria-valuemin`, `aria-valuemax`, `aria-valuenow` | ✅ Required | Code review + axe-core |
| `aria-valuetext` (human-readable dates) | ✅ Required | Code review + screen reader |
| Focus indicators (visible) | ✅ Required | Manual testing |
| Color contrast (3:1 for UI) | ✅ Required | Color contrast checker |
| Live region announcements | ✅ Required | Screen reader testing |
| Touch targets (≥ 44x44px) | ✅ Required | Manual measurement |
| Not color-only information | ✅ Required | Manual review (patterns for Power/Gas) |
| Works in high contrast mode | ✅ Required | Windows high contrast mode testing |
| Screen reader testing (NVDA) | ✅ Required | Manual testing |
| Screen reader testing (VoiceOver) | ✅ Required | Manual testing (macOS/iOS) |

---

### E. Related Documentation

- **Previous Version**: `requirements-v2.md` (V2 - Timeline Presets)
- **Original Version**: `requirements.md` (V1 - Date Picker)
- **Test Scenarios**: `test-scenarios-v3.md` (to be created)
- **User Guide**: `user-guide.md` (to be updated)
- **Architecture**: `architecture.md` (to be created - complex feature)
- **API Documentation**: Not applicable (UI component only)
- **Project Guide**: `/CLAUDE.md`

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 3.0 | 2025-11-04 | Claude (Requirements Analyst) | V3 MAJOR REDESIGN - Interactive timeline slider with data visualization |
|  |  |  | - Added interactive dual-handle range slider |
|  |  |  | - Added histogram data visualization (Power/Gas) |
|  |  |  | - Integrated presets with slider animation |
|  |  |  | - Performance requirements and optimization strategies |
|  |  |  | - Accessibility requirements (WCAG 2.1 AA) |
|  |  |  | - Mobile touch interaction requirements |
|  |  |  | - Estimated 64-88 hours (8-11 days) effort |
| 2.0 | 2025-11-04 | Claude (Requirements Analyst) | V2 Redesign - Timeline presets + multi-select |
| 1.0 | 2025-11-04 | Claude (Requirements Analyst) | V1 Initial - Date picker + radio buttons |

---

**END OF REQUIREMENTS SPECIFICATION V3**
