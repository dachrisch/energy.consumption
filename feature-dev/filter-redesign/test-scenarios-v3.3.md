# Test Scenarios: Filter Redesign V3.3

## Document Information
- **Version**: 3.3 (Visual UX Refinements)
- **Date**: 2025-11-05
- **Related Requirements**: requirements-v3.3.md
- **Test Scope**: Energy type button styling, slider label positioning

---

## Test Categories

### 1. Energy Type Button Styling (FR-V3.3-001)

#### TS-V3.3-001: Energy Type Button - Deselected State
**Priority**: HIGH
**Type**: Visual

**Preconditions**:
- Application loaded
- Energy table filters visible
- No energy types selected

**Steps**:
1. Observe Power button styling
2. Observe Gas button styling

**Expected Results**:
- ✅ Power button: Transparent background, transparent border, muted text color
- ✅ Gas button: Transparent background, transparent border, muted text color
- ✅ Same styling as deselected preset buttons
- ✅ NO green or red color visible

---

#### TS-V3.3-002: Energy Type Button - Selected Power Only
**Priority**: HIGH
**Type**: Visual + Functional

**Preconditions**:
- Application loaded
- No energy types selected

**Steps**:
1. Click Power button
2. Observe Power button styling
3. Observe Gas button styling

**Expected Results**:
- ✅ Power button: Primary subtle background, primary border, primary text color
- ✅ Power button font weight: Semibold (600)
- ✅ Power button has subtle shadow
- ✅ NO green color (should be primary color)
- ✅ Gas button remains deselected (transparent, muted)
- ✅ Power button styling matches active preset button styling

---

#### TS-V3.3-003: Energy Type Button - Selected Gas Only
**Priority**: HIGH
**Type**: Visual + Functional

**Preconditions**:
- Application loaded
- No energy types selected

**Steps**:
1. Click Gas button
2. Observe Gas button styling
3. Observe Power button styling

**Expected Results**:
- ✅ Gas button: Primary subtle background, primary border, primary text color
- ✅ Gas button font weight: Semibold (600)
- ✅ Gas button has subtle shadow
- ✅ NO red color (should be primary color)
- ✅ Power button remains deselected (transparent, muted)
- ✅ Gas button styling matches active preset button styling

---

#### TS-V3.3-004: Energy Type Button - Both Selected
**Priority**: HIGH
**Type**: Visual + Functional

**Preconditions**:
- Application loaded
- No energy types selected

**Steps**:
1. Click Power button
2. Click Gas button
3. Observe both button stylings

**Expected Results**:
- ✅ Both buttons: Primary subtle background, primary border, primary text color
- ✅ Both buttons use identical color scheme
- ✅ NO green or red colors visible
- ✅ Multi-select functionality works correctly
- ✅ Table shows both Power and Gas readings

---

#### TS-V3.3-005: Energy Type Button - Hover State (Deselected)
**Priority**: MEDIUM
**Type**: Visual + Interaction

**Preconditions**:
- Application loaded
- No energy types selected

**Steps**:
1. Hover over Power button
2. Observe hover styling
3. Move away, hover over Gas button
4. Observe hover styling

**Expected Results**:
- ✅ Hover: Background changes to background-hover
- ✅ Hover: Border changes to border color
- ✅ Hover: Text changes to foreground color
- ✅ NO green or red colors on hover
- ✅ Smooth transition (150ms)

---

#### TS-V3.3-006: Visual Consistency - Active Buttons Comparison
**Priority**: HIGH
**Type**: Visual

**Preconditions**:
- Application loaded
- Select "Last 7 days" preset
- Select Power energy type

**Steps**:
1. Compare "Last 7 days" button styling with Power button styling
2. Take screenshot for side-by-side comparison

**Expected Results**:
- ✅ Background color: Identical (var(--primary-subtle))
- ✅ Border color: Identical (var(--primary))
- ✅ Text color: Identical (var(--primary))
- ✅ Font weight: Identical (600)
- ✅ Shadow: Similar or identical
- ✅ Overall appearance: Consistent design language

---

### 2. Slider Label Positioning (FR-V3.3-002)

