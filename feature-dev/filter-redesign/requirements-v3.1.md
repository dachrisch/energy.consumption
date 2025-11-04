# Requirements Specification: Filter Redesign V3.1 - UX Refinements

## Document Information
- **Feature Type**: UI Enhancement - REFINEMENTS TO V3
- **Component**: Filter Components (EnergyTableFilters, TypeFilter, FilterReset, RangeSlider, DateRangeDisplay)
- **Related Page**: `/src/app/readings/page.tsx`
- **Status**: Requirements Defined - V3.1 Refinements
- **Date**: 2025-11-04
- **Version**: 3.1 (MINOR - Visual & Interaction Refinements)
- **Previous Version**: V3.0 (Interactive Timeline Slider) - See `requirements-v3.md`
- **Complexity Level**: 🟡 **MEDIUM** - Focused bug fixes and visual refinements

---

## Executive Summary

This document specifies refinements to the V3 implementation based on user testing feedback. V3 has been implemented and tested, revealing **7 issues** requiring fixes:

**Issue Breakdown**:
- **1 Critical Bug**: Slider drag not working (handles don't respond to dragging)
- **3 Visual Refinements**: Button colors, borders, label cleanup
- **2 Component Relocations**: Reset button placement, filter count badge removal
- **1 Layout Issue**: Date labels overflowing at container edges

**Impact**: 🟡 **MEDIUM** - Critical drag bug blocks usability, visual refinements improve UX

**Estimated Effort**: 4-8 hours (0.5-1 day)

---

## User Feedback (Verbatim)

User testing of V3 implementation revealed the following issues:

1. **TypeFilter Colors**: _"the filter selectors should only have a color when active, otherwise this is too bright"_
2. **EnergyTableFilters Border**: _"filter readings have two borders, the outside in thin and an inside in thick, remove the thick"_
3. **Timeline Label**: _"cleanup the labels, i think timeline filter is not necessary as we already see that we are having a timeline"_
4. **Filter Count Badge**: _"get rid of the number icon for how many filter, we dont need this"_
5. **Reset Button Placement**: _"include reset in the row of presets filters and make it visually different"_
6. **Slider Drag Bug**: _"the slider cannot be used, it works with the presets but not by dragging them"_ (CRITICAL)
7. **Date Label Overflow**: _"also the labels are overflowing at the edges"_

---

## Problem Statement

### Current Issues (V3 Implementation)

After implementing V3, user testing revealed:

#### Critical Functionality Issue
- ❌ **Slider handles don't respond to dragging**: Preset buttons work (move handles), but manual drag-and-drop of handles is broken
  - **Impact**: Primary slider interaction is non-functional
  - **Root Cause**: Event handlers not properly wired or position calculation bug

#### Visual & UX Issues
- ❌ **Inactive type filter buttons too bright**: All buttons have colored backgrounds, making inactive state visually noisy
- ❌ **Double border on filter container**: Solid container has both thin outer and thick inner border
- ❌ **Redundant "Timeline Filter" label**: Section already shows timeline controls, label is unnecessary
- ❌ **Filter count badge unnecessary**: Badge showing "(1)" or "(2)" adds clutter, reset button alone is sufficient
- ❌ **Reset button isolated**: Reset button is in separate row below type filter, should be with presets
- ❌ **Date labels overflow**: Labels at edges (start/end dates) overflow container bounds

---

## Categorization: Bugs vs. Refinements

### Critical Bugs (Priority: 🔴 CRITICAL)
**Must fix immediately - blocks core functionality**

1. **FR-V3.1-001**: Slider drag interaction not working

### Visual Refinements (Priority: 🟡 HIGH)
**Should fix - improves usability and aesthetics**

2. **FR-V3.1-002**: TypeFilter inactive button styling (too bright)
3. **FR-V3.1-003**: EnergyTableFilters double border (remove thick inner border)
4. **FR-V3.1-004**: Remove "Timeline Filter" label text
5. **FR-V3.1-005**: Remove active filter count badge from FilterReset
6. **FR-V3.1-006**: Move FilterReset to presets row, visually distinct styling

### Layout Issues (Priority: 🟡 HIGH)
**Should fix - prevents information loss**

7. **FR-V3.1-007**: DateRangeDisplay labels overflow at edges

---

## Functional Requirements (V3.1 Refinements)

### FR-V3.1-001: Fix Slider Drag Interaction (CRITICAL BUG)
**Priority**: 🔴 **CRITICAL**
**Status**: Bug - Not Working
**Complexity**: 🔴 **HIGH** (Root cause investigation required)

**Current Behavior**:
- Clicking preset buttons animates slider handles correctly ✅
- Handles appear at correct positions ✅
- Handles do NOT respond to mouse drag ❌
- Handles do NOT respond to touch drag (mobile) ❌
- Clicking/touching handle does not initiate drag ❌

**Expected Behavior**:
- User can click/touch handle and drag it to new position
- Handle follows mouse/finger position during drag
- Date range updates in real-time during drag
- Filter applies when drag ends (debounced)

**Root Cause Investigation Areas**:

1. **Event Handler Wiring** (Most Likely):
   - Check `SliderHandle.tsx`: Are `onMouseDown` and `onTouchStart` calling `onDragStart`? ✅ (Code shows they are)
   - Check `RangeSlider.tsx`: Is `handleDragStart` setting state correctly? ✅ (Code shows it is)
   - Check parent drag events: Are global `mousemove` and `mouseup` listeners attached?
     - **LIKELY ISSUE**: `RangeSlider.tsx` may not be attaching global drag listeners
     - Need to add `useEffect` to attach `document` event listeners when dragging starts

2. **Position Calculation**:
   - Check `SliderCalculationService.ts`: Are position-to-date and date-to-position calculations correct?
   - Check handle constraints: Are handles constrained to track bounds?

3. **Touch Events**:
   - Check if touch events are properly prevented from causing page scroll
   - Check if touch coordinates are correctly extracted from event

**Implementation Fix (Expected)**:

```typescript
// In RangeSlider.tsx
useEffect(() => {
  if (!sliderState.isDragging) return;

  // Global mouse/touch move handler
  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const position = e.clientX - rect.left;
    handleDrag(position);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const position = touch.clientX - rect.left;
    handleDrag(position);
  };

  // Global mouse/touch up handler
  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Attach global listeners
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleMouseUp);

  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleMouseUp);
  };
}, [sliderState.isDragging, handleDrag, handleDragEnd]);
```

**Acceptance Criteria**:
- ✅ User can click/touch handle and drag it
- ✅ Handle follows cursor/finger smoothly (60fps)
- ✅ Handle constrained to track bounds
- ✅ Start handle cannot cross end handle
- ✅ End handle cannot cross start handle
- ✅ Date labels update in real-time during drag
- ✅ Filter applies when drag ends (debounced)
- ✅ Works on desktop (mouse)
- ✅ Works on mobile (touch)
- ✅ No page scroll during drag on mobile

**Testing**:
- ✅ Manual test: Drag start handle left/right
- ✅ Manual test: Drag end handle left/right
- ✅ Manual test: Try to drag start handle past end handle (should stop)
- ✅ Manual test: Touch drag on mobile device
- ✅ Automated test: Mock drag events and verify state changes

---

### FR-V3.1-002: TypeFilter Inactive Button Styling
**Priority**: 🟡 **HIGH**
**Status**: Visual Refinement
**Complexity**: 🟢 **LOW**

**Current Behavior**:
- **Inactive buttons**: Have colored subtle background (`bg-primary-subtle`, `border-primary`)
  ```typescript
  // TypeFilter.tsx line 90-92
  isChecked
    ? 'bg-primary-subtle border-primary text-primary font-semibold shadow-sm ring-3 ring-primary-subtle'
    : 'bg-transparent border-border text-foreground hover:bg-background-hover hover:border-border-hover'
  ```
- User feedback: **"too bright"** when not active

**Expected Behavior**:
- **Inactive buttons**: Neutral/muted appearance
  - Background: Transparent (`bg-transparent`)
  - Border: Subtle gray (`border-border`)
  - Text: Muted foreground (`text-foreground-muted` or `text-foreground`)
  - Hover: Slight background change (`hover:bg-background-hover`)

- **Active buttons**: Colorful (current implementation is correct)
  - Background: Primary subtle (`bg-primary-subtle`)
  - Border: Primary bold (`border-primary`)
  - Text: Primary bold (`text-primary font-semibold`)
  - Shadow: Subtle (`shadow-sm`)
  - Ring: Primary subtle (`ring-3 ring-primary-subtle`)

**Code Changes**:

**File**: `src/app/components/energy/TypeFilter.tsx`

**Current** (lines 89-93):
```typescript
${
  isChecked
    ? 'bg-primary-subtle border-primary text-primary font-semibold shadow-sm ring-3 ring-primary-subtle'
    : 'bg-transparent border-border text-foreground hover:bg-background-hover hover:border-border-hover'
}
```

**Change to**:
```typescript
${
  isChecked
    ? 'bg-primary-subtle border-primary text-primary font-semibold shadow-sm ring-3 ring-primary-subtle'
    : 'bg-transparent border-muted text-foreground-muted hover:bg-background-hover hover:border-border hover:text-foreground'
}
```

**Summary of Changes**:
- Inactive state: `border-border` → `border-muted` (more subtle)
- Inactive state: `text-foreground` → `text-foreground-muted` (less prominent)
- Inactive hover: Add `hover:text-foreground` (brighten on hover)

**Acceptance Criteria**:
- ✅ Inactive buttons have muted appearance (gray, low contrast)
- ✅ Active buttons retain colorful appearance (primary colors)
- ✅ Hover state provides visual feedback (slight background + text change)
- ✅ Transition smooth (existing `transition-all duration-150`)
- ✅ Mobile and desktop both look correct

---

### FR-V3.1-003: Remove EnergyTableFilters Thick Inner Border
**Priority**: 🟡 **HIGH**
**Status**: Visual Refinement
**Complexity**: 🟢 **LOW**

**Current Behavior**:
- `EnergyTableFilters` uses `solid-container` class
- User reports **"two borders, the outside in thin and an inside in thick"**
- Need to inspect `solid-container` CSS definition

**Expected Behavior**:
- Container has **single thin outer border** only
- No thick inner border

**Investigation Required**:
1. Check `solid-container` class definition (likely in `src/app/layout/main.css` or Tailwind config)
2. Identify source of "thick inner border"
   - Could be `border-2` or `border-4` on container
   - Could be padding + background creating visual "inner border"

**Code Changes** (Placeholder - requires investigation):

**File**: TBD (likely `src/app/layout/main.css` or component styles)

**Current** (example):
```css
.solid-container {
  @apply border-4 border-border rounded-2xl; /* Thick border */
  @apply p-6 bg-background;
}
```

**Change to**:
```css
.solid-container {
  @apply border border-border rounded-2xl; /* Thin border (1px) */
  @apply p-6 bg-background;
}
```

**Alternative**: If `solid-container` is correct, check if component adds extra border:

**File**: `src/app/components/energy/EnergyTableFilters.tsx`

**Current** (line 143):
```typescript
<div className={`energy-table-filters solid-container ${className}`}>
```

**Check for additional border classes** in parent component or wrapper.

**Acceptance Criteria**:
- ✅ Filter container has single thin outer border (1-2px max)
- ✅ No thick inner border visible
- ✅ Border color subtle (gray, not prominent)
- ✅ Rounded corners preserved
- ✅ Padding not affected

---

### FR-V3.1-004: Remove "Timeline Filter" Label
**Priority**: 🟡 **HIGH**
**Status**: Visual Refinement
**Complexity**: 🟢 **LOW**

**Current Behavior**:
- Section has label: `<label className="text-sm font-semibold text-foreground">Timeline Filter</label>`
  - **File**: `src/app/components/energy/EnergyTableFilters.tsx` line 147

**Expected Behavior**:
- Label removed completely
- Timeline section remains, but without text label
- Visual hierarchy maintained through spacing

**Code Changes**:

**File**: `src/app/components/energy/EnergyTableFilters.tsx`

**Current** (lines 145-154):
```typescript
{/* Timeline Filter Section */}
<div className="flex flex-col gap-4">
  <label className="text-sm font-semibold text-foreground">Timeline Filter</label>

  {/* Preset Buttons */}
  <TimelinePresets
    activePresetId={activePresetId}
    onPresetClick={handlePresetClick}
  />

  {/* Range Slider with Histogram */}
  <RangeSlider
    data={energyData}
    dateRange={dateRange}
    onDateRangeChange={handleSliderChange}
    minDate={minDate}
    maxDate={maxDate}
  />
</div>
```

**Change to**:
```typescript
{/* Timeline Section */}
<div className="flex flex-col gap-4">
  {/* Preset Buttons */}
  <TimelinePresets
    activePresetId={activePresetId}
    onPresetClick={handlePresetClick}
  />

  {/* Range Slider with Histogram */}
  <RangeSlider
    data={energyData}
    dateRange={dateRange}
    onDateRangeChange={handleSliderChange}
    minDate={minDate}
    maxDate={maxDate}
  />
</div>
```

**Acceptance Criteria**:
- ✅ "Timeline Filter" label removed
- ✅ Timeline section spacing unchanged (gap-4 maintained)
- ✅ Visual hierarchy clear without label
- ✅ No layout shift

---

### FR-V3.1-005: Remove Active Filter Count Badge
**Priority**: 🟡 **HIGH**
**Status**: Visual Refinement
**Complexity**: 🟢 **LOW**

**Current Behavior**:
- `FilterReset` component displays badge with active filter count
  - **File**: `src/app/components/energy/FilterReset.tsx` lines 94-120
  - Badge shows "(1)" or "(2)" when filters active

**Expected Behavior**:
- Badge removed completely
- Reset button shows only icon + "Reset Filters" text
- Button disabled state when no filters active (existing behavior preserved)

**Code Changes**:

**File**: `src/app/components/energy/FilterReset.tsx`

**Current** (lines 94-120):
```typescript
{/* Active filter count badge */}
{activeFilterCount > 0 && (
  <div
    className="
      inline-flex
      items-center
      justify-center
      min-w-[24px]
      h-6
      px-2
      rounded-full
      bg-primary
      text-primary-foreground
      text-xs
      font-bold
      animate-in
      fade-in
      zoom-in
      duration-150
    "
    aria-label={`${activeFilterCount} active ${
      activeFilterCount === 1 ? 'filter' : 'filters'
    }`}
  >
    {activeFilterCount}
  </div>
)}
```

**Change to**:
```typescript
{/* Badge removed - no longer needed */}
```

**Also Update Container** (line 43):
```typescript
// Current
<div className={`filter-reset flex items-center gap-3 ${className}`}>

// Change to (remove gap-3 since no badge)
<div className={`filter-reset ${className}`}>
```

**Props Update** (FilterResetProps):
- `activeFilterCount` prop still needed for disabled state logic (line 40)
- Badge display removed, but count still used for disabling button

**Acceptance Criteria**:
- ✅ Badge removed (no number shown)
- ✅ Reset button still disabled when no filters active
- ✅ Reset button functionality unchanged
- ✅ Button label remains clear ("Reset Filters")
- ✅ No layout shift

---

### FR-V3.1-006: Move FilterReset to Presets Row, Distinct Styling
**Priority**: 🟡 **HIGH**
**Status**: Layout Refinement
**Complexity**: 🟡 **MEDIUM**

**Current Behavior**:
- FilterReset button in separate row below type filter
  - **File**: `src/app/components/energy/EnergyTableFilters.tsx` lines 171-174
  ```typescript
  {/* Reset Section */}
  <div className="flex justify-end">
    <FilterReset activeFilterCount={activeFilterCount} onReset={handleReset} />
  </div>
  ```

**Expected Behavior**:
- FilterReset button moved to **same row as TimelinePresets**
- Reset button **visually distinct** from preset buttons:
  - Different style (secondary/muted vs primary)
  - Positioned at end of row (after preset buttons)
  - Clear separation (larger gap or separator)

**Layout Structure**:

**Before** (Current):
```
┌─────────────────────────────────────┐
│ Timeline Filter                      │ ← Remove (FR-V3.1-004)
│ [7d] [30d] [90d] [Month] [Year]     │ ← Presets
│                                      │
│ [Slider with histogram]             │
├─────────────────────────────────────┤
│ Energy Type                          │
│ [✓ Power] [✓ Gas]                   │
├─────────────────────────────────────┤
│                   [Reset Filters]    │ ← Isolated row
└─────────────────────────────────────┘
```

**After** (New):
```
┌─────────────────────────────────────┐
│ [7d] [30d] [90d] [Month] [Year] │ [Reset] │ ← Presets + Reset
│                                      │
│ [Slider with histogram]             │
├─────────────────────────────────────┤
│ Energy Type                          │
│ [✓ Power] [✓ Gas]                   │
└─────────────────────────────────────┘
```

**Code Changes**:

**File**: `src/app/components/energy/EnergyTableFilters.tsx`

**Current** (lines 145-174):
```typescript
{/* Timeline Filter Section */}
<div className="flex flex-col gap-4">
  <label className="text-sm font-semibold text-foreground">Timeline Filter</label>

  {/* Preset Buttons */}
  <TimelinePresets
    activePresetId={activePresetId}
    onPresetClick={handlePresetClick}
  />

  {/* Range Slider with Histogram */}
  <RangeSlider ... />
</div>

{/* Type Filter Section */}
<div className="flex flex-col gap-3">
  <label className="text-sm font-semibold text-foreground">Energy Type</label>
  <TypeFilter selectedTypes={selectedTypes} onSelectionChange={onTypesChange} />
</div>

{/* Reset Section */}
<div className="flex justify-end">
  <FilterReset activeFilterCount={activeFilterCount} onReset={handleReset} />
</div>
```

**Change to**:
```typescript
{/* Timeline Section */}
<div className="flex flex-col gap-4">
  {/* Preset Buttons + Reset Button Row */}
  <div className="flex flex-wrap items-center gap-3">
    {/* Presets */}
    <div className="flex flex-wrap gap-3 flex-1">
      <TimelinePresets
        activePresetId={activePresetId}
        onPresetClick={handlePresetClick}
      />
    </div>

    {/* Visual separator (optional) */}
    <div className="hidden sm:block w-px h-8 bg-border" />

    {/* Reset button (visually distinct) */}
    <FilterReset
      activeFilterCount={activeFilterCount}
      onReset={handleReset}
      className="ml-auto sm:ml-0"
    />
  </div>

  {/* Range Slider with Histogram */}
  <RangeSlider ... />
</div>

{/* Type Filter Section */}
<div className="flex flex-col gap-3">
  <label className="text-sm font-semibold text-foreground">Energy Type</label>
  <TypeFilter selectedTypes={selectedTypes} onSelectionChange={onTypesChange} />
</div>
```

**FilterReset Styling Update** (Visually Distinct):

**File**: `src/app/components/energy/FilterReset.tsx`

**Current** (lines 64-65):
```typescript
bg-secondary
text-secondary-foreground
```

**Options for "Visually Distinct"**:

**Option A: Muted/Ghost Style** (Recommended):
```typescript
bg-transparent
border-2
border-muted
text-foreground-muted
hover:bg-background-hover
hover:border-border
hover:text-foreground
```

**Option B: Outline Style with Accent Color**:
```typescript
bg-transparent
border-2
border-destructive-muted
text-destructive
hover:bg-destructive-subtle
hover:border-destructive
```

**Option C: Current Secondary (No change, already distinct)**:
```typescript
bg-secondary
text-secondary-foreground
hover:bg-secondary-hover
```

**Recommendation**: **Option A** - Muted/ghost style clearly differentiates reset from active presets

**Mobile Behavior**:
- **Mobile** (<640px): Reset button below presets (full-width or right-aligned)
- **Desktop** (≥640px): Reset button inline with presets, separated

**Responsive Classes**:
```typescript
// Presets container
<div className="flex flex-wrap gap-3 flex-1 w-full sm:w-auto">

// Separator (desktop only)
<div className="hidden sm:block w-px h-8 bg-border" />

// Reset button
<FilterReset
  className="w-full sm:w-auto mt-2 sm:mt-0"
  ...
/>
```

**Acceptance Criteria**:
- ✅ Reset button in same row as presets (desktop)
- ✅ Reset button visually distinct from presets (different style)
- ✅ Clear separation between presets and reset (gap or separator)
- ✅ Mobile: Reset button below presets or right-aligned
- ✅ Desktop: Reset button inline at end of row
- ✅ No layout shift or overflow
- ✅ Hover states work correctly

---

### FR-V3.1-007: Fix DateRangeDisplay Label Overflow
**Priority**: 🟡 **HIGH**
**Status**: Layout Bug
**Complexity**: 🟡 **MEDIUM**

**Current Behavior**:
- Date labels positioned using absolute positioning with `transform: translateX(-50%)`
  - **File**: `src/app/components/energy/RangeSlider/DateRangeDisplay.tsx` lines 82-106
- Labels overflow at edges when handle is near start/end of track
  - **Example**: Start handle at position 0 → label overflows left edge
  - **Example**: End handle at max position → label overflows right edge

**Expected Behavior**:
- Labels never overflow container bounds
- Labels adjust position dynamically:
  - **Near left edge**: Align left (no center transform)
  - **Near right edge**: Align right (no center transform)
  - **Center**: Center-aligned (existing behavior)

**Implementation Strategy**:

**File**: `src/app/components/energy/RangeSlider/DateRangeDisplay.tsx`

**Add Edge Detection Logic**:
```typescript
// Add to DateRangeDisplay component
const LABEL_PADDING = 10; // Padding from container edge
const LABEL_ESTIMATED_WIDTH = format === 'full' ? 120 : 40; // Estimate based on format

// Calculate if label is near edge
const isStartNearLeftEdge = useMemo(() => {
  return startPosition < LABEL_ESTIMATED_WIDTH / 2 + LABEL_PADDING;
}, [startPosition, format]);

const isEndNearRightEdge = useMemo(() => {
  // Requires containerWidth prop (need to pass from parent)
  return endPosition > containerWidth - LABEL_ESTIMATED_WIDTH / 2 - LABEL_PADDING;
}, [endPosition, containerWidth, format]);

// Adjust label alignment based on edge proximity
const startLabelStyle = useMemo(() => {
  const baseStyle = {
    fontSize,
    marginTop,
  };

  if (isStartNearLeftEdge) {
    // Align left
    return {
      ...baseStyle,
      left: `${LABEL_PADDING}px`,
      transform: 'none',
      textAlign: 'left' as const,
    };
  } else {
    // Center align (default)
    return {
      ...baseStyle,
      left: `${startPosition}px`,
      transform: 'translateX(-50%)',
      textAlign: 'center' as const,
    };
  }
}, [startPosition, isStartNearLeftEdge, fontSize, marginTop]);

const endLabelStyle = useMemo(() => {
  const baseStyle = {
    fontSize,
    marginTop,
  };

  if (isEndNearRightEdge) {
    // Align right
    return {
      ...baseStyle,
      right: `${LABEL_PADDING}px`,
      left: 'auto',
      transform: 'none',
      textAlign: 'right' as const,
    };
  } else {
    // Center align (default)
    return {
      ...baseStyle,
      left: `${endPosition}px`,
      transform: 'translateX(-50%)',
      textAlign: 'center' as const,
    };
  }
}, [endPosition, isEndNearRightEdge, fontSize, marginTop]);
```

**Props Update** (DateRangeDisplayProps):
```typescript
// Add containerWidth prop
export interface DateRangeDisplayProps {
  startDate: Date;
  endDate: Date;
  startPosition: number;
  endPosition: number;
  format: DateFormat;
  containerWidth: number; // NEW: Required for edge detection
  className?: string;
}
```

**Parent Component Update** (RangeSlider.tsx):
```typescript
// Pass containerWidth to DateRangeDisplay (line 293-300)
<DateRangeDisplay
  startDate={dateRange.start}
  endDate={dateRange.end}
  startPosition={startPosition}
  endPosition={endPosition}
  format={dateFormat}
  containerWidth={containerWidth} // NEW: Pass width
/>
```

**Alternative (Simpler) - CSS Overflow Prevention**:
```typescript
// Wrap DateRangeDisplay in container with overflow hidden
<div className="relative overflow-hidden">
  <DateRangeDisplay ... />
</div>
```

**Pros**: Simpler implementation
**Cons**: Labels get cut off instead of repositioned (less elegant)

**Recommendation**: **Full implementation with edge detection** (more robust UX)

**Acceptance Criteria**:
- ✅ Start label never overflows left edge
- ✅ End label never overflows right edge
- ✅ Labels center-aligned when not near edges
- ✅ Labels left-aligned when near left edge
- ✅ Labels right-aligned when near right edge
- ✅ Smooth transition between alignment modes (optional animation)
- ✅ Works on mobile (short format) and desktop (full format)
- ✅ No layout shift

---

## Non-Functional Requirements (V3.1)

### NFR-V3.1-1: No Regression in Existing Functionality
**Priority**: 🔴 **CRITICAL**

**Requirements**:
- ✅ All V3 features remain functional after refinements
- ✅ Preset buttons still work (animate slider handles)
- ✅ Type filter checkboxes still work (multi-select)
- ✅ Histogram visualization unchanged
- ✅ Keyboard navigation unchanged
- ✅ Accessibility (ARIA attributes) unchanged
- ✅ Mobile responsiveness preserved
- ✅ All existing tests still pass

---

### NFR-V3.1-2: Performance - No Degradation
**Priority**: 🔴 **CRITICAL**

**Requirements**:
- ✅ Slider drag performance: 60fps maintained (after bug fix)
- ✅ Date label edge detection: < 5ms overhead
- ✅ Component re-renders minimized (memoization preserved)
- ✅ No memory leaks from new event listeners (drag fix)

---

### NFR-V3.1-3: Visual Consistency
**Priority**: 🟡 **MEDIUM**

**Requirements**:
- ✅ Inactive buttons consistently muted across all filter types
- ✅ Reset button styling distinct but cohesive with overall design
- ✅ Border thickness consistent across components (1-2px max)
- ✅ Spacing and gaps consistent (Tailwind scale: gap-2, gap-3, gap-4)
- ✅ Color palette consistent (use existing CSS variables)

---

## Testing Strategy (V3.1)

### Test Categories

#### 1. Bug Fix Verification (Critical)
**Slider Drag Fix (FR-V3.1-001)**:
- ✅ Manual test: Drag start handle left/right (mouse)
- ✅ Manual test: Drag end handle left/right (mouse)
- ✅ Manual test: Touch drag on mobile (iOS Safari, Android Chrome)
- ✅ Manual test: Handles constrained to track bounds
- ✅ Manual test: Handles cannot cross each other
- ✅ Automated test: Mock mouse drag events
- ✅ Automated test: Verify state updates during drag
- ✅ Performance test: Drag at 60fps (no lag)

#### 2. Visual Refinement Verification
**TypeFilter Inactive Buttons (FR-V3.1-002)**:
- ✅ Visual test: Inactive buttons muted (screenshot comparison)
- ✅ Visual test: Active buttons colorful (unchanged)
- ✅ Visual test: Hover states correct
- ✅ Automated test: Class names correct for each state

**Double Border Fix (FR-V3.1-003)**:
- ✅ Visual test: Single thin border only (screenshot)
- ✅ Manual inspection: Check computed styles in browser DevTools

**Label Removal (FR-V3.1-004)**:
- ✅ Visual test: "Timeline Filter" label removed (screenshot)
- ✅ Automated test: Label element not in DOM

**Badge Removal (FR-V3.1-005)**:
- ✅ Visual test: No badge displayed (screenshot)
- ✅ Automated test: Badge element not in DOM

**Reset Button Relocation (FR-V3.1-006)**:
- ✅ Visual test: Reset button in presets row (desktop)
- ✅ Visual test: Reset button below presets (mobile)
- ✅ Visual test: Reset button visually distinct
- ✅ Manual test: Reset button click works
- ✅ Responsive test: Layout correct at all breakpoints

**Date Label Overflow Fix (FR-V3.1-007)**:
- ✅ Manual test: Drag start handle to left edge (label stays in bounds)
- ✅ Manual test: Drag end handle to right edge (label stays in bounds)
- ✅ Visual test: Labels adjust alignment dynamically
- ✅ Automated test: Edge detection logic correct

#### 3. Regression Testing
**Existing Functionality**:
- ✅ Preset buttons work (animate handles)
- ✅ Type filter checkboxes work (multi-select)
- ✅ Histogram updates when type filter changes
- ✅ Keyboard navigation works (Tab, Arrow keys)
- ✅ Accessibility attributes correct (ARIA)
- ✅ Mobile touch interactions work
- ✅ All V3 tests still pass (70-100 tests)

---

## Implementation Checklist

### Phase 1: Critical Bug Fix (Priority 1)
**Estimated Time**: 2-3 hours

- [ ] **FR-V3.1-001**: Fix slider drag interaction
  - [ ] Investigate root cause (likely missing global event listeners)
  - [ ] Add `useEffect` for `mousemove`/`mouseup` listeners when dragging
  - [ ] Add `touchmove`/`touchend` listeners for mobile
  - [ ] Test drag on desktop (mouse)
  - [ ] Test drag on mobile (touch)
  - [ ] Verify handles constrained and cannot cross
  - [ ] Verify 60fps performance during drag

### Phase 2: Visual Refinements (Priority 2)
**Estimated Time**: 1-2 hours

- [ ] **FR-V3.1-002**: TypeFilter inactive button styling
  - [ ] Update Tailwind classes for inactive state
  - [ ] Test visual appearance (muted)
  - [ ] Test hover states
  - [ ] Screenshot before/after comparison

- [ ] **FR-V3.1-003**: Remove double border
  - [ ] Investigate `solid-container` CSS
  - [ ] Remove thick inner border
  - [ ] Test visual appearance
  - [ ] Screenshot before/after comparison

- [ ] **FR-V3.1-004**: Remove "Timeline Filter" label
  - [ ] Delete label element from EnergyTableFilters
  - [ ] Verify spacing unchanged
  - [ ] Screenshot before/after comparison

- [ ] **FR-V3.1-005**: Remove active filter count badge
  - [ ] Delete badge JSX from FilterReset
  - [ ] Update container classes (remove gap-3)
  - [ ] Verify button still disables when no filters
  - [ ] Screenshot before/after comparison

### Phase 3: Layout Adjustments (Priority 3)
**Estimated Time**: 1-2 hours

- [ ] **FR-V3.1-006**: Move FilterReset to presets row
  - [ ] Restructure layout (presets + reset in same row)
  - [ ] Update FilterReset styling (ghost/muted style)
  - [ ] Add visual separator (optional)
  - [ ] Test desktop layout (inline)
  - [ ] Test mobile layout (below or right-aligned)
  - [ ] Screenshot before/after comparison

- [ ] **FR-V3.1-007**: Fix date label overflow
  - [ ] Add containerWidth prop to DateRangeDisplay
  - [ ] Implement edge detection logic
  - [ ] Adjust label alignment based on edge proximity
  - [ ] Test labels at left edge (start handle)
  - [ ] Test labels at right edge (end handle)
  - [ ] Test labels in center (default)
  - [ ] Screenshot edge cases

### Phase 4: Testing & QA
**Estimated Time**: 1-2 hours

- [ ] Run all automated tests (ensure no regressions)
- [ ] Manual testing on desktop (Chrome, Safari, Firefox)
- [ ] Manual testing on mobile (iOS Safari, Android Chrome)
- [ ] Visual regression testing (screenshot comparisons)
- [ ] Accessibility audit (axe-core)
- [ ] Performance testing (drag at 60fps)
- [ ] Fix any issues found

### Phase 5: Documentation & Commit
**Estimated Time**: 0.5 hour

- [ ] Update CHANGELOG.md
- [ ] Update CLAUDE.md (if new patterns introduced)
- [ ] Commit with detailed message
- [ ] Co-authored-by: Claude

---

## Success Metrics

### Critical Bug Fix
- ✅ **Slider drag works**: User can drag handles smoothly (60fps)
- ✅ **No console errors**: Event listeners attach/detach correctly
- ✅ **Mobile works**: Touch drag functional on iOS and Android

### Visual Refinements
- ✅ **User satisfaction**: User approves visual changes (less bright, cleaner)
- ✅ **Consistency**: All inactive elements have muted appearance
- ✅ **Clarity**: Reset button clearly distinct from presets
- ✅ **No overflow**: Date labels stay within container bounds

### Regression Testing
- ✅ **All tests pass**: 70-100 existing tests still pass
- ✅ **No functionality lost**: All V3 features still work
- ✅ **Performance maintained**: 60fps drag, < 100ms aggregation

---

## Open Questions

### Q1: FilterReset Button Styling - Which Option?
**Options**:
- **A**: Muted/ghost style (transparent bg, muted border/text)
- **B**: Outline with accent color (destructive red/orange border)
- **C**: Keep secondary style (current gray background)

**Recommendation**: **Option A** - Clearly distinct from primary-styled presets

**Decision**: TBD (user preference)

---

### Q2: Visual Separator Between Presets and Reset?
**Options**:
- **A**: No separator (rely on gap spacing)
- **B**: Vertical line separator (1px gray line)
- **C**: Larger gap (gap-6 instead of gap-3)

**Recommendation**: **Option B** - Clear visual separation without excessive spacing

**Decision**: TBD (design preference)

---

### Q3: Date Label Overflow - Full Implementation or Simple CSS?
**Options**:
- **A**: Full edge detection + dynamic alignment (more robust)
- **B**: Simple `overflow: hidden` on container (simpler, labels get cut off)

**Recommendation**: **Option A** - Better UX, labels never hidden

**Decision**: **Option A** (recommended for better UX)

---

## Conclusion

**Status**: ✅ **REQUIREMENTS DEFINED - V3.1 REFINEMENTS**

This document specifies **7 refinements** to the V3 implementation:

**Critical** (Must Fix):
1. ✅ **Slider drag bug** (FR-V3.1-001) - CRITICAL

**High Priority** (Should Fix):
2. ✅ **TypeFilter inactive buttons muted** (FR-V3.1-002)
3. ✅ **Remove double border** (FR-V3.1-003)
4. ✅ **Remove "Timeline Filter" label** (FR-V3.1-004)
5. ✅ **Remove filter count badge** (FR-V3.1-005)
6. ✅ **Move reset to presets row** (FR-V3.1-006)
7. ✅ **Fix date label overflow** (FR-V3.1-007)

**Estimated Effort**: 4-8 hours (0.5-1 day)

**Next Steps**:
1. Review requirements with user (confirm open questions)
2. Begin Phase 1: Fix critical slider drag bug
3. Continue with visual refinements (Phase 2-3)
4. Thorough testing (Phase 4)
5. Commit and document (Phase 5)

---

**Document Status**: ✅ **READY FOR IMPLEMENTATION**

**Approval Required**: User confirmation on:
- ✅ FilterReset button styling (Q1)
- ✅ Visual separator (Q2)
- ✅ Date label overflow implementation approach (Q3)

---

## Appendices

### A. Component File Changes Summary

| File | Changes | Lines Changed | Complexity |
|------|---------|---------------|------------|
| `RangeSlider.tsx` | Add global drag event listeners | ~30-50 | 🔴 High |
| `TypeFilter.tsx` | Update inactive button classes | ~5 | 🟢 Low |
| `EnergyTableFilters.tsx` | Remove label, restructure layout | ~20-30 | 🟡 Medium |
| `FilterReset.tsx` | Remove badge, update styling | ~30-40 | 🟡 Medium |
| `DateRangeDisplay.tsx` | Add edge detection + dynamic alignment | ~50-70 | 🟡 Medium |
| `solid-container` CSS | Remove thick border (TBD) | ~1-5 | 🟢 Low |

**Total Estimated LOC**: ~135-200 lines (net change)

---

### B. Testing Checklist (Detailed)

#### Critical Bug Fix Tests
- [ ] Desktop mouse drag: Start handle
- [ ] Desktop mouse drag: End handle
- [ ] Desktop mouse drag: Handles constrained to track
- [ ] Desktop mouse drag: Handles cannot cross
- [ ] Mobile touch drag: Start handle (iOS Safari)
- [ ] Mobile touch drag: End handle (iOS Safari)
- [ ] Mobile touch drag: Start handle (Android Chrome)
- [ ] Mobile touch drag: End handle (Android Chrome)
- [ ] Performance: 60fps during drag (Chrome DevTools)
- [ ] No page scroll during mobile drag

#### Visual Refinement Tests
- [ ] TypeFilter: Inactive buttons muted (screenshot)
- [ ] TypeFilter: Active buttons colorful (screenshot)
- [ ] TypeFilter: Hover states correct (manual)
- [ ] Double border: Fixed (screenshot + DevTools inspection)
- [ ] Timeline label: Removed (visual check)
- [ ] Filter badge: Removed (visual check)
- [ ] Reset button: In presets row desktop (screenshot)
- [ ] Reset button: Below/right mobile (screenshot)
- [ ] Reset button: Visually distinct (screenshot)
- [ ] Date labels: No overflow at left edge (manual drag)
- [ ] Date labels: No overflow at right edge (manual drag)

#### Regression Tests
- [ ] Preset buttons work (all presets)
- [ ] Type filter checkboxes work (power, gas, both)
- [ ] Histogram updates on type filter change
- [ ] Keyboard navigation (Tab, Arrow keys)
- [ ] ARIA attributes correct (axe-core)
- [ ] All unit tests pass (Jest)
- [ ] All integration tests pass

---

### C. Diff Preview (Example - TypeFilter)

**File**: `src/app/components/energy/TypeFilter.tsx`

```diff
  className={`
    ...
    ${
      isChecked
        ? 'bg-primary-subtle border-primary text-primary font-semibold shadow-sm ring-3 ring-primary-subtle'
-       : 'bg-transparent border-border text-foreground hover:bg-background-hover hover:border-border-hover'
+       : 'bg-transparent border-muted text-foreground-muted hover:bg-background-hover hover:border-border hover:text-foreground'
    }
    ...
  `}
```

---

**END OF REQUIREMENTS SPECIFICATION V3.1**
