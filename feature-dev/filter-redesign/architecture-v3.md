# Architecture Design: Interactive Timeline Slider with Data Visualization (V3)

## Document Information
- **Feature**: Interactive Timeline Slider with Data Visualization
- **Component**: `EnergyTableFilters` and new `RangeSlider` component hierarchy
- **Status**: Architecture Defined - Ready for Implementation
- **Date**: 2025-11-04
- **Complexity**: VERY HIGH (8-11 days effort)
- **Related Documents**:
  - Requirements: `requirements-v3.md`
  - Summary: `V3_SUMMARY.md`

---

## Executive Summary

This architecture document provides a comprehensive blueprint for implementing an **interactive dual-handle range slider with real-time data visualization** for the Energy Consumption Monitor application. The slider will transform the timeline filter from simple preset buttons into a sophisticated, visually-rich interface that shows measurement distribution while allowing precise date range selection.

**Key Architectural Decisions**:
1. **Custom Slider Implementation** - Build from scratch for maximum control and date-specific behavior
2. **SVG-Based Visualization** - Use declarative SVG for histogram rendering (scalable, accessible)
3. **Hook-Based State Management** - Leverage custom hooks for slider logic, drag interactions, and keyboard navigation
4. **Service Layer for Aggregation** - Separate data aggregation logic into testable service classes
5. **Performance-First Design** - Memoization, throttling, debouncing at architectural level
6. **Component Composition** - Break down into small, focused components following SRP

