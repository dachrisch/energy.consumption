# Requirements Specification: Filter Redesign V3.3 - Energy Type & Label UX Refinements

## Document Information
- **Feature Type**: UI Enhancement - VISUAL REFINEMENTS TO V3.2
- **Component**: Energy Type Filter, Slider Date Labels
- **Related Page**: `/src/app/readings/page.tsx`
- **Status**: Requirements Defined - V3.3 Refinements
- **Date**: 2025-11-05
- **Version**: 3.3 (MINOR - Visual UX Refinements)
- **Previous Version**: V3.2 (Code Style & UX Refinements) - See `requirements-v3.2.md`
- **Complexity Level**: 🟢 **LOW** - Focused CSS styling adjustments

---

## Executive Summary

This document specifies refinements to the V3.2 implementation based on **additional user feedback focusing on energy type button styling and slider label positioning**. V3.2 has been completed and implemented. User has now identified **2 issues**:

**Issue Breakdown**:
- **1 Visual/UX Refinement**: Energy type switches styling (remove green/red colors, match preset buttons)
- **1 Layout Issue**: Slider date labels too far below handles, too large, overlapping with buttons

**Impact**: 🟢 **LOW** - Minor visual refinements to improve consistency and readability

**Estimated Effort**: 1-2 hours (0.125-0.25 days)

---

## User Feedback (Verbatim)

User testing of V3.2 implementation revealed the following issues:

1. **Energy Type Switch Colors**: _"Remove the green and red color from energy type switches and style them like the timeline buttons. They look great."_
   - Current: Energy type buttons use energy-specific colors when selected
     - Power (green): `rgba(75, 192, 192, 0.1)` background, `rgb(75, 192, 192)` border/text
     - Gas (red): `rgba(255, 99, 132, 0.1)` background, `rgb(255, 99, 132)` border/text
   - Desired: Style like preset buttons (use primary color, not energy-specific colors)
   - User approval: "They [preset buttons] look great"

2. **Slider Label Positioning**: _"The label on the slider is too far below the slider point. It could be much smaller and it must not overlap with the buttons."_
   - Current issues:
     - Date labels positioned 8px below handle center (desktop), 6px (mobile)
     - Font size: 14px (desktop), 12px (mobile)
     - Labels perceived as "too far below the slider point"
     - Labels potentially overlapping with preset/type filter buttons
   - Desired:
     - Closer to slider handle
     - Smaller font size
     - No overlap with buttons

---

## Problem Statement

### Energy Type Button Styling Inconsistency

**Current State** (V3.2):
- Energy type buttons use **energy-specific colors** when selected
  - CSS: Lines 173-184 in `filter-components.css`
  - Power: Green (`rgb(75, 192, 192)`)
  - Gas: Red (`rgb(255, 99, 132)`)
- Deselected buttons correctly styled: NO COLOR (transparent, muted text)

**Issues**:
- ❌ **Inconsistent with preset buttons**: Preset buttons use primary color, type buttons use energy colors
- ❌ **Visual hierarchy confusion**: Energy colors draw more attention than primary color
- ❌ **Design pattern inconsistency**: All filter buttons should follow same active state pattern

**User Expectation**:
- ✅ **Match preset button styling**: Active state uses primary color (like preset buttons)
- ✅ **Consistent design language**: All filter buttons use same color scheme
- ✅ **Energy type identification**: Icon and label sufficient (color not needed for distinction)

---

### Slider Label Positioning & Sizing

**Current State** (V3.2):
- Date labels in `DateRangeDisplay.tsx`:
  - **Position**: 8px below handle center (desktop), 6px (mobile)
    - CSS: `marginTop` variable (lines 75, 104)
  - **Font Size**: 14px (0.875rem - desktop), 12px (0.75rem - mobile)
    - CSS: `fontSize` variable (line 74)
  - **Layout**: Labels inside `<div className="mt-2">` wrapper in RangeSlider.tsx (line 333)

