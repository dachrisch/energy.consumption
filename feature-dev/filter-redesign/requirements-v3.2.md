# Requirements Specification: Filter Redesign V3.2 - Code Style & UX Refinements

## Document Information
- **Feature Type**: UI Enhancement - CODE STYLE & UX REFINEMENTS TO V3.1
- **Component**: Filter Components, QA Process
- **Related Page**: `/src/app/readings/page.tsx`
- **Status**: Requirements Defined - V3.2 Refinements
- **Date**: 2025-11-04
- **Version**: 3.2 (MINOR - Code Quality & UX Refinements)
- **Previous Version**: V3.1 (Bug Fixes & Visual Refinements) - See `requirements-v3.1.md`
- **Complexity Level**: 🟡 **MEDIUM** - Code style refactoring + targeted UX improvements

---

## Executive Summary

This document specifies refinements to the V3.1 implementation based on **user testing feedback focusing on code quality and UX improvements**. V3.1 has been completed and pushed to PR #199. User has now tested the implementation and identified **7 issues**:

**Issue Breakdown**:
- **1 Critical Architecture Issue**: Excessive inline Tailwind classes (code style/maintainability)
- **5 Visual/UX Refinements**: Button colors, borders, label cleanup
- **1 Responsive Design Issue**: Filters taking up too much screen space on mobile

**Impact**: 🟡 **MEDIUM** - Code style is critical for maintainability, UX refinements improve mobile experience

**Estimated Effort**: 6-10 hours (0.75-1.25 days)

---

## User Feedback (Verbatim)

User testing of V3.1 implementation revealed the following issues:

1. **Solid Container Border**: _"remove border from solid-container"_
   - CSS provided:
   ```css
   .solid-container {
       border-radius: var(--radius-lg);
       border-style: var(--tw-border-style);
       padding: calc(var(--spacing) * 4);
       border-width: 1px;
   }
   ```

2. **Filter Selector Colors**: _"style of filter selector should be NO COLOR when not selected."_

3. **Type Filter Buttons**: _"power and gas buttons without checkbox, also make them no color when deselected and color when selected"_

4. **Code Style - CRITICAL**: _"update qa-agent to also take code style check into account. the excessive use of classes is not acceptable here."_
   - User highlighted problematic code (button with excessive inline classes):
   ```html
   <button type="button" aria-pressed="false" aria-label="Select Last 7 days" class="
                  preset-button
                  flex-shrink-0
                  px-4 py-2
                  rounded-xl
                  border-2
                  text-sm
                  font-medium
                  transition-all
                  duration-150
                  ease-in-out
                  bg-transparent border-border text-foreground hover:bg-background-hover hover:border-border-hover hover:transform hover:-translate-y-0.5
                  cursor-pointer
                  focus-visible:outline-none
                  focus-visible:ring-3
                  focus-visible:ring-primary-subtle
                  focus-visible:ring-offset-2
                " style="scroll-snap-align: start; min-width: max-content;">Last 7 days</button>
   ```
   - User requirement: _"styled should be concentrated in css files"_

5. **Histogram Y-Axis Labels**: _"get rid of y-axis labels. this is not chart just a pictogram"_

6. **Mobile Filter Height**: _"on mobile, filters are taking up the whole screen, because the selectors are not responsive. at most 30% of the screen are allowed"_

7. **Energy Type Label**: _"also remove the label energy type"_

---

## Problem Statement

### Critical Code Style Issue

The current implementation uses **excessive inline Tailwind classes**, making the code:
- ❌ **Hard to maintain**: Changes require editing multiple components
- ❌ **Not DRY**: Same utility combinations repeated across components
- ❌ **Hard to read**: Button definitions span 20+ lines due to inline classes
- ❌ **Inconsistent**: Minor variations in similar button styles

**Example** (TimelinePresets.tsx, lines 65-86):
```typescript
className={`
  preset-button
  flex-shrink-0
  px-4 py-2
  rounded-xl
  border-2
  text-sm
  font-medium
  transition-all
  duration-150
  ease-in-out
  ${
    isActive
      ? 'bg-primary border-primary text-primary-foreground shadow-md transform -translate-y-0.5'
      : 'bg-transparent border-border text-foreground hover:bg-background-hover hover:border-border-hover hover:transform hover:-translate-y-0.5'
  }
  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  focus-visible:outline-none
  focus-visible:ring-3
  focus-visible:ring-primary-subtle
  focus-visible:ring-offset-2
`}
```

**Solution**: Extract button patterns to CSS classes using **BEM-like naming convention**.

### Visual & UX Issues

