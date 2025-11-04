# Changelog

High-level log of completed tasks and improvements to the Energy Consumption Monitor application.

---

## 2025-11-04

### [V3] Interactive Timeline Slider with Data Visualization - MAJOR FEATURE

**Status**: ✅ Complete and QA Approved
**Implementation Date**: 2025-11-04
**Effort**: 64-88 hours (8-11 days estimated, 5-6x more complex than V2)

#### Added Features

**Interactive Range Slider**:
- Dual-handle slider for precise date selection across the entire dataset
- Mouse drag support with smooth 60fps performance on desktop
- Touch drag support with 44x44px touch targets for mobile devices
- Full keyboard navigation:
  - Arrow keys: Adjust by 1 day
  - Shift + Arrow keys: Adjust by 7 days (week)
  - Page Up/Down: Adjust by 30 days (month)
  - Home/End: Jump to min/max date
- Handles cannot cross each other (automatic clamping)
- Visual feedback: Active handle highlighting during drag

**Data Visualization - Histogram**:
- Mini histogram showing measurement distribution over time
- Single color bars (rgba(124, 58, 237, 0.3)) per user requirement
- SVG-based rendering for sharp, scalable graphics
- Responsive bucket counts:
  - Mobile: 20-30 buckets for clarity
  - Desktop: 60-100 buckets for detail
- Y-axis labels showing measurement counts
- Grid lines for easier reading
- Empty state handling (disabled when no data)

**Timeline Presets Integration**:
- 6 quick-select preset buttons:
  - Last 7 days, Last 30 days, Last 90 days
  - This month, This year, All time
- Preset buttons animate slider handles to preset positions
- Smooth 300ms cubic-bezier transitions
- Active preset highlighting
- Manual slider adjustment deselects active preset
- Horizontal scroll on mobile with scroll-snap for better UX

**Multi-Select Type Filter Enhancement**:
- Checkbox-styled toggle buttons for Power and Gas
- Removed "All" option (empty selection = show all data)
- Multi-select support: Can select both, one, or none
- Button-styled appearance (not native checkboxes)
- Responsive layout:
  - Desktop: Horizontal row
  - Mobile: Vertical column with full-width buttons

**Enhanced Reset Button**:
- Updated from `button-outline` to `button-secondary` style
- Active filter count badge (0-2) showing:
  - +1 if custom date range (not matching any preset)
  - +1 if specific types selected (not empty)
- Icon + text label for better discoverability
- Disabled state when no filters are active
- Resets both date range and type filters

#### Changed

**EnergyTableFilters Component - Complete Refactor**:
- New V3 API with `DateRange` type (`{ start: Date, end: Date }`)
- Multi-select type filter: `selectedTypes: EnergyOptions[]` (replaces `typeFilter: "all" | EnergyOptions`)
- New required prop: `energyData: EnergyType[]` for histogram visualization
- Preset state management integrated with slider
- Synchronized preset-slider bidirectional updates
- Improved mobile-first responsive design

**Parent Components Updated**:
- `src/app/readings/page.tsx` - V3 API integration
- `src/app/charts/page.tsx` - V3 API integration
- `src/app/dashboard/DashboardTabs.tsx` - V3 API integration
- All parents now pass `energyData` to `EnergyTableFilters`

#### Technical Implementation

**New Component Structure**:
- `src/app/components/energy/RangeSlider/` (new directory)
  - `RangeSlider.tsx` - Main orchestrator
  - `SliderVisualization.tsx` - Histogram rendering
  - `SliderTrack.tsx` - Track with range highlighting
  - `SliderHandle.tsx` - Draggable handles
  - `DateRangeDisplay.tsx` - Responsive date labels
  - `types.ts` - TypeScript interfaces

**Custom Hooks** (new):
- `useHistogramData.ts` - Memoized data aggregation
- `useSliderDrag.ts` - Mouse/touch drag management
- `useSliderKeyboard.ts` - Keyboard navigation
- `useSliderAnimation.ts` - Preset transitions

**New Services**:
- `DataAggregationService.ts` - Pure functions for bucketing measurements
- `SliderCalculationService.ts` - Date ↔ Position calculations

