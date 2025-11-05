# Requirements Specification: Filter Redesign V3.4 - Button Styling & Mobile UX Refinements

## Document Information
- **Feature Type**: UI Enhancement - VISUAL & UX REFINEMENTS TO V3.3
- **Component**: Timeline Presets, Filter Reset
- **Related Page**: `/src/app/readings/page.tsx`
- **Status**: Requirements Defined - V3.4 Refinements
- **Date**: 2025-11-05
- **Version**: 3.4 (PATCH - Visual & Mobile UX Refinements)
- **Previous Version**: V3.3 (Visual UX Refinements) - See `requirements-v3.3.md`
- **Complexity Level**: 🟢 **LOW** - Simple CSS/config changes with proven solutions

---

## Executive Summary

This document specifies refinements to the V3.3 implementation based on **user feedback focusing on preset button UX and mobile hover state issues**. V3.3 has been completed and implemented. User has now identified **3 issues**:

**Issue Breakdown**:
- **1 Feature Removal**: "All time" preset button is redundant with "Reset filters"
- **1 Visual Enhancement**: Add box styling to inactive preset/type filter buttons
- **1 Mobile UX Bug**: Hover states persist after tapping on mobile (known issue, already solved for bottom bar)

**Impact**: 🟢 **LOW** - Quick refinements using existing patterns

**Estimated Effort**: 1-2 hours (0.125-0.25 days)

---

## User Feedback (Verbatim)

User testing of V3.3 implementation revealed the following issues:

1. **Redundant "All time" Preset**: _"Remove 'All time' preset button - it's redundant with 'Reset filters' button"_
   - Current: 6 preset buttons including "All time"
   - Desired: 5 preset buttons (remove "All time")
   - Reasoning: "Reset filters" button provides same functionality

2. **Box Styling for Inactive Buttons**: _"Surround inactive filters with a box similar to the one used for 'Reset filter' button"_
   - Current: Inactive preset/type filter buttons have transparent background and border
   - Desired: Inactive buttons should have visible border like reset button
   - Reference: Reset button uses `border-color: var(--border-muted)` (line 218, filter-components.css)

3. **Mobile Hover Persistence**: _"Fix mobile hover state persistence issue - buttons stay in hover state after clicking until an outside click (same problem as bottom bar had previously)"_
   - Current: Hover styles apply on touch devices, persist after tap
   - Desired: Hover styles only apply on devices with hover capability
   - Reference: Previously fixed for bottom bar using `@media (hover: hover)` wrapper
   - Commit reference: `d164083` - "fix: wrap all hover effects in @media (hover: hover)"
   - Documentation: `feature-dev/CHANGELOG.md` lines 292-310

---

## Problem Statement

### Problem 1: Redundant "All time" Preset

**Current State** (V3.3):
- 6 preset buttons in `TIMELINE_PRESETS` array:
  - Last 7 days, Last 30 days, Last 90 days
  - This month, This year, **All time**
- "All time" preset sets date range to `[new Date(0), new Date(8640000000000000)]` (Unix epoch to max JS date)
- "Reset filters" button also clears date range to full range

**Issues**:
- ❌ **Functional duplication**: Both "All time" and "Reset filters" achieve same result
- ❌ **UI clutter**: Extra button that serves no unique purpose
- ❌ **User confusion**: Two buttons for same action

**User Expectation**:
- ✅ **5 preset buttons**: Remove "All time" from array
- ✅ **Clear intent**: Reset button is for resetting, presets are for specific ranges
- ✅ **Simpler UI**: Less visual noise, easier to scan

---

### Problem 2: Inactive Button Box Styling

**Current State** (V3.3):
- **Inactive preset buttons** (lines 74-78, filter-components.css):
  ```css
  background-color: transparent;
  border-color: transparent;
  color: var(--foreground-muted);
  ```
- **Inactive type filter buttons** (lines 140-144, filter-components.css):
  ```css
  background-color: transparent;
  border-color: transparent;
  color: var(--foreground-muted);
  ```
- **Reset button** (lines 216-220, filter-components.css):
  ```css
  background-color: transparent;
  border-color: var(--border-muted); /* ← VISIBLE BORDER */
  color: var(--foreground-muted);
  ```

**Issues**:
- ❌ **Visual inconsistency**: Reset button has visible border, other inactive buttons don't
- ❌ **Lack of affordance**: Transparent borders make buttons blend into background
- ❌ **Unclear clickability**: Users may not recognize inactive buttons as interactive

**User Expectation**:
- ✅ **Consistent box styling**: All inactive buttons should have visible border
- ✅ **Better affordance**: Box outline signals "this is a button"
- ✅ **Match reset button**: Use same `border-color: var(--border-muted)` pattern

**Visual Comparison**:

**Before** (V3.3):
```
Inactive preset button:   [  Last 7 days  ]  ← no visible border
Inactive type button:     [  Power  ]  ← no visible border
Reset button:             │ Reset Filters │  ← visible border (muted)
```