After V3.1 implementation, user identified:
- ❌ **Solid container border unnecessary**: Border adds visual weight without purpose
- ❌ **Inactive filter buttons too colorful**: Preset and type filter buttons have colors when not selected
- ❌ **Checkbox visual in type filter**: Checkbox UI element is redundant
- ❌ **Histogram y-axis labels**: Labels are misleading (it's a pictogram, not a chart)
- ❌ **"Energy Type" label redundant**: Label is unnecessary
- ❌ **Mobile filters too tall**: Filters occupy entire screen on mobile (should be max 30%)

---

## Categorization: Architecture vs. UX Issues

### Critical Architecture Issues (Priority: 🔴 CRITICAL)
**Must fix for code maintainability and future development**

1. **FR-V3.2-004**: Code style refactor - move inline Tailwind to CSS files
2. **FR-V3.2-008**: QA Agent update - add code style checks

### Visual/UX Refinements (Priority: 🟡 HIGH)
**Should fix - improves aesthetics and consistency**

3. **FR-V3.2-001**: Remove border from `.solid-container` CSS class
4. **FR-V3.2-002**: Preset filter buttons - NO COLOR when not selected
5. **FR-V3.2-003**: Type filter buttons - remove checkbox, NO COLOR when deselected
6. **FR-V3.2-005**: Remove y-axis labels from histogram (pictogram, not chart)
7. **FR-V3.2-007**: Remove "Energy Type" label

### Responsive Design Issues (Priority: 🟡 HIGH)
**Should fix - critical for mobile UX**

8. **FR-V3.2-006**: Mobile responsiveness - filters max 30% of screen height

---

## Functional Requirements (V3.2 Refinements)

### FR-V3.2-001: Remove Border from Solid Container
**Priority**: 🟡 **HIGH**
**Status**: Visual Refinement
**Complexity**: 🟢 **LOW**

**Current Behavior**:
- `.solid-container` has visible border: `@apply border`
  - **File**: `src/app/layout/container.css` line 2
  - Border adds visual weight to filter container

**Expected Behavior**:
- `.solid-container` has NO border
- Rounded corners and padding preserved
- Background color distinguishes container from surroundings

**Code Changes**:

**File**: `src/app/layout/container.css`

**Current** (lines 1-3):
```css
.solid-container {
  @apply border rounded-lg p-4;
}
```

**Change to**:
```css
.solid-container {
  @apply rounded-lg p-4;
}
```

**Summary of Changes**:
- Remove `border` from Tailwind apply directive
- Keep `rounded-lg` (rounded corners)
- Keep `p-4` (padding)

**Acceptance Criteria**:
- ✅ No visible border on filter container
- ✅ Rounded corners preserved (rounded-lg)
- ✅ Padding unchanged (p-4 = 1rem)
- ✅ Container still visually distinct from background
- ✅ No layout shift

**Testing**:
- ✅ Visual test: Screenshot before/after
- ✅ Manual inspection: Chrome DevTools border styles
- ✅ Responsive test: Mobile and desktop views

---

### FR-V3.2-002: Preset Filter Buttons - NO COLOR When Not Selected
**Priority**: 🟡 **HIGH**
**Status**: Visual Refinement
**Complexity**: 🟢 **LOW** (will be addressed in FR-V3.2-004 CSS refactor)

**Current Behavior**:
- **Inactive preset buttons**: Transparent background but have border color (`border-border`)
  - **File**: `TimelinePresets.tsx` line 79
  - Buttons are visually distinct even when not active

**Expected Behavior**:
- **Inactive buttons**: NO COLOR - completely neutral/gray appearance
  - Background: Transparent (`bg-transparent`)
  - Border: Muted gray or very subtle (`border-muted` or `border-transparent`)
  - Text: Muted foreground (`text-foreground-muted`)
  - Hover: Slight background change only (`hover:bg-background-hover`)

- **Active buttons**: COLORFUL (current implementation correct)
  - Background: Primary (`bg-primary`)
  - Border: Primary (`border-primary`)
  - Text: Primary foreground (`text-primary-foreground`)
  - Shadow: Medium (`shadow-md`)

**Visual Comparison**:

**Before** (Current):
```
Inactive: [Last 7 days] ← Gray border visible
Active:   [Last 30 days] ← Primary color
```

**After** (New):
```
Inactive: [Last 7 days] ← No visible border, muted text
Active:   [Last 30 days] ← Primary color (unchanged)
```

**Code Changes** (will be implemented in FR-V3.2-004):

This will be addressed through CSS class refactoring. Final CSS should achieve:

**Inactive State**:
```css
.preset-button {
  /* Base styles */
  background: transparent;
  border: 1px solid transparent; /* or very muted gray */
  color: var(--foreground-muted);
}

.preset-button:hover {
  background: var(--background-hover);
  color: var(--foreground);
}
```

**Active State**:
```css
.preset-button--active {
  background: var(--primary);
  border: 2px solid var(--primary);
  color: var(--primary-foreground);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}
```

**Acceptance Criteria**:
- ✅ Inactive buttons have NO visible color (gray/muted only)
- ✅ Active buttons retain colorful appearance (primary colors)
- ✅ Hover state provides subtle feedback
- ✅ Transition smooth (150ms duration)
- ✅ Mobile and desktop both look correct
- ✅ Consistent with TypeFilter button styling (FR-V3.2-003)

---

### FR-V3.2-003: Type Filter Buttons - Remove Checkbox, NO COLOR When Deselected
**Priority**: 🟡 **HIGH**
**Status**: Visual Refinement
**Complexity**: 🟡 **MEDIUM** (remove checkbox + styling)

**Current Behavior**:
- Type filter buttons have **checkbox visual indicator**
  - **File**: `TypeFilter.tsx` lines 101-132
  - Checkbox shows checked/unchecked state with checkmark icon
- **Inactive buttons**: Have colored subtle background (muted)
  - Line 92: `'bg-transparent border-muted text-foreground-muted ...'`

**Expected Behavior**:
- **Remove checkbox visual entirely** (lines 101-132)
- **Deselected buttons**: NO COLOR - completely neutral appearance
  - Background: Transparent
  - Border: Transparent or very muted
  - Text: Muted foreground
  - Icon: Muted color
- **Selected buttons**: COLORFUL
  - Background: Primary subtle
  - Border: Primary
  - Text: Primary bold
  - Icon: Primary color
  - Ring: Primary subtle

**Code Changes**:

**File**: `src/app/components/energy/TypeFilter.tsx`

**Current JSX** (lines 100-140):
```typescript
<button>
  {/* Checkbox indicator (visual only) */}
  <span className="...checkbox styles...">
    {isChecked && <svg>...</svg>}
  </span>

  {/* Energy type icon */}
  {icon}

  {/* Label */}
  <span>{label}</span>
</button>
```

**Change to**:
```typescript
<button>
  {/* Energy type icon */}
  {icon}

  {/* Label */}
  <span>{label}</span>
</button>
```

**Remove lines 101-132** (entire checkbox span and SVG checkmark).

**Styling Changes** (will be implemented in FR-V3.2-004 CSS refactor):

**Deselected State**:
```css
.type-filter-button {
  /* Base styles */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  min-height: 44px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--foreground-muted);
  transition: all 150ms ease-in-out;
}

.type-filter-button:hover {
  background: var(--background-hover);
  color: var(--foreground);
}
```

**Selected State**:
```css
.type-filter-button--selected {
  background: var(--primary-subtle);
  border: 2px solid var(--primary);
  color: var(--primary);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  outline: 3px solid var(--primary-subtle);
  outline-offset: 0;
}
```

**Acceptance Criteria**:
- ✅ Checkbox visual removed (no span with checkbox, no SVG checkmark)
- ✅ Button shows only icon + label
- ✅ Deselected buttons have NO COLOR (transparent/muted)
- ✅ Selected buttons have PRIMARY COLOR
- ✅ Touch target remains 44px minimum (mobile)
- ✅ Hover states work correctly
- ✅ Multi-select behavior unchanged (can select both Power and Gas)
- ✅ Screen reader announcement unchanged (aria-live region)
- ✅ Consistent with preset button styling (FR-V3.2-002)

**Testing**:
- ✅ Visual test: Screenshot before/after
- ✅ Manual test: Click to select/deselect
- ✅ Manual test: Multi-select (both Power and Gas)
- ✅ Accessibility test: Screen reader announces selection
- ✅ Mobile test: Touch targets 44px minimum

---

### FR-V3.2-004: Code Style Refactor - Move Inline Tailwind to CSS Files (CRITICAL)
**Priority**: 🔴 **CRITICAL**
**Status**: Architecture Refactor
**Complexity**: 🔴 **HIGH** (affects multiple components)

**Current Behavior**:
- Components use **excessive inline Tailwind classes**
- Button definitions span 20+ lines of template literals
- Same utility combinations repeated across components
- Hard to maintain, not DRY, difficult to read

**Example Problems**:

**TimelinePresets.tsx** (lines 65-86):
```typescript
className={`
  preset-button
  flex-shrink-0
  px-4 py-2
  rounded-xl
  border-2
  text-sm
  font-medium
  transition-all
  duration-150
  ease-in-out
  ${isActive ? '...' : '...'}
  ${disabled ? '...' : '...'}
  focus-visible:outline-none
  focus-visible:ring-3
  focus-visible:ring-primary-subtle
  focus-visible:ring-offset-2
`}
```

**TypeFilter.tsx** (lines 73-99):
```typescript
className={`
  flex
  items-center
  justify-center
  gap-2
  px-4
  py-3
  rounded-xl
  border-2
  text-sm
  font-medium
  transition-all
  duration-150
  ease-in-out
  min-h-[44px]
  sm:flex-1
  ${isChecked ? '...' : '...'}
  ${disabled ? '...' : '...'}
  focus-visible:...
`}
```

**Expected Behavior**:
- **Button patterns extracted to CSS classes**
- **BEM-like naming convention**: `.component__element--modifier`
- **Minimal inline classes**: Only for dynamic layout/spacing if necessary
- **CSS files organized by component or pattern**

**CSS Architecture**:

Create new CSS file: `src/app/components/energy/filter-components.css`

**Import in main.css**:
```css
@import "@fortawesome/fontawesome-free/css/all.min.css";
@import "./alert.css";
@import "./bottom-nav.css";
@import "./button.css";
@import "./chart.css";
@import "./container.css";
@import "./dashboard.css";
@import "./form.css";
@import "./globals.css";
@import "./group.css";
@import "./modal.css";
@import "./navigation.css";
@import "./profile-menu.css";
@import "./table.css";
@import "../components/energy/filter-components.css"; /* NEW */
```

**CSS File Structure**:

```css
/* ============================================
   Filter Components - Shared Button Styles
   ============================================ */

/* Base Button Pattern
   - Used by preset buttons and type filter buttons
   - Provides consistent foundation
   ============================================ */
.filter-button-base {
  /* Layout */
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  /* Spacing */
  padding: 0.5rem 1rem; /* py-2 px-4 */
  gap: 0.5rem; /* gap-2 */

  /* Typography */
  font-size: 0.875rem; /* text-sm */
  font-weight: 500; /* font-medium */

  /* Borders & Corners */
  border-radius: 0.75rem; /* rounded-xl */
  border-width: 2px;
  border-style: solid;

  /* Transitions */
  transition-property: all;
  transition-timing-function: ease-in-out;
  transition-duration: 150ms;

  /* Focus Styles */
  outline: none;
}

.filter-button-base:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--primary-subtle);
  outline-offset: 2px;
}

/* Preset Button Styles
   ============================================ */
.preset-button {
  /* Inherits from base */
  @apply filter-button-base;

  /* Inactive State */
  background-color: transparent;
  border-color: transparent;
  color: var(--foreground-muted);
  cursor: pointer;
}

.preset-button:hover:not(:disabled) {
  background-color: var(--background-hover);
  color: var(--foreground);
  transform: translateY(-1px);
}

.preset-button--active {
  background-color: var(--primary);
  border-color: var(--primary);
  color: var(--primary-foreground);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.preset-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile Scroll Behavior */
.preset-button {
  scroll-snap-align: start;
  min-width: max-content;
}

/* Type Filter Button Styles
   ============================================ */
.type-filter-button {
  /* Inherits from base */
  @apply filter-button-base;

  /* Deselected State */
  background-color: transparent;
  border-color: transparent;
  color: var(--foreground-muted);
  cursor: pointer;

  /* Mobile: Full width, Desktop: Flex-1 */
  min-height: 44px;
}

@media (min-width: 640px) {
  .type-filter-button {
    flex: 1;
  }
}

.type-filter-button:hover:not(:disabled) {
  background-color: var(--background-hover);
  border-color: var(--border);
  color: var(--foreground);
}

.type-filter-button--selected {
  background-color: var(--primary-subtle);
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  outline: 3px solid var(--primary-subtle);
  outline-offset: 0;
}

.type-filter-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Reset Button Styles
   (Already defined in button.css, just add variant if needed)
   ============================================ */
.reset-button {
  /* Inherits from existing button styles */
  /* Add any filter-specific reset button styles here */
}
```

**Component Updates**:

**File**: `src/app/components/energy/TimelinePresets.tsx`

**Current** (lines 58-94):
```typescript
<button
  key={preset.id}
  type="button"
  onClick={() => handlePresetClick(preset)}
  disabled={disabled}
  aria-pressed={isActive}
  aria-label={`Select ${preset.label}`}
  className={`
    preset-button
    flex-shrink-0
    px-4 py-2
    rounded-xl
    border-2
    text-sm
    font-medium
    transition-all
    duration-150
    ease-in-out
    ${
      isActive
        ? 'bg-primary border-primary text-primary-foreground shadow-md transform -translate-y-0.5'
        : 'bg-transparent border-border text-foreground hover:bg-background-hover hover:border-border-hover hover:transform hover:-translate-y-0.5'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    focus-visible:outline-none
    focus-visible:ring-3
    focus-visible:ring-primary-subtle
    focus-visible:ring-offset-2
  `}
  style={{
    scrollSnapAlign: 'start',
    minWidth: 'max-content',
  }}
>
  {preset.label}
</button>
```

**Change to**:
```typescript
<button
  key={preset.id}
  type="button"
  onClick={() => handlePresetClick(preset)}
  disabled={disabled}
  aria-pressed={isActive}
  aria-label={`Select ${preset.label}`}
  className={`preset-button ${isActive ? 'preset-button--active' : ''}`}
>
  {preset.label}
</button>
```

**File**: `src/app/components/energy/TypeFilter.tsx`

**Current** (lines 66-100):
```typescript
<button
  key={type}
  type="button"
  onClick={() => handleTypeToggle(type)}
  disabled={disabled}
  aria-pressed={isChecked}
  aria-label={`Filter ${label} readings`}
  className={`
    flex
    items-center
    justify-center
    gap-2
    px-4
    py-3
    rounded-xl
    border-2
    text-sm
    font-medium
    transition-all
    duration-150
    ease-in-out
    min-h-[44px]
    sm:flex-1
    ${
      isChecked
        ? 'bg-primary-subtle border-primary text-primary font-semibold shadow-sm ring-3 ring-primary-subtle'
        : 'bg-transparent border-muted text-foreground-muted hover:bg-background-hover hover:border-border hover:text-foreground'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    focus-visible:outline-none
    focus-visible:ring-3
    focus-visible:ring-primary-subtle
    focus-visible:ring-offset-2
  `}
>
  {/* Checkbox removed (FR-V3.2-003) */}
  {icon}
  <span>{label}</span>
</button>
```

**Change to**:
```typescript
<button
  key={type}
  type="button"
  onClick={() => handleTypeToggle(type)}
  disabled={disabled}
  aria-pressed={isChecked}
  aria-label={`Filter ${label} readings`}
  className={`type-filter-button ${isChecked ? 'type-filter-button--selected' : ''}`}
>
  {icon}
  <span>{label}</span>
</button>
```

**Acceptance Criteria**:
- ✅ New CSS file created: `src/app/components/energy/filter-components.css`
- ✅ CSS imported in `main.css`
- ✅ Preset buttons use `.preset-button` and `.preset-button--active` classes
- ✅ Type filter buttons use `.type-filter-button` and `.type-filter-button--selected` classes
- ✅ Inline Tailwind classes reduced to < 5 utility classes per element (ideally 1-2)
- ✅ BEM-like naming convention used (`.component--modifier`)
- ✅ Visual appearance unchanged (pixel-perfect)
- ✅ All button states work: hover, active, disabled, focus-visible
- ✅ Mobile and desktop styles preserved
- ✅ No regressions in functionality

**Testing**:
- ✅ Visual test: Screenshot before/after (should be identical)
- ✅ Manual test: All button interactions work (click, hover, focus)
- ✅ Responsive test: Mobile and desktop layouts preserved
- ✅ Browser test: Chrome, Safari, Firefox all render correctly
- ✅ Code review: Verify inline classes reduced significantly

**Benefits**:
- ✅ **Maintainability**: Change button styles in one place (CSS file)
- ✅ **Readability**: Component JSX is clean and focused on logic
- ✅ **Consistency**: Shared CSS classes ensure uniform styling
- ✅ **DRY**: No repeated utility combinations
- ✅ **Performance**: Potentially smaller bundle size (CSS > repeated inline classes)

---

### FR-V3.2-005: Remove Y-Axis Labels from Histogram
**Priority**: 🟡 **HIGH**
**Status**: Visual Refinement
**Complexity**: 🟢 **LOW**

**Current Behavior**:
- Histogram displays y-axis grid lines with numeric labels (0, 5, 10, 15...)
  - **File**: `SliderVisualization.tsx` lines 71-97
  - Labels positioned at left edge with `textAnchor="end"`
  - Grid lines extend across chart

**User Feedback**:
- _"get rid of y-axis labels. this is not chart just a pictogram"_
- User wants histogram to be **visual indicator only**, not precise data chart
- Labels add unnecessary complexity for a "pictogram"

**Expected Behavior**:
- **Remove y-axis numeric labels** (lines 85-94)
- **Keep subtle grid lines** (optional - for visual structure)
  - OR remove grid lines entirely (pictogram doesn't need precision)
- Histogram bars remain as visual density indicator

**Code Changes**:

**File**: `src/app/components/energy/RangeSlider/SliderVisualization.tsx`

**Current** (lines 40-97):
```typescript
// Padding for chart (leave space for Y-axis labels and bottom margin)
const paddingLeft = 30;
const paddingRight = 5;
const paddingTop = 10;
const paddingBottom = 10;

const chartWidth = width - paddingLeft - paddingRight;
const chartHeight = height - paddingTop - paddingBottom;

// Y-axis scale
const yScale = maxCount > 0 ? chartHeight / maxCount : 0;

// Calculate Y-axis labels (4-5 labels)
const yLabels: number[] = [];
if (maxCount > 0) {
  const labelCount = 4;
  const step = Math.ceil(maxCount / labelCount);
  for (let i = 0; i <= labelCount; i++) {
    yLabels.push(i * step);
  }
}

return (
  <svg>
    {/* Y-axis grid lines (subtle) */}
    {yLabels.map((value, index) => {
      const y = paddingTop + chartHeight - value * yScale;
      return (
        <g key={`grid-${index}`}>
          <line
            x1={paddingLeft}
            y1={y}
            x2={width - paddingRight}
            y2={y}
            stroke="currentColor"
            strokeWidth={index === 0 ? 1 : 0.5}
            opacity={index === 0 ? 0.3 : 0.15}
            className="text-border"
          />
          <text
            x={paddingLeft - 5}
            y={y + 3}
            textAnchor="end"
            fontSize="10"
            fill="currentColor"
            className="text-foreground-muted"
          >
            {value}
          </text>
        </g>
      );
    })}

    {/* Histogram bars */}
    ...
  </svg>
);
```

**Change to**:
```typescript
// Padding for chart (minimal now - no y-axis labels)
const paddingLeft = 5; // Reduced from 30
const paddingRight = 5;
const paddingTop = 10;
const paddingBottom = 10;

const chartWidth = width - paddingLeft - paddingRight;
const chartHeight = height - paddingTop - paddingBottom;

// Y-axis scale
const yScale = maxCount > 0 ? chartHeight / maxCount : 0;

// No y-axis labels calculated (removed)

return (
  <svg>
    {/* Y-axis grid lines and labels REMOVED */}

    {/* Histogram bars */}
    ...
  </svg>
);
```

**Removed Lines**:
- Lines 40: `paddingLeft = 30` → change to `5`
- Lines 52-60: Y-axis labels calculation (remove)
- Lines 71-97: Y-axis grid lines and labels rendering (remove)

**Keep**:
- Histogram bars (lines 100-126)
- Tooltip on hover (title element)
- Screen reader text

**Acceptance Criteria**:
- ✅ No y-axis numeric labels visible
- ✅ No y-axis grid lines visible (OR subtle baseline only if desired)
- ✅ Histogram bars unchanged (same visual appearance)
- ✅ Left padding reduced (no space reserved for labels)
- ✅ Bars extend closer to left edge
- ✅ Tooltip on hover still works (shows count and date range)
- ✅ Screen reader text unchanged
- ✅ Pictogram appearance (not a precise chart)

**Testing**:
- ✅ Visual test: Screenshot before/after
- ✅ Manual test: Hover bars (tooltip works)
- ✅ Accessibility test: Screen reader description present
- ✅ Mobile test: Bars render correctly

---

### FR-V3.2-006: Mobile Responsiveness - Filters Max 30% Screen Height
**Priority**: 🟡 **HIGH**
**Status**: Responsive Design Fix
**Complexity**: 🟡 **MEDIUM**

**Current Behavior**:
- Filters occupy significant vertical space on mobile
  - **File**: `EnergyTableFilters.tsx` lines 142-184
  - Filter sections use natural height (no constraint)
  - On small screens, filters can take 50-70% of viewport height

**User Feedback**:
- _"on mobile, filters are taking up the whole screen, because the selectors are not responsive. at most 30% of the screen are allowed"_
- User wants filters compact on mobile to show more data/table rows

**Expected Behavior**:
- **Mobile** (<640px): Filters limited to max 30% of viewport height
- **Scrollable if needed**: If content exceeds 30vh, make scrollable
- **Desktop** (≥640px): No height constraint (natural height)

**Implementation Strategy**:

**Option A: Max Height + Overflow Scroll** (Recommended)
```css
@media (max-width: 639px) {
  .energy-table-filters {
    max-height: 30vh;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}
```

**Option B: Collapse Sections** (More Complex)
- Accordion-style sections that expand/collapse
- Default: Only type filter visible, timeline collapsed
- Tap to expand timeline section

**Recommendation**: **Option A** - Simpler, less disruptive to existing UX

**Code Changes**:

**File**: `src/app/components/energy/filter-components.css` (new file from FR-V3.2-004)

Add at end of file:
```css
/* ============================================
   Mobile Responsiveness
   ============================================ */

/* Filters Container - Mobile Height Constraint */
@media (max-width: 639px) {
  .energy-table-filters {
    /* Max 30% of viewport height */
    max-height: 30vh;
    overflow-y: auto;
    overflow-x: hidden;

    /* Smooth scrolling */
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;

    /* Custom scrollbar styling */
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }

  .energy-table-filters::-webkit-scrollbar {
    width: 4px;
  }

  .energy-table-filters::-webkit-scrollbar-track {
    background: transparent;
  }

  .energy-table-filters::-webkit-scrollbar-thumb {
    background: var(--border);
    border-radius: 2px;
  }

  .energy-table-filters::-webkit-scrollbar-thumb:hover {
    background: var(--foreground-muted);
  }
}
```

**Alternative: Reduce Filter Section Spacing on Mobile**

If 30vh is too restrictive, also reduce gap spacing:

```css
@media (max-width: 639px) {
  .energy-table-filters > div {
    gap: 1rem; /* Reduce from 1.5rem (gap-6) */
  }

  .energy-table-filters .flex.flex-col.gap-4 {
    gap: 0.75rem; /* Reduce from 1rem (gap-4) */
  }

  .energy-table-filters .flex.flex-col.gap-3 {
    gap: 0.5rem; /* Reduce from 0.75rem (gap-3) */
  }
}
```

**Component Update** (if needed):

**File**: `src/app/components/energy/EnergyTableFilters.tsx`

No JSX changes needed - CSS handles it.

Optional: Add class for easier CSS targeting:
```typescript
<div className={`energy-table-filters solid-container ${className}`}>
```
(Already has `energy-table-filters` class, so no change needed)

**Acceptance Criteria**:
- ✅ **Mobile** (<640px): Filters max 30% viewport height (30vh)
- ✅ Filters scrollable if content exceeds 30vh
- ✅ Smooth scrolling on mobile (webkit-overflow-scrolling: touch)
- ✅ Custom scrollbar styled (thin, subtle)
- ✅ **Desktop** (≥640px): No height constraint (natural height)
- ✅ No horizontal overflow (overflow-x: hidden)
- ✅ Content remains accessible (all filters reachable via scroll)
- ✅ No layout shift between mobile/desktop

**Testing**:
- ✅ Mobile test (iPhone 13 Pro, 390x844): Filters max 30% height
- ✅ Mobile test (small screen, 320x568): Filters scrollable if needed
- ✅ Manual test: Scroll filters on mobile (smooth scrolling)
- ✅ Desktop test (1920x1080): Filters natural height (no constraint)
- ✅ Responsive test: Breakpoint transition at 640px smooth

**User Feedback Expected**:
- Mobile screens show more data table rows
- Filters remain accessible but less dominant
- User can scroll filters if needed to access all options

---

### FR-V3.2-007: Remove "Energy Type" Label
**Priority**: 🟡 **HIGH**
**Status**: Visual Refinement
**Complexity**: 🟢 **LOW**

**Current Behavior**:
- Type filter section has label: `<label className="text-sm font-semibold text-foreground">Energy Type</label>`
  - **File**: `EnergyTableFilters.tsx` line 180

**User Feedback**:
- _"also remove the label energy type"_
- Label is redundant (buttons already show "Power" and "Gas")

**Expected Behavior**:
- Label removed completely
- Type filter section remains, but without text label
- Visual hierarchy maintained through spacing

**Code Changes**:

**File**: `src/app/components/energy/EnergyTableFilters.tsx`

**Current** (lines 178-182):
```typescript
{/* Type Filter Section */}
<div className="flex flex-col gap-3">
  <label className="text-sm font-semibold text-foreground">Energy Type</label>
  <TypeFilter selectedTypes={selectedTypes} onSelectionChange={onTypesChange} />
</div>
```

**Change to**:
```typescript
{/* Type Filter Section */}
<div className="flex flex-col gap-3">
  <TypeFilter selectedTypes={selectedTypes} onSelectionChange={onTypesChange} />
</div>
```

**Remove line 180** completely.

**Acceptance Criteria**:
- ✅ "Energy Type" label removed
- ✅ Type filter section spacing unchanged (gap-3 maintained)
- ✅ Visual hierarchy clear without label
- ✅ No layout shift
- ✅ Consistent with V3.1 timeline label removal (FR-V3.1-004)

**Testing**:
- ✅ Visual test: Screenshot before/after
- ✅ Manual inspection: Label not in DOM
- ✅ Layout test: Spacing preserved

---

### FR-V3.2-008: QA Agent Update - Add Code Style Checks
**Priority**: 🔴 **CRITICAL**
**Status**: Process Improvement
**Complexity**: 🟡 **MEDIUM**

**Current Behavior**:
- QA agent checks:
  - ✅ Test success (100%)
  - ✅ Coverage requirements
  - ✅ Lint results
  - ✅ Security vulnerabilities
  - ✅ SOLID principles
  - ✅ Clean code practices
  - ✅ Browser testing (mobile/desktop)
- **Missing**: Explicit code style review for inline class overuse

**User Feedback**:
- _"update qa-agent to also take code style check into account. the excessive use of classes is not acceptable here."_
- _"styled should be concentrated in css files"_

**Expected Behavior**:
- QA agent explicitly checks for **excessive inline Tailwind classes**
- Fails QA if components have > threshold of inline utility classes
- Provides specific feedback on code style violations
- Encourages CSS class extraction for reusable patterns

**Code Changes**:

**File**: `.claude/agents/qa-engineer.md`

**Add New Section**: "Phase 4.5: Code Style Analysis" (insert after Phase 4, before Phase 5)

**Insert at line 90** (after "### Phase 4: Code Quality Checks"):

```markdown
### Phase 4.5: Code Style Analysis

**CRITICAL**: Check for excessive inline utility classes (Tailwind, etc.)

1. **Scan components for inline class overuse**
   - Search for `className={` with long template literals
   - Flag any element with > 15 inline utility classes
   - Flag repeated utility combinations across files
   - Example violation:
     ```typescript
     className={`
       preset-button
       flex-shrink-0
       px-4 py-2
       rounded-xl
       border-2
       text-sm
       font-medium
       transition-all
       duration-150
       ease-in-out
       ${isActive ? '...' : '...'}
       focus-visible:outline-none
       focus-visible:ring-3
       ...
     `}
     ```

2. **Verify CSS class extraction**
   - Check for dedicated CSS files for component patterns
   - Verify BEM or similar naming convention used
   - Ensure reusable patterns defined in CSS, not inline
   - Example good pattern:
     ```typescript
     className={`preset-button ${isActive ? 'preset-button--active' : ''}`}
     ```

3. **Generate code style report**
   - Count inline utility classes per component
   - List components with excessive inline classes
   - Suggest CSS extraction for common patterns
   - Provide refactoring guidance

**Acceptance Criteria**:
- ✅ No component has > 10 inline utility classes per element (guideline)
- ✅ Common button/form patterns extracted to CSS classes
- ✅ BEM-like naming convention used for modifiers
- ✅ CSS files organized and imported correctly
```

**Update Phase 7 (Code Review)**: Add code style item

**Insert at line 189** (in "Clean code assessment" list):

```markdown
### ⚠️ Areas for Improvement
1. **Naming**: [Issues and examples]
2. **Function Complexity**: [Issues and examples]
3. **Code Duplication**: [Issues and examples]
4. **Inline Class Overuse**: [Issues and examples] ← NEW
   - Components with > 10 inline utility classes
   - Repeated utility combinations not extracted
   - Suggestions for CSS class extraction
5. **Documentation**: [Issues and examples]
6. **Error Handling**: [Issues and examples]
```

**Update Report Template**: Add Code Style section

**Insert at line 454** (after "Clean Code Assessment"):

```markdown
## Code Style Analysis

### Inline Utility Class Usage

**Scan Results**:
- Total components scanned: [number]
- Components with excessive inline classes (>10): [number]
- Repeat utility patterns found: [number]

**Violations**:
1. **[Component Name]** (`[file path]`)
   - **Element**: `<button>` (line [X])
   - **Inline Class Count**: [number]
   - **Issue**: Excessive inline Tailwind classes
   - **Suggestion**: Extract to CSS class (e.g., `.preset-button`)

2. **[Component Name]** (`[file path]`)
   - **Element**: `<button>` (line [X])
   - **Inline Class Count**: [number]
   - **Issue**: Repeated pattern (found in 3 components)
   - **Suggestion**: Create shared CSS class in `filter-components.css`

### CSS Class Extraction

**Status**: ✅ Good / ⚠️ Needs Improvement / ❌ Violations Found

**CSS Files Reviewed**:
- `src/app/layout/main.css`: ✅
- `src/app/components/energy/filter-components.css`: ⚠️ Not found (if new)
- `src/app/layout/button.css`: ✅

**Recommendations**:
1. Extract repeated button patterns to CSS classes
2. Use BEM naming: `.component--modifier`
3. Keep inline classes minimal (<5 per element)
4. Organize CSS by component or pattern
```

**Update Exit Criteria** (line 627):

```markdown
## Exit Criteria

Implementation is approved when:
- ✅ 100% of tests pass
- ✅ Coverage meets or exceeds project requirements
- ✅ No critical lint issues
- ✅ No critical security vulnerabilities
- ✅ SOLID principles properly applied
- ✅ Clean code practices followed
- ✅ Code style: No excessive inline utility classes ← NEW
- ✅ CSS patterns properly extracted and organized ← NEW
- ✅ All code review concerns addressed
- ✅ Feature documentation complete in feature-dev/
- ✅ Mobile functionality verified (primary target)
- ✅ Desktop functionality verified (secondary target)
- ✅ Responsive behavior tested across breakpoints
- ✅ User flows work in actual browser
```

**Acceptance Criteria**:
- ✅ QA agent document updated with code style checks
- ✅ New "Phase 4.5: Code Style Analysis" section added
- ✅ Code style violations included in report template
- ✅ Exit criteria updated with code style requirements
- ✅ Threshold defined: > 10 inline utility classes = violation
- ✅ Guidance provided for CSS extraction and BEM naming

**Testing**:
- ✅ QA agent runs code style checks on next review
- ✅ Report includes inline class count per component
- ✅ Violations clearly flagged with file locations
- ✅ Refactoring suggestions actionable

---

## Non-Functional Requirements (V3.2)

### NFR-V3.2-1: No Regression in Functionality
**Priority**: 🔴 **CRITICAL**

**Requirements**:
- ✅ All V3.1 features remain functional after refinements
- ✅ Preset buttons work (animate slider handles)
- ✅ Type filter multi-select works (Power and Gas)
- ✅ Slider drag works (V3.1 fix preserved)
- ✅ Date labels work (V3.1 overflow fix preserved)
- ✅ Reset button works (clears all filters)
- ✅ Histogram visualization unchanged (except y-axis labels removed)
- ✅ Keyboard navigation unchanged
- ✅ Accessibility (ARIA attributes) unchanged
- ✅ All existing tests still pass

---

### NFR-V3.2-2: Performance - No Degradation
**Priority**: 🔴 **CRITICAL**

**Requirements**:
- ✅ CSS class extraction does NOT increase bundle size significantly
- ✅ Mobile scroll performance smooth (60fps)
- ✅ Slider drag performance maintained (60fps)
- ✅ Component re-renders minimized (memoization preserved)
- ✅ CSS file load time negligible (<50ms)

**Expected Performance Benefits**:
- ✅ **Smaller bundle size**: CSS classes > repeated inline Tailwind
- ✅ **Faster parsing**: Browser parses CSS once, not per component instance
- ✅ **Better caching**: CSS file cached by browser

---

### NFR-V3.2-3: Visual Consistency
**Priority**: 🟡 **MEDIUM**

**Requirements**:
- ✅ Inactive buttons consistently muted across preset and type filters
- ✅ Active buttons consistently colorful (primary theme)
- ✅ Border removal consistent (solid-container)
- ✅ Spacing and gaps consistent (no layout shifts)
- ✅ Color palette consistent (use existing CSS variables)
- ✅ Mobile and desktop styling consistent

---

### NFR-V3.2-4: Maintainability
**Priority**: 🔴 **CRITICAL**

**Requirements**:
- ✅ Code style refactor significantly improves maintainability
- ✅ Button styles changeable in one place (CSS file)
- ✅ New developers can easily understand button patterns
- ✅ CSS naming convention clear and consistent (BEM-like)
- ✅ No code duplication across components

---

## Testing Strategy (V3.2)

### Test Categories

#### 1. Code Style Verification (Critical)
**CSS Extraction (FR-V3.2-004)**:
- ✅ Manual review: Count inline classes per component (should be <5)
- ✅ Visual test: Screenshot before/after refactor (should be identical)
- ✅ Code review: Verify CSS file created and imported
- ✅ Code review: Verify BEM naming convention used
- ✅ Automated test: Component tests still pass (no regressions)

#### 2. Visual Refinement Verification
**Solid Container Border (FR-V3.2-001)**:
- ✅ Visual test: No border visible (screenshot)
- ✅ Manual inspection: Chrome DevTools computed styles (border: none)

**Preset Button Colors (FR-V3.2-002)**:
- ✅ Visual test: Inactive buttons muted (screenshot)
- ✅ Visual test: Active buttons colorful (screenshot)
- ✅ Manual test: Hover states correct

**Type Filter Buttons (FR-V3.2-003)**:
- ✅ Visual test: No checkbox visible (screenshot)
- ✅ Visual test: Deselected buttons muted (screenshot)
- ✅ Visual test: Selected buttons colorful (screenshot)
- ✅ Manual test: Multi-select works (Power + Gas)

**Histogram Y-Axis (FR-V3.2-005)**:
- ✅ Visual test: No y-axis labels visible (screenshot)
- ✅ Visual test: Bars extend closer to left edge
- ✅ Manual test: Tooltip on hover works

**Energy Type Label (FR-V3.2-007)**:
- ✅ Visual test: Label removed (screenshot)
- ✅ Automated test: Label not in DOM

#### 3. Responsive Design Verification
**Mobile Filter Height (FR-V3.2-006)**:
- ✅ Mobile test (390x844): Filters max 30vh
- ✅ Mobile test (320x568): Filters scrollable if needed
- ✅ Manual test: Scroll filters on mobile
- ✅ Desktop test (1920x1080): Filters natural height (no constraint)

#### 4. Regression Testing
**Existing Functionality**:
- ✅ Preset buttons work (all presets)
- ✅ Type filter multi-select works
- ✅ Slider drag works (V3.1 fix)
- ✅ Date label overflow fix preserved (V3.1)
- ✅ Reset button works
- ✅ Histogram updates on type filter change
- ✅ Keyboard navigation works
- ✅ ARIA attributes correct
- ✅ All unit tests pass (Jest)

#### 5. QA Agent Verification
**QA Process Update (FR-V3.2-008)**:
- ✅ QA agent document updated
- ✅ Code style checks added to Phase 4.5
- ✅ Report template includes code style section
- ✅ Exit criteria updated
- ✅ Next QA run includes code style analysis

---

## Implementation Checklist

### Phase 1: Critical Architecture Refactor (Priority 1)
**Estimated Time**: 3-4 hours

- [ ] **FR-V3.2-004**: Code style refactor
  - [ ] Create `src/app/components/energy/filter-components.css`
  - [ ] Define `.filter-button-base` class (shared foundation)
  - [ ] Define `.preset-button` and `.preset-button--active` classes
  - [ ] Define `.type-filter-button` and `.type-filter-button--selected` classes
  - [ ] Import CSS in `main.css`
  - [ ] Update `TimelinePresets.tsx` (reduce inline classes)
  - [ ] Update `TypeFilter.tsx` (reduce inline classes)
  - [ ] Visual regression test (screenshot before/after)
  - [ ] Verify all button states work (hover, active, disabled, focus)

- [ ] **FR-V3.2-008**: QA agent update
  - [ ] Add "Phase 4.5: Code Style Analysis" section
  - [ ] Update "Clean Code Assessment" with inline class item
  - [ ] Update report template with "Code Style Analysis" section
  - [ ] Update exit criteria with code style requirements
  - [ ] Document threshold: >10 inline classes = violation

### Phase 2: Visual Refinements (Priority 2)
**Estimated Time**: 2-3 hours

- [ ] **FR-V3.2-001**: Remove border from solid-container
  - [ ] Edit `src/app/layout/container.css`
  - [ ] Remove `border` from `.solid-container`
  - [ ] Screenshot before/after

- [ ] **FR-V3.2-002**: Preset button colors (no color when inactive)
  - [ ] Already handled in FR-V3.2-004 CSS refactor
  - [ ] Verify inactive buttons have `border: transparent`
  - [ ] Screenshot inactive vs active

- [ ] **FR-V3.2-003**: Type filter buttons (remove checkbox, no color when deselected)
  - [ ] Remove checkbox JSX (lines 101-132 in TypeFilter.tsx)
  - [ ] Already handled in FR-V3.2-004 CSS refactor for colors
  - [ ] Screenshot before/after

- [ ] **FR-V3.2-005**: Remove y-axis labels from histogram
  - [ ] Edit `SliderVisualization.tsx`
  - [ ] Remove y-axis label calculation (lines 52-60)
  - [ ] Remove y-axis rendering (lines 71-97)
  - [ ] Reduce `paddingLeft` from 30 to 5
  - [ ] Screenshot before/after

- [ ] **FR-V3.2-007**: Remove "Energy Type" label
  - [ ] Edit `EnergyTableFilters.tsx`
  - [ ] Remove line 180 (label element)
  - [ ] Screenshot before/after

### Phase 3: Responsive Design Fix (Priority 3)
**Estimated Time**: 1-2 hours

- [ ] **FR-V3.2-006**: Mobile filter height constraint
  - [ ] Add mobile CSS to `filter-components.css`
  - [ ] Set `max-height: 30vh` for mobile (<640px)
  - [ ] Add `overflow-y: auto` with smooth scrolling
  - [ ] Style custom scrollbar
  - [ ] Test on mobile devices (390x844, 320x568)
  - [ ] Test on desktop (1920x1080) - no constraint
  - [ ] Screenshot mobile before/after

### Phase 4: Testing & QA
**Estimated Time**: 1-2 hours

- [ ] Run all automated tests (ensure no regressions)
- [ ] Visual regression testing (screenshot comparisons)
- [ ] Manual testing on desktop (Chrome, Safari, Firefox)
- [ ] Manual testing on mobile (iOS Safari, Android Chrome)
- [ ] Accessibility audit (axe-core)
- [ ] Performance testing (mobile scroll, slider drag)
- [ ] Code review (verify inline classes reduced)
- [ ] Fix any issues found

### Phase 5: Documentation & Commit
**Estimated Time**: 0.5 hour

- [ ] Update CHANGELOG.md (V3.2 entry)
- [ ] Update CLAUDE.md (if new CSS patterns introduced)
- [ ] Commit with detailed message
- [ ] Co-authored-by: Claude

---

## Success Metrics

### Code Style Refactor
- ✅ **Inline classes reduced**: <5 per element (from 15-20+)
- ✅ **CSS file created**: `filter-components.css` exists and imported
- ✅ **Maintainability improved**: Button styles changeable in one place
- ✅ **No visual regression**: Pixel-perfect match before/after
- ✅ **QA process improved**: Code style checks added to QA agent

### Visual Refinements
- ✅ **User satisfaction**: User approves visual changes (less colorful inactive buttons)
- ✅ **Consistency**: All inactive elements have muted appearance
- ✅ **Clarity**: Checkbox removed from type filter
- ✅ **Simplicity**: Histogram is pictogram (no y-axis labels)
- ✅ **Clean UI**: Unnecessary labels removed

### Responsive Design
- ✅ **Mobile usability improved**: Filters max 30% screen height
- ✅ **More data visible**: Users see more table rows on mobile
- ✅ **Filters accessible**: Scrollable if content exceeds 30vh
- ✅ **Desktop unchanged**: No height constraint on larger screens

### Regression Testing
- ✅ **All tests pass**: Existing test suite passes 100%
- ✅ **No functionality lost**: All V3.1 features still work
- ✅ **Performance maintained**: 60fps drag, smooth mobile scroll

---

## Open Questions

### Q1: Grid Lines in Histogram?
**Question**: Should we keep subtle grid lines in histogram, or remove them entirely?

**Options**:
- **A**: Keep very subtle horizontal baseline (opacity 0.1)
- **B**: Remove all grid lines (pure pictogram)

**Recommendation**: **Option B** - Pure pictogram (no grid lines)

**Reasoning**: User said "pictogram, not chart" - grid lines imply precision

**Decision**: TBD (user preference)

---

### Q2: Mobile Filter Height - Exact Threshold?
**Question**: Is 30vh a strict requirement, or a guideline?

**Current**: Max 30vh on mobile (<640px)

**Alternative**: Allow 35vh if 30vh is too restrictive?

**Recommendation**: **Start with 30vh**, adjust if user feedback indicates it's too small

**Decision**: **30vh** (user specified)

---

### Q3: CSS File Organization?
**Question**: Where should filter component CSS live?

**Options**:
- **A**: `src/app/components/energy/filter-components.css` (component-specific)
- **B**: `src/app/layout/filter-components.css` (with other layout CSS)

**Recommendation**: **Option A** - Component-specific CSS file

**Reasoning**: Easier to locate, co-located with components

**Decision**: **Option A** (recommended)

---

## Conclusion

**Status**: ✅ **REQUIREMENTS DEFINED - V3.2 REFINEMENTS**

This document specifies **7 refinements + 1 QA process update** to the V3.1 implementation:

**Critical** (Must Fix):
1. ✅ **Code style refactor** (FR-V3.2-004) - CRITICAL for maintainability
2. ✅ **QA agent update** (FR-V3.2-008) - CRITICAL for process improvement

**High Priority** (Should Fix):
3. ✅ **Remove solid-container border** (FR-V3.2-001)
4. ✅ **Preset buttons - no color when inactive** (FR-V3.2-002)
5. ✅ **Type filter buttons - remove checkbox, no color when deselected** (FR-V3.2-003)
6. ✅ **Remove histogram y-axis labels** (FR-V3.2-005)
7. ✅ **Mobile filter height max 30%** (FR-V3.2-006)
8. ✅ **Remove "Energy Type" label** (FR-V3.2-007)

**Estimated Effort**: 6-10 hours (0.75-1.25 days)

**Key Focus**: **Code maintainability** through CSS extraction and **mobile UX** through responsive improvements

**Next Steps**:
1. Review requirements with user (confirm open questions)
2. Begin Phase 1: Code style refactor + QA agent update (critical)
3. Continue with visual refinements (Phase 2)
4. Implement responsive fix (Phase 3)
5. Thorough testing (Phase 4)
6. Commit and document (Phase 5)

---

**Document Status**: ✅ **READY FOR IMPLEMENTATION**

**Approval Required**: User confirmation on:
- ✅ Histogram grid lines (Q1) - remove entirely?
- ✅ Mobile filter height (Q2) - 30vh strict or flexible?
- ✅ CSS file location (Q3) - component-specific or layout?

---

## Appendices

### A. Component File Changes Summary

| File | Changes | Lines Changed | Complexity |
|------|---------|---------------|------------|
| **CSS Files** | | | |
| `container.css` | Remove border from solid-container | 1 | 🟢 Low |
| `filter-components.css` | NEW - Button patterns, mobile responsive | ~150-200 | 🔴 High |
| `main.css` | Import new CSS file | 1 | 🟢 Low |
| **Components** | | | |
| `TimelinePresets.tsx` | Reduce inline classes | ~20-30 | 🟡 Medium |
| `TypeFilter.tsx` | Remove checkbox, reduce inline classes | ~40-50 | 🟡 Medium |
| `SliderVisualization.tsx` | Remove y-axis labels | ~30-40 | 🟢 Low |
| `EnergyTableFilters.tsx` | Remove label | 1 | 🟢 Low |
| **QA Agent** | | | |
| `.claude/agents/qa-engineer.md` | Add code style checks | ~80-100 | 🟡 Medium |

**Total Estimated LOC**: ~320-470 lines (net change including new CSS file)

---

### B. Testing Checklist (Detailed)

#### Code Style Tests
- [ ] **FR-V3.2-004**: CSS extraction
  - [ ] Manual review: Inline classes <5 per element
  - [ ] Code review: CSS file created and imported
  - [ ] Code review: BEM naming used
  - [ ] Visual test: Screenshot before/after (identical)
  - [ ] All component tests pass

#### Visual Refinement Tests
- [ ] **FR-V3.2-001**: Solid container border
  - [ ] Visual test: No border (screenshot)
  - [ ] DevTools: Border computed style = none
- [ ] **FR-V3.2-002**: Preset button colors
  - [ ] Visual test: Inactive muted (screenshot)
  - [ ] Visual test: Active colorful (screenshot)
- [ ] **FR-V3.2-003**: Type filter buttons
  - [ ] Visual test: No checkbox (screenshot)
  - [ ] Visual test: Deselected muted (screenshot)
  - [ ] Visual test: Selected colorful (screenshot)
  - [ ] Manual test: Multi-select works
- [ ] **FR-V3.2-005**: Histogram y-axis
  - [ ] Visual test: No labels (screenshot)
  - [ ] Manual test: Tooltip works
- [ ] **FR-V3.2-007**: Energy type label
  - [ ] Visual test: Label removed (screenshot)

#### Responsive Design Tests
- [ ] **FR-V3.2-006**: Mobile filter height
  - [ ] Mobile (390x844): Filters max 30vh
  - [ ] Mobile (320x568): Filters scrollable
  - [ ] Desktop (1920x1080): No height constraint

#### Regression Tests
- [ ] Preset buttons work (all presets)
- [ ] Type filter multi-select works
- [ ] Slider drag works (60fps)
- [ ] Date labels work (no overflow)
- [ ] Reset button works
- [ ] Histogram updates on type change
- [ ] Keyboard navigation works
- [ ] All unit tests pass

#### QA Agent Tests
- [ ] **FR-V3.2-008**: QA agent updated
  - [ ] Document has Phase 4.5 section
  - [ ] Report template has code style section
  - [ ] Exit criteria updated
  - [ ] Next QA run includes code style checks

---

### C. CSS Architecture - BEM Naming Convention

**Pattern**: `.block__element--modifier`

**Examples**:

**Base Blocks**:
- `.filter-button-base` - Shared button foundation
- `.preset-button` - Preset button base
- `.type-filter-button` - Type filter button base

**Modifiers**:
- `.preset-button--active` - Active preset state
- `.type-filter-button--selected` - Selected type state
- `.filter-button-base:disabled` - Disabled state (pseudo-class)

**Benefits**:
- ✅ Clear component structure
- ✅ Easy to understand at a glance
- ✅ Predictable naming
- ✅ Avoids naming collisions
- ✅ Works well with modern CSS

---

### D. Before/After Code Comparison

**TimelinePresets.tsx - Button Element**

**Before** (Lines 58-94):
```typescript
<button
  key={preset.id}
  type="button"
  onClick={() => handlePresetClick(preset)}
  disabled={disabled}
  aria-pressed={isActive}
  aria-label={`Select ${preset.label}`}
  className={`
    preset-button
    flex-shrink-0
    px-4 py-2
    rounded-xl
    border-2
    text-sm
    font-medium
    transition-all
    duration-150
    ease-in-out
    ${
      isActive
        ? 'bg-primary border-primary text-primary-foreground shadow-md transform -translate-y-0.5'
        : 'bg-transparent border-border text-foreground hover:bg-background-hover hover:border-border-hover hover:transform hover:-translate-y-0.5'
    }
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    focus-visible:outline-none
    focus-visible:ring-3
    focus-visible:ring-primary-subtle
    focus-visible:ring-offset-2
  `}
  style={{
    scrollSnapAlign: 'start',
    minWidth: 'max-content',
  }}
>
  {preset.label}
</button>
```

**After** (Refactored):
```typescript
<button
  key={preset.id}
  type="button"
  onClick={() => handlePresetClick(preset)}
  disabled={disabled}
  aria-pressed={isActive}
  aria-label={`Select ${preset.label}`}
  className={`preset-button ${isActive ? 'preset-button--active' : ''}`}
>
  {preset.label}
</button>
```

**Lines Reduced**: 28 lines → 8 lines (70% reduction)

**Inline Classes**: 20+ utility classes → 2 CSS classes

---

**END OF REQUIREMENTS SPECIFICATION V3.2**
