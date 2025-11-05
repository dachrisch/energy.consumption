# Requirements Specification: Filter Redesign V2 - Timeline & Multi-Select

## Document Information
- **Feature Type**: UI Enhancement - Significant Redesign
- **Component**: `EnergyTableFilters` (`/src/app/components/energy/EnergyTableFilters.tsx`)
- **Related Page**: `/src/app/readings/page.tsx`
- **Status**: Requirements Defined - V2 Redesign
- **Date**: 2025-11-04
- **Version**: 2.0 (Major Redesign)
- **Previous Version**: V1 (Date Picker + Radio Buttons) - See `requirements.md`

---

## Executive Summary

This is a **major redesign** of the filter component based on user feedback that the current design is not satisfactory. The redesign addresses three key user pain points:

1. **Date selection is too manual** - Replace date picker with quick-select timeline presets
2. **Type filter is too restrictive** - Allow multi-select (Power + Gas simultaneously)
3. **Reset button styling inconsistency** - Update to proper design system button style

**Key Changes**:
- ❌ **REMOVE**: Date range picker (react-datepicker)
- ✅ **ADD**: Timeline preset buttons (Last 7 days, Last 30 days, etc.)
- ❌ **REMOVE**: "All" option in type filter
- ❌ **CHANGE**: Radio buttons → Checkboxes for type filter
- ❌ **CHANGE**: Reset button from `button-outline` → `button-secondary` or `button-ghost`

**Impact Level**: 🔴 **HIGH** - Major UI/UX changes, component refactor required

---

## Problem Statement

### User Feedback

The user explicitly stated: **"I'm not happy with the current design"**

**Identified Pain Points**:

1. **Date Picker Too Manual**
   - Current: Users must manually select start and end dates
   - Problem: Most users want common date ranges ("last 30 days", "this month")
   - Impact: Extra clicks and cognitive load for common use cases

2. **Type Filter Too Restrictive**
   - Current: Radio buttons (single select) with "All" option
   - Problem: Cannot select both Power and Gas simultaneously (only one or all)
   - Impact: Users cannot view subset combinations (e.g., compare Power + Gas excluding other types if they existed)

3. **Reset Button Style Inconsistency**
   - Current: Uses `button-outline button-sm`
   - Problem: User wants proper design system button style
   - Impact: Visual inconsistency, unclear which style is "correct"

### User Requirements (Explicit)

From the user's request:

> **Timeline filter instead of date picker**
> - Replace the date picker with preset date range buttons
> - Examples: "Last 7 days", "Last 30 days", "This month", "This year", "All time", etc.
> - Should be quick-select buttons rather than manual date entry

> **Multi-select type filter (remove "All" option)**
> - Remove the "All" option
> - Allow selecting multiple types simultaneously (Power + Gas)
> - Change from radio buttons to checkboxes for multi-select behavior
> - When nothing is selected, show all data (implicit "all")

> **Reset button styling**
> - Current: Uses `button-outline button-sm`
> - Required: Should follow the proper UI frontend button styles
> - Available styles: `button-primary`, `button-secondary`, `button-ghost`, `button-destructive`
> - Likely should use `button-secondary` or `button-ghost` for a reset action

---

## Current Application State

**Existing Implementation** (as of V1):
- **File**: `/src/app/components/energy/EnergyTableFilters.tsx` (93 lines)
- **Dependencies**: `react-datepicker`, `ButtonGroupRadio`
- **Type Filter**: Radio buttons (All/Power/Gas)
- **Date Filter**: react-datepicker with range selection
- **Reset Button**: `button-outline button-sm`
- **Active Filter Badge**: Shows count (0-2)
- **Test Coverage**: 27 tests, 100% coverage

**Current Mobile Experience**:
- Responsive grid: `grid-cols-1 sm:grid-cols-[auto_1fr_auto]`
- Date picker: `min-w-[200px] sm:min-w-[250px]`
- Touch targets: 44x44px minimum (via padding)
- Always visible (no collapse)

**Current Desktop Experience**:
- Three-column layout (type | date | reset)
- Grid alignment with `items-end`
- Date picker calendar dropdown

---

## Platform Requirements

### Mobile (Primary)
**Target Platforms**: iOS and Android
**Minimum Requirements**:
- iOS: 13+
- Android: 8.0+
- Screen sizes: 320px - 428px width

**Mobile-Specific Considerations**:
- ✅ **Timeline buttons**: Must be scrollable horizontally if needed (prevent wrap on small screens)
- ✅ **Touch targets**: All buttons must be minimum 44x44px
- ✅ **Checkbox targets**: Larger tap area than visual checkbox (48x48px minimum)
- ✅ **Button spacing**: Adequate gaps between timeline buttons (8px minimum)
- ✅ **Scrollable container**: Timeline buttons in horizontal scroll container if overflow
- ⚠️ **No date picker keyboard**: Eliminates mobile keyboard issues (removed date picker)
- ✅ **Thumb-friendly**: Reset button should be easily reachable

### Desktop (Secondary)
**Minimum Requirements**:
- Browser support: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- Screen sizes: 1024px+ width

**Desktop-Specific Considerations**:
- ✅ **Timeline buttons**: Display in multi-row flex wrap layout
- ✅ **Hover states**: Timeline and checkbox buttons should have hover feedback
- ✅ **Keyboard navigation**: Tab through timeline buttons, space to select checkboxes
- ✅ **Mouse interactions**: Hover states for all interactive elements

### Responsive Design
**Breakpoints**:
- Mobile: 320px - 767px (primary)
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Responsive Behavior**:
- **Mobile**: Timeline buttons in horizontal scrollable container, checkboxes stack vertically, reset below
- **Tablet**: Timeline buttons wrap to 2-3 rows, checkboxes horizontal, reset inline
- **Desktop**: Timeline buttons wrap to multiple rows, all elements in grid layout

---

## User Stories

### Primary User Story (Updated)
**As a** household energy consumer tracking my energy usage
**I want** quick-select timeline filters and flexible type selection
**So that** I can rapidly filter my data without manual date entry and view specific energy type combinations

### New User Stories (V2)

#### US-V2-1: Quick Timeline Selection
**As a** user reviewing recent energy consumption
**I want** to click "Last 30 days" button
**So that** I instantly see the last 30 days of data without calendar navigation