#### TS-V3.3-007: Slider Label - Desktop Font Size and Position
**Priority**: HIGH
**Type**: Visual
**Viewport**: Desktop (≥640px)

**Preconditions**:
- Application loaded
- Desktop viewport (1920x1080 or similar)
- Slider visible with date range selected

**Steps**:
1. Observe start date label
2. Observe end date label
3. Measure visual distance from handle center to label top
4. Inspect font size

**Expected Results**:
- ✅ Font size: 12px (0.75rem) - reduced from 14px
- ✅ Margin from handle: ~2px (very close)
- ✅ Total gap from handle center to label: ~20px (reduced from ~36px)
- ✅ Labels visually connected to handles
- ✅ Text readable and clear

---

#### TS-V3.3-008: Slider Label - Mobile Font Size and Position
**Priority**: HIGH
**Type**: Visual
**Viewport**: Mobile (<640px)

**Preconditions**:
- Application loaded
- Mobile viewport (375x667 or similar)
- Slider visible with date range selected

**Steps**:
1. Observe start date label (short format: MM/DD)
2. Observe end date label
3. Measure visual distance from handle center to label top
4. Inspect font size

**Expected Results**:
- ✅ Font size: 10px (0.625rem) - reduced from 12px
- ✅ Margin from handle: ~1px (very close)
- ✅ Total gap from handle center to label: ~16px (reduced from ~34px)
- ✅ Labels visually connected to handles
- ✅ Text readable even at smaller size
- ✅ Short date format (MM/DD) used

---

#### TS-V3.3-009: Slider Label - No Overlap with Buttons (Desktop)
**Priority**: HIGH
**Type**: Visual + Layout
**Viewport**: Desktop (≥640px)

**Preconditions**:
- Application loaded
- Desktop viewport
- Filters visible (preset buttons, slider, type filter buttons)

**Steps**:
1. Drag slider handles to various positions
2. Observe spacing between date labels and preset buttons above
3. Observe spacing between date labels and type filter buttons below
4. Zoom in to 150% (accessibility test)

**Expected Results**:
- ✅ Date labels do NOT overlap with preset buttons
- ✅ Date labels do NOT overlap with type filter buttons
- ✅ Sufficient whitespace between labels and buttons
- ✅ At 150% zoom: No overlap occurs
- ✅ Visual hierarchy clear (buttons primary, labels secondary)

---

#### TS-V3.3-010: Slider Label - No Overlap with Buttons (Mobile)
**Priority**: HIGH
**Type**: Visual + Layout
**Viewport**: Mobile (<640px)

**Preconditions**:
- Application loaded
- Mobile viewport (375x667)
- Filters visible (preset buttons scroll, slider, type filter buttons)

**Steps**:
1. Drag slider handles to various positions
2. Scroll preset buttons horizontally
3. Observe spacing between date labels and buttons
4. Test on small screen (320x568)

**Expected Results**:
- ✅ Date labels do NOT overlap with preset buttons
- ✅ Date labels do NOT overlap with type filter buttons
- ✅ Labels fit within allocated space
- ✅ On 320x568 viewport: Still no overlap
- ✅ Filters remain within 30vh constraint (V3.2)

---

#### TS-V3.3-011: Slider Label - Edge Detection (Left Edge)
**Priority**: MEDIUM
**Type**: Functional

**Preconditions**:
- Application loaded
- Slider visible

**Steps**:
1. Drag start handle to far left (minimum date)
2. Observe start date label positioning

**Expected Results**:
- ✅ Label aligns left (not centered) to prevent cutoff
- ✅ Label text fully visible
- ✅ Edge detection logic works correctly
- ✅ Label stays within container bounds

---

#### TS-V3.3-012: Slider Label - Edge Detection (Right Edge)
**Priority**: MEDIUM
**Type**: Functional

**Preconditions**:
- Application loaded
- Slider visible

**Steps**:
1. Drag end handle to far right (maximum date)
2. Observe end date label positioning

