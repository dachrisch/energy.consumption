# Test Scenarios: Filter Redesign V3.4

## Document Information
- **Version**: V3.4
- **Date**: 2025-11-05
- **Related Requirements**: `requirements-v3.4.md`
- **Test Focus**: Preset removal, box styling, mobile hover fix

---

## Test Scenario Categories

### 1. Preset Button Count (FR-V3.4-001)

#### TS-V3.4-001: Verify 5 Preset Buttons Render
**Priority**: High
**Type**: Visual Verification

**Preconditions**:
- Navigate to Readings page
- Filters section visible

**Steps**:
1. Count preset buttons in timeline section
2. Verify button labels

**Expected Result**:
- Exactly 5 preset buttons visible
- Labels: "Last 7 days", "Last 30 days", "Last 90 days", "This month", "This year"
- No "All time" button present

**Pass Criteria**:
- ✅ Button count === 5
- ✅ No "All time" button
- ✅ All 5 buttons render correctly

---

#### TS-V3.4-002: Verify All Presets Functional
**Priority**: High
**Type**: Functional Test

**Preconditions**:
- Readings page loaded
- Energy data present

**Steps**:
1. Click "Last 7 days" → Verify slider animates to last 7 days
2. Click "Last 30 days" → Verify slider animates to last 30 days
3. Click "Last 90 days" → Verify slider animates to last 90 days
4. Click "This month" → Verify slider animates to current month
5. Click "This year" → Verify slider animates to current year

**Expected Result**:
- Each preset animates slider handles correctly
- Date range display updates
- Active state highlights clicked preset
- Table filters update after 200ms debounce

**Pass Criteria**:
- ✅ All 5 presets animate slider correctly
- ✅ No errors in console
- ✅ Active state highlights correctly

---

#### TS-V3.4-003: Verify No References to "all-time"
**Priority**: Medium
**Type**: Code Verification

**Preconditions**:
- Code changes implemented

**Steps**:
1. Run `grep -r "all-time" src/` in terminal
2. Run `grep -r "isAllTimePreset" src/` in terminal
3. Check TypeScript compilation: `npm run build`

**Expected Result**:
- Zero results for "all-time" string search
- Zero results for "isAllTimePreset" function search
- TypeScript compiles without errors

**Pass Criteria**:
- ✅ No "all-time" references in codebase
- ✅ No "isAllTimePreset" references
- ✅ Build succeeds

---

#### TS-V3.4-004: Verify Reset Button Provides All-Time Functionality
**Priority**: High
**Type**: Functional Test

**Preconditions**:
- Readings page loaded
- Apply a preset filter (e.g., "Last 7 days")

**Steps**:
1. Click "Last 7 days" preset
2. Observe slider handles animate to last 7 days
3. Click "Reset Filters" button
4. Observe slider handles

**Expected Result**:
- Slider handles move to full range (minDate to maxDate)
- All measurements visible in table
- No active preset highlighted
- Reset button becomes disabled (no active filters)

**Pass Criteria**:
- ✅ Reset clears date range to full range
- ✅ All measurements visible
- ✅ Functionally equivalent to old "All time" preset

---

### 2. Box Styling for Inactive Buttons (FR-V3.4-002)

#### TS-V3.4-005: Verify Inactive Preset Button Border
**Priority**: High
**Type**: Visual Verification

**Preconditions**:
- Readings page loaded
- No preset selected (all inactive)

**Steps**:
1. Observe inactive preset buttons (all 5)
2. Use DevTools to inspect border-color
3. Compare with reset button border

**Expected Result**:
- All inactive preset buttons have visible border
- Border color: `var(--border-muted)` (matches reset button)
- Border width: 2px
- Border radius: 0.75rem (12px)
- Background: transparent

**Pass Criteria**:
- ✅ Visible border on all inactive presets
- ✅ Border color matches reset button
- ✅ Border color is `var(--border-muted)`

---

#### TS-V3.4-006: Verify Inactive Type Filter Button Border
**Priority**: High
**Type**: Visual Verification

**Preconditions**:
- Readings page loaded
- Deselect all type filters (both Power and Gas off)

**Steps**:
1. Deselect Power and Gas buttons
2. Observe inactive type filter buttons
3. Use DevTools to inspect border-color
4. Compare with reset button border