**After** (V3.4):
```
Inactive preset button:   │ Last 7 days │  ← visible border (matches reset)
Inactive type button:     │ Power │  ← visible border (matches reset)
Reset button:             │ Reset Filters │  ← unchanged
```

---

### Problem 3: Mobile Hover State Persistence

**Current State** (V3.3):
- **Preset buttons** (lines 91-95, filter-components.css):
  ```css
  .preset-button:hover:not(:disabled) {
    background-color: var(--background-hover);
    color: var(--foreground);
    transform: translateY(-1px);
  }
  ```
- **Type filter buttons** (lines 162-166, filter-components.css):
  ```css
  .type-filter-button:hover:not(:disabled) {
    background-color: var(--background-hover);
    border-color: var(--border);
    color: var(--foreground);
  }
  ```
- **Problem**: On touch devices (mobile/tablet), tapping a button triggers hover state, which **persists after tap** until user taps elsewhere

**Issues**:
- ❌ **Stuck hover state**: Button remains in hover appearance after tap
- ❌ **Poor mobile UX**: Confusing visual feedback (looks active but isn't)
- ❌ **Inconsistent with app**: Bottom bar already fixed this issue

**Previous Solution** (from commit `d164083`):
- Wrapped all hover effects in `@media (hover: hover)` media query
- This media query only matches devices with hover capability (mice, trackpads)
- Touch-only devices (phones, tablets) don't match this query
- Result: Hover styles don't apply on touch devices, no persistence issue

**Reference Implementation** (from `src/app/layout/button.css`, lines 15-21):
```css
@media (hover: hover) {
  button:hover:not(:disabled) {
    background-color: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
}
```

**Reference Implementation** (from `src/app/layout/navigation.css`, lines 41-45):
```css
@media (hover: hover) {
  .logo-clickable:hover {
    opacity: 0.8;
  }
}
```

**User Expectation**:
- ✅ **No hover on touch**: Hover styles don't apply on mobile/tablet
- ✅ **Consistent with app**: Matches bottom bar, sidebar, navigation behavior
- ✅ **Clean mobile UX**: Tap feedback via :active state only

**Technical Reference**:
- MDN Docs: [hover media feature](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover)
- Stack Overflow: [Button keeps hover effect after being clicked on mobile screens](https://stackoverflow.com/questions/70375065/button-keeps-hover-effect-after-being-clicked-on-mobile-screens)
- Changelog: `feature-dev/CHANGELOG.md` lines 292-310

---

## Functional Requirements (V3.4 Refinements)

### FR-V3.4-001: Remove "All time" Preset Button
**Priority**: 🟢 **LOW**
**Status**: Feature Removal
**Complexity**: 🟢 **TRIVIAL**

**Current Behavior**:
- `TIMELINE_PRESETS` array contains 6 presets
- "All time" preset at index 5 (lines 84-95, timelinePresets.ts)

**Expected Behavior**:
- `TIMELINE_PRESETS` array contains 5 presets
- "All time" preset removed from array
- "Reset filters" button provides all-time functionality

**Code Changes**:

**File**: `src/app/constants/timelinePresets.ts`

**Current** (lines 84-95):
```typescript
{
  id: 'all-time',
  label: 'All time',
  calculateRange: () => {
    // All time means no date filtering - return very wide range
    // Will be handled specially in component logic
    return {
      start: new Date(0), // Unix epoch
      end: new Date(8640000000000000), // Max JS date
    };
  },
},
```

**Change**: **DELETE lines 84-95** (remove entire "All time" preset object)

**Also Remove** (lines 106-110):
```typescript
/**
 * Check if a preset is the "All time" preset
 */
export const isAllTimePreset = (presetId: string | null): boolean => {
  return presetId === 'all-time';
};
```

**Reason**: Utility function `isAllTimePreset()` no longer needed after removing preset.

**Result**:
- `TIMELINE_PRESETS` array reduced from 6 to 5 elements
- 5 preset buttons displayed: Last 7/30/90 days, This month, This year
- No functionality lost (reset button provides all-time range)

**Acceptance Criteria**:
- ✅ `TIMELINE_PRESETS` array contains exactly 5 presets
- ✅ "All time" preset removed from array
- ✅ `isAllTimePreset()` utility function removed
- ✅ 5 preset buttons render (not 6)
- ✅ Preset buttons still work correctly (animation, selection)
- ✅ Reset button still clears date range to full range
- ✅ No TypeScript errors (no references to 'all-time' preset)
- ✅ Tests updated (if any test references 'all-time' preset)

**Testing**:
- ✅ Visual test: Verify 5 buttons render (screenshot)
- ✅ Manual test: Click each preset (all work correctly)
- ✅ Manual test: Click reset button (clears to full range)
- ✅ Grep test: Search codebase for 'all-time' (should find zero references after removal)
- ✅ Unit tests: Verify TIMELINE_PRESETS.length === 5

---

### FR-V3.4-002: Add Box Styling to Inactive Filter Buttons
**Priority**: 🟡 **MEDIUM**
**Status**: Visual Enhancement
**Complexity**: 🟢 **TRIVIAL**

**Current Behavior**:
- Inactive preset/type filter buttons have `border-color: transparent`
- No visible border/box around buttons
- Only reset button has visible border (`var(--border-muted)`)

**Expected Behavior**:
- Inactive preset/type filter buttons have visible border
- Use same border color as reset button: `var(--border-muted)`
- Maintains transparent background (no background color)
- Active state unchanged (primary color, no border visibility change)

**Code Changes**:

**File**: `src/app/components/energy/filter-components.css`

**Change 1: Preset Button Inactive State** (lines 74-78)

**Current**:
```css
/* Inactive State - NO COLOR */
background-color: transparent;
border-color: transparent;
color: var(--foreground-muted);
cursor: pointer;
```

**Change to**:
```css
/* Inactive State - WITH BOX */
background-color: transparent;
border-color: var(--border-muted); /* ← ADD VISIBLE BORDER */
color: var(--foreground-muted);
cursor: pointer;
```

---

**Change 2: Type Filter Button Deselected State** (lines 140-144)

**Current**:
```css
/* Deselected State - NO COLOR */
background-color: transparent;
border-color: transparent;
color: var(--foreground-muted);
cursor: pointer;
```

**Change to**:
```css
/* Deselected State - WITH BOX */
background-color: transparent;
border-color: var(--border-muted); /* ← ADD VISIBLE BORDER */
color: var(--foreground-muted);
cursor: pointer;
```

---

**Summary**:
- Change `border-color: transparent` → `border-color: var(--border-muted)`
- Apply to both `.preset-button` and `.type-filter-button` inactive states
- No other changes needed (background, color, padding all unchanged)

**Visual Design Specification**:

**Border Color**: `var(--border-muted)` (already defined in theme CSS variables)
- Light mode: Subtle gray border (matches reset button)
- Dark mode: Subtle light gray border (matches reset button)

**Border Width**: `2px` (unchanged from existing)

**Border Radius**: `0.75rem` (12px, unchanged from existing)

**Box Shadow**: None (unchanged)

**Acceptance Criteria**:
- ✅ Inactive preset buttons have visible border (`var(--border-muted)`)
- ✅ Inactive type filter buttons have visible border (`var(--border-muted)`)
- ✅ Border color matches reset button
- ✅ Border width and radius unchanged (2px, 0.75rem)
- ✅ Active state unchanged (primary color, box shadow)
- ✅ Hover state unchanged (background color change still works)
- ✅ Background remains transparent (no color)
- ✅ Visual consistency across all filter buttons
- ✅ Light and dark mode both correct

**Testing**:
- ✅ Visual test: Screenshot inactive buttons (border visible)
- ✅ Visual comparison: Inactive preset vs reset button (borders match)
- ✅ Manual test: Click button (active state still works)
- ✅ Manual test: Hover button (hover state still works)
- ✅ Theme test: Toggle dark mode (border visible in both themes)
- ✅ Responsive test: Mobile and desktop (borders scale correctly)

---

### FR-V3.4-003: Fix Mobile Hover State Persistence
**Priority**: 🔴 **HIGH** (UX bug)
**Status**: Mobile UX Fix
**Complexity**: 🟢 **TRIVIAL** (known solution)

**Current Behavior**:
- Hover styles defined with `:hover` pseudo-class (no media query wrapper)
- On touch devices, tapping button triggers `:hover` state
- Hover state **persists after tap** until user taps elsewhere
- Creates "stuck hover" appearance (confusing UX)

**Expected Behavior**:
- Hover styles only apply on devices with hover capability (mice, trackpads)
- Touch devices (phones, tablets) don't trigger hover styles
- No hover state persistence on mobile
- Tap feedback via `:active` state only (not `:hover`)

**Code Changes**:

**File**: `src/app/components/energy/filter-components.css`

**Change 1: Preset Button Hover** (lines 91-95)

**Current**:
```css
.preset-button:hover:not(:disabled) {
  background-color: var(--background-hover);
  color: var(--foreground);
  transform: translateY(-1px);
}
```

**Change to**:
```css
@media (hover: hover) {
  .preset-button:hover:not(:disabled) {
    background-color: var(--background-hover);
    color: var(--foreground);
    transform: translateY(-1px);
  }
}
```

---

**Change 2: Type Filter Button Hover** (lines 162-166)

**Current**:
```css
.type-filter-button:hover:not(:disabled) {
  background-color: var(--background-hover);
  border-color: var(--border);
  color: var(--foreground);
}
```

**Change to**:
```css
@media (hover: hover) {
  .type-filter-button:hover:not(:disabled) {
    background-color: var(--background-hover);
    border-color: var(--border);
    color: var(--foreground);
  }
}
```

---

**Change 3: Reset Button Hover** (lines 229-233)

**Current**:
```css
.filter-reset-button:hover:not(:disabled) {
  background-color: var(--background-hover);
  border-color: var(--border);
  color: var(--foreground);
}
```

**Change to**:
```css
@media (hover: hover) {
  .filter-reset-button:hover:not(:disabled) {
    background-color: var(--background-hover);
    border-color: var(--border);
    color: var(--foreground);
  }
}
```

---

**Summary**:
- Wrap all 3 hover rules in `@media (hover: hover) { ... }`
- No changes to hover styles themselves (only wrapping)
- Matches pattern used in button.css, navigation.css, sidebar.css

**How It Works**:

**Desktop/Mouse** (hover capability):
- `@media (hover: hover)` matches ✅
- Hover styles apply when mouse hovers over button
- Normal desktop UX

**Mobile/Touch** (no hover capability):
- `@media (hover: hover)` doesn't match ❌
- Hover styles never apply, even on tap
- Touch feedback via `:active` state only
- No stuck hover state

**Browser Support**:
- Chrome/Edge: ✅ Full support
- Safari: ✅ Full support
- Firefox: ✅ Full support
- Mobile browsers: ✅ Full support (iOS Safari, Chrome Android)

**Acceptance Criteria**:
- ✅ All hover rules wrapped in `@media (hover: hover)`
- ✅ Desktop (mouse): Hover styles apply on hover
- ✅ Mobile (touch): Hover styles never apply
- ✅ Mobile (touch): No stuck hover after tap
- ✅ Active state still works on mobile (tap feedback)
- ✅ Consistent with bottom bar, sidebar, navigation (already fixed)
- ✅ No visual regression on desktop
- ✅ All 3 button types fixed (preset, type filter, reset)

**Testing**:
- ✅ Desktop test: Hover buttons with mouse (hover style applies)
- ✅ Mobile test: Tap button, observe no hover state after tap
- ✅ Mobile test: Tap button, observe :active state during tap
- ✅ Mobile test: Tap button, then tap elsewhere (no stuck hover)
- ✅ DevTools test: Toggle device emulation (hover on/off)
- ✅ Real device test: Test on actual iOS/Android device
- ✅ Cross-browser test: Chrome, Safari, Firefox (all work)

---

## Non-Functional Requirements (V3.4)

### NFR-V3.4-1: No Regression in Functionality
**Priority**: 🔴 **CRITICAL**

**Requirements**:
- ✅ All V3.3 features remain functional after refinements
- ✅ Preset buttons work (animate slider handles)
  - 5 presets instead of 6 (expected change)
- ✅ Type filter multi-select works (Power and Gas)
- ✅ Reset button works (clears all filters)
- ✅ Slider drag works (V3.1 fix preserved)
- ✅ Date labels work (V3.1 overflow fix preserved)
- ✅ Histogram visualization unchanged
- ✅ Keyboard navigation unchanged
- ✅ Accessibility (ARIA attributes) unchanged
- ✅ All existing tests still pass

---

### NFR-V3.4-2: Visual Consistency
**Priority**: 🟡 **MEDIUM**

**Requirements**:
- ✅ **All inactive filter buttons have consistent styling**:
  - Preset buttons (inactive): Transparent background, muted border ← NEW
  - Type filter buttons (deselected): Transparent background, muted border ← NEW
  - Reset button (inactive): Transparent background, muted border ← UNCHANGED
- ✅ **Active/selected states consistent**:
  - Preset buttons (active): Primary color
  - Type filter buttons (selected): Primary color
  - Reset button: Muted (unchanged)
- ✅ **All buttons have visible borders**:
  - No transparent borders (all use `var(--border-muted)` when inactive)

---

### NFR-V3.4-3: Mobile UX Parity
**Priority**: 🔴 **CRITICAL**

**Requirements**:
- ✅ **No hover state persistence on mobile**:
  - Filter buttons match bottom bar behavior (no stuck hover)
  - Consistent with navigation, sidebar, profile menu
- ✅ **Touch feedback still works**:
  - :active state provides tap feedback
  - No loss of interactivity on mobile
- ✅ **Responsive design maintained**:
  - Buttons scale correctly on mobile
  - Touch targets ≥ 44x44px (unchanged)

---

### NFR-V3.4-4: Accessibility Maintained
**Priority**: 🔴 **CRITICAL**

**Requirements**:
- ✅ **Border contrast ratio**:
  - `var(--border-muted)` meets WCAG 2.1 AA (3:1 for UI components)
- ✅ **Keyboard navigation**:
  - Tab order unchanged
  - Focus states unchanged
- ✅ **Screen reader**:
  - ARIA attributes unchanged
  - Announcements unchanged
- ✅ **Touch targets**:
  - ≥ 44x44px maintained (unchanged)

---

## Testing Strategy (V3.4)

### Test Categories

#### 1. Preset Removal Verification (FR-V3.4-001)

**Preset Button Count**:
- ✅ Visual test: Count buttons (should be 5, not 6)
- ✅ Screenshot: Before (6 buttons) vs After (5 buttons)
- ✅ Unit test: `TIMELINE_PRESETS.length === 5`
- ✅ Manual test: Each preset works (Last 7/30/90, This month/year)

**No References to 'all-time'**:
- ✅ Grep test: Search for `'all-time'` string (zero results)
- ✅ Grep test: Search for `isAllTimePreset` (zero results)
- ✅ TypeScript test: No compilation errors (no broken references)

**Reset Button Functionality**:
- ✅ Manual test: Click reset (clears date range to full)
- ✅ Manual test: Reset button provides all-time functionality

---

#### 2. Box Styling Verification (FR-V3.4-002)

**Visual Border Testing**:
- ✅ Visual test: Inactive preset button has visible border
- ✅ Visual test: Inactive type filter button has visible border
- ✅ Side-by-side comparison: Inactive preset vs reset button (borders match)
- ✅ Screenshot: Before (no border) vs After (border visible)

**Color Consistency**:
- ✅ DevTools test: Inspect border-color (should be `var(--border-muted)`)
- ✅ Theme test: Toggle dark mode (border visible in both themes)
- ✅ Contrast test: Border meets 3:1 contrast ratio (WCAG 2.1 AA)

**State Transitions**:
- ✅ Manual test: Click inactive button → becomes active (border changes to primary)
- ✅ Manual test: Click active button → becomes inactive (border changes to muted)
- ✅ Manual test: Hover inactive button (hover style still works)

---

#### 3. Mobile Hover Fix Verification (FR-V3.4-003)

**Desktop Testing** (with mouse):
- ✅ Manual test: Hover preset button (hover style applies)
- ✅ Manual test: Hover type filter button (hover style applies)
- ✅ Manual test: Hover reset button (hover style applies)
- ✅ Visual test: Hover effects match V3.3 behavior

**Mobile Testing** (touch device):
- ✅ Real device test: Tap preset button (no hover after tap)
- ✅ Real device test: Tap type filter button (no hover after tap)
- ✅ Real device test: Tap reset button (no hover after tap)
- ✅ Real device test: Tap button, then tap elsewhere (no stuck hover)
- ✅ Visual test: :active state works during tap (visual feedback)

**DevTools Testing**:
- ✅ DevTools: Enable device emulation (mobile viewport)
- ✅ DevTools: Inspect hover media query (should not match)
- ✅ DevTools: Tap button, observe computed styles (no hover styles)
- ✅ DevTools: Switch to desktop, observe computed styles (hover styles present)

**Cross-Browser Testing**:
- ✅ Chrome (desktop): Hover works
- ✅ Safari (desktop): Hover works
- ✅ Firefox (desktop): Hover works
- ✅ iOS Safari (mobile): No hover persistence
- ✅ Chrome Android (mobile): No hover persistence

---

#### 4. Regression Testing

**Existing Functionality**:
- ✅ Preset buttons: Last 7/30/90 days work
- ✅ Preset buttons: This month/year work
- ✅ Preset buttons: Animate slider handles
- ✅ Type filter: Multi-select works (Power + Gas)
- ✅ Reset button: Clears all filters
- ✅ Slider: Drag works (V3.1 fix)
- ✅ Date labels: Overflow fix preserved (V3.1)
- ✅ Histogram: Updates on filter change
- ✅ Keyboard navigation: Tab, Enter, Space all work
- ✅ ARIA attributes: Screen reader announces correctly

**Automated Tests**:
- ✅ Run `npm test` (all tests pass)
- ✅ No new test failures introduced
- ✅ Update tests if any reference 'all-time' preset

---

#### 5. Responsive Design Verification

**Mobile** (<640px):
- ✅ Preset buttons: 5 buttons visible, horizontal scroll works
- ✅ Type filter buttons: Full width, stacked vertically
- ✅ All buttons: Touch targets ≥ 44x44px
- ✅ Borders: Visible and correct color
- ✅ No hover persistence on tap

**Desktop** (≥640px):
- ✅ Preset buttons: Flex wrap, 2 rows
- ✅ Type filter buttons: Horizontal row
- ✅ Borders: Visible and correct color
- ✅ Hover states: Apply on mouse hover

---

#### 6. Accessibility Audit

**Visual Contrast**:
- ✅ Border color: `var(--border-muted)` meets 3:1 ratio
- ✅ Text color: `var(--foreground-muted)` meets 4.5:1 ratio
- ✅ Active state: Primary color meets 4.5:1 ratio

**Keyboard Navigation**:
- ✅ Tab order: Correct sequence (presets → type filters → reset)
- ✅ Focus visible: Outlines visible on focus
- ✅ Enter/Space: Activate buttons

**Screen Reader**:
- ✅ Preset buttons: "Select Last 7 days" announced
- ✅ Type filter buttons: "Power, not selected" announced
- ✅ Reset button: "Reset all filters, disabled/enabled" announced
- ✅ Live region: Range changes announced

---

## Implementation Checklist

### Phase 1: Remove "All time" Preset
**Estimated Time**: 0.25 hours

- [ ] **FR-V3.4-001**: Remove "All time" preset
  - [ ] Open `src/app/constants/timelinePresets.ts`
  - [ ] Delete "All time" preset object (lines 84-95)
  - [ ] Delete `isAllTimePreset()` utility function (lines 106-110)
  - [ ] Save file
  - [ ] Verify TypeScript compiles (no errors)
  - [ ] Run tests: `npm test` (update tests if needed)
  - [ ] Grep for 'all-time' references (should be zero)
  - [ ] Visual test: Verify 5 buttons render

### Phase 2: Add Box Styling to Inactive Buttons
**Estimated Time**: 0.25 hours

- [ ] **FR-V3.4-002**: Box styling for inactive buttons
  - [ ] Open `src/app/components/energy/filter-components.css`
  - [ ] Update preset button (line 76): `border-color: var(--border-muted);`
  - [ ] Update type filter button (line 142): `border-color: var(--border-muted);`
  - [ ] Save file
  - [ ] Visual test: Screenshot inactive buttons (borders visible)
  - [ ] Theme test: Toggle dark mode (borders visible)
  - [ ] Manual test: Click buttons (active state works)

### Phase 3: Fix Mobile Hover Persistence
**Estimated Time**: 0.5 hours

- [ ] **FR-V3.4-003**: Mobile hover fix
  - [ ] Open `src/app/components/energy/filter-components.css`
  - [ ] Wrap preset hover (lines 91-95) in `@media (hover: hover)`
  - [ ] Wrap type filter hover (lines 162-166) in `@media (hover: hover)`
  - [ ] Wrap reset hover (lines 229-233) in `@media (hover: hover)`
  - [ ] Save file
  - [ ] Desktop test: Hover works with mouse
  - [ ] Mobile test: Tap button, no hover persistence
  - [ ] DevTools test: Toggle device emulation
  - [ ] Real device test: iOS/Android

### Phase 4: Testing & QA
**Estimated Time**: 0.5 hours

- [ ] Run all automated tests: `npm test`
- [ ] Visual regression testing (screenshot comparisons)
- [ ] Manual testing on desktop (Chrome, Safari, Firefox)
- [ ] Manual testing on mobile (iOS Safari, Android Chrome)
- [ ] Accessibility audit (axe-core)
- [ ] Grep for 'all-time' (zero results)
- [ ] Fix any issues found

### Phase 5: Documentation & Commit
**Estimated Time**: 0.25 hours

- [ ] Update CHANGELOG.md (V3.4 entry)
- [ ] Commit with detailed message:
  ```
  refactor(filters): V3.4 refinements - remove redundant preset, add box styling, fix mobile hover

  - Remove "All time" preset (redundant with reset button)
  - Add visible border to inactive preset/type filter buttons
  - Fix mobile hover state persistence (wrap in @media (hover: hover))
  - Consistent styling across all filter buttons
  - Mobile UX parity with bottom bar/navigation

  User feedback: "All time redundant", "add box like reset button", "hover stuck on mobile"

  Co-authored-by: Claude <noreply@anthropic.com>
  🤖 Generated with Claude Code (https://claude.com/claude-code)
  ```

---

## Success Metrics

### Preset Removal
- ✅ **Cleaner UI**: 5 buttons instead of 6 (16.7% reduction)
- ✅ **No functional loss**: Reset button provides all-time functionality
- ✅ **User satisfaction**: "Redundancy removed"

### Box Styling
- ✅ **Visual consistency**: All inactive buttons have visible borders
- ✅ **Better affordance**: Box outline signals interactivity
- ✅ **User satisfaction**: "Looks like reset button now"

### Mobile Hover Fix
- ✅ **No stuck hover**: Buttons return to normal state after tap
- ✅ **Consistent with app**: Matches bottom bar, navigation, sidebar
- ✅ **User satisfaction**: "Mobile UX feels clean now"

### Regression Testing
- ✅ **All tests pass**: Existing test suite passes 100%
- ✅ **No functionality lost**: All V3.3 features still work
- ✅ **Accessibility maintained**: WCAG 2.1 AA compliance

---

## Code Changes Summary

### Files Modified (3 files)

| File | Changes | Lines Changed | Complexity |
|------|---------|---------------|------------|
| **Constants** | | | |
| `src/app/constants/timelinePresets.ts` | Remove "All time" preset + utility function | -17 lines | 🟢 Trivial |
| **CSS** | | | |
| `src/app/components/energy/filter-components.css` | Add borders to inactive buttons, wrap hover in media query | ~8 lines | 🟢 Trivial |

**Total Estimated LOC**: ~25 lines changed (very small change)

---

## CSS Changes Detail

### File: `src/app/components/energy/filter-components.css`

#### Change 1: Preset Button Inactive Border (line 76)

**Before**:
```css
border-color: transparent;
```

**After**:
```css
border-color: var(--border-muted);
```

---

#### Change 2: Type Filter Button Inactive Border (line 142)

**Before**:
```css
border-color: transparent;
```

**After**:
```css
border-color: var(--border-muted);
```

---

#### Change 3: Preset Button Hover (lines 91-95)

**Before**:
```css
.preset-button:hover:not(:disabled) {
  background-color: var(--background-hover);
  color: var(--foreground);
  transform: translateY(-1px);
}
```

**After**:
```css
@media (hover: hover) {
  .preset-button:hover:not(:disabled) {
    background-color: var(--background-hover);
    color: var(--foreground);
    transform: translateY(-1px);
  }
}
```

---

#### Change 4: Type Filter Button Hover (lines 162-166)

**Before**:
```css
.type-filter-button:hover:not(:disabled) {
  background-color: var(--background-hover);
  border-color: var(--border);
  color: var(--foreground);
}
```

**After**:
```css
@media (hover: hover) {
  .type-filter-button:hover:not(:disabled) {
    background-color: var(--background-hover);
    border-color: var(--border);
    color: var(--foreground);
  }
}
```

---

#### Change 5: Reset Button Hover (lines 229-233)

**Before**:
```css
.filter-reset-button:hover:not(:disabled) {
  background-color: var(--background-hover);
  border-color: var(--border);
  color: var(--foreground);
}
```

**After**:
```css
@media (hover: hover) {
  .filter-reset-button:hover:not(:disabled) {
    background-color: var(--background-hover);
    border-color: var(--border);
    color: var(--foreground);
  }
}
```

---

## Visual Design Reference

### Inactive Button Styling (All Filter Buttons)

**Unified Pattern** (V3.4):
```css
/* All inactive filter buttons */
.inactive-filter-button-pattern {
  background-color: transparent;
  border-color: var(--border-muted); /* ← NEW: Visible border */
  color: var(--foreground-muted);
  border-width: 2px;
  border-style: solid;
  border-radius: 0.75rem;
}
```

**Applies to**:
- Preset buttons (inactive)
- Type filter buttons (deselected)
- Reset button (unchanged - already has this pattern)

---

### Active/Selected Button Styling

**No changes** to active states:
```css
/* Preset buttons (active) */
.preset-button--active {
  background-color: var(--primary);
  border-color: var(--primary);
  color: var(--primary-foreground);
}

/* Type filter buttons (selected) */
.type-filter-button--selected {
  background-color: var(--primary-subtle);
  border-color: var(--primary);
  color: var(--primary);
}
```

---

### Hover Styling (Desktop Only)

**Pattern** (wrapped in media query):
```css
@media (hover: hover) {
  .filter-button:hover:not(:disabled) {
    background-color: var(--background-hover);
    /* other hover styles... */
  }
}
```

**Result**:
- Desktop (mouse): Hover styles apply ✅
- Mobile (touch): Hover styles never apply ❌

---

## Comparison: V3.3 vs V3.4

| Aspect | V3.3 | V3.4 (New) |
|--------|------|------------|
| **Preset Button Count** | 6 (includes "All time") | 5 (removed "All time") ← LESS CLUTTER |
| **Inactive Preset Button Border** | Transparent (invisible) | Muted (visible) ← NEW BOX |
| **Inactive Type Filter Button Border** | Transparent (invisible) | Muted (visible) ← NEW BOX |
| **Reset Button Border** | Muted (visible) | Unchanged |
| **Desktop Hover (preset buttons)** | Applies on hover | Applies on hover ← UNCHANGED |
| **Mobile Hover (preset buttons)** | Stuck after tap | No hover on touch ← FIXED |
| **Desktop Hover (type filter)** | Applies on hover | Applies on hover ← UNCHANGED |
| **Mobile Hover (type filter)** | Stuck after tap | No hover on touch ← FIXED |
| **Desktop Hover (reset button)** | Applies on hover | Applies on hover ← UNCHANGED |
| **Mobile Hover (reset button)** | Stuck after tap | No hover on touch ← FIXED |
| **Visual Consistency** | Reset has border, others don't | All inactive buttons have border ← CONSISTENT |

---

## Known Issues & Limitations

### Hover Media Query Support

**Browser Support**:
- ✅ Chrome/Edge: Full support since v41 (2015)
- ✅ Safari: Full support since v9 (2015)
- ✅ Firefox: Full support since v64 (2018)
- ✅ iOS Safari: Full support since v9 (2015)
- ✅ Chrome Android: Full support since v41 (2015)

**Fallback**:
- No fallback needed (>99% browser support)
- Old browsers (IE11) would show hover on touch (acceptable degradation)
- App doesn't support IE11 anyway (Next.js 16 requirement)

**Reference**: [Can I Use: hover media feature](https://caniuse.com/css-media-interaction)

---

## Open Questions

### Q1: Should "Reset filters" clear to full range or empty filters?

**Question**: When user clicks "Reset filters", should date range clear to full range (all-time) or clear to empty (no filters)?

**Context**: With "All time" preset removed, reset button is the only way to get all-time range.

**Current Behavior**: Reset button clears to full range (all measurements).

**Options**:
- **A**: Keep current behavior (clear to full range) - recommended
- **B**: Change to empty filters (user must manually set full range)

**Recommendation**: **Option A** - Keep current behavior

**Reasoning**:
- User explicitly asked to remove "All time" preset because reset button provides same functionality
- Implies reset should clear to full range (all-time equivalent)
- Matches user mental model: "reset" = "show everything"

**Decision**: **Keep current behavior** (clear to full range)

---

### Q2: Should we add visual separator between preset sections?

**Question**: With 5 presets, should we visually group them (e.g., "Recent" vs "Calendar")?

**Context**:
- "Last X days" presets (7/30/90) are relative ranges
- "This month/year" are calendar-based ranges
- Could add visual separator or label

**Options**:
- **A**: Keep flat list (no grouping) - recommended
- **B**: Add separator between "Last 90 days" and "This month"
- **C**: Add group labels ("Recent" / "Calendar")

**Recommendation**: **Option A** - Keep flat list

**Reasoning**:
- Only 5 buttons (small enough to scan quickly)
- Adding complexity for minimal benefit
- User didn't request grouping
- Simpler is better

**Decision**: **Keep flat list** (no grouping)

---

## Conclusion

**Status**: ✅ **REQUIREMENTS DEFINED - V3.4 REFINEMENTS**

This document specifies **3 refinements** to the V3.3 implementation:

**Low Priority** (Nice-to-Have):
1. ✅ **Remove "All time" preset** (FR-V3.4-001) - Reduce clutter, use reset button

**Medium Priority** (Should Fix):
2. ✅ **Add box styling to inactive buttons** (FR-V3.4-002) - Visual consistency

**High Priority** (Must Fix - UX Bug):
3. ✅ **Fix mobile hover persistence** (FR-V3.4-003) - Known issue, proven solution

**Estimated Effort**: 1-2 hours (0.125-0.25 days)

**Key Focus**: **UI simplification** (fewer buttons), **visual consistency** (unified box styling), and **mobile UX parity** (no stuck hover)

**Benefits**:
- ✅ **Cleaner UI**: Less visual noise (5 buttons vs 6)
- ✅ **Consistent design**: All inactive buttons have box outline
- ✅ **Better mobile UX**: No hover state persistence (matches rest of app)
- ✅ **User satisfaction**: All 3 feedback points addressed

**Next Steps**:
1. Review requirements with user (confirm approach)
2. Implement preset removal (Phase 1 - 0.25 hours)
3. Implement box styling (Phase 2 - 0.25 hours)
4. Implement hover fix (Phase 3 - 0.5 hours)
5. Thorough testing (Phase 4 - 0.5 hours)
6. Commit and document (Phase 5 - 0.25 hours)

---

**Document Status**: ✅ **READY FOR IMPLEMENTATION**

**Open Questions**:
- Q1: Reset button clears to full range? (YES - keep current behavior)
- Q2: Add visual separator between presets? (NO - keep flat list)

---

## References

### Previous Fixes
- **Commit**: `d164083` - "fix: wrap all hover effects in @media (hover: hover)"
- **Changelog**: `feature-dev/CHANGELOG.md` lines 292-310
- **Files Fixed Previously**: button.css, navigation.css, sidebar.css, profile-menu.css, bottom-nav.css

### Technical References
- **MDN**: [hover media feature](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover)
- **Stack Overflow**: [Button keeps hover effect after being clicked on mobile](https://stackoverflow.com/questions/70375065/button-keeps-hover-effect-after-being-clicked-on-mobile-screens)
- **Can I Use**: [hover media feature support](https://caniuse.com/css-media-interaction)

### Related Documents
- **V3.3 Requirements**: `feature-dev/filter-redesign/requirements-v3.3.md`
- **V3.2 Requirements**: `feature-dev/filter-redesign/requirements-v3.2.md`
- **V3.1 Requirements**: `feature-dev/filter-redesign/requirements-v3.1.md`
- **V3 Architecture**: `feature-dev/filter-redesign/architecture-v3.md`
- **Visual Design**: `feature-dev/filter-redesign/visual-design-v3.md`

---

**END OF REQUIREMENTS SPECIFICATION V3.4**