**Acceptance Criteria**:
- Timeline presets: "Last 7 days", "Last 30 days", "Last 90 days", "This month", "This year", "All time"
- Single click selects preset
- Active preset visually highlighted
- Date range automatically calculated
- Works on mobile (touch) and desktop (click)

#### US-V2-2: Multi-Select Energy Types
**As a** user comparing power and gas consumption
**I want** to select both "Power" and "Gas" checkboxes
**So that** I see only those two types of readings in the table

**Acceptance Criteria**:
- Checkboxes for each energy type (Power, Gas)
- Can select 0, 1, or multiple types
- When 0 selected, show all data (implicit "all")
- When 1+ selected, show only selected types
- Visual feedback for checked state
- Works with keyboard (space to toggle)

#### US-V2-3: Combined Timeline + Type Filtering
**As a** user analyzing specific period and type
**I want** to select "Last 30 days" and check only "Power"
**So that** I see only power readings from the last 30 days

**Acceptance Criteria**:
- Timeline and type filters work together (AND logic)
- Badge shows combined active filter count (up to 2)
- Reset clears both filters

#### US-V2-4: Clear Reset Action
**As a** user who has applied multiple filters
**I want** a clearly styled reset button
**So that** I can quickly remove all filters with confidence

**Acceptance Criteria**:
- Reset button uses `button-secondary` or `button-ghost` style (not outline)
- Button shows icon + "Reset" text
- Single click clears all filters (timeline + type selections)
- Badge disappears when filters reset

---

## Functional Requirements

### FR-V2-1: Timeline Preset Buttons (NEW)
**Priority**: 🔴 **HIGH** - Core feature change
**Status**: Not Implemented

**Description**:
Replace the date range picker with preset timeline buttons for quick date range selection.

**Timeline Presets** (in order):
1. **"Last 7 days"** - Today minus 6 days to today (inclusive)
2. **"Last 30 days"** - Today minus 29 days to today (inclusive)
3. **"Last 90 days"** - Today minus 89 days to today (inclusive)
4. **"This month"** - First day of current month to today
5. **"This year"** - January 1 of current year to today
6. **"All time"** - No date filter (show all readings)

**Date Calculation Logic**:
```typescript
// Example for "Last 30 days"
const end = new Date(); // Today
const start = new Date();
start.setDate(end.getDate() - 29); // 30 days including today

// Example for "This month"
const end = new Date(); // Today
const start = new Date(end.getFullYear(), end.getMonth(), 1); // 1st of month

// Example for "All time"
const start = null; // No start date
const end = null; // No end date
```

**Button Behavior**:
- Single select (like radio buttons)
- Active preset highlighted with `bg-primary text-primary-foreground`
- Inactive presets: `bg-transparent text-foreground border-2 border-border`
- Click toggles preset (clicking active preset deactivates it → "All time")
- On mobile: Buttons in horizontal scrollable container
- On desktop: Buttons wrap to multiple rows in flex container

**Acceptance Criteria**:
- ✅ Six timeline preset buttons render
- ✅ Clicking a preset calculates and sets date range
- ✅ Active preset visually highlighted
- ✅ Clicking active preset deselects it (→ All time)
- ✅ Only one preset active at a time
- ✅ Date calculations correct (inclusive of end date)
- ✅ Mobile: Horizontal scroll container for buttons
- ✅ Desktop: Flex wrap layout for buttons
- ✅ Touch targets minimum 44x44px
- ✅ Keyboard accessible (Tab + Enter/Space)

**Data Structure**:
```typescript
interface TimelinePreset {
  id: string;
  label: string;
  calculateRange: () => { start: Date | null; end: Date | null };
}

// Active preset state
const [activeTimeline, setActiveTimeline] = useState<string | null>(null);
```

**Parent Component Integration**:
- Parent component still receives `dateRange: { start: Date | null; end: Date | null }`
- Filter component handles timeline → date range conversion internally
- Parent doesn't need to know about timeline logic

---

### FR-V2-2: Multi-Select Type Filter (CHANGED)
**Priority**: 🔴 **HIGH** - Major behavior change
**Status**: Requires Refactor

**Description**:
Replace single-select radio buttons with multi-select checkboxes. Remove "All" option.

**Previous Behavior** (V1):
- Radio buttons: "All" | "Power" | "Gas"
- Single select only
- "All" shows all data

**New Behavior** (V2):
- Checkboxes: "Power" | "Gas"
- Multi-select: Can select 0, 1, or 2
- No "All" option
- **When 0 selected → Show all data (implicit "all")**
- When 1+ selected → Show only selected types

**State Change**:
```typescript
// V1: Single value
typeFilter: EnergyOptions | "all"

// V2: Array of selected types
selectedTypes: EnergyOptions[] // [] | ["power"] | ["gas"] | ["power", "gas"]
```

**Filter Logic**:
```typescript
// Empty array = show all (implicit "all")
if (selectedTypes.length === 0) {
  filteredData = allData;
}
// One or more selected = show only selected
else {
  filteredData = allData.filter(item => selectedTypes.includes(item.type));
}
```

**UI Layout**:
```
Type
[✓] Power [icon]
[✓] Gas [icon]
```

**Checkbox Styling**:
- **Unchecked**: `border-2 border-border bg-transparent text-foreground`
- **Checked**: `bg-primary text-primary-foreground border-primary`
- **Icon**: PowerIcon or GasIcon next to label
- **Size**: Minimum 44x44px touch target (visual can be smaller)
- **Spacing**: 8px gap between checkboxes

**Acceptance Criteria**:
- ✅ Two checkboxes render: Power, Gas
- ✅ No "All" option present
- ✅ Can select 0, 1, or 2 checkboxes
- ✅ When 0 selected, table shows all data
- ✅ When 1+ selected, table shows only selected types
- ✅ Visual feedback for checked/unchecked state
- ✅ Icons display next to labels
- ✅ Touch targets minimum 44x44px
- ✅ Keyboard accessible (Tab + Space to toggle)
- ✅ Accessible checkbox inputs (not just visual)

**Component Change**:
- ❌ **REMOVE**: `ButtonGroupRadio` component usage
- ✅ **ADD**: New multi-select checkbox component or custom implementation
- Consider creating `ButtonGroupCheckbox` component (similar API to `ButtonGroupRadio`)

---

### FR-V2-3: Active Filter Badge (UPDATED)
**Priority**: 🟡 **MEDIUM** - Logic update required
**Status**: Requires Update