**Expected Result**:
- Both inactive type filter buttons have visible border
- Border color: `var(--border-muted)` (matches reset button)
- Border width: 2px
- Border radius: 0.75rem (12px)
- Background: transparent

**Pass Criteria**:
- ✅ Visible border on inactive type filters
- ✅ Border color matches reset button
- ✅ Border color is `var(--border-muted)`

---

#### TS-V3.4-007: Verify Border Consistency Across Themes
**Priority**: Medium
**Type**: Visual Verification

**Preconditions**:
- Readings page loaded

**Steps**:
1. Light mode: Observe inactive button borders
2. Toggle to dark mode (profile menu → theme toggle)
3. Dark mode: Observe inactive button borders
4. Compare border visibility and color

**Expected Result**:
- Light mode: Borders visible with subtle gray color
- Dark mode: Borders visible with subtle light gray color
- Both modes: `var(--border-muted)` adapts to theme
- Contrast ratio ≥ 3:1 in both modes (WCAG 2.1 AA)

**Pass Criteria**:
- ✅ Borders visible in light mode
- ✅ Borders visible in dark mode
- ✅ Color adapts correctly to theme

---

#### TS-V3.4-008: Verify Active State Border Change
**Priority**: High
**Type**: Interaction Test

**Preconditions**:
- Readings page loaded

**Steps**:
1. Observe inactive preset button (muted border)
2. Click button to activate
3. Observe active preset button (primary border)
4. Click button again to deactivate (or click different preset)
5. Observe inactive button (muted border again)

**Expected Result**:
- Inactive: `border-color: var(--border-muted)` (subtle)
- Active: `border-color: var(--primary)` (prominent)
- Smooth transition between states
- Border visible in both states

**Pass Criteria**:
- ✅ Border changes from muted to primary on activation
- ✅ Border changes back to muted on deactivation
- ✅ Transition is smooth

---

### 3. Mobile Hover State Fix (FR-V3.4-003)

#### TS-V3.4-009: Desktop Hover - Preset Buttons
**Priority**: High
**Type**: Desktop Interaction Test
**Device**: Desktop with mouse

**Preconditions**:
- Readings page loaded on desktop
- Mouse available

**Steps**:
1. Hover mouse over inactive preset button
2. Observe visual change (hover state)
3. Move mouse away
4. Observe button returns to normal

**Expected Result**:
- Hover: Background changes to `var(--background-hover)`
- Hover: Text color changes to `var(--foreground)`
- Hover: Button translates up 1px
- Mouse away: Button returns to original state
- Transition is smooth

**Pass Criteria**:
- ✅ Hover state applies on mouse hover
- ✅ Hover state removes when mouse leaves
- ✅ No regression from V3.3 behavior

---

#### TS-V3.4-010: Mobile Touch - Preset Buttons (No Hover)
**Priority**: Critical
**Type**: Mobile Interaction Test
**Device**: Mobile phone or tablet (touch only)

**Preconditions**:
- Readings page loaded on mobile device
- Touch input only (no mouse)

**Steps**:
1. Tap inactive preset button
2. Observe button during tap (active state)
3. Release tap
4. Observe button after tap (should return to normal, NOT hover)
5. Tap elsewhere on screen
6. Observe button (should still be normal, NOT stuck in hover)

**Expected Result**:
- During tap: `:active` state applies (visual feedback)
- After tap: Button returns to normal state (no hover)
- Tap elsewhere: No change (no stuck hover)
- Hover styles never apply on touch device

**Pass Criteria**:
- ✅ No hover state after tap
- ✅ No stuck hover state
- ✅ :active state works during tap
- ✅ Button returns to normal immediately after tap

---

#### TS-V3.4-011: Mobile Touch - Type Filter Buttons (No Hover)
**Priority**: Critical
**Type**: Mobile Interaction Test
**Device**: Mobile phone or tablet (touch only)

**Preconditions**:
- Readings page loaded on mobile device
- Touch input only

**Steps**:
1. Tap inactive type filter button (e.g., "Power")
2. Observe button during tap
3. Release tap
4. Observe button after tap (selected state, no hover)
5. Tap elsewhere
6. Verify no hover state persists

