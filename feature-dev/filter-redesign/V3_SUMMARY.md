# V3 Requirements Summary: Interactive Timeline Slider

## Overview

**Document**: `requirements-v3.md`
**Status**: Requirements Defined - Ready for Stakeholder Review
**Complexity**: 🔴 **VERY HIGH** (5-6x more complex than V2)
**Estimated Effort**: 64-88 hours (8-11 days for experienced developer)

---

## What Changed from V2

### V2 Had:
- Timeline preset buttons (Last 7 days, Last 30 days, etc.)
- Multi-select checkboxes (Power, Gas)
- Reset button styling update

### V3 Adds (NEW):
1. **Interactive Dual-Handle Range Slider**
   - Draggable start/end date handles
   - Custom date range selection (any dates within dataset)
   - Smooth drag on mobile (touch) and desktop (mouse)
   - Keyboard navigation (Arrow keys, Page Up/Down, Home/End)

2. **Data Visualization on Slider Track**
   - **Mini histogram** showing measurement distribution over time
   - Visual distinction between Power (blue) and Gas (orange)
   - Stacked bars showing data density per time period
   - Responsive bucket count (20-30 on mobile, 60-100 on desktop)

3. **Preset-to-Slider Integration**
   - Preset buttons now **animate slider handles** to preset positions
   - Manual slider adjustment deselects active preset
   - Slider is PRIMARY interaction, presets are SECONDARY helpers

4. **Performance Optimization**
   - Data aggregation: < 100ms for 1000 measurements
   - Smooth 60fps dragging
   - Throttling and debouncing for performance
   - Memoization to avoid unnecessary recalculations

5. **Enhanced Accessibility**
   - Full WCAG 2.1 AA compliance
   - Complete keyboard navigation
   - ARIA attributes for screen readers
   - Touch targets ≥ 44x44px

---

## Core Features

### Feature 1: Interactive Range Slider

**What it does**:
- Two draggable handles (start date, end date)
- Slider spans from earliest to latest measurement in dataset
- Handles can be dragged to select any custom date range
- Selected range highlighted on track
- Dates displayed below slider: "Jan 15, 2024 - Feb 10, 2024"

**Interactions**:
- **Drag handles**: Click/touch and drag to new position
- **Click track**: Click on track to move nearest handle
- **Keyboard**: Arrow keys, Shift+Arrow, Page Up/Down, Home/End
- **Preset buttons**: Animate handles to preset positions

**Edge Cases Handled**:
- No data: Slider disabled
- Single measurement: Handles at same position
- Very large range (5+ years): Slider scales appropriately
- Same-day range: Handles overlap correctly
- Handles cannot cross each other

---

### Feature 2: Data Visualization (Histogram)

**What it does**:
- Shows measurement distribution over time as mini histogram
- Vertical bars represent measurement count per time bucket
- Power (blue) and Gas (orange) shown as stacked bars
- Rendered as SVG behind slider track

**Responsive Buckets**:
- Mobile: 20-30 buckets (fewer for clarity)
- Desktop: 60-100 buckets (more detail)

**Type Filter Integration**:
- When only "Power" selected: Show only blue bars
- When only "Gas" selected: Show only orange bars
- Updates in real-time when checkboxes change

**Performance**:
- Data aggregation: < 100ms for 1000 measurements
- Memoized to avoid recalculation unless data/screen size changes

---

### Feature 3: Preset-Slider Synchronization

**How it works**:
1. User clicks "Last 30 days" preset button
2. Slider handles **animate** to preset positions (300ms transition)
3. Preset button highlighted as active
4. Filter updates to show last 30 days of data

**Reverse Sync**:
1. User manually drags slider to custom range
2. Active preset **deselects** (no longer matching)
3. Badge shows "1" active filter (custom range)

**Presets** (from V2, unchanged):
- Last 7 days
- Last 30 days
- Last 90 days
- This month
- This year
- All time

---

## Technical Decisions

### Build Custom Slider (Not a Library)
**Rationale**:
- Date-specific behavior (not numeric)
- Tight integration with histogram visualization
- Full control over performance
- No unnecessary dependencies

### SVG for Visualization (Not Canvas/Chart.js)
**Rationale**:
- Declarative (React-friendly)
- Scalable (no pixelation)
- Easy to style with CSS
- Accessible (ARIA labels)
- Perfect for < 100 histogram bars