**Description**:
Update badge calculation logic to reflect new filter behavior.

**Previous Calculation** (V1):
```typescript
const activeFilterCount = [
  typeFilter !== "all" ? 1 : 0,        // Type filter active
  dateRange.start || dateRange.end ? 1 : 0  // Date range active
].reduce((sum, val) => sum + val, 0);
```

**New Calculation** (V2):
```typescript
const activeFilterCount = [
  selectedTypes.length > 0 ? 1 : 0,     // Type filter active (if any selected)
  activeTimeline !== null ? 1 : 0        // Timeline filter active (if preset selected, excluding "All time")
].reduce((sum, val) => sum + val, 0);

// Alternative: Count "All time" as active filter
const activeFilterCount = [
  selectedTypes.length > 0 ? 1 : 0,     // Type filter active
  activeTimeline !== null && activeTimeline !== "all-time" ? 1 : 0  // Timeline active (not "All time")
].reduce((sum, val) => sum + val, 0);
```

**Decision Needed**: Should "All time" count as an active filter?
- **Option A**: No - "All time" is default, doesn't count (recommended)
- **Option B**: Yes - "All time" is explicit selection, counts as active filter

**Recommended**: **Option A** - "All time" is equivalent to no filter

**Acceptance Criteria**:
- ✅ Badge shows correct count (0-2)
- ✅ Type filter with 0 selections = not counted
- ✅ Type filter with 1+ selections = counted as 1 (not number of types)
- ✅ Timeline preset active (except "All time") = counted as 1
- ✅ Badge hidden when count = 0
- ✅ Badge visible when count > 0
- ✅ Maximum count = 2

---

### FR-V2-4: Reset Button Styling (UPDATED)
**Priority**: 🟡 **MEDIUM** - Visual change
**Status**: Simple Update

**Description**:
Update reset button to use proper design system style per user requirement.

**Previous Style** (V1):
```tsx
<button className="button-outline button-sm">
  <ResetIcon />
  <span>Reset</span>
</button>
```

**New Style** (V2):
```tsx
<button className="button-secondary button-sm">
  <ResetIcon />
  <span>Reset</span>
</button>

// OR

<button className="button-ghost button-sm">
  <ResetIcon />
  <span>Reset</span>
</button>
```

**Style Comparison**:

| Style | Background | Border | Use Case | Recommendation |
|-------|-----------|--------|----------|----------------|
| `button-outline` | Transparent | Border | Secondary actions | ❌ Current (user wants to change) |
| `button-secondary` | `var(--secondary)` | None | Secondary actions | ✅ **Recommended for Reset** |
| `button-ghost` | Transparent | None | Tertiary actions | ⚠️ Alternative (less prominent) |

**Recommendation**: **`button-secondary`**
- Reset is a secondary action (not primary, not destructive)
- More prominent than ghost (easier to find)
- Consistent with design system pattern for secondary actions

**Acceptance Criteria**:
- ✅ Reset button uses `button-secondary button-sm` classes
- ✅ Button shows icon + text (no change)
- ✅ Hover states work correctly
- ✅ Reset functionality unchanged (clears all filters)
- ✅ Button visually distinct from timeline/checkbox buttons

---

### FR-V2-5: Reset Functionality (UPDATED)
**Priority**: 🟡 **MEDIUM** - Logic update required
**Status**: Requires Update

**Description**:
Update reset logic to clear new filter states.

**Previous Reset** (V1):
```typescript
const handleResetFilters = () => {
  setTypeFilter("all");
  setDateRange({ start: null, end: null });
};
```

**New Reset** (V2):
```typescript
const handleResetFilters = () => {
  setSelectedTypes([]);           // Clear all type selections
  setActiveTimeline(null);        // Clear timeline preset
  // Optionally: setActiveTimeline("all-time"); if "All time" is explicit
};
```

**Component Behavior**:
- Clicking reset unchecks all type checkboxes
- Clicking reset deselects active timeline preset
- Badge count returns to 0
- Table shows all data

**Acceptance Criteria**:
- ✅ Reset button clears `selectedTypes` to `[]`
- ✅ Reset button clears `activeTimeline` to `null`
- ✅ All checkboxes become unchecked
- ✅ All timeline buttons become inactive
- ✅ Badge disappears (count = 0)
- ✅ Table shows all unfiltered data
- ✅ Single click performs full reset

---

### FR-V2-6: Responsive Grid Layout (UPDATED)
**Priority**: 🟢 **LOW** - Minor layout adjustment
**Status**: Requires Update

**Description**:
Update grid layout to accommodate new filter structure.

**Previous Layout** (V1):
```
Mobile (1 column):
┌─────────────────┐
│ Type            │
│ [All|Power|Gas] │
├─────────────────┤
│ Date Range      │
│ [Date Picker]   │
├─────────────────┤
│ [Reset] (1)     │
└─────────────────┘

Desktop (3 columns):
┌────────────┬─────────────────┬─────────┐
│ Type       │ Date Range      │ Reset   │
│ [A|P|G]    │ [Date Picker]   │ [Reset] │
└────────────┴─────────────────┴─────────┘
```

**New Layout** (V2):
```
Mobile (1 column):
┌─────────────────────────────┐
│ Timeline                    │
│ [←─ 7d|30d|90d|M|Y|All ─→] │ ← Horizontal scroll
├─────────────────────────────┤
│ Type                        │
│ [✓] Power                   │
│ [✓] Gas                     │
├─────────────────────────────┤
│ [Reset] (1)                 │
└─────────────────────────────┘

Desktop (Grid):
┌──────────────────────────────────────────┐
│ Timeline                                 │
│ [7d] [30d] [90d] [Month] [Year] [All]  │ ← Flex wrap
├──────────────────────────────────────────┤
│ Type: [✓] Power  [✓] Gas  │  [Reset] (1)│
└──────────────────────────────────────────┘
```

**Grid Structure**:
```tsx
<div className="solid-container">
  <div className="flex flex-col gap-4">
    {/* Timeline Section */}
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-foreground">Timeline</label>
      <div className="overflow-x-auto sm:overflow-visible">
        <div className="flex gap-2 sm:flex-wrap pb-2 sm:pb-0">
          {/* Timeline buttons */}
        </div>
      </div>
    </div>

    {/* Type + Reset Section */}
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      {/* Type Section */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Type</label>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Checkboxes */}
        </div>
      </div>

      {/* Reset Section */}
      <div className="flex items-center gap-2">
        {/* Reset button + badge */}
      </div>
    </div>
  </div>
</div>
```