**Issues**:
- ❌ **Too far from handle**: 8px gap + track height (40px) + mt-2 class (8px) = ~56px total distance
- ❌ **Font too large**: 14px/12px feels prominent for auxiliary information
- ❌ **Potential overlap**: Labels can overlap with buttons below (especially on mobile)

**User Expectation**:
- ✅ **Closer to handle**: Labels should be visually connected to handle
- ✅ **Smaller font**: Less prominent, more auxiliary
- ✅ **No overlap**: Must not collide with preset/type filter buttons

**Current Layout** (RangeSlider.tsx):
```
[Histogram] (100-120px)
[mb-4 gap = 16px]
[Slider Track + Handles] (40px)
[mt-2 gap = 8px]
[Date Labels] (variable height)
[Buttons below in parent component]
```

**Problem Areas**:
1. **mt-2 class adds extra 8px** between slider track and labels
2. **marginTop in DateRangeDisplay** adds another 6-8px
3. **Total gap from handle center**: ~20px (handle center) + 8px (mt-2) + 6-8px (marginTop) = **34-36px**

---

## Functional Requirements (V3.3 Refinements)

### FR-V3.3-001: Energy Type Button Styling - Match Preset Buttons
**Priority**: 🟡 **MEDIUM**
**Status**: Visual Refinement
**Complexity**: 🟢 **LOW**

**Current Behavior**:
- Type filter buttons use **energy-specific colors** when selected
  - **File**: `src/app/components/energy/filter-components.css` lines 173-184
  - Power: Green background/border/text
  - Gas: Red background/border/text

**Expected Behavior**:
- Type filter buttons use **primary color** when selected (like preset buttons)
  - Background: Primary subtle (`var(--primary-subtle)`)
  - Border: Primary (`var(--primary)`)
  - Text: Primary (`var(--primary)`)
  - Font weight: Semibold (600)
  - Shadow: Subtle (`0 1px 2px rgba(0, 0, 0, 0.05)`)
  - Ring: None (removed)

**Visual Comparison**:

**Before** (V3.2):
```
Power button (selected): Green background, green border, green text
Gas button (selected): Red background, red border, red text
```

**After** (V3.3):
```
Power button (selected): Primary subtle background, primary border, primary text
Gas button (selected): Primary subtle background, primary border, primary text
(Same styling as active preset buttons)
```

**Code Changes**:

**File**: `src/app/components/energy/filter-components.css`

**Current** (lines 168-184):
```css
.type-filter-button--selected {
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Energy Type Specific Colors (from energyTypes.ts) */
.type-filter-button--selected.type-filter-button--power {
  background-color: rgba(75, 192, 192, 0.1);
  border-color: rgb(75, 192, 192);
  color: rgb(75, 192, 192);
}

.type-filter-button--selected.type-filter-button--gas {
  background-color: rgba(255, 99, 132, 0.1);
  border-color: rgb(255, 99, 132);
  color: rgb(255, 99, 132);
}
```

**Change to**:
```css
.type-filter-button--selected {
  background-color: var(--primary-subtle);
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Energy Type Specific Colors - REMOVED (no longer needed) */
/* Removed .type-filter-button--selected.type-filter-button--power */
/* Removed .type-filter-button--selected.type-filter-button--gas */
```

**Summary of Changes**:
- Move background/border/color from energy-specific classes to `.type-filter-button--selected`
- Remove `.type-filter-button--selected.type-filter-button--power` class (lines 174-178)
- Remove `.type-filter-button--selected.type-filter-button--gas` class (lines 180-184)
- Use CSS variables for primary colors (consistent with preset buttons)

**Component Update** (if needed):

**File**: `src/app/components/energy/TypeFilter.tsx`

**Current** (line 73):
```typescript
className={`type-filter-button ${isChecked ? `type-filter-button--selected type-filter-button--${type}` : ''}`}
```

**Change to**:
```typescript
className={`type-filter-button ${isChecked ? 'type-filter-button--selected' : ''}`}
```