**Expected Results**:
- ✅ Label aligns right (not centered) to prevent cutoff
- ✅ Label text fully visible
- ✅ Edge detection logic works correctly
- ✅ Label stays within container bounds

---

#### TS-V3.3-013: Slider Label - Overlap Handling (Handles Close Together)
**Priority**: MEDIUM
**Type**: Functional

**Preconditions**:
- Application loaded
- Slider visible

**Steps**:
1. Drag handles very close together (< 40px gap)
2. Observe label display behavior

**Expected Results**:
- ✅ Only one label shown (start label) when handles too close
- ✅ Label doesn't overlap or collide
- ✅ Screen reader still announces both dates
- ✅ Overlap detection works correctly

---

#### TS-V3.3-014: Slider Label - Drag Interaction
**Priority**: HIGH
**Type**: Functional

**Preconditions**:
- Application loaded
- Slider visible

**Steps**:
1. Drag start handle from left to right
2. Observe label following handle smoothly
3. Drag end handle from right to left
4. Observe label following handle smoothly

**Expected Results**:
- ✅ Labels update immediately during drag
- ✅ Labels positioned correctly at all positions
- ✅ Smooth visual feedback (60fps)
- ✅ No flickering or jumping
- ✅ Labels maintain proper distance from handle

---

### 3. Regression Tests (V3.2 Features)

#### TS-V3.3-015: Preset Buttons Still Work
**Priority**: HIGH
**Type**: Functional

**Preconditions**:
- Application loaded

**Steps**:
1. Click "Last 7 days" preset
2. Click "Last 30 days" preset
3. Click "This month" preset

**Expected Results**:
- ✅ Each preset animates slider handles correctly
- ✅ Date range updates correctly
- ✅ Active preset highlighted (primary color)
- ✅ Table filters to selected date range

---

#### TS-V3.3-016: Type Filter Multi-Select Still Works
**Priority**: HIGH
**Type**: Functional

**Preconditions**:
- Application loaded
- Both Power and Gas selected initially

**Steps**:
1. Click Power (deselect)
2. Verify table shows only Gas readings
3. Click Power (reselect)
4. Verify table shows both Power and Gas readings
5. Click Gas (deselect)
6. Verify table shows only Power readings

**Expected Results**:
- ✅ Multi-select functionality works correctly
- ✅ Table filters correctly based on selection
- ✅ Screen reader announces selection changes
- ✅ ARIA attributes correct (aria-pressed)

---

#### TS-V3.3-017: Slider Drag Still Works (V3.1 Fix)
**Priority**: HIGH
**Type**: Functional

**Preconditions**:
- Application loaded
- Slider visible

**Steps**:
1. Start dragging start handle
2. Move mouse/finger rapidly outside slider container
3. Continue dragging
4. Release outside container

**Expected Results**:
- ✅ Drag continues even when cursor leaves container (V3.1 fix)
- ✅ Handle follows cursor position
- ✅ Drag ends correctly on mouse/touch release
- ✅ Date range updates correctly

---

#### TS-V3.3-018: Reset Button Still Works
**Priority**: HIGH
**Type**: Functional

**Preconditions**:
- Application loaded
- Filters applied (preset selected, type filter changed)

**Steps**:
1. Observe reset button badge (shows active filter count)
2. Click reset button
3. Observe filters reset

**Expected Results**:
- ✅ Badge shows correct count before reset
- ✅ All filters reset to default
- ✅ Preset buttons deselected
- ✅ Slider handles at full range
- ✅ Both energy types selected
- ✅ Table shows all data

---

### 4. Accessibility Tests

#### TS-V3.3-019: Keyboard Navigation - Type Filter Buttons
**Priority**: HIGH
**Type**: Accessibility

**Preconditions**:
- Application loaded
- Using keyboard only (no mouse)

**Steps**:
1. Tab to Power button
2. Press Space or Enter to select
3. Tab to Gas button
4. Press Space or Enter to select

**Expected Results**:
- ✅ Buttons focusable via Tab
- ✅ Focus visible styles applied
- ✅ Space/Enter toggles selection
- ✅ Screen reader announces state changes
- ✅ ARIA attributes updated (aria-pressed)

---