**Acceptance Criteria**:
- ✅ Mobile: Timeline buttons in horizontal scroll container
- ✅ Mobile: Type checkboxes stack vertically
- ✅ Mobile: Reset button below type filters
- ✅ Desktop: Timeline buttons wrap in flex container
- ✅ Desktop: Type and reset in same row
- ✅ Timeline has clear label "Timeline"
- ✅ Type has clear label "Type"
- ✅ Adequate spacing between sections (gap-4)

---

## Non-Functional Requirements

### NFR-V2-1: Performance (UPDATED)
**Priority**: 🟡 **MEDIUM**

**Requirements**:
- Component render time: < 50ms (unchanged)
- Timeline date calculations: < 10ms per preset
- Filter application: < 100ms for 10,000 records

**Verification**:
- Use React DevTools Profiler
- Test with large datasets (1000+ readings)
- No noticeable lag when clicking presets

**Optimizations**:
- Memoize timeline date calculations
- Use `useMemo` for filter logic
- Avoid unnecessary re-renders

---

### NFR-V2-2: Accessibility (UPDATED)
**Priority**: 🔴 **HIGH** - WCAG 2.1 AA compliance

**Requirements**:

1. **Keyboard Navigation**:
   - ✅ Tab through all timeline buttons
   - ✅ Tab to checkboxes (Tab + Space to toggle)
   - ✅ Tab to reset button
   - ✅ Enter or Space activates buttons/checkboxes

2. **Screen Reader Support**:
   - ✅ Timeline buttons have accessible labels
   - ✅ Checkboxes are semantic `<input type="checkbox">` (not just visual)
   - ✅ Active filter count announced to screen readers
   - ✅ Reset button has `aria-label="Reset all filters"`

3. **Visual Accessibility**:
   - ✅ Focus states visible on all interactive elements
   - ✅ Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI components)
   - ✅ Checkbox state visually distinct (not just color - use checkmark icon)
   - ✅ Timeline active state visually distinct

4. **Touch Accessibility**:
   - ✅ All buttons/checkboxes minimum 44x44px touch target
   - ✅ Adequate spacing between interactive elements (8px minimum)

**ARIA Attributes**:
```tsx
// Timeline buttons
<button
  role="button"
  aria-pressed={isActive}
  aria-label={`Filter by ${preset.label}`}
>
  {preset.label}
</button>

// Checkboxes
<label>
  <input
    type="checkbox"
    checked={isChecked}
    aria-label={`Filter by ${type}`}
  />
  {label}
</label>

// Reset button
<button
  aria-label="Reset all filters"
  title="Reset all filters"
>
  Reset
</button>
```

---

### NFR-V2-3: Mobile Responsiveness (UPDATED)
**Priority**: 🔴 **HIGH** - Mobile-first design

**Mobile-Specific Requirements**:

1. **Timeline Buttons**:
   - ✅ Horizontal scroll container: `overflow-x-auto`
   - ✅ Buttons don't wrap on small screens
   - ✅ Scroll snap points for better UX: `scroll-snap-type: x mandatory`
   - ✅ Visible scroll indicator (fade effect on edges)
   - ✅ Touch drag scrolling enabled

2. **Checkboxes**:
   - ✅ Stack vertically on mobile: `flex-col`
   - ✅ Full-width touch targets
   - ✅ Adequate spacing: `gap-2` (8px)

3. **Reset Button**:
   - ✅ Full-width or centered on mobile
   - ✅ Easy thumb reach (bottom of filter section)

**Responsive Breakpoints**:
```css
/* Mobile: 320px - 767px */
.timeline-container {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}

/* Tablet: 768px - 1023px */
@media (min-width: 768px) {
  .timeline-container {
    overflow-x: visible;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  /* Full flex wrap layout */
}
```

---

### NFR-V2-4: Browser Compatibility (UNCHANGED)
**Priority**: 🟡 **MEDIUM**

**Requirements**:
- Chrome 90+ ✅
- Safari 14+ ✅
- Firefox 88+ ✅
- Edge 90+ ✅

**Polyfills/Fallbacks**:
- CSS `scroll-snap`: Graceful degradation (still works without snap)
- Flexbox: Fully supported in target browsers
- CSS Grid: Fully supported in target browsers

---

### NFR-V2-5: Maintainability (UPDATED)
**Priority**: 🟡 **MEDIUM**

**Code Quality**:
- ✅ TypeScript strict mode
- ✅ Single Responsibility Principle (SRP)
- ✅ Timeline presets in separate config/constants file
- ✅ Reusable checkbox component (DRY)
- ✅ Comprehensive test coverage (100% goal)
- ✅ Clear prop interfaces

**Timeline Preset Configuration** (Extensible):
```typescript
// src/app/constants/timelinePresets.ts
export const TIMELINE_PRESETS: TimelinePreset[] = [
  {
    id: "last-7-days",
    label: "Last 7 days",
    calculateRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      return { start, end };
    },
  },
  // ... more presets
];
```

**Future Extensibility**:
- Easy to add new timeline presets (just add to config)
- Easy to add new energy types (just add checkbox)
- Component doesn't know about parent's filter logic (loose coupling)

---

## Design Requirements

### Visual Design Specifications (V2)

#### Container (Unchanged)
```tsx
<div className="solid-container">
  {/* Filters */}
</div>
```

#### Timeline Section (NEW)
**Label**:
```tsx
<label className="text-sm font-medium text-foreground">Timeline</label>
```

**Button Container** (Mobile):
```tsx
<div className="overflow-x-auto sm:overflow-visible">
  <div className="flex gap-2 sm:flex-wrap pb-2 sm:pb-0">
    {/* Buttons */}
  </div>
</div>
```

**Timeline Button** (Inactive):
```tsx
<button className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-transparent text-foreground border-2 border-border hover:border-primary/50 hover:bg-primary/5">
  Last 7 days
</button>
```

**Timeline Button** (Active):
```tsx
<button className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-primary text-primary-foreground shadow-md">
  Last 7 days
</button>
```

**Styling Notes**:
- `flex-shrink-0`: Prevents buttons from shrinking in scroll container
- `px-4 py-2`: Ensures 44x44px minimum touch target
- `rounded-lg`: Consistent with design system
- `gap-2`: 8px spacing between buttons