**Expected Result**:
- During tap: `:active` state applies
- After tap: Button shows selected state (primary color)
- No hover state at any point
- Tap elsewhere: Selected state persists (correct), but no hover

**Pass Criteria**:
- ✅ No hover state on tap
- ✅ Selected state applies correctly
- ✅ No hover persistence

---

#### TS-V3.4-012: Mobile Touch - Reset Button (No Hover)
**Priority**: Critical
**Type**: Mobile Interaction Test
**Device**: Mobile phone or tablet (touch only)

**Preconditions**:
- Readings page loaded on mobile device
- Active filters present (reset button enabled)

**Steps**:
1. Tap "Reset Filters" button
2. Observe button during tap
3. Release tap
4. Observe button after tap (should be disabled now, no hover)
5. Tap elsewhere
6. Verify no hover state

**Expected Result**:
- During tap: `:active` state applies
- After tap: Filters reset, button becomes disabled
- No hover state at any point
- No stuck hover after tap

**Pass Criteria**:
- ✅ No hover state on tap
- ✅ Reset functionality works
- ✅ No hover persistence

---

#### TS-V3.4-013: DevTools Emulation - Hover Media Query
**Priority**: High
**Type**: Technical Verification
**Device**: Desktop browser with DevTools

**Preconditions**:
- Readings page loaded in Chrome/Edge/Firefox
- DevTools open

**Steps**:
1. Desktop mode: Inspect preset button → Computed styles
2. Verify `@media (hover: hover)` matches
3. Toggle device emulation (mobile viewport)
4. Inspect preset button → Computed styles
5. Verify `@media (hover: hover)` does NOT match
6. Hover over button in mobile emulation
7. Verify no hover styles apply

**Expected Result**:
- Desktop mode: Media query matches, hover styles present in computed styles
- Mobile emulation: Media query doesn't match, hover styles absent from computed styles
- Mobile emulation hover: No visual change

**Pass Criteria**:
- ✅ Media query matches on desktop
- ✅ Media query doesn't match on mobile emulation
- ✅ Hover styles absent in mobile mode

---

#### TS-V3.4-014: Cross-Browser Testing - Mobile Hover Fix
**Priority**: Medium
**Type**: Cross-Browser Test
**Devices**: iOS Safari, Chrome Android, Samsung Internet

**Preconditions**:
- Readings page loaded on real mobile devices
- Different browsers/OS combinations

**Steps**:
1. iOS Safari: Tap button, verify no hover persistence
2. Chrome Android: Tap button, verify no hover persistence
3. Samsung Internet (if available): Tap button, verify no hover persistence

**Expected Result**:
- All mobile browsers: No hover state after tap
- Consistent behavior across browsers
- :active state works during tap

**Pass Criteria**:
- ✅ iOS Safari: No hover persistence
- ✅ Chrome Android: No hover persistence
- ✅ Samsung Internet: No hover persistence (if tested)

---

### 4. Regression Testing

#### TS-V3.4-015: All V3.3 Features Still Work
**Priority**: Critical
**Type**: Regression Test

**Preconditions**:
- V3.4 changes implemented

**Steps**:
1. Test slider drag (mouse and touch)
2. Test keyboard navigation (arrows, page up/down, home/end)
3. Test preset animation (smooth transitions)
4. Test type filter multi-select
5. Test reset button
6. Test date label positioning (close to handles, small font)
7. Test histogram visualization
8. Run automated tests: `npm test`

**Expected Result**:
- All V3.3 functionality preserved
- Slider drag: Works on desktop and mobile
- Keyboard nav: All shortcuts work
- Preset animation: Smooth 300ms transitions
- Type filter: Multi-select works
- Reset: Clears all filters
- Date labels: Small, close to handles (V3.3 refinement preserved)
- Histogram: Updates correctly
- Tests: All pass (412/412)

**Pass Criteria**:
- ✅ Slider drag works (V3.1 fix preserved)
- ✅ Keyboard navigation works
- ✅ Preset buttons animate correctly
- ✅ Type filter multi-select works
- ✅ Reset button works
- ✅ Date labels positioned correctly (V3.3)
- ✅ Histogram renders correctly
- ✅ All automated tests pass

---

#### TS-V3.4-016: Accessibility - WCAG 2.1 AA Compliance
**Priority**: High
**Type**: Accessibility Audit