**Reason**: Remove energy-type-specific class suffix (`type-filter-button--power`, `type-filter-button--gas`) since we no longer use energy-specific colors.

**Acceptance Criteria**:
- ✅ Selected type filter buttons use primary color (not green/red)
- ✅ Styling matches preset button active state (same colors)
- ✅ Deselected buttons remain unchanged (transparent, muted)
- ✅ Icon and label still clearly identify energy type (Power/Gas)
- ✅ Hover states unchanged
- ✅ Multi-select functionality unchanged
- ✅ Accessibility unchanged (ARIA attributes, screen reader)
- ✅ Visual consistency across all filter buttons
- ✅ Mobile and desktop both correct

**Testing**:
- ✅ Visual test: Screenshot before/after (energy type buttons)
- ✅ Manual test: Select Power (should show primary color, not green)
- ✅ Manual test: Select Gas (should show primary color, not red)
- ✅ Manual test: Select both (both should show primary color)
- ✅ Visual comparison: Active type button vs active preset button (should match)
- ✅ Responsive test: Mobile and desktop views

---

### FR-V3.3-002: Slider Label Positioning - Closer, Smaller, No Overlap
**Priority**: 🟡 **MEDIUM**
**Status**: Layout Refinement
**Complexity**: 🟢 **LOW**

**Current Behavior**:
- Date labels positioned far below slider handles
  - **Files**:
    - `RangeSlider.tsx` line 333: `<div className="mt-2">` (8px margin)
    - `DateRangeDisplay.tsx` lines 75, 104: `marginTop` variable (6-8px)
  - Total gap from handle center: ~34-36px
- Font size: 14px (desktop), 12px (mobile)
- Labels can overlap with buttons below on mobile

**Expected Behavior**:
- Date labels **closer to slider handles**
  - Reduce gap from handle center to ~16-20px total
  - Remove `mt-2` class from RangeSlider wrapper (saves 8px)
  - Reduce `marginTop` in DateRangeDisplay to 2px (desktop), 1px (mobile)
- **Smaller font size**
  - Desktop: 12px (0.75rem) - reduced from 14px
  - Mobile: 10px (0.625rem) - reduced from 12px
- **No overlap with buttons**
  - Ensure sufficient spacing between labels and buttons
  - Labels should fit comfortably in allocated space

**Code Changes**:

**File 1**: `src/app/components/energy/RangeSlider/RangeSlider.tsx`

**Current** (lines 332-342):
```typescript
{/* Date labels */}
<div className="mt-2">
  <DateRangeDisplay
    startDate={dateRange.start}
    endDate={dateRange.end}
    startPosition={startPosition}
    endPosition={endPosition}
    format={dateFormat}
    containerWidth={containerWidth}
  />
</div>
```

**Change to**:
```typescript
{/* Date labels */}
<DateRangeDisplay
  startDate={dateRange.start}
  endDate={dateRange.end}
  startPosition={startPosition}
  endPosition={endPosition}
  format={dateFormat}
  containerWidth={containerWidth}
/>
```

**Summary**: Remove `<div className="mt-2">` wrapper (saves 8px gap).

---

**File 2**: `src/app/components/energy/RangeSlider/DateRangeDisplay.tsx`

**Current** (lines 74-75):
```typescript
// Font size based on format
const fontSize = format === 'full' ? '0.875rem' : '0.75rem'; // 14px : 12px
const marginTop = format === 'full' ? '8px' : '6px';
```

**Change to**:
```typescript
// Font size based on format (SMALLER)
const fontSize = format === 'full' ? '0.75rem' : '0.625rem'; // 12px : 10px
const marginTop = format === 'full' ? '2px' : '1px'; // CLOSER to handle
```

**Summary**:
- Reduce font size: 14px→12px (desktop), 12px→10px (mobile)
- Reduce margin: 8px→2px (desktop), 6px→1px (mobile)

---