#### TS-V3.3-020: Screen Reader - Type Filter Selection
**Priority**: HIGH
**Type**: Accessibility

**Preconditions**:
- Application loaded
- Screen reader enabled (NVDA, JAWS, or VoiceOver)

**Steps**:
1. Navigate to Power button
2. Activate button (select)
3. Navigate to Gas button
4. Activate button (select)

**Expected Results**:
- ✅ Button role announced
- ✅ Button label announced ("Filter Power readings")
- ✅ Button state announced (pressed/not pressed)
- ✅ Live region announces selection: "Selected: Power"
- ✅ Live region announces: "Selected: Power, Gas" (both selected)

---

#### TS-V3.3-021: Screen Reader - Slider Labels
**Priority**: HIGH
**Type**: Accessibility

**Preconditions**:
- Application loaded
- Screen reader enabled

**Steps**:
1. Navigate to slider area
2. Listen for date range announcement
3. Drag handle
4. Listen for updates

**Expected Results**:
- ✅ Slider role announced
- ✅ Date range announced (via live region)
- ✅ During drag: "Adjusting start date" or "Adjusting end date" announced
- ✅ After drag: Full date range announced
- ✅ Hidden labels (on overlap) still accessible

---

#### TS-V3.3-022: Color Contrast - Slider Labels (Smaller Font)
**Priority**: HIGH
**Type**: Accessibility

**Preconditions**:
- Application loaded

**Steps**:
1. Use contrast checker tool on date labels
2. Measure contrast ratio (text vs background)
3. Test at 12px font size (desktop)
4. Test at 10px font size (mobile)

**Expected Results**:
- ✅ Desktop (12px): Contrast ratio ≥ 4.5:1 (WCAG AA for body text)
- ✅ Mobile (10px): Contrast ratio ≥ 4.5:1
- ✅ Text color (--foreground-muted) has sufficient contrast
- ✅ Labels readable in light and dark modes

---

#### TS-V3.3-023: Touch Targets - Type Filter Buttons (Mobile)
**Priority**: HIGH
**Type**: Accessibility
**Viewport**: Mobile (<640px)

**Preconditions**:
- Application loaded
- Mobile viewport (375x667)

**Steps**:
1. Measure Power button touch target
2. Measure Gas button touch target
3. Test tapping with finger

**Expected Results**:
- ✅ Minimum height: 44px (WCAG guideline)
- ✅ Minimum width: 44px (or full width on mobile)
- ✅ Easy to tap without hitting adjacent elements
- ✅ Adequate spacing between buttons

---

### 5. Responsive Design Tests

#### TS-V3.3-024: Mobile Portrait (375x667)
**Priority**: HIGH
**Type**: Responsive

**Preconditions**:
- Application loaded
- Mobile viewport 375x667 (iPhone SE)

**Steps**:
1. Observe filter layout
2. Interact with all filter controls
3. Verify spacing and sizing

**Expected Results**:
- ✅ Type filter buttons: Primary color when selected
- ✅ Date labels: 10px font, 1px margin
- ✅ No overlaps between UI elements
- ✅ Filters within 30vh height constraint
- ✅ Scrollable if content exceeds 30vh

---

#### TS-V3.3-025: Mobile Landscape (667x375)
**Priority**: MEDIUM
**Type**: Responsive

**Preconditions**:
- Application loaded
- Mobile landscape viewport

**Steps**:
1. Rotate device to landscape
2. Observe filter layout
3. Verify functionality

**Expected Results**:
- ✅ Filters adapt to landscape orientation
- ✅ Type filter buttons styled correctly
- ✅ Date labels readable
- ✅ No UI elements cut off

---

#### TS-V3.3-026: Tablet (768x1024)
**Priority**: MEDIUM
**Type**: Responsive

**Preconditions**:
- Application loaded
- Tablet viewport

**Steps**:
1. Observe filter layout
2. Verify breakpoint transition (640px)

**Expected Results**:
- ✅ Desktop layout used (≥640px breakpoint)
- ✅ Date labels: 12px font, full format
- ✅ Type filter buttons: Horizontal row
- ✅ Spacing and styling correct