**Preconditions**:
- V3.4 changes implemented
- axe-core DevTools extension installed

**Steps**:
1. Run axe-core audit on Readings page
2. Check border contrast ratio (DevTools contrast checker)
3. Test keyboard navigation (tab through all buttons)
4. Test screen reader (announcements for button states)
5. Verify touch targets ≥ 44x44px (mobile)

**Expected Result**:
- axe-core: 0 violations
- Border contrast: ≥ 3:1 ratio (`var(--border-muted)`)
- Keyboard nav: Tab order correct, focus visible
- Screen reader: Buttons announced correctly
- Touch targets: All buttons ≥ 44x44px

**Pass Criteria**:
- ✅ No axe-core violations
- ✅ Border contrast ≥ 3:1
- ✅ Keyboard navigation works
- ✅ Screen reader announces correctly
- ✅ Touch targets meet 44x44px minimum

---

### 5. Responsive Design

#### TS-V3.4-017: Mobile Layout (< 640px)
**Priority**: High
**Type**: Responsive Test
**Viewport**: 375px width (iPhone SE)

**Preconditions**:
- Readings page loaded
- Mobile viewport

**Steps**:
1. Observe preset buttons (horizontal scroll)
2. Observe type filter buttons (vertical stack)
3. Observe reset button (full width)
4. Check borders visible on all buttons
5. Tap buttons (no hover persistence)

**Expected Result**:
- Preset buttons: Horizontal scroll with scroll-snap
- Type filter buttons: Full width, stacked vertically
- Reset button: Full width at bottom
- All buttons: Visible borders (`var(--border-muted)`)
- Touch: No hover persistence on any button
- Touch targets: ≥ 44x44px

**Pass Criteria**:
- ✅ Layout correct for mobile
- ✅ Borders visible on all inactive buttons
- ✅ No hover persistence on tap
- ✅ Touch targets meet 44x44px

---

#### TS-V3.4-018: Desktop Layout (≥ 640px)
**Priority**: High
**Type**: Responsive Test
**Viewport**: 1280px width (desktop)

**Preconditions**:
- Readings page loaded
- Desktop viewport

**Steps**:
1. Observe preset buttons (flex wrap, 2 rows)
2. Observe type filter buttons (horizontal row)
3. Observe reset button (inline with filters)
4. Check borders visible on inactive buttons
5. Hover buttons with mouse (hover states apply)

**Expected Result**:
- Preset buttons: Flex wrap, natural layout (no scroll)
- Type filter buttons: Horizontal row
- Reset button: Inline with type filters
- All inactive buttons: Visible borders
- Hover: Styles apply on mouse hover

**Pass Criteria**:
- ✅ Layout correct for desktop
- ✅ Borders visible on inactive buttons
- ✅ Hover states apply correctly
- ✅ No visual regressions

---

## Summary of Critical Tests

**Must Pass (Critical)**:
1. TS-V3.4-001: 5 preset buttons render ✅
2. TS-V3.4-002: All presets functional ✅
3. TS-V3.4-004: Reset provides all-time functionality ✅
4. TS-V3.4-010: Mobile - No hover persistence (presets) ✅
5. TS-V3.4-011: Mobile - No hover persistence (type filters) ✅
6. TS-V3.4-012: Mobile - No hover persistence (reset) ✅
7. TS-V3.4-015: All V3.3 features work ✅

**Should Pass (High Priority)**:
8. TS-V3.4-005: Preset border visible ✅
9. TS-V3.4-006: Type filter border visible ✅
10. TS-V3.4-009: Desktop hover works ✅
11. TS-V3.4-016: Accessibility (WCAG 2.1 AA) ✅

**Nice to Pass (Medium Priority)**:
12. TS-V3.4-003: No "all-time" references in code ✅
13. TS-V3.4-007: Border consistency across themes ✅
14. TS-V3.4-013: DevTools - Hover media query ✅
15. TS-V3.4-014: Cross-browser mobile testing ✅

---

## Test Execution Checklist

### Automated Tests
- [ ] Run `npm test` - All tests pass
- [ ] Run `npm run build` - Build succeeds
- [ ] Run `grep -r "all-time" src/` - Zero results
- [ ] Run `grep -r "isAllTimePreset" src/` - Zero results