**File 3**: `src/app/components/energy/RangeSlider/RangeSlider.tsx` (height adjustment if needed)

**Current** (lines 250-251):
```typescript
const histogramHeight = isMobile ? 100 : 120;
const totalHeight = histogramHeight + 60; // histogram + labels space
```

**Evaluation**:
- Current allocation: 60px for slider track + labels
- New allocation needed: ~50px (slider track 40px + labels ~10px)
- **Change if overlap occurs**: Reduce to `histogramHeight + 50` (saves 10px)

**Decision**: **Monitor after implementation**. Only change if labels overlap with buttons.

**Acceptance Criteria**:
- ✅ Date labels positioned **closer to slider handles** (~16-20px from handle center)
- ✅ Font size **smaller**: 12px (desktop), 10px (mobile)
- ✅ Labels **do not overlap** with preset/type filter buttons below
- ✅ Labels remain **readable** (not too small)
- ✅ Edge detection still works (labels adjust at container edges)
- ✅ Overlap handling still works (hide one label if too close)
- ✅ Responsive design unchanged (full format desktop, short format mobile)
- ✅ Accessibility unchanged (screen reader text)
- ✅ Visual hierarchy improved (labels less prominent, auxiliary information)

**Testing**:
- ✅ Visual test: Screenshot before/after (label positioning)
- ✅ Manual test: Drag handles (labels follow correctly)
- ✅ Edge case test: Handles at container edges (labels adjust correctly)
- ✅ Overlap test: Handles very close together (overlap handling works)
- ✅ Spacing test: Verify no overlap with buttons below (especially mobile)
- ✅ Readability test: Labels still readable at smaller size
- ✅ Mobile test: 12px→10px reduction acceptable on small screens
- ✅ Desktop test: 14px→12px reduction acceptable on large screens

---

## Non-Functional Requirements (V3.3)

### NFR-V3.3-1: No Regression in Functionality
**Priority**: 🔴 **CRITICAL**

**Requirements**:
- ✅ All V3.2 features remain functional after refinements
- ✅ Type filter multi-select works (Power and Gas)
- ✅ Preset buttons work (animate slider handles)
- ✅ Slider drag works (V3.1 fix preserved)
- ✅ Date labels work (V3.1 overflow fix preserved)
- ✅ Reset button works (clears all filters)
- ✅ Histogram visualization unchanged
- ✅ Keyboard navigation unchanged
- ✅ Accessibility (ARIA attributes) unchanged
- ✅ All existing tests still pass

---

### NFR-V3.3-2: Visual Consistency
**Priority**: 🟡 **MEDIUM**

**Requirements**:
- ✅ **All filter buttons use consistent styling**:
  - Preset buttons (active): Primary color
  - Type filter buttons (selected): Primary color ← NEW (matches presets)
  - Reset button: Muted (unchanged)
- ✅ **Inactive/deselected states consistent**:
  - All buttons: Transparent background, muted text
- ✅ **Date labels visually subordinate**:
  - Smaller font size, closer to handle
  - Auxiliary information, not primary focus
- ✅ **No visual collisions**:
  - Labels don't overlap with buttons
  - Sufficient whitespace maintained

---

### NFR-V3.3-3: Accessibility Maintained
**Priority**: 🔴 **CRITICAL**

**Requirements**:
- ✅ **Type filter buttons**:
  - ARIA attributes unchanged (`aria-pressed`, `aria-label`)
  - Screen reader announcement unchanged
  - Keyboard navigation unchanged
  - Touch targets unchanged (44px minimum)
- ✅ **Date labels**:
  - Screen reader text unchanged
  - Hidden labels (on overlap) still accessible via screen reader
  - Smaller font still readable (WCAG 2.1 AA contrast maintained)

---

## Testing Strategy (V3.3)

### Test Categories

#### 1. Visual Refinement Verification