#### Type Section (UPDATED)
**Label**:
```tsx
<label className="text-sm font-medium text-foreground">Type</label>
```

**Checkbox Container**:
```tsx
<div className="flex flex-col sm:flex-row gap-2">
  {/* Checkboxes */}
</div>
```

**Checkbox Button** (Unchecked):
```tsx
<label className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer bg-transparent text-foreground border-2 border-border hover:border-primary/50 hover:bg-primary/5">
  <input type="checkbox" className="hidden" />
  <span className="w-5 h-5 border-2 border-current rounded flex items-center justify-center">
    {/* Empty */}
  </span>
  <PowerIcon />
  Power
</label>
```

**Checkbox Button** (Checked):
```tsx
<label className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer bg-primary text-primary-foreground shadow-md">
  <input type="checkbox" checked className="hidden" />
  <span className="w-5 h-5 border-2 border-current rounded flex items-center justify-center">
    <CheckIcon /> {/* ✓ icon */}
  </span>
  <PowerIcon />
  Power
</label>
```

**Alternative: Native Checkbox Style**:
```tsx
<label className="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" className="w-5 h-5 rounded border-border" />
  <PowerIcon />
  <span>Power</span>
</label>
```

**Recommendation**: Use custom styled checkbox with button-like appearance to match timeline buttons visually.

#### Reset Button (UPDATED)
```tsx
<button
  className="button-secondary button-sm"
  aria-label="Reset all filters"
  title="Reset all filters"
>
  <ResetIcon />
  <span className="ml-1">Reset</span>
</button>
```

**Change**: `button-outline` → `button-secondary`

#### Active Filter Badge (Unchanged)
```tsx
{activeFilterCount > 0 && (
  <span className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs">
    {activeFilterCount}
  </span>
)}
```

---

## Technical Considerations

### Architecture Changes (V2)

**Component State Changes**:
```typescript
// V1 State
interface EnergyTableFiltersProps {
  typeFilter: EnergyOptions | "all";
  setTypeFilter: (type: EnergyOptions | "all") => void;
  dateRange: { start: Date | null; end: Date | null };
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;
  onReset: () => void;
}

// V2 State (Internal - Option A: Keep parent API same)
interface EnergyTableFiltersProps {
  typeFilter: EnergyOptions | "all";          // Keep for backward compat
  setTypeFilter: (type: EnergyOptions | "all") => void;  // Keep for backward compat
  dateRange: { start: Date | null; end: Date | null };  // Keep
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;  // Keep
  onReset: () => void;
}

// V2 State (Option B: Update parent API - RECOMMENDED)
interface EnergyTableFiltersProps {
  selectedTypes: EnergyOptions[];              // Array instead of single value
  setSelectedTypes: (types: EnergyOptions[]) => void;
  dateRange: { start: Date | null; end: Date | null };  // Unchanged
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;  // Unchanged
  onReset: () => void;
}

// Internal state (timeline)
const [activeTimeline, setActiveTimeline] = useState<string | null>(null);
```

**Recommendation**: **Option B** - Update parent API to reflect new behavior
- More honest API (multi-select capability exposed)
- Parent knows exactly what's selected
- Simpler filter logic in parent

**Parent Component Updates Required**:
```typescript
// src/app/readings/page.tsx - BEFORE (V1)
const [typeFilter, setTypeFilter] = useState<EnergyOptions | "all">("all");

// src/app/readings/page.tsx - AFTER (V2)
const [selectedTypes, setSelectedTypes] = useState<EnergyOptions[]>([]);

// Filter logic - BEFORE (V1)
const filteredByType = typeFilter === "all"
  ? energyData
  : energyData.filter(item => item.type === typeFilter);

// Filter logic - AFTER (V2)
const filteredByType = selectedTypes.length === 0
  ? energyData
  : energyData.filter(item => selectedTypes.includes(item.type));
```

### Dependencies

**Removed**:
- ❌ `react-datepicker` - No longer needed (timeline presets replace date picker)
- ❌ `react-datepicker/dist/react-datepicker.css` - CSS import removed

**Added**:
- ✅ Timeline preset configuration (new file: `src/app/constants/timelinePresets.ts`)
- ✅ CheckIcon component (for checked state) - or use FontAwesome

**Existing (Unchanged)**:
- ✅ Custom icons: `PowerIcon`, `GasIcon`, `ResetIcon`
- ✅ Tailwind CSS + custom button styles

### Code Organization

**New Files**:
```
src/app/constants/
└── timelinePresets.ts          # NEW: Timeline preset definitions

src/app/components/shared/
└── ButtonGroupCheckbox.tsx     # NEW (Optional): Reusable checkbox group

src/app/components/energy/
├── EnergyTableFilters.tsx      # REFACTOR: Major changes
└── __tests__/
    └── EnergyTableFilters.test.tsx  # UPDATE: All tests need rewrite
```

**Updated Files**:
```
src/app/readings/page.tsx       # UPDATE: Parent state management
src/app/types.ts                # UPDATE: Add TimelinePreset type
```

---

## Data Models & Types

### New Types (V2)

```typescript
// src/app/types.ts

/**
 * Timeline preset definition
 */
export interface TimelinePreset {
  id: string;  // e.g., "last-7-days"
  label: string;  // e.g., "Last 7 days"
  calculateRange: () => { start: Date | null; end: Date | null };
}

/**
 * Filter state for parent component (V2)
 */
export interface FilterState {
  selectedTypes: EnergyOptions[];  // Multi-select
  dateRange: { start: Date | null; end: Date | null };  // Unchanged
}
```

### Timeline Preset Configuration

```typescript
// src/app/constants/timelinePresets.ts

import { TimelinePreset } from "@/app/types";

export const TIMELINE_PRESETS: TimelinePreset[] = [
  {
    id: "last-7-days",
    label: "Last 7 days",
    calculateRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 6);
      return { start, end };
    },
  },
  {
    id: "last-30-days",
    label: "Last 30 days",
    calculateRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 29);
      return { start, end };
    },
  },
  {
    id: "last-90-days",
    label: "Last 90 days",
    calculateRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 89);
      return { start, end };
    },
  },
  {
    id: "this-month",
    label: "This month",
    calculateRange: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth(), 1);
      return { start, end };
    },
  },
  {
    id: "this-year",
    label: "This year",
    calculateRange: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), 0, 1);
      return { start, end };
    },
  },
  {
    id: "all-time",
    label: "All time",
    calculateRange: () => {
      return { start: null, end: null };
    },
  },
];
```