**Estimated Complexity**: 64-88 hours (8-11 days)
- Custom slider: 16-20 hours
- Data visualization: 8-10 hours
- Integration & testing: 20-24 hours
- Polish & accessibility: 10-14 hours

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [High-Level Design](#high-level-design)
3. [Component Architecture](#component-architecture)
4. [Data Flow Architecture](#data-flow-architecture)
5. [State Management Design](#state-management-design)
6. [Custom Hooks Specification](#custom-hooks-specification)
7. [Service Layer Design](#service-layer-design)
8. [Type Definitions](#type-definitions)
9. [Performance Optimization Strategy](#performance-optimization-strategy)
10. [Accessibility Architecture](#accessibility-architecture)
11. [Testing Architecture](#testing-architecture)
12. [Migration Strategy](#migration-strategy)
13. [Technology Decisions](#technology-decisions)
14. [Implementation Phases](#implementation-phases)
15. [Risk Analysis & Mitigation](#risk-analysis--mitigation)

---

## Architecture Overview

### System Context

The timeline slider feature sits within the Energy Consumption Monitor's filtering system:

```
Energy Consumption Monitor
│
├── Dashboard Page (/)
├── Readings Page (/readings) ◄── Our Feature Lives Here
│   ├── EnergyTableFilters ◄── V3 Major Update
│   │   ├── Timeline Presets (V2 - Existing)
│   │   ├── RangeSlider (V3 - NEW)
│   │   │   ├── SliderVisualization (Histogram)
│   │   │   ├── SliderTrack
│   │   │   └── SliderHandles (x2)
│   │   ├── TypeFilter (V2 - Existing)
│   │   └── ResetButton (V2 - Updated)
│   └── EnergyTable (Filter consumer)
├── Add Page (/add)
└── Contracts Page (/contracts)
```

### Architectural Style

**Chosen Style**: **Layered Architecture with Component Composition**

**Layers**:
1. **Presentation Layer**: React components (UI rendering, user interactions)
2. **Hook Layer**: Custom hooks (state management, business logic, side effects)
3. **Service Layer**: Pure functions and classes (data aggregation, calculations, validation)
4. **Utility Layer**: Pure helper functions (date calculations, performance utilities)

**Rationale**:
- Clear separation of concerns (SRP)
- Highly testable (each layer can be tested in isolation)
- Follows existing project patterns (hooks + services + utilities)
- Scalable (easy to add new visualization types or slider features)
- Maintainable (changes in one layer don't cascade to others)

---

## High-Level Design

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     ReadingsPage (Parent)                       │
│  - Fetches energyData via useEnergyData()                      │
│  - Manages filter state (typeFilter, dateRange)               │
│  - Passes energyData to EnergyTableFilters                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ Props: energyData, dateRange, callbacks
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              EnergyTableFilters (Orchestrator)                  │
│  - Coordinates all filter sub-components                        │
│  - Manages active preset state                                  │
│  - Calculates active filter count for badge                     │
└────┬────────────────┬──────────────┬───────────────┬────────────┘
     │                │              │               │
     │ Preset State   │ Slider Data  │ Type Filter   │ Reset Handler
     ▼                ▼              ▼               ▼
┌─────────┐    ┌────────────┐  ┌──────────┐   ┌──────────┐
│Timeline │    │RangeSlider │  │TypeFilter│   │ResetBtn  │
│Presets  │    │            │  │(existing)│   │(updated) │
│(V2)     │───▶│(V3 - NEW)  │  └──────────┘   └──────────┘
└─────────┘    │            │
               └──────┬─────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
   ┌──────────┐ ┌─────────┐ ┌──────────┐
   │Slider    │ │Slider   │ │Slider    │
   │Visualiz- │ │Track    │ │Handle    │
   │ation     │ │         │ │(x2)      │
   └──────────┘ └─────────┘ └──────────┘
         │            │            │
         │            │            │
         └────────────┴────────────┘
                      │
                      │ Uses Hooks & Services
                      ▼
   ┌──────────────────────────────────────┐
   │  Hook Layer                          │
   │  - useSliderDrag                     │
   │  - useSliderKeyboard                 │
   │  - useSliderAnimation                │
   │  - useHistogramData                  │
   └─────────────┬────────────────────────┘
                 │
                 │ Uses Services & Utils
                 ▼
   ┌──────────────────────────────────────┐
   │  Service Layer                       │
   │  - DataAggregationService            │
   │  - SliderCalculationService          │
   └─────────────┬────────────────────────┘
                 │
                 │ Uses Utilities
                 ▼
   ┌──────────────────────────────────────┐
   │  Utility Layer                       │
   │  - sliderUtils (date/position calc)  │
   │  - performance (throttle/debounce)   │
   │  - dateUtils (existing + additions)  │
   └──────────────────────────────────────┘
```

### Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                        Data Sources                             │
└────────────────┬───────────────────────────────────────────────┘
                 │
                 │ energyData: EnergyType[]
                 │ (from parent via API call)
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EnergyTableFilters                             │
│  1. Calculate min/max dates from energyData                     │
│  2. Pass to RangeSlider as slider bounds                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ energyData + bounds
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     RangeSlider                                 │
│  1. Use useHistogramData hook                                   │
│     └─> Aggregates energyData into buckets (memoized)          │
│  2. Use useSliderDrag hook                                      │
│     └─> Manages drag state, position calculations              │
│  3. Render visualization, track, handles                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ On drag/preset change
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    State Updates                                │
│  1. Update local slider state (startDate, endDate)              │
│  2. Debounced callback to parent (setDateRange)                 │
│  3. Parent updates dateRange state                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Updated dateRange
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EnergyTable                                  │
│  Filters energyData by dateRange and typeFilter                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Component Hierarchy

```
RangeSlider/
├── index.ts                          # Barrel export
├── RangeSlider.tsx                   # Main container component
├── SliderVisualization.tsx           # Histogram SVG rendering
├── SliderTrack.tsx                   # Track + range highlight
├── SliderHandle.tsx                  # Individual draggable handle
├── DateRangeDisplay.tsx              # Selected dates display
├── types.ts                          # Component-specific types
├── hooks/
│   ├── useSliderDrag.ts              # Drag interaction logic
│   ├── useSliderKeyboard.ts          # Keyboard navigation logic
│   ├── useSliderAnimation.ts         # Preset animation logic
│   └── useHistogramData.ts           # Data aggregation & memoization
└── __tests__/
    ├── RangeSlider.test.tsx
    ├── SliderVisualization.test.tsx
    ├── SliderHandle.test.tsx
    └── sliderHooks.test.ts
```

### Component Responsibilities

#### 1. RangeSlider (Main Container)
**File**: `src/app/components/energy/RangeSlider/RangeSlider.tsx`

**Responsibility**:
- Orchestrate all slider sub-components
- Manage slider state (start/end dates, active handle, dragging state)
- Coordinate drag, keyboard, and preset interactions
- Emit date range changes to parent

**Props**:
```typescript
interface RangeSliderProps {
  min: Date;                          // Earliest date in dataset
  max: Date;                          // Latest date in dataset
  startValue: Date;                   // Current start date (controlled)
  endValue: Date;                     // Current end date (controlled)
  onChange: (start: Date, end: Date) => void; // Callback on change
  energyData: EnergyType[];           // For histogram visualization
  selectedTypes: EnergyOptions[];     // Filter histogram by type
  disabled?: boolean;                 // Disable slider (no data)
  className?: string;                 // Custom styling
}
```

**State**:
```typescript
interface SliderState {
  isDragging: boolean;
  activeHandle: 'start' | 'end' | null;
  isAnimating: boolean;
}
```

**Uses Hooks**:
- `useHistogramData(energyData, selectedTypes, bucketCount)`
- `useSliderDrag(min, max, startValue, endValue, onChange)`
- `useSliderKeyboard(min, max, startValue, endValue, onChange)`
- `useSliderAnimation()`

**Renders**:
```tsx
<div className="range-slider-container" role="group" aria-labelledby="slider-label">
  <span id="slider-label" className="sr-only">Select date range</span>

  {/* Histogram visualization (behind track) */}
  <SliderVisualization
    buckets={histogramBuckets}
    selectedTypes={selectedTypes}
  />

  {/* Slider track with range highlight */}
  <SliderTrack
    startPercent={startPercent}
    endPercent={endPercent}
    onClick={handleTrackClick}
  />

  {/* Start date handle */}
  <SliderHandle
    type="start"
    position={startPercent}
    date={startValue}
    isActive={activeHandle === 'start'}
    onDragStart={handleDragStart}
    onDragMove={handleDragMove}
    onDragEnd={handleDragEnd}
    onKeyDown={handleKeyDown}
  />

  {/* End date handle */}
  <SliderHandle
    type="end"
    position={endPercent}
    date={endValue}
    isActive={activeHandle === 'end'}
    onDragStart={handleDragStart}
    onDragMove={handleDragMove}
    onDragEnd={handleDragEnd}
    onKeyDown={handleKeyDown}
  />

  {/* Selected date range display */}
  <DateRangeDisplay
    startDate={startValue}
    endDate={endValue}
    format="responsive"
  />

  {/* Live region for screen readers */}
  <div role="status" aria-live="polite" className="sr-only">
    {liveAnnouncementText}
  </div>
</div>
```

---

#### 2. SliderVisualization (Histogram)
**File**: `src/app/components/energy/RangeSlider/SliderVisualization.tsx`

**Responsibility**:
- Render histogram bars as SVG
- Show Power (blue) and Gas (orange) as stacked bars
- Responsive bucket rendering (fewer on mobile, more on desktop)

**Props**:
```typescript
interface SliderVisualizationProps {
  buckets: DataBucket[];              // Aggregated data buckets
  selectedTypes: EnergyOptions[];     // Show only selected types
  width?: number;                     // SVG width (default: 100%)
  height?: number;                    // SVG height (default: 60px)
  className?: string;
}
```

**Rendering Logic**:
```tsx
<svg
  className="slider-visualization"
  width="100%"
  height={height}
  preserveAspectRatio="none"
  aria-hidden="true"  // Decorative visualization
>
  {buckets.map((bucket, index) => {
    const x = `${(index / buckets.length) * 100}%`;
    const width = `${(1 / buckets.length) * 100}%`;
    const maxCount = Math.max(...buckets.map(b => b.totalCount));
    const heightScale = (maxHeight - 10) / maxCount; // Leave 10px padding

    // Show only selected types
    const showPower = selectedTypes.includes('power');
    const showGas = selectedTypes.includes('gas');

    const powerHeight = showPower ? bucket.powerCount * heightScale : 0;
    const gasHeight = showGas ? bucket.gasCount * heightScale : 0;

    return (
      <g key={index}>
        {/* Power bar (blue) - bottom of stack */}
        {showPower && (
          <rect
            x={x}
            y={maxHeight - powerHeight}
            width={width}
            height={powerHeight}
            fill="rgba(59, 130, 246, 0.6)"  // blue with 60% opacity
            className="histogram-bar histogram-bar-power"
          />
        )}

        {/* Gas bar (orange) - top of stack */}
        {showGas && (
          <rect
            x={x}
            y={maxHeight - powerHeight - gasHeight}
            width={width}
            height={gasHeight}
            fill="rgba(249, 115, 22, 0.6)"  // orange with 60% opacity
            className="histogram-bar histogram-bar-gas"
          />
        )}
      </g>
    );
  })}
</svg>
```

**Performance Considerations**:
- Parent passes memoized `buckets` prop (calculated by `useHistogramData` hook)
- Wrapped in `React.memo` to prevent unnecessary re-renders
- SVG rendering is fast for < 100 buckets (typical case)

---

#### 3. SliderTrack (Track + Range Highlight)
**File**: `src/app/components/energy/RangeSlider/SliderTrack.tsx`

**Responsibility**:
- Render slider track background
- Highlight selected range between handles
- Handle click-to-move-handle interaction

**Props**:
```typescript
interface SliderTrackProps {
  startPercent: number;               // Start handle position (0-100)
  endPercent: number;                 // End handle position (0-100)
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
}
```

**Rendering Logic**:
```tsx
<div
  className="slider-track-container"
  onClick={onClick}
  ref={trackRef}
>
  {/* Background track (full width) */}
  <div className="slider-track-background" />

  {/* Selected range highlight */}
  <div
    className="slider-track-selected"
    style={{
      left: `${startPercent}%`,
      width: `${endPercent - startPercent}%`,
    }}
  />
</div>
```

**Styling** (Tailwind):
```css
.slider-track-container {
  position: relative;
  width: 100%;
  height: 8px;
  cursor: pointer;
}

.slider-track-background {
  position: absolute;
  width: 100%;
  height: 100%;
  background: hsl(var(--border));  /* Gray track */
  border-radius: 9999px;           /* Fully rounded */
}

.slider-track-selected {
  position: absolute;
  height: 100%;
  background: hsl(var(--primary));  /* Primary color highlight */
  border-radius: 9999px;
  z-index: 1;
}
```

---

#### 4. SliderHandle (Draggable Handle)
**File**: `src/app/components/energy/RangeSlider/SliderHandle.tsx`

**Responsibility**:
- Render individual draggable handle (start or end)
- Handle mouse/touch drag events
- Handle keyboard navigation
- Display ARIA attributes for accessibility

**Props**:
```typescript
interface SliderHandleProps {
  type: 'start' | 'end';
  position: number;                   // Position as percentage (0-100)
  date: Date;                         // Current date value
  isActive: boolean;                  // Is this handle being dragged?
  onDragStart: (type: 'start' | 'end', event: React.MouseEvent | React.TouchEvent) => void;
  onDragMove: (event: React.MouseEvent | React.TouchEvent) => void;
  onDragEnd: () => void;
  onKeyDown: (type: 'start' | 'end', event: React.KeyboardEvent) => void;
  className?: string;
}
```

**Rendering Logic**:
```tsx
<div
  role="slider"
  aria-label={`${type === 'start' ? 'Start' : 'End'} date`}
  aria-valuemin={minTimestamp}
  aria-valuemax={maxTimestamp}
  aria-valuenow={date.getTime()}
  aria-valuetext={formatDateForScreenReader(date)}
  tabIndex={0}
  className={cn(
    "slider-handle",
    `slider-handle-${type}`,
    isActive && "slider-handle-active",
    className
  )}
  style={{
    left: `${position}%`,
  }}
  onMouseDown={(e) => onDragStart(type, e)}
  onTouchStart={(e) => onDragStart(type, e)}
  onKeyDown={(e) => onKeyDown(type, e)}
>
  {/* Visual handle circle */}
  <div className="slider-handle-circle" />

  {/* Larger touch target (invisible overlay) */}
  <div className="slider-handle-touch-target" />
</div>
```

**Styling** (Tailwind + CSS):
```css
.slider-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  cursor: grab;
  outline: none;  /* Custom focus style instead */
}

.slider-handle:focus {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

.slider-handle-active {
  cursor: grabbing;
  z-index: 11;  /* Active handle on top */
}

.slider-handle-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: hsl(var(--primary));
  border: 2px solid hsl(var(--background));
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease;
}

.slider-handle-active .slider-handle-circle {
  transform: scale(1.2);
}

.slider-handle-touch-target {
  position: absolute;
  width: 44px;    /* WCAG minimum touch target */
  height: 44px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* Invisible but captures touch/click events */
}
```

---

#### 5. DateRangeDisplay (Date Labels)
**File**: `src/app/components/energy/RangeSlider/DateRangeDisplay.tsx`

**Responsibility**:
- Display selected date range in human-readable format
- Responsive formatting (short on mobile, long on desktop)

**Props**:
```typescript
interface DateRangeDisplayProps {
  startDate: Date;
  endDate: Date;
  format?: 'short' | 'long' | 'responsive';
  className?: string;
}
```

**Rendering Logic**:
```tsx
const DateRangeDisplay: React.FC<DateRangeDisplayProps> = ({
  startDate,
  endDate,
  format = 'responsive',
  className,
}) => {
  const formatDate = (date: Date): string => {
    if (format === 'short') {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }

    if (format === 'long') {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }

    // Responsive: short on mobile, long on desktop
    const isMobile = window.innerWidth < 640;
    return isMobile
      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={cn("date-range-display", className)}>
      <span className="date-range-start">{formatDate(startDate)}</span>
      <span className="date-range-separator"> - </span>
      <span className="date-range-end">{formatDate(endDate)}</span>
    </div>
  );
};
```

---

## Data Flow Architecture

### 1. Data Aggregation Flow

```
energyData: EnergyType[]
         │
         │ Pass to useHistogramData hook
         ▼
┌─────────────────────────────────────────────┐
│      useHistogramData Hook                  │
│  1. useMemo(() => {                         │
│       calculateMinMaxDates(energyData)      │
│     }, [energyData])                        │
│                                             │
│  2. useMemo(() => {                         │
│       DataAggregationService.aggregate(     │
│         energyData,                         │
│         bucketCount,                        │
│         selectedTypes                       │
│       )                                     │
│     }, [energyData, bucketCount, ...])      │
│                                             │
│  3. Return: { buckets, minDate, maxDate }  │
└────────────────┬────────────────────────────┘
                 │
                 │ Memoized buckets
                 ▼
         SliderVisualization
         (Renders histogram)
```

### 2. User Interaction Flow

#### Drag Interaction
```
User drags handle
         │
         ▼
onMouseDown / onTouchStart
         │
         ▼
useSliderDrag hook
         │
         ├─> Calculate mouse/touch position
         ├─> Convert position to date (SliderCalculationService)
         ├─> Validate constraints (handles can't cross)
         ├─> Throttle visualization update (30fps)
         │
         ▼
Update local slider state
         │
         ▼
onMouseUp / onTouchEnd
         │
         ▼
Debounced onChange callback (200ms)
         │
         ▼
Parent updates dateRange state
         │
         ▼
EnergyTable filters data
```

#### Preset Button Click
```
User clicks "Last 30 days"
         │
         ▼
EnergyTableFilters.handlePresetClick()
         │
         ├─> Calculate preset dates (start, end)
         ├─> Set activePreset state
         │
         ▼
Trigger RangeSlider animation
         │
         ▼
useSliderAnimation hook
         │
         ├─> Animate handles to new positions (CSS transition)
         ├─> Update startValue, endValue props
         ├─> Set isAnimating flag
         │
         ▼
After animation (300ms)
         │
         ▼
onChange callback to parent
         │
         ▼
Parent updates dateRange state
```

#### Keyboard Navigation
```
User focuses handle, presses arrow key
         │
         ▼
onKeyDown event
         │
         ▼
useSliderKeyboard hook
         │
         ├─> Determine adjustment amount:
         │   - Arrow keys: ±1 day
         │   - Shift+Arrow: ±7 days
         │   - Page Up/Down: ±30 days
         │   - Home/End: min/max date
         │
         ├─> Calculate new date
         ├─> Validate constraints
         │
         ▼
Update slider state immediately (no debounce)
         │
         ▼
onChange callback to parent
```

---

## State Management Design

### State Ownership

**Parent Component (ReadingsPage)**:
- Owns filter state (`dateRange`, `typeFilter`)
- Reason: Multiple consumers (filters, table, possibly charts)

**EnergyTableFilters**:
- Owns `activePreset` state
- Reason: Only relevant to this component, not needed elsewhere

**RangeSlider**:
- Owns `SliderState` (isDragging, activeHandle, isAnimating)
- Reason: Internal implementation detail, not exposed to parent

### State Flow

```
┌──────────────────────────────────────┐
│        ReadingsPage (Top-Level)      │
│                                      │
│  State:                              │
│  - energyData: EnergyType[]          │
│  - dateRange: {                      │
│      start: Date | null,             │
│      end: Date | null                │
│    }                                 │
│  - typeFilter: EnergyOptions | "all" │
└──────────────┬───────────────────────┘
               │
               │ Props down
               ▼
┌──────────────────────────────────────┐
│      EnergyTableFilters              │
│                                      │
│  State:                              │
│  - activePreset: string | null       │
│                                      │
│  Derived:                            │
│  - activeFilterCount (computed)      │
└──────────────┬───────────────────────┘
               │
               │ Props down
               ▼
┌──────────────────────────────────────┐
│        RangeSlider                   │
│                                      │
│  State:                              │
│  - sliderState: {                    │
│      isDragging: boolean,            │
│      activeHandle: 'start'|'end'|null│
│      isAnimating: boolean            │
│    }                                 │
│                                      │
│  Controlled Props:                   │
│  - startValue: Date (from parent)    │
│  - endValue: Date (from parent)      │
│                                      │
│  Callbacks up:                       │
│  - onChange(start, end)              │
└──────────────────────────────────────┘
```

### State Update Patterns

#### Pattern 1: Controlled Component (Slider)
```typescript
// RangeSlider is controlled by parent
const RangeSlider: React.FC<RangeSliderProps> = ({
  startValue,  // Controlled by parent
  endValue,    // Controlled by parent
  onChange,    // Callback to update parent
  ...
}) => {
  // Local state for interaction details (not exposed)
  const [sliderState, setSliderState] = useState<SliderState>({
    isDragging: false,
    activeHandle: null,
    isAnimating: false,
  });

  const handleDragMove = (newDate: Date) => {
    // Update parent ONLY (parent will re-render us with new props)
    if (sliderState.activeHandle === 'start') {
      onChange(newDate, endValue);
    } else {
      onChange(startValue, newDate);
    }
  };

  // Render using props (not local state)
  return (
    <SliderHandle
      position={dateToPercent(startValue)}  // Use prop
      date={startValue}                     // Use prop
      ...
    />
  );
};
```

#### Pattern 2: Debounced Updates
```typescript
// In useSliderDrag hook
const useSliderDrag = (
  min: Date,
  max: Date,
  startValue: Date,
  endValue: Date,
  onChange: (start: Date, end: Date) => void
) => {
  // Debounced version of onChange (only fire after drag stops)
  const debouncedOnChange = useMemo(
    () => debounce(onChange, 200),
    [onChange]
  );

  const handleDragMove = (clientX: number) => {
    const newDate = calculateDateFromPosition(clientX);

    // Immediate local state update (smooth dragging)
    setLocalDate(newDate);

    // Debounced parent update (reduce filter recalculations)
    debouncedOnChange(newDate, endValue);
  };

  return { handleDragMove, ... };
};
```

#### Pattern 3: Optimistic UI Updates
```typescript
// Show immediate visual feedback, apply filter later
const handlePresetClick = (presetId: string) => {
  const preset = TIMELINE_PRESETS.find(p => p.id === presetId);
  const { start, end } = preset.calculateRange();

  // 1. Immediate UI update (optimistic)
  setActivePreset(presetId);

  // 2. Animate slider handles (visual feedback)
  animateSliderHandles(start, end);

  // 3. After animation, update parent filter (actual data change)
  setTimeout(() => {
    setDateRange({ start, end });
  }, 300);  // Match animation duration
};
```

---

## Custom Hooks Specification

### Hook 1: useHistogramData

**File**: `src/app/components/energy/RangeSlider/hooks/useHistogramData.ts`

**Purpose**: Aggregate energy data into histogram buckets with memoization

**Signature**:
```typescript
interface UseHistogramDataResult {
  buckets: DataBucket[];
  minDate: Date;
  maxDate: Date;
  isLoading: boolean;
}

function useHistogramData(
  energyData: EnergyType[],
  selectedTypes: EnergyOptions[],
  bucketCount?: number  // Optional: auto-calculated from screen size
): UseHistogramDataResult
```

**Implementation**:
```typescript
import { useMemo } from 'react';
import { DataAggregationService } from '@/app/services/DataAggregationService';
import { EnergyType, EnergyOptions, DataBucket } from '@/app/types';
import { useMediaQuery } from '@/app/hooks/useMediaQuery';

export const useHistogramData = (
  energyData: EnergyType[],
  selectedTypes: EnergyOptions[],
  bucketCount?: number
): UseHistogramDataResult => {
  // Auto-calculate bucket count based on screen size if not provided
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1023px)');

  const defaultBucketCount = isMobile ? 25 : isTablet ? 50 : 80;
  const finalBucketCount = bucketCount ?? defaultBucketCount;

  // Memoize min/max dates (only recalculate if data changes)
  const { minDate, maxDate } = useMemo(() => {
    if (energyData.length === 0) {
      const now = new Date();
      return { minDate: now, maxDate: now };
    }

    const dates = energyData.map(d => d.date.getTime());
    return {
      minDate: new Date(Math.min(...dates)),
      maxDate: new Date(Math.max(...dates)),
    };
  }, [energyData]);

  // Memoize aggregated buckets (expensive operation)
  const buckets = useMemo(() => {
    if (energyData.length === 0) {
      return [];
    }

    return DataAggregationService.aggregateIntoBuckets(
      energyData,
      minDate,
      maxDate,
      finalBucketCount,
      selectedTypes
    );
  }, [energyData, minDate, maxDate, finalBucketCount, selectedTypes]);

  return {
    buckets,
    minDate,
    maxDate,
    isLoading: energyData.length === 0,
  };
};
```

**Dependencies**: `energyData`, `selectedTypes`, screen size (via useMediaQuery)
**Memoization**: Heavy - buckets recalculated only when dependencies change
**Performance**: < 100ms for 1000 measurements (target)

---

### Hook 2: useSliderDrag

**File**: `src/app/components/energy/RangeSlider/hooks/useSliderDrag.ts`

**Purpose**: Handle mouse/touch drag interactions with throttling

**Signature**:
```typescript
interface UseSliderDragResult {
  isDragging: boolean;
  activeHandle: 'start' | 'end' | null;
  handleDragStart: (handle: 'start' | 'end', event: React.MouseEvent | React.TouchEvent) => void;
  handleDragMove: (event: React.MouseEvent | React.TouchEvent) => void;
  handleDragEnd: () => void;
  handleTrackClick: (event: React.MouseEvent) => void;
}

function useSliderDrag(
  trackRef: React.RefObject<HTMLDivElement>,
  min: Date,
  max: Date,
  startValue: Date,
  endValue: Date,
  onChange: (start: Date, end: Date) => void
): UseSliderDragResult
```

**Implementation**:
```typescript
import { useState, useCallback, useRef, useEffect } from 'react';
import { SliderCalculationService } from '@/app/services/SliderCalculationService';
import { throttle, debounce } from '@/app/utils/performance';

export const useSliderDrag = (
  trackRef: React.RefObject<HTMLDivElement>,
  min: Date,
  max: Date,
  startValue: Date,
  endValue: Date,
  onChange: (start: Date, end: Date) => void
) => {
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<'start' | 'end' | null>(null);
  const dragStartPosRef = useRef<{ x: number; initialDate: Date } | null>(null);

  // Debounced onChange (apply filter after drag ends)
  const debouncedOnChange = useCallback(
    debounce((start: Date, end: Date) => {
      onChange(start, end);
    }, 200),
    [onChange]
  );

  // Throttled position update (smooth visual feedback during drag)
  const throttledPositionUpdate = useCallback(
    throttle((clientX: number, handle: 'start' | 'end') => {
      if (!trackRef.current) return;

      const newDate = SliderCalculationService.calculateDateFromPosition(
        clientX,
        trackRef.current,
        min,
        max
      );

      // Validate constraints
      if (handle === 'start') {
        const constrainedDate = new Date(Math.min(newDate.getTime(), endValue.getTime()));
        onChange(constrainedDate, endValue);
      } else {
        const constrainedDate = new Date(Math.max(newDate.getTime(), startValue.getTime()));
        onChange(startValue, constrainedDate);
      }
    }, 16), // 60fps
    [trackRef, min, max, startValue, endValue, onChange]
  );

  const handleDragStart = useCallback(
    (handle: 'start' | 'end', event: React.MouseEvent | React.TouchEvent) => {
      event.preventDefault();

      const clientX = 'touches' in event
        ? event.touches[0].clientX
        : event.clientX;

      setIsDragging(true);
      setActiveHandle(handle);
      dragStartPosRef.current = {
        x: clientX,
        initialDate: handle === 'start' ? startValue : endValue,
      };

      // Add global event listeners
      document.addEventListener('mousemove', handleDragMove as any);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove as any);
      document.addEventListener('touchend', handleDragEnd);
    },
    [startValue, endValue]
  );

  const handleDragMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!isDragging || !activeHandle || !dragStartPosRef.current) return;

      const clientX = 'touches' in event
        ? event.touches[0].clientX
        : event.clientX;

      // Check drag threshold (5px to prevent accidental drags)
      const dragDistance = Math.abs(clientX - dragStartPosRef.current.x);
      if (dragDistance < 5) return;

      throttledPositionUpdate(clientX, activeHandle);
    },
    [isDragging, activeHandle, throttledPositionUpdate]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setActiveHandle(null);
    dragStartPosRef.current = null;

    // Remove global event listeners
    document.removeEventListener('mousemove', handleDragMove as any);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove as any);
    document.removeEventListener('touchend', handleDragEnd);

    // Apply debounced filter update
    debouncedOnChange(startValue, endValue);
  }, [startValue, endValue, debouncedOnChange]);

  const handleTrackClick = useCallback(
    (event: React.MouseEvent) => {
      if (!trackRef.current) return;

      const clickedDate = SliderCalculationService.calculateDateFromPosition(
        event.clientX,
        trackRef.current,
        min,
        max
      );

      // Move nearest handle to clicked position
      const distToStart = Math.abs(clickedDate.getTime() - startValue.getTime());
      const distToEnd = Math.abs(clickedDate.getTime() - endValue.getTime());

      if (distToStart < distToEnd) {
        const constrainedDate = new Date(Math.min(clickedDate.getTime(), endValue.getTime()));
        onChange(constrainedDate, endValue);
      } else {
        const constrainedDate = new Date(Math.max(clickedDate.getTime(), startValue.getTime()));
        onChange(startValue, constrainedDate);
      }
    },
    [trackRef, min, max, startValue, endValue, onChange]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragMove as any);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove as any);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, []);

  return {
    isDragging,
    activeHandle,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleTrackClick,
  };
};
```

---

### Hook 3: useSliderKeyboard

**File**: `src/app/components/energy/RangeSlider/hooks/useSliderKeyboard.ts`

**Purpose**: Handle keyboard navigation (arrow keys, shortcuts)

**Signature**:
```typescript
interface UseSliderKeyboardResult {
  handleKeyDown: (handle: 'start' | 'end', event: React.KeyboardEvent) => void;
}

function useSliderKeyboard(
  min: Date,
  max: Date,
  startValue: Date,
  endValue: Date,
  onChange: (start: Date, end: Date) => void
): UseSliderKeyboardResult
```

**Implementation**:
```typescript
import { useCallback } from 'react';
import { addDays } from '@/app/utils/dateUtils';

export const useSliderKeyboard = (
  min: Date,
  max: Date,
  startValue: Date,
  endValue: Date,
  onChange: (start: Date, end: Date) => void
) => {
  const handleKeyDown = useCallback(
    (handle: 'start' | 'end', event: React.KeyboardEvent) => {
      let adjustment = 0;

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          adjustment = event.shiftKey ? -7 : -1;  // Shift = week, normal = day
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          adjustment = event.shiftKey ? 7 : 1;
          break;
        case 'PageDown':
          adjustment = -30;  // Month
          break;
        case 'PageUp':
          adjustment = 30;   // Month
          break;
        case 'Home':
          // Jump to min date
          if (handle === 'start') {
            onChange(min, endValue);
          } else {
            onChange(startValue, min);
          }
          event.preventDefault();
          return;
        case 'End':
          // Jump to max date
          if (handle === 'start') {
            onChange(max, endValue);
          } else {
            onChange(startValue, max);
          }
          event.preventDefault();
          return;
        default:
          return;  // Ignore other keys
      }

      event.preventDefault();

      const currentDate = handle === 'start' ? startValue : endValue;
      const newDate = addDays(currentDate, adjustment);

      // Constrain to bounds
      const constrainedDate = new Date(
        Math.max(min.getTime(), Math.min(max.getTime(), newDate.getTime()))
      );

      // Validate handle constraints
      if (handle === 'start') {
        const finalDate = new Date(Math.min(constrainedDate.getTime(), endValue.getTime()));
        onChange(finalDate, endValue);
      } else {
        const finalDate = new Date(Math.max(constrainedDate.getTime(), startValue.getTime()));
        onChange(startValue, finalDate);
      }
    },
    [min, max, startValue, endValue, onChange]
  );

  return { handleKeyDown };
};
```

---

### Hook 4: useSliderAnimation

**File**: `src/app/components/energy/RangeSlider/hooks/useSliderAnimation.ts`

**Purpose**: Animate slider handles to preset positions

**Signature**:
```typescript
interface UseSliderAnimationResult {
  isAnimating: boolean;
  animateToPosition: (targetStart: Date, targetEnd: Date, duration?: number) => Promise<void>;
}

function useSliderAnimation(): UseSliderAnimationResult
```

**Implementation**:
```typescript
import { useState, useCallback } from 'react';

export const useSliderAnimation = () => {
  const [isAnimating, setIsAnimating] = useState(false);

  const animateToPosition = useCallback(
    (targetStart: Date, targetEnd: Date, duration: number = 300): Promise<void> => {
      return new Promise((resolve) => {
        setIsAnimating(true);

        // CSS transition handles the visual animation
        // We just need to manage the state flag
        setTimeout(() => {
          setIsAnimating(false);
          resolve();
        }, duration);
      });
    },
    []
  );

  return {
    isAnimating,
    animateToPosition,
  };
};
```

**Note**: Actual animation is done via CSS transitions on handle `left` style property.

---

## Service Layer Design

### Service 1: DataAggregationService

**File**: `src/app/services/DataAggregationService.ts`

**Purpose**: Aggregate energy data into histogram buckets (pure functions)

**Class Definition**:
```typescript
import { EnergyType, EnergyOptions, DataBucket } from '@/app/types';

/**
 * Service for aggregating energy data into time-based buckets
 * Pure functions - no side effects, easily testable
 */
export class DataAggregationService {
  /**
   * Aggregate energy measurements into time buckets for histogram
   *
   * @param data - Energy measurements to aggregate
   * @param minDate - Start of date range
   * @param maxDate - End of date range
   * @param bucketCount - Number of buckets to create
   * @param selectedTypes - Filter by energy types (empty = all)
   * @returns Array of data buckets with counts per type
   */
  static aggregateIntoBuckets(
    data: EnergyType[],
    minDate: Date,
    maxDate: Date,
    bucketCount: number,
    selectedTypes: EnergyOptions[] = []
  ): DataBucket[] {
    if (data.length === 0 || bucketCount <= 0) {
      return [];
    }

    const minTime = minDate.getTime();
    const maxTime = maxDate.getTime();
    const bucketSize = (maxTime - minTime) / bucketCount;

    // Initialize empty buckets
    const buckets: DataBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
      startDate: new Date(minTime + i * bucketSize),
      endDate: new Date(minTime + (i + 1) * bucketSize),
      powerCount: 0,
      gasCount: 0,
      totalCount: 0,
    }));

    // Filter data by selected types if specified
    const filteredData = selectedTypes.length > 0
      ? data.filter(item => selectedTypes.includes(item.type))
      : data;

    // Populate buckets with measurement counts
    filteredData.forEach(item => {
      const itemTime = item.date.getTime();
      const bucketIndex = Math.floor((itemTime - minTime) / bucketSize);

      // Handle edge case: item exactly at maxTime goes in last bucket
      const safeBucketIndex = Math.min(bucketIndex, bucketCount - 1);

      if (safeBucketIndex >= 0 && safeBucketIndex < bucketCount) {
        const bucket = buckets[safeBucketIndex];

        if (item.type === 'power') {
          bucket.powerCount++;
        } else if (item.type === 'gas') {
          bucket.gasCount++;
        }

        bucket.totalCount++;
      }
    });

    return buckets;
  }

  /**
   * Calculate optimal bucket count based on date range and screen size
   *
   * @param minDate - Start of date range
   * @param maxDate - End of date range
   * @param isMobile - Is mobile screen?
   * @returns Recommended bucket count
   */
  static calculateOptimalBucketCount(
    minDate: Date,
    maxDate: Date,
    isMobile: boolean
  ): number {
    const daysDiff = Math.ceil(
      (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Base bucket counts
    const baseMobile = 25;
    const baseDesktop = 80;

    // Adjust based on date range
    if (daysDiff <= 30) {
      // 1 month or less: fewer buckets (daily resolution)
      return isMobile ? 20 : 30;
    } else if (daysDiff <= 90) {
      // 3 months or less: normal buckets
      return isMobile ? baseMobile : 60;
    } else if (daysDiff <= 365) {
      // 1 year or less: normal buckets
      return isMobile ? baseMobile : baseDesktop;
    } else {
      // Multiple years: max buckets (weekly/monthly resolution)
      return isMobile ? 30 : 100;
    }
  }
}
```

**Testing**: 100% coverage target (pure functions, easy to test)

---

### Service 2: SliderCalculationService

**File**: `src/app/services/SliderCalculationService.ts`

**Purpose**: Date/position calculations for slider (pure functions)

**Class Definition**:
```typescript
/**
 * Service for slider position and date calculations
 * Pure functions - no side effects, easily testable
 */
export class SliderCalculationService {
  /**
   * Convert date to slider position percentage (0-100)
   *
   * @param date - Date to convert
   * @param min - Minimum date (slider start)
   * @param max - Maximum date (slider end)
   * @returns Position as percentage (0-100)
   */
  static dateToPercent(date: Date, min: Date, max: Date): number {
    const dateTime = date.getTime();
    const minTime = min.getTime();
    const maxTime = max.getTime();

    if (maxTime === minTime) {
      return 50;  // Handle edge case: single date
    }

    const percent = ((dateTime - minTime) / (maxTime - minTime)) * 100;
    return Math.max(0, Math.min(100, percent));  // Clamp to 0-100
  }

  /**
   * Convert slider position (clientX) to date
   *
   * @param clientX - Mouse/touch X position (pixels)
   * @param trackElement - Slider track DOM element
   * @param min - Minimum date (slider start)
   * @param max - Maximum date (slider end)
   * @returns Calculated date
   */
  static calculateDateFromPosition(
    clientX: number,
    trackElement: HTMLElement,
    min: Date,
    max: Date
  ): Date {
    const rect = trackElement.getBoundingClientRect();
    const trackWidth = rect.width;
    const offsetX = clientX - rect.left;

    // Calculate percentage (clamped to 0-100)
    const percent = Math.max(0, Math.min(100, (offsetX / trackWidth) * 100));

    // Convert percentage to date
    const minTime = min.getTime();
    const maxTime = max.getTime();
    const dateTime = minTime + (percent / 100) * (maxTime - minTime);

    return new Date(dateTime);
  }

  /**
   * Snap date to nearest day (remove time component)
   *
   * @param date - Date to snap
   * @returns Date with time set to 00:00:00.000
   */
  static snapToDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  /**
   * Check if two dates are the same day (ignoring time)
   *
   * @param date1 - First date
   * @param date2 - Second date
   * @returns True if same day
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Validate slider date constraints
   * Ensures start <= end and both within min/max bounds
   *
   * @param start - Start date
   * @param end - End date
   * @param min - Minimum allowed date
   * @param max - Maximum allowed date
   * @returns Validated and constrained dates
   */
  static validateConstraints(
    start: Date,
    end: Date,
    min: Date,
    max: Date
  ): { start: Date; end: Date } {
    // Constrain to bounds
    let constrainedStart = new Date(
      Math.max(min.getTime(), Math.min(max.getTime(), start.getTime()))
    );
    let constrainedEnd = new Date(
      Math.max(min.getTime(), Math.min(max.getTime(), end.getTime()))
    );

    // Ensure start <= end
    if (constrainedStart.getTime() > constrainedEnd.getTime()) {
      [constrainedStart, constrainedEnd] = [constrainedEnd, constrainedStart];
    }

    return {
      start: constrainedStart,
      end: constrainedEnd,
    };
  }
}
```

---

## Type Definitions

**File**: `src/app/types.ts` (add to existing types)

```typescript
/**
 * V3 Timeline Slider Types
 */

/**
 * Data bucket for histogram visualization
 * Represents measurement counts within a time range
 */
export interface DataBucket {
  startDate: Date;           // Bucket start time
  endDate: Date;             // Bucket end time
  powerCount: number;        // Number of power measurements
  gasCount: number;          // Number of gas measurements
  totalCount: number;        // Total measurements (power + gas)
}

/**
 * Slider state for drag/animation tracking
 * Internal state not exposed to parent
 */
export interface SliderState {
  isDragging: boolean;                    // Is user currently dragging?
  activeHandle: 'start' | 'end' | null;   // Which handle is being dragged?
  isAnimating: boolean;                   // Is slider animating to preset?
}

/**
 * Range slider component props
 */
export interface RangeSliderProps {
  min: Date;                                      // Earliest date in dataset
  max: Date;                                      // Latest date in dataset
  startValue: Date;                               // Current start date (controlled)
  endValue: Date;                                 // Current end date (controlled)
  onChange: (start: Date, end: Date) => void;     // Callback on range change
  energyData: EnergyType[];                       // Full dataset for histogram
  selectedTypes: EnergyOptions[];                 // Filter histogram by types
  disabled?: boolean;                             // Disable slider (no data)
  className?: string;                             // Custom CSS classes
}

/**
 * Slider visualization (histogram) props
 */
export interface SliderVisualizationProps {
  buckets: DataBucket[];                 // Aggregated data buckets
  selectedTypes: EnergyOptions[];        // Show only selected types
  width?: number;                        // SVG width (default: 100%)
  height?: number;                       // SVG height (default: 60px)
  className?: string;                    // Custom CSS classes
}

/**
 * Slider track props
 */
export interface SliderTrackProps {
  startPercent: number;                  // Start handle position (0-100)
  endPercent: number;                    // End handle position (0-100)
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
}

/**
 * Slider handle props
 */
export interface SliderHandleProps {
  type: 'start' | 'end';                 // Handle type
  position: number;                      // Position as percentage (0-100)
  date: Date;                            // Current date value
  isActive: boolean;                     // Is being dragged?
  onDragStart: (type: 'start' | 'end', event: React.MouseEvent | React.TouchEvent) => void;
  onDragMove: (event: React.MouseEvent | React.TouchEvent) => void;
  onDragEnd: () => void;
  onKeyDown: (type: 'start' | 'end', event: React.KeyboardEvent) => void;
  className?: string;
}

/**
 * Date range display props
 */
export interface DateRangeDisplayProps {
  startDate: Date;
  endDate: Date;
  format?: 'short' | 'long' | 'responsive';
  className?: string;
}

/**
 * Timeline preset definition
 * (Existing type from V2, carried forward)
 */
export interface TimelinePreset {
  id: string;
  label: string;
  calculateRange: () => { start: Date; end: Date };
}
```

**File**: `src/app/components/energy/RangeSlider/types.ts` (component-specific)

```typescript
/**
 * Component-specific types for RangeSlider
 * (Avoid polluting global types.ts with implementation details)
 */

export type HandleType = 'start' | 'end';

export interface DragState {
  isDragging: boolean;
  startX: number;
  startDate: Date;
}

export interface AnimationConfig {
  targetStart: Date;
  targetEnd: Date;
  duration: number;
}
```

---

## Performance Optimization Strategy

### Optimization 1: Memoization

**Where**: Data aggregation, date calculations, render components

**Implementation**:
```typescript
// In useHistogramData hook
const buckets = useMemo(() => {
  return DataAggregationService.aggregateIntoBuckets(
    energyData,
    minDate,
    maxDate,
    bucketCount,
    selectedTypes
  );
}, [energyData, minDate, maxDate, bucketCount, selectedTypes]);

// In RangeSlider component
const startPercent = useMemo(
  () => SliderCalculationService.dateToPercent(startValue, min, max),
  [startValue, min, max]
);

// Component memoization
const SliderVisualization = React.memo<SliderVisualizationProps>(({ buckets, selectedTypes }) => {
  // Render histogram
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if buckets or selectedTypes changed
  return (
    prevProps.buckets === nextProps.buckets &&
    arraysEqual(prevProps.selectedTypes, nextProps.selectedTypes)
  );
});
```

---

### Optimization 2: Throttling

**Where**: Drag move events, resize events

**Implementation**:
```typescript
// Throttle drag position updates (60fps = ~16ms)
const throttledPositionUpdate = useCallback(
  throttle((clientX: number) => {
    updateHandlePosition(clientX);
  }, 16),
  []
);

// Throttle visualization updates during drag (30fps = ~33ms)
const throttledVizUpdate = useCallback(
  throttle((buckets: DataBucket[]) => {
    updateVisualization(buckets);
  }, 33),
  []
);
```

---

### Optimization 3: Debouncing

**Where**: Filter application, resize handling

**Implementation**:
```typescript
// Debounce filter update (apply after user stops dragging)
const debouncedOnChange = useCallback(
  debounce((start: Date, end: Date) => {
    onChange(start, end);  // Trigger parent filter update
  }, 200),
  [onChange]
);

// Debounce resize handler
useEffect(() => {
  const handleResize = debounce(() => {
    recalculateBucketCount();
  }, 300);

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

### Optimization 4: Virtual Rendering (If Needed)

**When**: Dataset > 10,000 measurements

**Strategy**: Sample data for visualization, show representative subset

```typescript
// In DataAggregationService
static sampleDataForVisualization(
  data: EnergyType[],
  maxSamples: number = 5000
): EnergyType[] {
  if (data.length <= maxSamples) {
    return data;
  }

  // Evenly sample data points
  const step = Math.floor(data.length / maxSamples);
  return data.filter((_, index) => index % step === 0);
}
```

---

### Optimization 5: requestAnimationFrame for Smooth Dragging

**Implementation**:
```typescript
// In useSliderDrag hook
const rafIdRef = useRef<number | null>(null);

const handleDragMove = useCallback((event: MouseEvent | TouchEvent) => {
  if (rafIdRef.current) {
    cancelAnimationFrame(rafIdRef.current);
  }

  rafIdRef.current = requestAnimationFrame(() => {
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    updateHandlePosition(clientX);
  });
}, []);
```

---

## Accessibility Architecture

### ARIA Attribute Strategy

**Implementation in SliderHandle component**:
```tsx
<div
  role="slider"
  aria-label={`${type === 'start' ? 'Start' : 'End'} date`}
  aria-valuemin={min.getTime()}
  aria-valuemax={max.getTime()}
  aria-valuenow={date.getTime()}
  aria-valuetext={formatDateForScreenReader(date)}
  aria-orientation="horizontal"
  tabIndex={0}
  // ... rest of props
/>
```

**Helper function**:
```typescript
function formatDateForScreenReader(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  // Example: "Monday, January 15, 2024"
}
```

---

### Keyboard Navigation Strategy

**Implementation in useSliderKeyboard hook** (already shown above)

**Key Mappings**:
- `Arrow Left/Down`: -1 day
- `Arrow Right/Up`: +1 day
- `Shift + Arrow Left/Down`: -7 days (week)
- `Shift + Arrow Right/Up`: +7 days
- `Page Down`: -30 days (month)
- `Page Up`: +30 days
- `Home`: Jump to minimum date
- `End`: Jump to maximum date

---

### Focus Management

**Implementation**:
```typescript
// Auto-focus first handle when slider mounts
useEffect(() => {
  if (startHandleRef.current) {
    startHandleRef.current.focus();
  }
}, []);

// Focus visible styles (CSS)
.slider-handle:focus {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

.slider-handle:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

---

### Live Region Announcements

**Implementation in RangeSlider**:
```tsx
const [liveAnnouncementText, setLiveAnnouncementText] = useState('');

// Update announcement when range changes
useEffect(() => {
  const startStr = formatDateForScreenReader(startValue);
  const endStr = formatDateForScreenReader(endValue);
  setLiveAnnouncementText(`Date range selected: ${startStr} to ${endStr}`);
}, [startValue, endValue]);

// Render live region
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"  // Screen reader only (visually hidden)
>
  {liveAnnouncementText}
</div>
```

---

### Color Contrast & Visual Accessibility

**Design System Colors** (use existing Tailwind CSS variables):
```css
/* Ensure WCAG AA compliance */
--primary: hsl(221, 83%, 53%);       /* Blue: #3B82F6 */
--secondary: hsl(24, 95%, 53%);      /* Orange: #F97316 */
--background: hsl(0, 0%, 100%);      /* White */
--foreground: hsl(0, 0%, 10%);       /* Near black */
--border: hsl(0, 0%, 70%);           /* Gray */

/* Contrast ratios:
   - Primary on Background: 4.5:1 ✓ (WCAG AA)
   - Foreground on Background: 14.6:1 ✓ (WCAG AAA)
   - Border on Background: 3.1:1 ✓ (WCAG AA for UI)
*/
```

**High Contrast Mode Support**:
```css
@media (prefers-contrast: high) {
  .slider-handle-circle {
    border-width: 3px;
  }

  .slider-track-selected {
    outline: 2px solid currentColor;
  }
}
```

---

## Testing Architecture

### Test Categories & Distribution

**Total Tests**: 70-100 (as per requirements)

#### 1. Unit Tests: Services (20 tests)

**File**: `src/app/services/__tests__/DataAggregationService.test.ts`

```typescript
describe('DataAggregationService', () => {
  describe('aggregateIntoBuckets', () => {
    it('should create correct number of buckets', () => {
      const data = mockEnergyData(100);
      const buckets = DataAggregationService.aggregateIntoBuckets(
        data,
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        50,
        []
      );
      expect(buckets).toHaveLength(50);
    });

    it('should count power measurements correctly', () => {
      // Test power count aggregation
    });

    it('should count gas measurements correctly', () => {
      // Test gas count aggregation
    });

    it('should filter by selected types', () => {
      // Test type filtering
    });

    it('should handle empty dataset', () => {
      // Test edge case
    });

    it('should aggregate in < 100ms for 1000 measurements', () => {
      const data = mockEnergyData(1000);
      const start = performance.now();
      DataAggregationService.aggregateIntoBuckets(data, minDate, maxDate, 50, []);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});
```

**File**: `src/app/services/__tests__/SliderCalculationService.test.ts`

```typescript
describe('SliderCalculationService', () => {
  describe('dateToPercent', () => {
    it('should convert date to correct percentage', () => {
      const min = new Date('2024-01-01');
      const max = new Date('2024-12-31');
      const mid = new Date('2024-07-01');
      const percent = SliderCalculationService.dateToPercent(mid, min, max);
      expect(percent).toBeCloseTo(50, 1);
    });

    it('should return 0 for min date', () => {
      // Test boundary
    });

    it('should return 100 for max date', () => {
      // Test boundary
    });
  });

  describe('calculateDateFromPosition', () => {
    it('should convert position to correct date', () => {
      // Test position-to-date conversion
    });

    it('should handle track click at start', () => {
      // Test edge case
    });
  });

  describe('validateConstraints', () => {
    it('should ensure start <= end', () => {
      // Test constraint validation
    });

    it('should constrain to min/max bounds', () => {
      // Test boundary constraints
    });
  });
});
```

---

#### 2. Unit Tests: Hooks (25 tests)

**File**: `src/app/components/energy/RangeSlider/hooks/__tests__/useHistogramData.test.ts`

```typescript
import { renderHook } from '@testing-library/react';
import { useHistogramData } from '../useHistogramData';
import { mockEnergyData } from '@/app/__tests__/testUtils';

describe('useHistogramData', () => {
  it('should return memoized buckets', () => {
    const data = mockEnergyData(100);
    const { result, rerender } = renderHook(
      ({ energyData, selectedTypes }) => useHistogramData(energyData, selectedTypes),
      {
        initialProps: { energyData: data, selectedTypes: ['power', 'gas'] },
      }
    );

    const firstBuckets = result.current.buckets;

    // Re-render with same props
    rerender({ energyData: data, selectedTypes: ['power', 'gas'] });

    // Buckets should be memoized (same reference)
    expect(result.current.buckets).toBe(firstBuckets);
  });

  it('should recalculate buckets when data changes', () => {
    // Test memoization invalidation
  });

  it('should filter buckets by selected types', () => {
    // Test type filtering
  });

  it('should return min/max dates', () => {
    // Test date calculation
  });
});
```

**File**: `src/app/components/energy/RangeSlider/hooks/__tests__/useSliderDrag.test.ts`

```typescript
describe('useSliderDrag', () => {
  it('should handle drag start', () => {
    // Test drag initiation
  });

  it('should throttle drag move events', () => {
    // Test throttling
  });

  it('should debounce onChange callback', () => {
    // Test debouncing
  });

  it('should prevent handles from crossing', () => {
    // Test constraint validation
  });

  it('should handle touch events on mobile', () => {
    // Test touch support
  });
});
```

---

#### 3. Component Tests (30 tests)

**File**: `src/app/components/energy/RangeSlider/__tests__/RangeSlider.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RangeSlider from '../RangeSlider';
import { mockEnergyData } from '@/app/__tests__/testUtils';

describe('RangeSlider', () => {
  const defaultProps = {
    min: new Date('2024-01-01'),
    max: new Date('2024-12-31'),
    startValue: new Date('2024-03-01'),
    endValue: new Date('2024-09-01'),
    onChange: jest.fn(),
    energyData: mockEnergyData(100),
    selectedTypes: ['power', 'gas'],
  };

  it('should render with two handles', () => {
    render(<RangeSlider {...defaultProps} />);
    const handles = screen.getAllByRole('slider');
    expect(handles).toHaveLength(2);
  });

  it('should display current date range', () => {
    render(<RangeSlider {...defaultProps} />);
    expect(screen.getByText(/March/)).toBeInTheDocument();
    expect(screen.getByText(/September/)).toBeInTheDocument();
  });

  it('should call onChange when handle dragged', async () => {
    const onChange = jest.fn();
    render(<RangeSlider {...defaultProps} onChange={onChange} />);

    const startHandle = screen.getAllByRole('slider')[0];
    fireEvent.mouseDown(startHandle);
    fireEvent.mouseMove(document, { clientX: 200 });
    fireEvent.mouseUp(document);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });
  });

  it('should support keyboard navigation', async () => {
    const onChange = jest.fn();
    render(<RangeSlider {...defaultProps} onChange={onChange} />);

    const startHandle = screen.getAllByRole('slider')[0];
    startHandle.focus();

    await userEvent.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenCalled();
  });

  it('should prevent start handle from passing end handle', () => {
    // Test constraint validation
  });

  it('should render histogram visualization', () => {
    render(<RangeSlider {...defaultProps} />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();  // SVG
  });

  it('should be disabled when no data', () => {
    render(<RangeSlider {...defaultProps} energyData={[]} disabled />);
    const handles = screen.getAllByRole('slider');
    handles.forEach(handle => {
      expect(handle).toHaveAttribute('aria-disabled', 'true');
    });
  });
});
```

---

#### 4. Integration Tests (15 tests)

**File**: `src/app/components/energy/__tests__/EnergyTableFilters.integration.test.tsx`

```typescript
describe('EnergyTableFilters with RangeSlider (Integration)', () => {
  it('should sync preset button with slider', () => {
    // Click "Last 30 days" preset
    // Verify slider handles move to correct positions
    // Verify date range display updates
  });

  it('should deselect preset when slider manually adjusted', () => {
    // Click preset
    // Drag slider handle
    // Verify preset button no longer active
  });

  it('should update histogram when type filter changes', () => {
    // Uncheck "Power" checkbox
    // Verify histogram only shows gas bars
  });

  it('should reset slider to full range on reset button click', () => {
    // Set custom range
    // Click reset
    // Verify slider at min/max
  });
});
```

---

#### 5. Accessibility Tests (10 tests)

**File**: `src/app/components/energy/RangeSlider/__tests__/RangeSlider.a11y.test.tsx`

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('RangeSlider Accessibility', () => {
  it('should have no axe violations', async () => {
    const { container } = render(<RangeSlider {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have correct ARIA attributes on handles', () => {
    render(<RangeSlider {...defaultProps} />);
    const handles = screen.getAllByRole('slider');

    handles.forEach(handle => {
      expect(handle).toHaveAttribute('aria-valuemin');
      expect(handle).toHaveAttribute('aria-valuemax');
      expect(handle).toHaveAttribute('aria-valuenow');
      expect(handle).toHaveAttribute('aria-valuetext');
    });
  });

  it('should announce range changes to screen readers', async () => {
    render(<RangeSlider {...defaultProps} />);
    const liveRegion = screen.getByRole('status');

    // Trigger range change
    const startHandle = screen.getAllByRole('slider')[0];
    fireEvent.keyDown(startHandle, { key: 'ArrowRight' });

    await waitFor(() => {
      expect(liveRegion).toHaveTextContent(/Date range selected/);
    });
  });
});
```

---

### Testing Tools & Libraries

**Required**:
- Jest (test runner)
- React Testing Library (component testing)
- @testing-library/user-event (user interaction simulation)
- jest-axe (accessibility testing)

**Optional**:
- React DevTools Profiler (performance measurement)
- Chrome Performance tab (FPS measurement)

---

## Migration Strategy

### Phase 1: Preparation (No Breaking Changes)

**Goal**: Set up new types and utilities without breaking V1

**Steps**:
1. Add new types to `src/app/types.ts`
2. Create new service files (`DataAggregationService`, `SliderCalculationService`)
3. Create new utility files (`sliderUtils`, performance utilities)
4. Write unit tests for services and utilities (100% coverage)

**Duration**: 6-8 hours
**Risk**: LOW (no existing code modified)

---

### Phase 2: Build RangeSlider Component (Isolated)

**Goal**: Build complete RangeSlider component hierarchy in isolation

**Steps**:
1. Create `src/app/components/energy/RangeSlider/` directory
2. Build all slider sub-components (RangeSlider, SliderVisualization, SliderTrack, SliderHandle, DateRangeDisplay)
3. Build all custom hooks (useHistogramData, useSliderDrag, useSliderKeyboard, useSliderAnimation)
4. Write component tests (30+ tests)
5. Manual testing in isolation (Storybook or dedicated test page)

**Duration**: 24-30 hours
**Risk**: LOW (not yet integrated into main app)

---

### Phase 3: Update EnergyTableFilters (Breaking Change)

**Goal**: Integrate RangeSlider into existing EnergyTableFilters

**Steps**:
1. Update `EnergyTableFilters` props to accept `energyData`
2. Add `activePreset` state to `EnergyTableFilters`
3. Add RangeSlider to layout (between presets and type filter)
4. Wire up preset-to-slider synchronization
5. Update reset logic to reset slider
6. Update badge calculation to include custom range
7. Update parent component (`ReadingsPage`) to pass `energyData`

**Changes Required in ReadingsPage**:
```typescript
// BEFORE (V1)
<EnergyTableFilters
  typeFilter={typeFilter}
  setTypeFilter={setTypeFilter}
  dateRange={dateRange}
  setDateRange={setDateRange}
  onReset={handleResetFilters}
/>

// AFTER (V3)
<EnergyTableFilters
  typeFilter={typeFilter}
  setTypeFilter={setTypeFilter}
  dateRange={dateRange}
  setDateRange={setDateRange}
  onReset={handleResetFilters}
  energyData={energyData}  // NEW: Required for slider visualization
/>
```

**Duration**: 8-10 hours
**Risk**: MEDIUM (breaking change, but isolated to filter component)

---

### Phase 4: Testing & QA

**Goal**: Comprehensive testing and bug fixes

**Steps**:
1. Run full test suite (70-100 tests)
2. Fix any failing tests
3. Manual testing on desktop (Chrome, Safari, Firefox)
4. Manual testing on mobile (iOS Safari, Android Chrome)
5. Accessibility audit (axe-core + manual screen reader testing)
6. Performance testing (1000, 5000, 10,000 measurements)

**Duration**: 12-16 hours
**Risk**: MEDIUM (bugs may require refactoring)

---

### Phase 5: Polish & Documentation

**Goal**: Final polish and documentation updates

**Steps**:
1. Animation polish (timing, easing)
2. Responsive tweaks (bucket count, layout)
3. Update CLAUDE.md
4. Update user-guide.md (if exists)
5. Add JSDoc comments
6. Update CHANGELOG.md

**Duration**: 4-6 hours
**Risk**: LOW (cosmetic changes only)

---

### Rollback Plan

If V3 causes critical issues:

1. **Immediate Rollback**: Revert `EnergyTableFilters` to V1
2. **Keep RangeSlider code**: Don't delete, just don't import
3. **Update parent**: Remove `energyData` prop from `EnergyTableFilters`
4. **Fix in separate branch**: Debug issues without affecting main

**Rollback Time**: < 30 minutes (single commit revert)

---

## Technology Decisions

### Decision 1: Build Custom Slider vs Use Library

**Options Evaluated**:
- Custom slider (recommended)
- rc-slider
- react-slider
- noUiSlider

**Decision**: **Build Custom Slider**

**Rationale**:
1. **Date-specific behavior**: Slider operates on dates, not numbers (libraries designed for numeric ranges)
2. **Tight visualization integration**: Histogram rendered as part of slider (hard to integrate with library)
3. **Performance control**: Optimize specifically for our data patterns and constraints
4. **No extra dependencies**: Keeps bundle size down, reduces maintenance burden
5. **Full customization**: Complete control over styling, animations, interactions
6. **Learning opportunity**: Team gains deep understanding of slider implementation

**Trade-offs**:
- More development time (3-4 days vs 1-2 days with library)
- Need to handle all edge cases ourselves
- Accessibility requires careful implementation

**Conclusion**: Custom slider is worth the extra effort for this use case.

---

### Decision 2: SVG vs Canvas for Visualization

**Options Evaluated**:
- SVG (recommended)
- Canvas
- Chart.js / D3.js

**Decision**: **SVG**

**Rationale**:
1. **Declarative**: React-friendly, easy to render conditionally
2. **Scalable**: No pixelation on zoom or high-DPI displays
3. **Styleable**: Can use CSS classes and Tailwind utilities
4. **Accessible**: Can add ARIA labels and roles to SVG elements
5. **Performance**: Fast enough for < 100 histogram bars (typical case)
6. **Simplicity**: No additional library needed

**Trade-offs**:
- Performance degrades with 1000+ SVG elements (not an issue for bucketed histogram)
- Slightly larger DOM tree than Canvas

**Conclusion**: SVG is the best choice for this visualization.

---

### Decision 3: State Management Approach

**Options Evaluated**:
- Local state with useState (recommended)
- useReducer
- Context API
- External state library (Zustand, Jotai)

**Decision**: **Local state with useState + Custom Hooks**

**Rationale**:
1. **Simple enough**: No complex state transitions requiring reducer
2. **Follows project patterns**: Existing codebase uses useState + hooks
3. **Easy to test**: Local state can be tested via component props
4. **No global state needed**: Filter state only relevant to Readings page
5. **Custom hooks abstract complexity**: Drag/keyboard logic in hooks, not components

**Trade-offs**:
- More prop drilling than Context (acceptable for 2-3 levels)
- Slightly less performant than useReducer (negligible difference)

**Conclusion**: useState + hooks is sufficient and idiomatic for this feature.

---

### Decision 4: Histogram Visualization Type

**Options Evaluated**:
- Mini histogram (stacked bars) ✓ **RECOMMENDED**
- Mini line chart / sparkline
- Heatmap / intensity bar
- Dot plot / scatter

**Decision**: **Mini Histogram (Stacked Bars)**

**Rationale** (from requirements document):
1. **Best clarity**: Easy to see data density at a glance
2. **Type distinction**: Can show Power (blue) and Gas (orange) as stacked bars
3. **Scalable**: Bucket aggregation handles large datasets well
4. **Familiar**: Users understand bar charts intuitively
5. **Mobile-friendly**: Can reduce bucket count on small screens

**Conclusion**: Histogram is the optimal choice for this use case.

---

### Decision 5: Animation Strategy

**Options Evaluated**:
- CSS transitions (recommended)
- React Spring
- Framer Motion
- requestAnimationFrame (manual)

**Decision**: **CSS Transitions**

**Rationale**:
1. **Simple**: Single line of CSS for smooth animation
2. **Performant**: GPU-accelerated, no JavaScript overhead
3. **No dependencies**: Built into browsers
4. **Easy to disable**: Users can disable animations via OS settings (prefers-reduced-motion)

**Implementation**:
```css
.slider-handle {
  transition: left 300ms ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .slider-handle {
    transition: none;
  }
}
```

**Conclusion**: CSS transitions are sufficient for preset animations.

---

## Implementation Phases

### Phase 1: Planning & Architecture ✓ (4-6 hours)

**Tasks**:
- ✓ Review requirements (V3)
- ✓ Design component hierarchy
- ✓ Define data flow
- ✓ Create type definitions
- ✓ Design hook specifications
- ✓ Design service layer
- ✓ Document architecture (this document)

**Deliverables**:
- ✓ `architecture-v3.md` (this document)

---

### Phase 2: Data Aggregation & Utilities (6-8 hours)

**Tasks**:
1. Create `src/app/services/DataAggregationService.ts`
   - Implement `aggregateIntoBuckets()`
   - Implement `calculateOptimalBucketCount()`
   - Write unit tests (100% coverage)

2. Create `src/app/services/SliderCalculationService.ts`
   - Implement `dateToPercent()`
   - Implement `calculateDateFromPosition()`
   - Implement `validateConstraints()`
   - Implement `snapToDay()`, `isSameDay()`
   - Write unit tests (100% coverage)

3. Create `src/app/utils/performance.ts`
   - Implement `throttle()`
   - Implement `debounce()`
   - Write unit tests

4. Update `src/app/utils/dateUtils.ts`
   - Add `addDays(date, days)` helper
   - Add `formatDateForScreenReader(date)` helper

5. Add types to `src/app/types.ts`
   - Add `DataBucket` type
   - Add `SliderState` type
   - Add all prop types

**Deliverables**:
- DataAggregationService (tested)
- SliderCalculationService (tested)
- Performance utilities (tested)
- Updated dateUtils
- Type definitions

---

### Phase 3: Slider Component (16-20 hours)

**Tasks**:
1. Create directory structure
   ```
   src/app/components/energy/RangeSlider/
   ├── index.ts
   ├── RangeSlider.tsx
   ├── SliderVisualization.tsx
   ├── SliderTrack.tsx
   ├── SliderHandle.tsx
   ├── DateRangeDisplay.tsx
   ├── types.ts
   ├── hooks/
   └── __tests__/
   ```

2. Build custom hooks (8-10 hours)
   - `useHistogramData.ts`
   - `useSliderDrag.ts`
   - `useSliderKeyboard.ts`
   - `useSliderAnimation.ts`
   - Write hook tests

3. Build components (8-10 hours)
   - `RangeSlider.tsx` (main container)
   - `SliderVisualization.tsx` (histogram SVG)
   - `SliderTrack.tsx` (track + highlight)
   - `SliderHandle.tsx` (draggable handle)
   - `DateRangeDisplay.tsx` (date labels)
   - Write component tests

4. Implement accessibility
   - ARIA attributes
   - Keyboard navigation
   - Focus management
   - Live region announcements

5. Styling with Tailwind CSS

**Deliverables**:
- Complete RangeSlider component hierarchy
- All custom hooks
- 30+ component tests
- Accessibility features

---

### Phase 4: Visualization Component (8-10 hours)

**Tasks**:
1. Build `SliderVisualization.tsx`
   - SVG histogram rendering
   - Stacked bars (Power blue, Gas orange)
   - Responsive bucket count
   - Type filter integration

2. Optimize rendering
   - Wrap in React.memo
   - Memoize bucket calculations (in hook)

3. Write tests
   - Histogram rendering tests
   - Type filter tests
   - Performance tests

**Deliverables**:
- SliderVisualization component
- 15+ visualization tests

---

### Phase 5: Preset-Slider Integration (4-6 hours)

**Tasks**:
1. Update `EnergyTableFilters.tsx`
   - Add `activePreset` state
   - Implement preset-to-slider animation
   - Implement reverse sync (slider-to-preset detection)

2. Wire up callbacks
   - Preset click → animate slider
   - Slider change → deselect preset

3. Write integration tests
   - Preset sync tests
   - Animation tests

**Deliverables**:
- Updated EnergyTableFilters
- 10+ integration tests

---

### Phase 6: Parent Component Integration (4-6 hours)

**Tasks**:
1. Update `ReadingsPage` (`src/app/readings/page.tsx`)
   - Pass `energyData` to EnergyTableFilters
   - Update reset handler

2. Update EnergyTableFilters layout
   - Add RangeSlider section
   - Update grid structure
   - Update badge calculation

3. Write integration tests
   - Full filter flow tests
   - Reset tests

**Deliverables**:
- Updated ReadingsPage
- Updated EnergyTableFilters layout
- 10+ integration tests

---

### Phase 7: Testing (12-16 hours)

**Tasks**:
1. Unit testing (20 tests)
   - Service tests
   - Utility tests

2. Component testing (30 tests)
   - RangeSlider tests
   - SliderVisualization tests
   - Hook tests

3. Integration testing (15 tests)
   - Filter integration tests
   - Preset sync tests
   - Type filter + slider tests

4. Accessibility testing (10 tests)
   - axe-core automated tests
   - ARIA attribute tests
   - Keyboard navigation tests
   - Screen reader tests (manual)

5. Performance testing (5 tests)
   - Data aggregation benchmarks
   - Drag performance tests (manual)
   - Memory leak tests

6. Manual testing
   - Desktop browsers (Chrome, Safari, Firefox)
   - Mobile devices (iOS, Android)
   - Responsive breakpoints

**Deliverables**:
- 70-100 tests passing
- Coverage report (100% for services/hooks)
- Manual testing checklist completed

---

### Phase 8: QA & Polish (8-12 hours)

**Tasks**:
1. Bug fixes from testing
2. Animation polish (timing, easing)
3. Responsive tweaks (mobile layout, bucket count)
4. Performance optimization (if needed)
5. Visual polish (colors, spacing, shadows)
6. Edge case handling (no data, single measurement, large ranges)

**Deliverables**:
- All bugs fixed
- Polished UI
- Smooth animations
- Responsive on all screen sizes

---

### Phase 9: Documentation (2-4 hours)

**Tasks**:
1. Update `CLAUDE.md`
   - Add V3 feature to architecture section
   - Add RangeSlider component documentation
   - Update component patterns

2. Add JSDoc comments
   - All hooks
   - All services
   - Public component props

3. Update CHANGELOG.md
   - Add V3 feature entry

4. Create usage examples (optional)

**Deliverables**:
- Updated CLAUDE.md
- JSDoc comments
- Updated CHANGELOG.md

---

### Total Timeline: 64-88 hours (8-11 days)

**Breakdown**:
- Setup & services: 10-14 hours (1.5-2 days)
- Slider implementation: 28-36 hours (3.5-4.5 days)
- Integration: 12-16 hours (1.5-2 days)
- Testing & QA: 20-28 hours (2.5-3.5 days)
- Documentation: 2-4 hours (0.5 day)

---

## Risk Analysis & Mitigation

### Risk 1: Performance Degradation with Large Datasets

**Risk Level**: HIGH
**Probability**: MEDIUM (likely with 5000+ measurements)
**Impact**: HIGH (unusable slider)

**Mitigation Strategies**:
1. **Memoization**: Aggressive memoization of data aggregation
2. **Throttling**: Throttle drag updates to 60fps, visualization to 30fps
3. **Debouncing**: Debounce filter application (200ms after drag ends)
4. **Early testing**: Test with 1000, 5000, 10,000 measurements in Phase 2
5. **Sampling**: If needed, sample data for visualization (show representative subset)
6. **Web Workers**: If needed, move aggregation to Web Worker (advanced, last resort)

**Contingency**:
- If performance unacceptable: Reduce bucket count dynamically based on dataset size
- If still unacceptable: Show simplified visualization (heatmap instead of histogram)

---

### Risk 2: Complex Touch Interactions on Mobile

**Risk Level**: MEDIUM
**Probability**: MEDIUM (touch events are tricky)
**Impact**: MEDIUM (poor mobile UX)

**Mitigation Strategies**:
1. **Large touch targets**: 44x44px handles (WCAG minimum)
2. **Drag threshold**: 5px minimum movement before drag starts (prevent accidental drags)
3. **Visual feedback**: Highlight active handle immediately on touch
4. **Early mobile testing**: Test on real iOS/Android devices in Phase 6
5. **Haptic feedback**: Optional vibration on handle snap (if supported)

**Contingency**:
- If touch dragging too difficult: Add "tap to set" alternative (tap histogram bar to jump handle)
- If still unacceptable: Fall back to date picker for mobile (keep slider on desktop)

---

### Risk 3: Accessibility Compliance

**Risk Level**: MEDIUM
**Probability**: MEDIUM (custom widgets are hard to make accessible)
**Impact**: HIGH (unusable for screen reader users)

**Mitigation Strategies**:
1. **Follow WAI-ARIA patterns**: Use official slider pattern exactly
2. **Full keyboard navigation**: Implement all keyboard shortcuts (arrows, page up/down, home/end)
3. **Screen reader testing**: Test with NVDA (Windows) and VoiceOver (Mac/iOS)
4. **Automated audit**: Run axe-core on every component
5. **Expert review**: If possible, get accessibility expert to review

**Contingency**:
- If accessibility issues found late: Delay release until fixed (non-negotiable)
- If custom slider too hard: Use accessible library (rc-slider) instead (requires rework)

---

### Risk 4: Browser Compatibility Issues

**Risk Level**: LOW
**Probability**: LOW (modern browsers have good support)
**Impact**: MEDIUM (broken in some browsers)

**Mitigation Strategies**:
1. **Test in target browsers**: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
2. **Use widely-supported APIs**: SVG, CSS transitions, touch events (all well-supported)
3. **Feature detection**: Check for touch support before using touch events
4. **Graceful degradation**: If slider fails, fall back to date picker

**Contingency**:
- If browser-specific bugs found: Add polyfills or workarounds
- If unsolvable: Hide slider in unsupported browsers, show date picker instead

---

### Risk 5: Development Timeline Overrun

**Risk Level**: MEDIUM
**Probability**: MEDIUM (complex feature, estimates may be optimistic)
**Impact**: HIGH (delayed release)

**Mitigation Strategies**:
1. **Phased approach**: Build in phases, checkpoint after each
2. **MVP first**: Get basic slider working, then add polish
3. **Buffer time**: Add 20% buffer to estimates (included in 8-11 days)
4. **Daily progress reviews**: Track actual vs estimated time
5. **Fallback plan**: If time-constrained, remove visualization (keep basic slider)

**Contingency**:
- If 25% over estimate: Remove animation polish, basic animations only
- If 50% over estimate: Remove visualization (histogram), keep basic slider
- If 75% over estimate: Abort V3, stick with V2 (presets only)

---

### Risk 6: Visualization Not Clear on Small Screens

**Risk Level**: MEDIUM
**Probability**: MEDIUM (small screens are challenging)
**Impact**: MEDIUM (confusing visualization)

**Mitigation Strategies**:
1. **Responsive bucket count**: Fewer buckets on mobile (20-30 vs 80-100 on desktop)
2. **Larger bars**: Increase bar width on mobile for visibility
3. **Simplified layout**: Stack components vertically on mobile
4. **Early mobile testing**: Test on small screens (320px) in Phase 3
5. **User feedback**: Get feedback on mobile prototype early

**Contingency**:
- If histogram too cluttered: Switch to heatmap visualization on mobile
- If still too cluttered: Hide visualization on very small screens (< 360px), show slider only

---

## Appendix

### A. File Structure (Complete)

```
src/app/
├── components/
│   └── energy/
│       ├── EnergyTableFilters.tsx         # UPDATED: Add RangeSlider integration
│       ├── EnergyTable.tsx                # Existing (unchanged)
│       └── RangeSlider/                   # NEW: Slider component hierarchy
│           ├── index.ts                   # Barrel export
│           ├── RangeSlider.tsx            # Main container
│           ├── SliderVisualization.tsx    # Histogram SVG
│           ├── SliderTrack.tsx            # Track + highlight
│           ├── SliderHandle.tsx           # Draggable handle
│           ├── DateRangeDisplay.tsx       # Date labels
│           ├── types.ts                   # Component-specific types
│           ├── hooks/
│           │   ├── useHistogramData.ts
│           │   ├── useSliderDrag.ts
│           │   ├── useSliderKeyboard.ts
│           │   └── useSliderAnimation.ts
│           └── __tests__/
│               ├── RangeSlider.test.tsx
│               ├── SliderVisualization.test.tsx
│               ├── SliderHandle.test.tsx
│               ├── SliderTrack.test.tsx
│               └── sliderHooks.test.ts
├── services/
│   ├── validationService.ts               # Existing (unchanged)
│   ├── DataAggregationService.ts          # NEW: Bucket aggregation
│   ├── SliderCalculationService.ts        # NEW: Date/position calculations
│   └── __tests__/
│       ├── DataAggregationService.test.ts
│       └── SliderCalculationService.test.ts
├── utils/
│   ├── dateUtils.ts                       # UPDATED: Add slider helpers
│   ├── csvUtils.ts                        # Existing (unchanged)
│   ├── errorHandling.ts                   # Existing (unchanged)
│   ├── performance.ts                     # NEW: throttle, debounce
│   └── __tests__/
│       ├── performance.test.ts
│       └── sliderUtils.test.ts
├── constants/
│   ├── energyTypes.ts                     # Existing (unchanged)
│   ├── ui.ts                              # Existing (unchanged)
│   └── slider.ts                          # NEW: Slider constants
├── hooks/
│   ├── useTableSort.ts                    # Existing (unchanged)
│   ├── useEnergyData.ts                   # Existing (unchanged)
│   ├── useToast.ts                        # Existing (unchanged)
│   ├── useConfirmationModal.ts            # Existing (unchanged)
│   └── useMediaQuery.ts                   # NEW: Responsive hook
├── types.ts                               # UPDATED: Add V3 types
└── readings/
    └── page.tsx                           # UPDATED: Pass energyData to filters
```

---

### B. Performance Benchmarks (Target)

| Metric | Target | Dataset Size | Verification Method |
|--------|--------|--------------|---------------------|
| Data aggregation | < 100ms | 1,000 measurements | `performance.now()` |
| Data aggregation | < 500ms | 5,000 measurements | `performance.now()` |
| Data aggregation | < 1s | 10,000 measurements | `performance.now()` |
| Initial render | < 200ms | Any size | React DevTools Profiler |
| Slider drag (FPS) | 60fps | Any size | Chrome Performance tab |
| Visualization render | < 50ms | 100 buckets | `performance.now()` |
| Type filter update | < 100ms | Any size | React DevTools Profiler |
| Preset animation | 300ms | N/A | CSS transition duration |
| Memory usage | < 1MB | Any size | Chrome Memory Profiler |

---

### C. Accessibility Checklist (WCAG 2.1 AA)

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| Keyboard navigation (Tab) | ✓ Tab to focus handles | Manual testing |
| Keyboard navigation (Arrows) | ✓ Arrow keys adjust dates | Manual testing |
| Keyboard shortcuts | ✓ Shift+Arrow, Page Up/Down, Home/End | Manual testing |
| ARIA `role="slider"` | ✓ On each handle | Code review + axe-core |
| ARIA `aria-valuemin/max/now` | ✓ Timestamps | Code review + axe-core |
| ARIA `aria-valuetext` | ✓ Human-readable dates | Code review + screen reader |
| Focus indicators | ✓ 2px outline on focus | Manual testing |
| Color contrast (UI) | ✓ 3:1 minimum | Color contrast checker |
| Color contrast (text) | ✓ 4.5:1 minimum | Color contrast checker |
| Live region announcements | ✓ `aria-live="polite"` | Screen reader testing (NVDA, VoiceOver) |
| Touch targets | ✓ ≥ 44x44px | Manual measurement |
| Not color-only info | ✓ Patterns + color (if needed) | Manual review |
| High contrast mode | ✓ Works in Windows high contrast | Manual testing (Windows) |
| Screen reader testing | ✓ NVDA + VoiceOver | Manual testing |

---

### D. Browser Compatibility Matrix

| Browser | Minimum Version | SVG Support | Touch Events | CSS Transitions | Status |
|---------|----------------|-------------|--------------|-----------------|--------|
| Chrome | 90+ | ✓ | ✓ | ✓ | Fully supported |
| Safari | 14+ | ✓ | ✓ | ✓ | Fully supported |
| Firefox | 88+ | ✓ | ✓ | ✓ | Fully supported |
| Edge | 90+ | ✓ | ✓ | ✓ | Fully supported |
| iOS Safari | 13+ | ✓ | ✓ | ✓ | Fully supported |
| Android Chrome | 90+ | ✓ | ✓ | ✓ | Fully supported |

---

### E. Related Documentation

- **Requirements**: `requirements-v3.md` (V3 - Full specification)
- **Summary**: `V3_SUMMARY.md` (V3 - Executive summary)
- **Previous Version**: `requirements-v2.md` (V2 - Timeline presets)
- **Architecture**: `architecture-v3.md` (this document)
- **Project Guide**: `/CLAUDE.md` (Project patterns and conventions)
- **Test Scenarios**: `test-scenarios-v3.md` (to be created)

---

## Conclusion

This architecture provides a comprehensive blueprint for implementing the interactive timeline slider with data visualization. The design prioritizes:

1. **Separation of Concerns**: Clear layers (components, hooks, services, utilities)
2. **Testability**: Pure functions, isolated components, dependency injection
3. **Performance**: Memoization, throttling, debouncing at architectural level
4. **Accessibility**: ARIA attributes, keyboard navigation, screen reader support
5. **Maintainability**: SOLID principles, clear responsibilities, extensive documentation
6. **Scalability**: Component composition, service layer, performance optimization

The phased implementation approach allows for checkpoints and risk mitigation at each stage. The total estimated effort of 64-88 hours (8-11 days) is based on experienced developer productivity and includes buffer time for unexpected challenges.

**Key Success Factors**:
- Early testing with large datasets (performance validation)
- Early mobile testing on real devices (touch interaction validation)
- Accessibility testing throughout (not as afterthought)
- Phased rollout with checkpoints (risk mitigation)

**Next Steps**:
1. Review this architecture with stakeholders
2. Get approval for technical approach
3. Begin Phase 2: Data Aggregation & Utilities

---

**Document Status**: ✅ **READY FOR IMPLEMENTATION**

**Approval Required**: Technical lead sign-off on:
- Component hierarchy
- Hook specifications
- Service layer design
- Performance targets
- Implementation timeline

---

**END OF ARCHITECTURE DOCUMENT**