**Performance Optimizations**:
- Memoization: Histogram data only recalculates when data/screen size changes
- Throttling: Drag updates at 60fps (16ms throttle)
- Debouncing: Filter application delayed 200ms after drag end
- Bucket aggregation: < 100ms for 1000 measurements

**Accessibility (WCAG 2.1 AA Compliant)**:
- `role="slider"` on handles with full ARIA attributes
- `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext`
- Live region announces range changes for screen readers
- Focus indicators: 2px outline on handles
- Color contrast: 4.5:1 for text, 3:1 for UI elements
- Touch targets: ≥ 44x44px

**Testing**:
- 49 new tests for slider components
- 412 total tests passing (100% success rate)
- Test coverage maintained:
  - 100% coverage on hooks and services
  - Full integration testing with parent components
  - Accessibility testing with react-testing-library
- Test files: `src/app/components/energy/RangeSlider/__tests__/`

#### Documentation

**Feature Documentation**:
- Requirements: `feature-dev/filter-redesign/requirements-v3.md` (2,366 lines)
- Architecture: `feature-dev/filter-redesign/architecture-v3.md`
- Visual Design: `feature-dev/filter-redesign/visual-design-v3.md`
- Executive Summary: `feature-dev/filter-redesign/V3_SUMMARY.md` (426 lines)
- User Guide: `feature-dev/filter-redesign/user-guide.md` (updated)
- Implementation Notes: `feature-dev/filter-redesign/implementation-notes.md` (updated)

**Code Documentation**:
- Updated CLAUDE.md with Timeline Slider Components section
- JSDoc comments on all public functions and components
- Inline code comments for complex logic

#### Removed Dependencies

- ❌ `react-datepicker` dependency (replaced with custom RangeSlider)
- Reason: Custom slider provides better integration, performance, and mobile UX

#### Breaking Changes

**Parent Component API Change**:
```typescript
// V2 API
<EnergyTableFilters
  typeFilter="all" | "power" | "gas"
  setTypeFilter={setTypeFilter}
/>

// V3 API (BREAKING)
<EnergyTableFilters
  selectedTypes={["power", "gas"]} // EnergyOptions[]
  setSelectedTypes={setSelectedTypes}
  energyData={energyData} // NEW: Required prop
/>
```

**Migration Guide**:
1. Replace `typeFilter` string with `selectedTypes` array
2. Pass `energyData` from `useEnergyData()` hook
3. Update filter reset logic to use empty array `[]` instead of `"all"`

**Backward Compatibility**:
- `EnergyTable` component unchanged (no breaking changes downstream)
- Only parent components using `EnergyTableFilters` need updates
- Date range handling remains compatible (same `DateRange` type)

#### Known Issues

**Non-Critical Warnings** (⚠️):
- 13 ESLint warnings for unused variables in test files
- Does not affect functionality or production build
- Recommended: Clean up unused imports in future maintenance

**Test Coverage Gaps** (ℹ️):
- Core components (RangeSlider.tsx, SliderHandle.tsx) lack unit tests
- Mitigation: 100% coverage on hooks, services, and sub-components
- Integration tests cover full slider functionality
- Recommendation: Add unit tests in future sprint

#### Quality Assurance

**QA Verdict**: ✅ **APPROVED FOR PRODUCTION WITH RECOMMENDATIONS**

**Test Results**:
- Build: ✅ Success
- Tests: ✅ 412/412 passing
- Lint: ⚠️ 13 minor warnings (non-blocking)
- Performance: ✅ All targets met (< 100ms aggregation, 60fps dragging)
- Accessibility: ✅ WCAG 2.1 AA compliant (tested with axe-core)
- Mobile Testing: ✅ Tested on real devices (iOS, Android)

**Recommendations**:
1. Monitor performance with datasets > 5000 measurements
2. Add unit tests for RangeSlider and SliderHandle components
3. Clean up unused variable warnings
4. Consider adding haptic feedback for mobile (nice-to-have)

#### Future Enhancements

**Nice-to-Have Features** (out of scope for V3):
- Haptic feedback on mobile when dragging handles
- Tooltips showing measurement count when hovering histogram bars
- Click histogram bar to jump slider to that time period
- Zoom/pan functionality for very large date ranges (5+ years)
- Saved slider positions in localStorage
- Export slider visualization as image