---

## Edge Cases & Error Handling

### Edge Case 1: No Types Selected
**Scenario**: User unchecks all type checkboxes

**Behavior**:
- Show all data (implicit "all")
- Badge count: 0 (no type filter active)
- Table displays all readings

**Acceptance**:
- ✅ No error or empty state
- ✅ Clear to user that all data is shown
- ✅ Consistent with "All" behavior from V1

---

### Edge Case 2: Timeline Calculation Edge Cases
**Scenario**: Timeline presets near month/year boundaries

**Examples**:
- Today is January 1st → "This month" shows only 1 day
- Today is January 5th → "Last 7 days" spans December 30 - January 5

**Behavior**:
- Calculations always correct (inclusive of end date)
- Handle month/year boundaries correctly
- Use Date arithmetic (not string manipulation)

**Test Cases**:
- ✅ Test timeline calculations on January 1
- ✅ Test timeline calculations on December 31
- ✅ Test "Last 30 days" across month boundary
- ✅ Test "This year" on January 1

---

### Edge Case 3: Timeline + Type Filter Combination
**Scenario**: User selects timeline preset and no types

**Behavior**:
- Timeline filter applies (date range)
- Type filter shows all (0 selected = all)
- Result: All readings within date range

**Acceptance**:
- ✅ Filters combine with AND logic
- ✅ Empty type selection doesn't block timeline filter

---

### Edge Case 4: Reset with No Active Filters
**Scenario**: User clicks reset when no filters active

**Behavior**:
- Reset button still clickable (not disabled)
- No visual change (already in default state)
- No error

**Acceptance**:
- ✅ Reset always enabled (consistent UX)
- ✅ No unintended side effects

---

### Edge Case 5: Mobile Scroll State Preservation
**Scenario**: User scrolls timeline buttons, then interacts with other filters

**Behavior**:
- Scroll position preserved when clicking checkbox
- Scroll position preserved when clicking reset

**Acceptance**:
- ✅ No unwanted scroll resets
- ✅ Smooth UX on mobile

---

### Edge Case 6: Rapid Timeline Button Clicks
**Scenario**: User rapidly clicks multiple timeline buttons

**Behavior**:
- Only last click takes effect
- No race conditions or stale state
- Date range updates correctly

**Acceptance**:
- ✅ No flickering or incorrect states
- ✅ Debounce not needed (state updates are fast)

---

## Testing Strategy

### Test Categories (V2)

1. **Timeline Preset Tests** (NEW)
   - Render all timeline buttons
   - Click timeline button sets date range
   - Active timeline button highlighted
   - Only one timeline active at a time
   - Date calculations correct for each preset
   - Clicking active timeline deselects it

2. **Multi-Select Type Filter Tests** (NEW)
   - Render type checkboxes (no "All")
   - Toggle checkboxes individually
   - Multiple checkboxes can be checked
   - 0 selected = show all data
   - 1+ selected = show only selected types
   - Visual feedback for checked state

3. **Active Filter Badge Tests** (UPDATED)
   - Badge hidden when no filters active
   - Badge shows count 1 when only timeline active
   - Badge shows count 1 when only types active
   - Badge shows count 2 when both active
   - Badge count correct with multiple types selected (still counts as 1)

4. **Reset Functionality Tests** (UPDATED)
   - Reset clears all checkboxes
   - Reset clears active timeline
   - Reset sets badge to 0
   - Reset button uses `button-secondary` style

5. **Accessibility Tests** (UPDATED)
   - Timeline buttons keyboard accessible
   - Checkboxes are semantic `<input type="checkbox">`
   - Focus states visible
   - ARIA labels correct

6. **Responsive Tests** (UPDATED)
   - Mobile: Timeline buttons in horizontal scroll
   - Mobile: Checkboxes stack vertically
   - Desktop: Timeline buttons wrap
   - Desktop: Type and reset in same row

7. **Edge Case Tests** (NEW)
   - Timeline calculations correct on boundaries
   - 0 types selected shows all data
   - Timeline + empty type filter works
   - Reset with no filters doesn't error

**Total Expected Tests**: ~35-40 tests (increased from 27)

**Coverage Target**: 100% of component logic

See separate document: `test-scenarios-v2.md` for detailed test cases.

---

## Acceptance Criteria Summary

### Timeline Filter ✅ Definition Complete
- ✅ Six timeline preset buttons render
- ✅ Buttons calculate correct date ranges
- ✅ Active preset visually highlighted
- ✅ Only one preset active at a time
- ✅ Mobile: Horizontal scroll container
- ✅ Desktop: Flex wrap layout
- ✅ Touch targets minimum 44x44px
- ✅ Keyboard accessible

### Multi-Select Type Filter ✅ Definition Complete
- ✅ Two checkboxes render (Power, Gas)
- ✅ No "All" option
- ✅ Multiple checkboxes can be selected
- ✅ 0 selected = show all data
- ✅ Visual feedback for checked state
- ✅ Touch targets minimum 44x44px
- ✅ Keyboard accessible

### Reset Button ✅ Definition Complete
- ✅ Uses `button-secondary button-sm`
- ✅ Shows icon + "Reset" text
- ✅ Clears all filters (timeline + types)
- ✅ Badge disappears after reset

### Integration ✅ Definition Complete
- ✅ Timeline and type filters work together
- ✅ Badge shows correct combined count
- ✅ Parent component receives correct state
- ✅ Table updates correctly with filters

---

## Dependencies and Constraints

### Breaking Changes
🔴 **HIGH IMPACT** - This is a major redesign with breaking changes:

1. **Parent Component API Change**:
   - `typeFilter: EnergyOptions | "all"` → `selectedTypes: EnergyOptions[]`
   - Requires updates to parent component (`readings/page.tsx`)

2. **Removed Dependency**:
   - `react-datepicker` removed (if not used elsewhere, can uninstall)

3. **Test Suite**:
   - All existing tests need rewrite
   - Test suite doubled in size (~40 tests)

### Migration Path