**Energy Type Button Colors (FR-V3.3-001)**:
- ✅ Visual test: Deselected buttons muted (screenshot)
- ✅ Visual test: Selected Power button uses primary color (not green)
- ✅ Visual test: Selected Gas button uses primary color (not red)
- ✅ Visual test: Both selected (both use primary color)
- ✅ Side-by-side comparison: Active type button vs active preset button (match)
- ✅ Manual test: Multi-select works (both Power and Gas selectable)

**Slider Label Positioning (FR-V3.3-002)**:
- ✅ Visual test: Labels closer to handles (screenshot before/after)
- ✅ Visual test: Font size smaller (12px desktop, 10px mobile)
- ✅ Manual test: Drag handles (labels follow correctly)
- ✅ Edge case test: Handles at edges (labels adjust)
- ✅ Overlap test: Handles close together (overlap handling)
- ✅ Spacing test: No overlap with buttons below
- ✅ Readability test: Labels readable at smaller size
- ✅ Mobile test: 10px font readable on small screens

#### 2. Regression Testing

**Existing Functionality**:
- ✅ Type filter multi-select works (Power + Gas)
- ✅ Preset buttons work (all presets)
- ✅ Slider drag works (V3.1 fix)
- ✅ Date label overflow fix preserved (V3.1)
- ✅ Reset button works
- ✅ Histogram updates on type filter change
- ✅ Keyboard navigation works
- ✅ ARIA attributes correct
- ✅ All unit tests pass (Jest)

#### 3. Responsive Design Verification

**Mobile** (<640px):
- ✅ Type filter buttons: Selected state uses primary color
- ✅ Date labels: 10px font size, 1px margin from handle
- ✅ No overlap between labels and buttons
- ✅ Filters still within 30vh constraint (V3.2)

**Desktop** (≥640px):
- ✅ Type filter buttons: Selected state uses primary color
- ✅ Date labels: 12px font size, 2px margin from handle
- ✅ No overlap between labels and buttons
- ✅ Layout natural height (no constraint)

#### 4. Accessibility Audit

**Type Filter Buttons**:
- ✅ Screen reader announces selection (aria-live region)
- ✅ Button state announced (aria-pressed)
- ✅ Touch targets 44px minimum
- ✅ Focus visible states work
- ✅ Keyboard navigation works (tab, enter, space)

**Date Labels**:
- ✅ Screen reader text present and correct
- ✅ Font size still readable (contrast ratio maintained)
- ✅ Hidden labels accessible via screen reader

---

## Implementation Checklist

### Phase 1: Energy Type Button Styling
**Estimated Time**: 0.5 hours

- [ ] **FR-V3.3-001**: Energy type button styling
  - [ ] Open `filter-components.css`
  - [ ] Move background/border/color to `.type-filter-button--selected` (lines 168-171)
  - [ ] Remove `.type-filter-button--selected.type-filter-button--power` (lines 174-178)
  - [ ] Remove `.type-filter-button--selected.type-filter-button--gas` (lines 180-184)
  - [ ] Open `TypeFilter.tsx`
  - [ ] Update className (line 73): Remove `type-filter-button--${type}` suffix
  - [ ] Save files
  - [ ] Visual test: Screenshot selected buttons (should be primary color)

### Phase 2: Slider Label Positioning
**Estimated Time**: 0.5 hours

- [ ] **FR-V3.3-002**: Slider label positioning
  - [ ] Open `RangeSlider.tsx`
  - [ ] Remove `<div className="mt-2">` wrapper (line 333)
  - [ ] Open `DateRangeDisplay.tsx`
  - [ ] Update fontSize (line 74): `'0.75rem' : '0.625rem'`
  - [ ] Update marginTop (line 75): `'2px' : '1px'`
  - [ ] Save files
  - [ ] Visual test: Screenshot labels (closer, smaller)
  - [ ] Spacing test: Verify no overlap with buttons

### Phase 3: Testing & QA
**Estimated Time**: 0.5 hours