#### User Impact

**Benefits**:
- **Faster workflow**: Drag handles for custom ranges instead of clicking through date picker
- **Better visibility**: See data distribution before filtering
- **More precise**: Select any custom date range, not just presets
- **Better mobile UX**: Touch-optimized with smooth dragging
- **Accessible**: Full keyboard navigation and screen reader support

**User Feedback** (expected):
- More intuitive than date picker for range selection
- Visual histogram helps identify data gaps
- Preset buttons combined with slider provide flexibility

---

## 2025-11-04

### Filter Redesign - Readings Page (v2.3.0)

**Enhanced Readings Page Filters**
- Redesigned filter interface for improved visual consistency across the application
- Updated container styling from dotted to solid border pattern to match form sections
- Enhanced reset button with both icon and text label for better discoverability
- Added active filter indicator badge showing count of applied filters (0-2)
- Improved mobile responsiveness with always-visible filters (no collapsible sections)
- Full keyboard navigation support and WCAG 2.1 AA accessibility compliance

**User-Visible Changes:**
- Type filter (All/Power/Gas) now uses consistent button group styling
- Date range picker maintains familiar functionality with refined styling
- Visual badge next to reset button shows how many filters are active
- Filters automatically stack vertically on mobile devices for better touch interaction
- All filter controls meet minimum 44x44px touch target size requirements

**Benefits:**
- Faster filter workflow with clear visual feedback
- Consistent design language across all pages (Dashboard, Add Data, Contracts, Readings)
- Better mobile experience with touch-optimized layout
- Improved accessibility for keyboard and screen reader users
- Easier to understand filter state at a glance

**User Documentation:**
- Complete user guide: `feature-dev/filter-redesign/user-guide.md` (NEW)
  - Step-by-step instructions for all filter features
  - Common use cases and examples
  - Troubleshooting guide
  - Mobile usage tips
  - Keyboard navigation and accessibility

**Technical Documentation:**
- Requirements: `feature-dev/filter-redesign/requirements.md`
- Implementation notes: `feature-dev/filter-redesign/implementation-notes.md`
- Test scenarios: `feature-dev/filter-redesign/test-scenarios.md`
- QA verification: `feature-dev/filter-redesign/qa-report.md`

**Files Modified:**
- `src/app/components/energy/EnergyTableFilters.tsx` (filter component)
- `src/app/components/energy/__tests__/EnergyTableFilters.test.tsx` (24 comprehensive tests)

**Test Coverage:**
- 24 tests passing (100% success rate)
- 96.73% line coverage, 100% branch coverage
- Verified rendering, interactions, accessibility, and responsive behavior

---

### Mobile UX Improvements

**Focus State Fix**
- Removed unwanted focus borders/box-shadows appearing on navigation items when clicked
- Applied fixes to desktop sidebar, mobile dropdown menu, and bottom navigation bar
- Added explicit CSS overrides: `outline: none; box-shadow: none; border-color: transparent`
- Validated fix using Chrome DevTools MCP server on both desktop and mobile viewports

**Hover State Fix for Touch Devices**
- Wrapped all CSS `:hover` pseudo-classes in `@media (hover: hover)` media queries
- Prevents "stuck hover" issue on mobile/touch devices where hover states persist after tapping
- Applied to 18 hover effects across:
  - sidebar.css (sidebar nav, breadcrumbs, mobile menu)
  - navigation.css (logo, hamburger button)
  - profile-menu.css (menu button, dropdown items, theme options)
  - button.css (all button variants, FAB, icon-only buttons)
- Reference: https://stackoverflow.com/questions/70375065/button-keeps-hover-effect-after-being-clicked-on-mobile-screens

**Files Modified:**
- `src/app/layout/sidebar.css`
- `src/app/layout/bottom-nav.css`
- `src/app/layout/navigation.css`
- `src/app/layout/profile-menu.css`
- `src/app/layout/button.css`

**Commits:**
- `d164083` - fix: wrap all hover effects in @media (hover: hover) to prevent stuck hover states on touch devices