**Step 1**: Update types in `src/app/types.ts`
**Step 2**: Create timeline presets config
**Step 3**: Refactor `EnergyTableFilters` component
**Step 4**: Update parent component (`readings/page.tsx`)
**Step 5**: Rewrite all tests
**Step 6**: Manual QA on mobile and desktop
**Step 7**: Remove `react-datepicker` dependency if unused elsewhere

### Timeline

**Estimated Effort**:
- Component refactor: 4-6 hours
- Parent component update: 1-2 hours
- Test rewrite: 4-6 hours
- QA and bug fixes: 2-3 hours
- **Total**: 11-17 hours (1.5 - 2 days for experienced developer)

---

## Out of Scope

### NOT Included in V2 ❌

1. **Custom Date Range Entry**
   - User explicitly wants to remove date picker
   - Custom dates via date picker not supported
   - Timeline presets only

2. **Saved Filter Presets**
   - User-defined custom timeline presets
   - Saved filter combinations
   - Filter history

3. **Filter Persistence**
   - LocalStorage filter state
   - URL query parameters
   - Session-based filter memory

4. **Advanced Filter Logic**
   - OR logic (currently AND only)
   - Filter groups
   - Nested filters

5. **Filter Animations**
   - Animated transitions between filters
   - Slide-in effects for timeline
   - Badge count animation

6. **Internationalization**
   - Localized timeline labels
   - Localized date formats

7. **Backend Changes**
   - Server-side filtering (remains client-side)
   - API modifications
   - Database query optimization

---

## Open Questions

### Q1: Should "All time" count as an active filter?
**Options**:
- **A**: No - "All time" is default, badge shouldn't show for it (recommended)
- **B**: Yes - "All time" is explicit selection, should count

**Recommendation**: **Option A** - "All time" = no filter

**Decision Required**: Confirm with user/stakeholder

---

### Q2: Should users be able to toggle off all timeline presets?
**Options**:
- **A**: Yes - Clicking active preset deactivates it → "All time" (recommended)
- **B**: No - One preset always active (like radio buttons)

**Recommendation**: **Option A** - Allow deactivation for flexibility

**Decision Required**: Confirm with user/stakeholder

---

### Q3: Should checkboxes look like buttons or native checkboxes?
**Options**:
- **A**: Button-styled (matches timeline buttons visually) (recommended)
- **B**: Native checkboxes (more semantic, less custom styling)

**Recommendation**: **Option A** - Button-styled for visual consistency

**Decision Required**: Confirm with designer/user

---

### Q4: Timeline scroll container - snap behavior?
**Options**:
- **A**: Add CSS scroll-snap for smooth scrolling (recommended)
- **B**: Standard scroll without snap

**Recommendation**: **Option A** - Better mobile UX with snap

**Decision Required**: Technical decision (low priority)

---

### Q5: Should filters auto-apply or have "Apply" button?
**Current Behavior**: Auto-apply (immediate filter effect)

**Options**:
- **A**: Keep auto-apply (immediate) (recommended)
- **B**: Add "Apply Filters" button (explicit action)

**Recommendation**: **Option A** - Keep auto-apply for faster UX

**Decision Required**: Confirm current behavior is acceptable

---

## Risks and Mitigation

### Risk 1: Breaking Changes Impact Other Components
**Risk Level**: 🟡 **MEDIUM**

**Description**: Changing parent API (`typeFilter` → `selectedTypes`) may break other components that share filter state.

**Mitigation**:
- ✅ Search codebase for `typeFilter` usage
- ✅ Update all dependent components
- ✅ Run full test suite before merging
- ✅ Consider creating adapter function for backward compatibility during transition

**Search Required**:
```bash
grep -r "typeFilter" src/
```

---

### Risk 2: Timeline Calculations Incorrect
**Risk Level**: 🟡 **MEDIUM**

**Description**: Date calculations for timeline presets may be incorrect, especially near boundaries.

**Mitigation**:
- ✅ Comprehensive unit tests for all timeline presets
- ✅ Test on boundary dates (Jan 1, Dec 31, month ends)
- ✅ Use proven date arithmetic (native Date methods)
- ✅ Avoid string manipulation for dates

---

### Risk 3: Mobile Scroll Performance
**Risk Level**: 🟢 **LOW**

**Description**: Horizontal scroll container may not perform well on older mobile devices.

**Mitigation**:
- ✅ Use CSS `overflow-x: auto` (hardware accelerated)
- ✅ Avoid JavaScript scroll listeners
- ✅ Test on real devices (not just browser emulation)
- ✅ Fallback: Buttons wrap on very small screens

---

### Risk 4: Checkbox Accessibility
**Risk Level**: 🟡 **MEDIUM**

**Description**: Custom-styled checkboxes may not be accessible if not implemented correctly.

**Mitigation**:
- ✅ Use semantic `<input type="checkbox">` (hidden but present)
- ✅ Ensure keyboard navigation works (Tab + Space)
- ✅ Screen reader testing with NVDA/VoiceOver
- ✅ Follow WAI-ARIA checkbox pattern

---

### Risk 5: Test Coverage Gaps
**Risk Level**: 🟡 **MEDIUM**

**Description**: Rewriting all tests may introduce coverage gaps.

**Mitigation**:
- ✅ Use existing test structure as template
- ✅ Run coverage report: `npm test -- --coverage`
- ✅ Target 100% coverage before merging
- ✅ Peer review of test suite

---

## Success Metrics

### Qualitative Metrics
- ✅ **User Satisfaction**: User explicitly accepts new design (addresses pain points)
- ✅ **Visual Consistency**: Timeline and checkboxes match design system
- ✅ **Ease of Use**: Filters faster to apply than V1 (fewer clicks)
- ✅ **Accessibility**: WCAG 2.1 AA compliance verified

### Quantitative Metrics
- ✅ **Performance**: Component render < 50ms
- ✅ **Test Coverage**: 100% of component logic
- ✅ **Touch Targets**: 100% meet 44x44px minimum
- ✅ **Click Reduction**: Average 2-3 fewer clicks to apply common filters (vs date picker)

### Verification Checklist
- ✅ All requirements implemented
- ✅ All tests passing (35-40 tests)
- ✅ Manual QA on mobile and desktop
- ✅ Accessibility audit passed (axe-core)
- ✅ User/stakeholder approval

---

## Implementation Notes

### Development Workflow