- [ ] Run all automated tests (ensure no regressions)
- [ ] Visual regression testing (screenshot comparisons)
- [ ] Manual testing on desktop (Chrome, Safari, Firefox)
- [ ] Manual testing on mobile (iOS Safari, Android Chrome)
- [ ] Accessibility audit (axe-core)
- [ ] Readability test (labels readable at smaller size)
- [ ] Fix any issues found

### Phase 4: Documentation & Commit
**Estimated Time**: 0.25 hours

- [ ] Update CHANGELOG.md (V3.3 entry)
- [ ] Commit with detailed message
- [ ] Co-authored-by: Claude

---

## Success Metrics

### Energy Type Button Styling
- ✅ **User satisfaction**: User approves primary color styling
- ✅ **Visual consistency**: All active filter buttons use primary color
- ✅ **Design simplification**: Removed energy-specific color complexity
- ✅ **Icon recognition**: Energy type still identifiable by icon + label

### Slider Label Positioning
- ✅ **Proximity improved**: Labels closer to handles (~50% reduction in gap)
- ✅ **Readability maintained**: Smaller font still readable
- ✅ **No collisions**: Labels don't overlap with buttons
- ✅ **Visual hierarchy improved**: Labels less prominent (auxiliary information)

### Regression Testing
- ✅ **All tests pass**: Existing test suite passes 100%
- ✅ **No functionality lost**: All V3.2 features still work
- ✅ **Accessibility maintained**: WCAG 2.1 AA compliance

---

## Open Questions

### Q1: Font Size Minimum for Mobile?
**Question**: Is 10px (0.625rem) too small for mobile date labels?

**Context**: Reducing from 12px to 10px on mobile

**Options**:
- **A**: Use 10px (as specified) - matches user request "much smaller"
- **B**: Use 11px (0.6875rem) as compromise

**Recommendation**: **Option A** (10px) - user specifically requested "much smaller"

**Fallback**: If 10px proves too small in testing, increase to 11px

**Decision**: **TBD** (test with 10px first, adjust if needed)

---

### Q2: Total Height Adjustment?
**Question**: Should we reduce `totalHeight` in RangeSlider.tsx?

**Current**: `histogramHeight + 60` (60px for slider track + labels)

**New calculation**:
- Slider track: 40px
- Labels: ~10px (reduced from ~20px)
- Total needed: ~50px (vs current 60px)

**Options**:
- **A**: Keep 60px (more whitespace, safer)
- **B**: Reduce to 50px (tighter layout, matches actual needs)

**Recommendation**: **Option A** - Keep 60px initially, monitor for overlap

**Reasoning**: Extra whitespace prevents overlap issues, can optimize later if needed

**Decision**: **Keep 60px** (safer default)

---

## Comparison: V3.2 vs V3.3

| Aspect | V3.2 | V3.3 (New) |
|--------|------|------------|
| **Energy Type Buttons (Selected)** | Energy-specific colors (green/red) | Primary color (matches presets) |
| **Energy Type Buttons (Deselected)** | Transparent, muted | Unchanged |
| **Date Labels - Font Size (Desktop)** | 14px | 12px ← SMALLER |
| **Date Labels - Font Size (Mobile)** | 12px | 10px ← SMALLER |
| **Date Labels - Position (Desktop)** | ~36px from handle center | ~20px ← CLOSER |
| **Date Labels - Position (Mobile)** | ~34px from handle center | ~16px ← CLOSER |
| **Visual Consistency** | Preset buttons use primary, type buttons use energy colors | All active buttons use primary ← CONSISTENT |

---

## Conclusion

**Status**: ✅ **REQUIREMENTS DEFINED - V3.3 REFINEMENTS**

This document specifies **2 refinements** to the V3.2 implementation:

**Medium Priority** (Should Fix):
1. ✅ **Energy type button styling** (FR-V3.3-001) - Match preset buttons, use primary color
2. ✅ **Slider label positioning** (FR-V3.3-002) - Closer, smaller, no overlap