### Manual Tests - Desktop
- [ ] TS-V3.4-001: Count preset buttons (5)
- [ ] TS-V3.4-002: Test all presets
- [ ] TS-V3.4-004: Test reset button
- [ ] TS-V3.4-005: Verify preset borders
- [ ] TS-V3.4-006: Verify type filter borders
- [ ] TS-V3.4-009: Test desktop hover (presets)
- [ ] TS-V3.4-018: Desktop layout correct

### Manual Tests - Mobile (Real Device)
- [ ] TS-V3.4-010: Tap preset, no hover persistence
- [ ] TS-V3.4-011: Tap type filter, no hover persistence
- [ ] TS-V3.4-012: Tap reset, no hover persistence
- [ ] TS-V3.4-017: Mobile layout correct
- [ ] TS-V3.4-014: Test on iOS Safari
- [ ] TS-V3.4-014: Test on Chrome Android

### Visual Tests
- [ ] Screenshot: 5 preset buttons (not 6)
- [ ] Screenshot: Inactive buttons with borders
- [ ] Screenshot: Light mode borders
- [ ] Screenshot: Dark mode borders
- [ ] Screenshot: Mobile layout
- [ ] Screenshot: Desktop layout

### Accessibility Tests
- [ ] TS-V3.4-016: Run axe-core (0 violations)
- [ ] TS-V3.4-016: Test keyboard navigation
- [ ] TS-V3.4-016: Test screen reader
- [ ] TS-V3.4-016: Verify touch targets ≥ 44x44px
- [ ] TS-V3.4-016: Check border contrast ≥ 3:1

### Regression Tests
- [ ] TS-V3.4-015: Slider drag works
- [ ] TS-V3.4-015: Keyboard navigation works
- [ ] TS-V3.4-015: Preset animation works
- [ ] TS-V3.4-015: Type filter multi-select works
- [ ] TS-V3.4-015: Date labels positioned correctly (V3.3)
- [ ] TS-V3.4-015: Histogram renders correctly

---

## Test Results Summary Template

```markdown
## V3.4 Test Results - [Date]

**Tester**: [Name]
**Environment**: [OS, Browser, Device]

### Automated Tests
- `npm test`: ✅ PASS / ❌ FAIL
- `npm run build`: ✅ PASS / ❌ FAIL
- Grep "all-time": ✅ ZERO RESULTS / ❌ FOUND REFERENCES
- Grep "isAllTimePreset": ✅ ZERO RESULTS / ❌ FOUND REFERENCES

### Critical Tests (Must Pass)
- TS-V3.4-001: ✅ PASS / ❌ FAIL
- TS-V3.4-002: ✅ PASS / ❌ FAIL
- TS-V3.4-004: ✅ PASS / ❌ FAIL
- TS-V3.4-010: ✅ PASS / ❌ FAIL
- TS-V3.4-011: ✅ PASS / ❌ FAIL
- TS-V3.4-012: ✅ PASS / ❌ FAIL
- TS-V3.4-015: ✅ PASS / ❌ FAIL

### High Priority Tests
- TS-V3.4-005: ✅ PASS / ❌ FAIL
- TS-V3.4-006: ✅ PASS / ❌ FAIL
- TS-V3.4-009: ✅ PASS / ❌ FAIL
- TS-V3.4-016: ✅ PASS / ❌ FAIL

### Visual Tests
- 5 preset buttons: ✅ PASS / ❌ FAIL
- Borders visible: ✅ PASS / ❌ FAIL
- Light mode: ✅ PASS / ❌ FAIL
- Dark mode: ✅ PASS / ❌ FAIL

### Mobile Testing (Real Device)
- iOS Safari: ✅ PASS / ❌ FAIL
- Chrome Android: ✅ PASS / ❌ FAIL
- No hover persistence: ✅ PASS / ❌ FAIL

### Overall Verdict
- ✅ **APPROVED FOR PRODUCTION**
- ⚠️ **APPROVED WITH MINOR ISSUES** (list below)
- ❌ **NOT APPROVED** (list blockers below)

**Issues Found**:
1. [Issue description]
2. [Issue description]

**Recommendations**:
1. [Recommendation]
2. [Recommendation]
```

---

**END OF TEST SCENARIOS V3.4**