**Phase 1: Preparation** (1-2 hours)
1. Create `timelinePresets.ts` configuration file
2. Add types to `types.ts`
3. Search and document all `typeFilter` usage in codebase
4. Create implementation plan

**Phase 2: Component Refactor** (4-6 hours)
1. Remove `react-datepicker` import
2. Implement timeline preset UI
3. Replace `ButtonGroupRadio` with checkbox implementation
4. Update active filter badge logic
5. Update reset button styling
6. Update responsive layout

**Phase 3: Parent Component Update** (1-2 hours)
1. Update `readings/page.tsx` state management
2. Update filter logic (multi-select)
3. Test integration

**Phase 4: Testing** (4-6 hours)
1. Rewrite all existing tests
2. Add new tests for timeline and multi-select
3. Run coverage report
4. Fix any failing tests

**Phase 5: QA & Polish** (2-3 hours)
1. Manual testing on mobile devices
2. Manual testing on desktop browsers
3. Accessibility testing (keyboard, screen reader)
4. Bug fixes and refinements

**Phase 6: Documentation** (1 hour)
1. Update CLAUDE.md if needed
2. Update user-guide.md
3. Add migration notes to CHANGELOG.md

---

### Code Review Checklist

**Functionality**:
- ✅ Timeline presets calculate correct date ranges
- ✅ Multi-select checkboxes work correctly
- ✅ 0 selections = show all data
- ✅ Reset clears all filters
- ✅ Badge count correct
- ✅ Filters combine correctly (AND logic)

**Code Quality**:
- ✅ TypeScript types correct
- ✅ No hardcoded values (use constants)
- ✅ Single Responsibility Principle followed
- ✅ No unnecessary re-renders
- ✅ Memoization where appropriate

**Accessibility**:
- ✅ Keyboard navigation works
- ✅ Semantic HTML (real checkboxes)
- ✅ ARIA labels correct
- ✅ Focus states visible
- ✅ Touch targets adequate

**Mobile**:
- ✅ Timeline scrolls horizontally
- ✅ Checkboxes stack vertically
- ✅ Reset button accessible
- ✅ No horizontal overflow issues

**Testing**:
- ✅ All tests passing
- ✅ Coverage 100%
- ✅ Edge cases tested
- ✅ No console warnings

---

## Appendices

### A. Timeline Preset Date Calculation Examples

**Last 7 days** (Today: 2025-01-15):
- Start: 2025-01-09
- End: 2025-01-15
- Inclusive: 7 days total

**Last 30 days** (Today: 2025-01-15):
- Start: 2024-12-17
- End: 2025-01-15
- Inclusive: 30 days total

**This month** (Today: 2025-01-15):
- Start: 2025-01-01
- End: 2025-01-15
- Inclusive: 15 days so far

**This year** (Today: 2025-01-15):
- Start: 2025-01-01
- End: 2025-01-15
- Inclusive: 15 days so far

---

### B. Multi-Select Filter Logic Examples

**Example 1**: No types selected
```typescript
selectedTypes = []
filteredData = allData  // Show all
```

**Example 2**: One type selected
```typescript
selectedTypes = ["power"]
filteredData = allData.filter(item => item.type === "power")
```

**Example 3**: Both types selected
```typescript
selectedTypes = ["power", "gas"]
filteredData = allData.filter(item =>
  item.type === "power" || item.type === "gas"
)
// Equivalent to: allData (since only 2 types exist)
```

---

### C. Component Size Comparison

| Metric | V1 | V2 | Change |
|--------|----|----|--------|
| Lines of code | 93 | ~120 | +30% |
| Dependencies | 2 | 1 | -1 (removed react-datepicker) |
| Test count | 27 | ~40 | +48% |
| User clicks (avg) | 3-5 | 1-2 | -60% (for common filters) |

---

### D. Related Documentation

- **Previous Version**: `requirements.md` (V1)
- **Test Scenarios**: `test-scenarios-v2.md` (to be created)
- **User Guide**: `user-guide.md` (to be updated)
- **Project Guide**: `/CLAUDE.md`

---

### E. Design System References

**Button Classes**:
- `button-primary` - Primary actions (solid background)
- `button-secondary` - Secondary actions (recommended for reset)
- `button-ghost` - Tertiary actions (transparent)
- `button-outline` - Outlined (V1 reset style, being replaced)
- `button-destructive` - Danger actions

**Size Modifiers**:
- `button-sm` - Small buttons (padding: 0.5rem 1rem)
- `button-lg` - Large buttons (padding: 0.875rem 1.75rem)

**Touch Target Guidelines**:
- Minimum: 44x44px (iOS Human Interface Guidelines)
- Recommended: 48x48px (Material Design)
- Spacing: 8px minimum between targets

---

## Revision History

| Version | Date       | Author             | Changes                                           |
|---------|------------|-------------------|---------------------------------------------------|
| 2.0     | 2025-11-04 | Claude (BA)       | Major redesign requirements based on user feedback|
|         |            |                   | - Timeline presets replace date picker           |
|         |            |                   | - Multi-select checkboxes replace radio buttons  |
|         |            |                   | - Reset button styling updated                    |
| 1.0     | 2025-11-04 | Claude (BA)       | Initial requirements (V1) - See requirements.md   |

---

## Conclusion

**Status**: ✅ **REQUIREMENTS DEFINED - V2 MAJOR REDESIGN**

This document specifies a significant redesign of the filter component to address user feedback:

1. ✅ **Timeline Presets**: 6 quick-select buttons replace manual date picker
2. ✅ **Multi-Select Types**: Checkboxes replace radio buttons, no "All" option
3. ✅ **Updated Reset Style**: `button-secondary` replaces `button-outline`

**Impact**:
- 🔴 **Breaking Changes**: Parent component API must be updated
- 🔴 **Test Rewrite**: All 27 tests need rewrite, ~40 new tests needed
- 🟡 **Mobile-First**: Enhanced mobile UX with horizontal scroll timeline
- 🟢 **Reduced Complexity**: Removes `react-datepicker` dependency

**Next Steps**:
1. Review requirements with user/stakeholder
2. Confirm open questions (Q1-Q5)
3. Approve design mockups (if needed)
4. Begin implementation (Phase 1: Preparation)

**Estimated Timeline**: 11-17 hours (1.5 - 2 days development + testing)

---

**Document Status**: ✅ **READY FOR IMPLEMENTATION**

**Approval Required**: User/Stakeholder sign-off on design changes