### Histogram Visualization (Not Line/Heatmap/Dots)
**Rationale**:
- Best clarity for data density
- Easy to distinguish Power vs Gas (stacked bars)
- Scalable for large datasets (buckets aggregate data)
- Familiar to users (bar charts are intuitive)
- Mobile-friendly (can reduce bucket count)

---

## Performance Requirements

| Metric | Target | Dataset Size |
|--------|--------|--------------|
| Data Aggregation | < 100ms | 1000 measurements |
| Data Aggregation | < 500ms | 5000 measurements |
| Slider Dragging | 60fps | Any |
| Initial Render | < 200ms | Any |
| Visualization Render | < 50ms | 100 buckets |

**Optimization Strategies**:
- Memoize aggregated bucket data
- Throttle visualization updates during drag (30fps)
- Debounce filter application (200ms after drag end)
- Use ResizeObserver for responsive recalculation

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
- Tab to focus handles (start, then end)
- Arrow keys: Adjust by 1 day
- Shift + Arrow keys: Adjust by 7 days (week)
- Page Up/Down: Adjust by 30 days (month)
- Home/End: Jump to min/max date

### Screen Reader Support
- `role="slider"` on each handle
- `aria-label`: "Start date handle", "End date handle"
- `aria-valuemin`, `aria-valuemax`, `aria-valuenow`
- `aria-valuetext`: "January 15, 2024" (human-readable)
- Live region announces range changes

### Visual Accessibility
- Focus indicators: 2px outline on handles
- Color contrast: Meets WCAG AA (4.5:1 text, 3:1 UI)
- Not color-only: Histogram uses color + patterns (Power solid, Gas striped - if needed)
- Works in high contrast mode

### Touch Accessibility
- Handles ≥ 44x44px touch targets
- Drag threshold (5px) prevents accidental drags

---

## Mobile Requirements

### Touch Dragging
- Smooth touch drag (60fps)
- Prevent page scroll during drag
- Visual feedback on active handle
- Drag threshold: 5px minimum movement

### Responsive Visualization
- Fewer buckets on mobile (20-30)
- Larger bars for visibility
- Simplified layout (slider full-width)

### Size Constraints
- Handle: 44x44px minimum (visual may be smaller)
- Track height: 8-12px
- Histogram height: 30-40px

---

## Effort Breakdown

### Phase 1: Planning & Architecture (4-6 hours)
- Finalize visualization type
- Design component architecture
- Define interfaces and types

### Phase 2: Data Aggregation & Utilities (6-8 hours)
- Implement `aggregateData` function
- Date calculation utilities
- Throttle/debounce utilities

### Phase 3: Slider Component (16-20 hours)
- Build `RangeSlider`, `SliderHandle`, `SliderTrack`
- Drag interactions (mouse + touch)
- Keyboard navigation
- ARIA attributes

### Phase 4: Visualization Component (8-10 hours)
- Build `SliderVisualization`
- Implement histogram (SVG)
- Responsive bucket count
- Performance optimization

### Phase 5: Preset-Slider Integration (4-6 hours)
- Preset-to-slider animation
- Reverse sync (slider-to-preset detection)

### Phase 6: Parent Component Integration (4-6 hours)
- Update `EnergyTableFilters`
- Update layout
- Pass energyData to slider

### Phase 7: Testing (12-16 hours)
- Write 70-100 tests
- Coverage report (100% target)
- Performance testing
- Accessibility testing

### Phase 8: QA & Polish (8-12 hours)
- Manual testing (mobile + desktop)
- Bug fixes
- Animation polish

### Phase 9: Documentation (2-4 hours)
- Update CLAUDE.md, user-guide.md
- Code comments

---

**Total**: 64-88 hours (8-11 days)

**Comparison**: V2 was 11-17 hours. V3 is **5-6x longer**.

---

## Testing Strategy

### Test Count: 70-100 tests (3x V2)

**Categories**:
1. Range Slider Tests (25-30): Dragging, keyboard, constraints
2. Data Visualization Tests (15-20): Histogram rendering, aggregation
3. Preset-Slider Sync Tests (10-12): Animation, reverse sync
4. Type Filter Tests (8-10): From V2, unchanged
5. Reset Tests (6-8): Updated logic
6. Badge Tests (5-6): Updated calculation
7. Accessibility Tests (10-12): ARIA, keyboard, screen reader
8. Performance Tests (5-8): Benchmarks, throttling
9. Responsive Tests (6-8): Mobile, desktop, resize
10. Edge Case Tests (8-10): No data, single measurement, gaps

**Coverage Target**: 100%

---

## Risks