**Estimated Effort**: 1-2 hours (0.125-0.25 days)

**Key Focus**: **Visual consistency** through unified button styling and **layout optimization** through improved label positioning

**Benefits**:
- ✅ **Consistent design language**: All active filter buttons use same color
- ✅ **Improved visual hierarchy**: Labels less prominent, auxiliary information
- ✅ **Better space utilization**: Labels closer to handles, no overlap
- ✅ **User approval**: Styling matches "great looking" preset buttons

**Next Steps**:
1. Review requirements with user (confirm open questions if needed)
2. Implement energy type button styling (Phase 1 - 0.5 hours)
3. Implement slider label positioning (Phase 2 - 0.5 hours)
4. Thorough testing (Phase 3 - 0.5 hours)
5. Commit and document (Phase 4 - 0.25 hours)

---

**Document Status**: ✅ **READY FOR IMPLEMENTATION**

**Open Questions**:
- Q1: 10px font size acceptable on mobile? (test first, adjust if needed)
- Q2: Keep 60px total height or reduce to 50px? (keep 60px initially)

---

## Appendices

### A. Component File Changes Summary

| File | Changes | Lines Changed | Complexity |
|------|---------|---------------|------------|
| **CSS Files** | | | |
| `filter-components.css` | Update type button selected styling | ~8-10 | 🟢 Low |
| **Components** | | | |
| `TypeFilter.tsx` | Remove energy-type class suffix | 1 | 🟢 Low |
| `DateRangeDisplay.tsx` | Reduce font size and margin | 2 | 🟢 Low |
| `RangeSlider.tsx` | Remove mt-2 wrapper | 1 | 🟢 Low |

**Total Estimated LOC**: ~12-14 lines changed (very small change)

---

### B. CSS Changes Detail

**File**: `src/app/components/energy/filter-components.css`

**Lines 168-184 - Before**:
```css
.type-filter-button--selected {
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Energy Type Specific Colors (from energyTypes.ts) */
.type-filter-button--selected.type-filter-button--power {
  background-color: rgba(75, 192, 192, 0.1);
  border-color: rgb(75, 192, 192);
  color: rgb(75, 192, 192);
}

.type-filter-button--selected.type-filter-button--gas {
  background-color: rgba(255, 99, 132, 0.1);
  border-color: rgb(255, 99, 132);
  color: rgb(255, 99, 132);
}
```

**Lines 168-172 - After**:
```css
.type-filter-button--selected {
  background-color: var(--primary-subtle);
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Energy Type Specific Colors - REMOVED */
/* No longer needed - using primary color like preset buttons */
```

---

### C. Visual Design Reference

**Active Button Styling (All Filter Buttons)**:
```css
/* Preset buttons, Type filter buttons (unified) */
.active-filter-button-pattern {
  background-color: var(--primary-subtle);
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
```

**Inactive Button Styling (All Filter Buttons)**:
```css
/* All inactive filter buttons (unified) */
.inactive-filter-button-pattern {
  background-color: transparent;
  border-color: transparent;
  color: var(--foreground-muted);
}
```

---

### D. Label Positioning Diagram

**Before (V3.2)**:
```
[Histogram] (100-120px)
    ↓
  [16px mb-4 gap]
    ↓
[Slider Track] (40px)
   [Handle]
    ↓
  [8px mt-2 gap]
    ↓
  [8px marginTop]
    ↓
  [Date Label] (14px/12px font)
    ↓
  ~36px total gap from handle center
```

**After (V3.3)**:
```
[Histogram] (100-120px)
    ↓
  [16px mb-4 gap]
    ↓
[Slider Track] (40px)
   [Handle]
    ↓
  [2px marginTop] ← MUCH CLOSER
    ↓
  [Date Label] (12px/10px font) ← SMALLER
    ↓
  ~20px total gap from handle center ← 44% REDUCTION
```

---

**END OF REQUIREMENTS SPECIFICATION V3.3**