---

#### TS-V3.3-027: Desktop Large (1920x1080)
**Priority**: HIGH
**Type**: Responsive

**Preconditions**:
- Application loaded
- Desktop viewport 1920x1080

**Steps**:
1. Observe filter layout
2. Verify all styling
3. Test interactions

**Expected Results**:
- ✅ Type filter buttons: Primary color when selected
- ✅ Date labels: 12px font, 2px margin, full format
- ✅ No height constraint on filters (natural height)
- ✅ All elements properly spaced
- ✅ No overlap issues

---

### 6. Cross-Browser Tests

#### TS-V3.3-028: Chrome/Edge (Chromium)
**Priority**: HIGH
**Type**: Browser Compatibility

**Steps**:
1. Test in Chrome or Edge
2. Verify all V3.3 changes

**Expected Results**:
- ✅ Type filter buttons: Primary color styling
- ✅ Date labels: Correct size and position
- ✅ No visual regressions

---

#### TS-V3.3-029: Safari (macOS/iOS)
**Priority**: HIGH
**Type**: Browser Compatibility

**Steps**:
1. Test in Safari
2. Verify all V3.3 changes
3. Check CSS variable support

**Expected Results**:
- ✅ Type filter buttons: Primary color styling
- ✅ Date labels: Correct size and position
- ✅ CSS variables (--primary, --primary-subtle) work correctly
- ✅ No visual regressions

---

#### TS-V3.3-030: Firefox
**Priority**: MEDIUM
**Type**: Browser Compatibility

**Steps**:
1. Test in Firefox
2. Verify all V3.3 changes

**Expected Results**:
- ✅ Type filter buttons: Primary color styling
- ✅ Date labels: Correct size and position
- ✅ No visual regressions

---

## Test Summary

### Test Coverage by Priority

| Priority | Test Count | Description |
|----------|-----------|-------------|
| HIGH | 22 | Critical functionality and visual tests |
| MEDIUM | 8 | Secondary features and edge cases |
| **TOTAL** | **30** | Complete test coverage |

### Test Coverage by Category

| Category | Test Count | Focus Area |
|----------|-----------|------------|
| Energy Type Button Styling | 6 | FR-V3.3-001 |
| Slider Label Positioning | 8 | FR-V3.3-002 |
| Regression Tests | 4 | V3.2 features |
| Accessibility Tests | 5 | WCAG 2.1 AA |
| Responsive Design Tests | 4 | Mobile/desktop |
| Cross-Browser Tests | 3 | Chrome/Safari/Firefox |

### Estimated Test Execution Time

- **Manual Testing**: ~2-3 hours
- **Automated Testing**: Existing Jest tests should pass
- **Browser Testing**: ~1 hour
- **Accessibility Audit**: ~30 minutes
- **Total**: ~3.5-4.5 hours

### Test Environment Requirements

**Viewports**:
- Mobile: 375x667 (iPhone SE), 320x568 (small)
- Tablet: 768x1024
- Desktop: 1920x1080

**Browsers**:
- Chrome (latest)
- Safari (latest)
- Firefox (latest)
- Edge (latest)

**Tools**:
- Browser DevTools (inspect, responsive mode)
- Screen reader (NVDA, JAWS, or VoiceOver)
- Color contrast checker (axe DevTools or similar)
- Screenshot comparison tool

---

## Exit Criteria

Implementation passes QA when:
- ✅ All HIGH priority tests pass (22 tests)
- ✅ No critical visual regressions
- ✅ Accessibility tests pass (WCAG 2.1 AA)
- ✅ Energy type buttons use primary color (no green/red)
- ✅ Date labels closer and smaller (no overlap)
- ✅ All existing functionality preserved
- ✅ Cross-browser compatibility verified

---

**Document Status**: ✅ **READY FOR TESTING**

**Next Steps**:
1. Implement V3.3 changes
2. Run automated tests (Jest)
3. Execute manual test scenarios
4. Document any issues found
5. Fix issues and retest
6. QA approval

---

**END OF TEST SCENARIOS V3.3**