### Risk 1: Performance with Large Datasets (HIGH)
- **Issue**: 10,000+ measurements may cause lag
- **Mitigation**: Memoization, throttling, sampling

### Risk 2: Mobile Touch Interactions (MEDIUM)
- **Issue**: Touch dragging may be difficult on small screens
- **Mitigation**: Large touch targets, drag threshold, testing on real devices

### Risk 3: Accessibility Compliance (MEDIUM)
- **Issue**: Custom slider may not meet WCAG AA
- **Mitigation**: Follow WAI-ARIA pattern, screen reader testing, axe-core

### Risk 4: Development Timeline Overrun (MEDIUM)
- **Issue**: 8-11 days may be optimistic
- **Mitigation**: Phased approach, checkpoints, buffer time (20% extra)

---

## Open Questions (Require Stakeholder Decision)

### Q1: Visualization Type
- **Recommended**: Mini Histogram (stacked bars)
- **Alternatives**: Line chart, heatmap, dot plot
- **Decision**: Confirm histogram is acceptable

### Q2: Slider Snapping
- **Recommended**: Continuous (handles can be at any position)
- **Alternative**: Snap to actual measurement dates
- **Decision**: Confirm continuous is acceptable

### Q3: Date Format Display
- **Recommended**: Responsive ("Jan 15 - Feb 10" on mobile, "January 15, 2024 - February 10, 2024" on desktop)
- **Alternatives**: ISO format, European format
- **Decision**: Confirm format preference

### Q4: Handle Visual Design
- **Recommended**: Circular handles (common pattern)
- **Alternatives**: Rectangular, arrow/triangle
- **Decision**: Create mockup for approval

### Q5: Preset Button Placement
- **Recommended**: Above slider (V2 pattern)
- **Alternatives**: Inline with slider, below slider
- **Decision**: Confirm layout preference

---

## Breaking Changes from V2

**Only 1 Breaking Change**:
- **Parent must pass `energyData` prop** to `EnergyTableFilters`

```typescript
// V2
<EnergyTableFilters
  selectedTypes={selectedTypes}
  setSelectedTypes={setSelectedTypes}
  dateRange={dateRange}
  setDateRange={setDateRange}
  onReset={handleResetFilters}
/>

// V3 (add energyData)
<EnergyTableFilters
  selectedTypes={selectedTypes}
  setSelectedTypes={setSelectedTypes}
  dateRange={dateRange}
  setDateRange={setDateRange}
  onReset={handleResetFilters}
  energyData={energyData}  // NEW: Required for slider visualization
/>
```

**All other V2 functionality preserved.**

---

## Out of Scope (Not in V3)

❌ Custom date picker integration (manual typing)
❌ Zoom/pan on slider
❌ Tooltips on histogram bars (hover for count)
❌ Multiple slider ranges (non-contiguous dates)
❌ Saved slider positions (localStorage)
❌ User-selectable bucket size
❌ Real-time data updates (WebSocket)
❌ Animated transitions for data changes

---

## Next Steps

1. **Review Requirements** with user/stakeholder
2. **Answer Open Questions** (Q1-Q5)
3. **Create Design Mockups** (handle design, colors, layout)
4. **Approve Timeline** (8-11 days effort)
5. **Begin Implementation** - Phase 1: Planning & Architecture

---

## Files Created

- ✅ `requirements-v3.md` (73 pages, comprehensive specification)
- ✅ `V3_SUMMARY.md` (this file - executive summary)

**Next**: Create `test-scenarios-v3.md`, `architecture.md` (if approved)

---

## Success Criteria

### Must Have (Required for V3)
- ✅ Interactive dual-handle slider with smooth dragging
- ✅ Histogram visualization showing Power/Gas distribution
- ✅ Preset buttons animate slider handles
- ✅ Performance: < 100ms aggregation for 1000 measurements
- ✅ Performance: 60fps dragging
- ✅ Accessibility: Full WCAG 2.1 AA compliance
- ✅ Mobile: Touch-optimized with ≥ 44x44px targets
- ✅ Test coverage: 100% for slider/visualization logic

### Nice to Have (Future Enhancements)
- ⚠️ Haptic feedback on handle snap (mobile)
- ⚠️ Tooltips on histogram bars
- ⚠️ Click histogram bar to jump slider
- ⚠️ Zoom/pan for large date ranges

---

**STATUS**: ✅ **READY FOR STAKEHOLDER APPROVAL**

Please review `requirements-v3.md` for full technical specification (73 pages).
