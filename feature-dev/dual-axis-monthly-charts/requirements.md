# Requirements Specification: Dual Y-Axis Monthly Charts

## Overview
Enhance the existing `MonthlyMeterReadingsChart` component to display both cumulative meter readings (left y-axis) and monthly consumption differences (right y-axis) in a single unified chart. This provides users with both the absolute meter state and the month-to-month consumption in one comprehensive visualization.

## Current Application State

### Existing Implementation Analysis

**Location**: `/src/app/components/energy/MonthlyMeterReadingsChart.tsx`

**Current Features**:
- Two separate line charts (Power and Gas)
- Displays end-of-month meter readings for 12 months
- Year navigation with prev/next buttons and dropdown
- Data quality indicators (actual, interpolated, extrapolated)
- Visual distinction via line styles and point markers
- Mobile-responsive with conditional font sizes and layouts
- Legend showing data quality types (Actual, Interpolated, Extrapolated)

**Current Data**:
- Source: `MonthlyDataAggregationService.calculateMonthlyReadings()`
- Returns: Array of 12 `MonthlyDataPoint` objects per energy type
- Each point contains: month, label, meterReading, quality flags
- Supports actual readings (±3 day tolerance)
- Supports interpolated values (linear interpolation between readings)
- Supports extrapolated values (trend-based projection)

**Current Chart Configuration**:
- Chart type: Line chart with points
- Y-axis: Meter Reading (kWh or m³)
- X-axis: Month labels (Jan-Dec)
- Legend: Custom legend showing data quality types
- Tooltips: Show meter reading and data quality
- Colors: Power (teal), Gas (red) from ENERGY_TYPE_CONFIG

**Integration Points**:
- Used in: `/src/app/charts/page.tsx`
- Service: `/src/app/services/MonthlyDataAggregationService.ts`
- Types: `MonthlyDataPoint` in `/src/app/types.ts`
- Constants: `ENERGY_TYPE_CONFIG`, `CHART_BORDER_DASH`, `CHART_POINT_RADIUS`

### User Request Analysis

**Primary Goal**: Show consumption (monthly differences) alongside meter readings without splitting into separate charts or requiring view mode toggles.

**Use Case**: User wants to see:
1. **Meter readings** (cumulative): "My meter read 1,234 kWh at end of January"
2. **Monthly consumption** (difference): "I used 156 kWh during February"
3. **Both together**: Compare absolute state with consumption patterns in one view

**Benefits**:
- Single chart shows complete monthly picture
- Easy correlation: "High meter reading in March corresponds to 200 kWh consumption that month"
- No need to switch views or perform mental math
- Consumption bars provide visual weight to usage amounts
- Meter reading line maintains trend continuity

## Platform Requirements

### Mobile (Primary)
**Target Platforms**: iOS and Android
**Minimum Requirements**:
- iOS: 14+
- Android: 10+
- Screen sizes: 320px - 428px width

**Mobile-Specific Considerations**:
- Dual y-axis labels must remain readable (9-11px fonts)
- Chart legend must accommodate both datasets (meter + consumption)
- Touch targets for chart interactions maintained at 44x44px minimum
- Bar chart visibility on small screens (sufficient bar width)
- Axis labels positioned to avoid overlap
- Responsive height: `clamp(300px, 50vh, 500px)` per chart

### Desktop (Secondary)
**Minimum Requirements**:
- Browser support: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- Screen sizes: 1024px+ width

**Desktop-Specific Considerations**:
- Larger fonts for axis labels (11-13px)
- Hover states for bars and line points
- More detailed tooltips with both values
- Legend at top of chart (vs bottom on mobile)
- Axis titles fully visible

### Responsive Design
**Breakpoints**:
- Mobile: 320px - 767px (primary)
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Responsive Behavior**:
- Chart height: Same as current (`clamp(300px, 50vh, 500px)`)
- Y-axis label font sizes scale with viewport
- Legend wraps on mobile if needed
- Tooltip content abbreviates on narrow screens
- Bar width adjusts based on available space

## Functional Requirements

### FR-001: Dual Y-Axis Configuration
**Priority**: High
**Description**: Configure Chart.js to display two independent y-axes - left for meter readings, right for monthly consumption.

**Acceptance Criteria**:
- Left y-axis labeled "Meter Reading (kWh)" or "Meter Reading (m³)"
- Right y-axis labeled "Monthly Consumption (kWh)" or "Monthly Consumption (m³)"
- Each axis auto-scales independently based on its dataset
- Left axis uses current meter reading range (e.g., 1000-2000 kWh)
- Right axis uses consumption range (e.g., 0-300 kWh)
- Both axes start at appropriate minimum (not necessarily zero)
- Grid lines shared (based on left y-axis only to avoid clutter)
- Mobile: Axis titles hidden, labels only (space constraint)
- Desktop: Both axis titles visible

### FR-002: Consumption Calculation Service
**Priority**: High
**Description**: Extend `MonthlyDataAggregationService` to calculate monthly consumption differences from meter readings.

**Acceptance Criteria**:
- New function: `calculateMonthlyConsumption(monthlyData: MonthlyDataPoint[]): MonthlyConsumptionPoint[]`
- Returns array of 12 consumption values (one per month)
- Consumption = Current month meter reading - Previous month meter reading
- First month (January):
  - If no previous December data from prior year, consumption = null
  - Optional: Accept previous year's December reading as parameter
- Handle null meter readings: If current or previous is null, consumption = null
- Handle interpolated/extrapolated data: Flag consumption as derived if either endpoint is not actual
- Return type:
  ```typescript
  type MonthlyConsumptionPoint = {
    month: number; // 1-12
    monthLabel: string; // "Jan", "Feb", etc.
    consumption: number | null; // Difference in kWh/m³
    isActual: boolean; // Both endpoints are actual readings
    isDerived: boolean; // One or both endpoints are interpolated/extrapolated
    sourceReadings: {
      current: MonthlyDataPoint;
      previous: MonthlyDataPoint | null;
    };
  };
  ```
- JSDoc documentation with examples
- Pure function, no side effects

### FR-003: Combined Chart Dataset
**Priority**: High
**Description**: Configure Chart.js with two datasets - line chart for meter readings, bar chart for consumption.

**Acceptance Criteria**:
- Dataset 1 (Line): Meter readings mapped to left y-axis (`yAxisID: 'y-left'`)
  - Type: 'line'
  - Visual style: Same as current (solid/dashed based on data quality)
  - Point markers: Filled/hollow based on actual/interpolated
  - Color: From ENERGY_TYPE_CONFIG (Power: teal, Gas: red)
  - Order: 2 (rendered on top of bars)

- Dataset 2 (Bar): Monthly consumption mapped to right y-axis (`yAxisID: 'y-right'`)
  - Type: 'bar'
  - Visual style: Semi-transparent bars (opacity: 0.6)
  - Color: Lighter shade of energy type color (use backgroundColor from config)
  - Bar width: 60% of category width
  - Border: 1px solid border matching energy type
  - Order: 1 (rendered behind line)
  - Pattern/texture: Solid for actual, striped/hatched for derived data

- Both datasets in single Chart.js config
- Shared x-axis (month labels)
- Chart type: 'line' with mixed dataset types

### FR-004: Visual Differentiation
**Priority**: High
**Description**: Clearly distinguish between meter readings (line) and consumption (bars) while maintaining data quality indicators.

**Acceptance Criteria**:
- **Meter Reading Line**:
  - Solid line + filled circles = Actual reading
  - Dashed line + hollow circles = Interpolated reading
  - Long-dashed line + hollow circles = Extrapolated reading
  - Line color: Full saturation from ENERGY_TYPE_CONFIG

- **Consumption Bars**:
  - Solid bars = Actual consumption (both endpoints actual)
  - Hatched/striped bars = Derived consumption (one or both endpoints interpolated/extrapolated)
  - Bar color: 60% opacity of energy type backgroundColor
  - Bar border: 1px solid border color matching energy type
  - Bars positioned behind line chart (visual hierarchy)

- **Color Coordination**:
  - Power: Line (teal), Bars (light teal with opacity)
  - Gas: Line (red/pink), Bars (light red/pink with opacity)
  - Maintain existing color scheme from ENERGY_TYPE_CONFIG

- **Legend Updates**:
  - Add bar legend item: "Monthly Consumption"
  - Keep existing line legend items: "Actual", "Interpolated", "Extrapolated"
  - Mobile: Legend at bottom, compact spacing
  - Desktop: Legend at top, comfortable spacing

### FR-005: Enhanced Tooltips
**Priority**: Medium
**Description**: Update tooltip to display both meter reading and consumption values when hovering over a month.

**Acceptance Criteria**:
- Tooltip shows both values for the hovered month:
  ```
  February 2024
  Meter Reading: 1,234 kWh (Actual)
  Consumption: 156 kWh
  ```
- If consumption is null (first month or gaps): Show "N/A" or "-"
- Data quality indicator for meter reading: "(Actual)", "(Interpolated)", "(Extrapolated)"
- Consumption quality: Show if derived from interpolated/extrapolated data
- Tooltip triggered by hovering over either line point or bar
- Mobile: Slightly smaller font (11px vs 13px)
- Desktop: Standard font (13px)
- Tooltip width expands to fit content (no truncation)

### FR-006: Edge Case Handling
**Priority**: High
**Description**: Handle edge cases for consumption calculation and visualization.

**Acceptance Criteria**:
- **First Month (January)**:
  - No previous data: Consumption = null, bar not rendered
  - Optional enhancement: Accept Dec of previous year if available
  - Tooltip shows: "Consumption: N/A (first month)"

- **Null Meter Readings**:
  - If current month reading is null: No bar rendered for that month
  - If previous month reading is null: Consumption = null for current month
  - Gap in bar chart corresponds to gap in line chart

- **Negative Consumption**:
  - If meter reading decreases (reset/rollback): Allow negative values
  - Render bar below zero line (downward bar)
  - Color: Same as positive but distinguished with red tint or border
  - Tooltip: "Consumption: -50 kWh (meter reset?)"
  - Log warning for investigation

- **Mixed Data Quality**:
  - Current = Actual, Previous = Interpolated → Consumption is Derived
  - Current = Extrapolated, Previous = Actual → Consumption is Derived
  - Mark derived consumption with hatched bar pattern

- **Year Boundary**:
  - December: Calculate consumption normally (Dec - Nov)
  - January of next year: Ideally use Dec of this year, but requires cross-year data fetch
  - MVP: January consumption = null if no Dec data

### FR-007: Accessibility and Mobile Optimization
**Priority**: Medium
**Description**: Ensure dual-axis chart is accessible and performs well on mobile devices.

**Acceptance Criteria**:
- Touch targets: Maintain 44x44px minimum for interactive elements
- Axis labels: Sufficient contrast ratio (≥4.5:1)
- ARIA labels: Chart includes descriptive aria-label summarizing content
- Screen reader: Alternative text describes dual-axis nature
- Keyboard navigation: Focus states on interactive chart elements
- Performance: Render time <500ms for 12 months of dual data
- Mobile rendering: No horizontal scroll, axes fit within viewport
- Font legibility: Minimum 9px on mobile, 11px on desktop
- Color blindness: Maintain distinguishability without relying solely on color (use patterns/textures)

### FR-008: Unit Handling
**Priority**: Medium
**Description**: Correctly label and format units for Power (kWh) vs Gas (m³).

**Acceptance Criteria**:
- Detect energy type from props/data
- Power charts:
  - Left axis: "Meter Reading (kWh)"
  - Right axis: "Monthly Consumption (kWh)"
  - Tooltip: "1,234 kWh"

- Gas charts:
  - Left axis: "Meter Reading (m³)"
  - Right axis: "Monthly Consumption (m³)"
  - Tooltip: "156 m³"

- Number formatting: Thousands separator (1,234)
- Decimal places: 2 for consumption, 2 for meter readings
- Consistent across all tooltips, labels, and legends

## Non-Functional Requirements

### NFR-001: Performance
**Priority**: High
**Metric**: Chart render time and calculation speed
**Target**:
- Consumption calculation: <50ms for 12 months
- Chart render (dual-axis): <600ms (slightly higher than single axis due to complexity)
- Year navigation re-render: <250ms
- No perceived lag on mobile devices (60fps interactions)

### NFR-002: Code Quality
**Priority**: High
**Metric**: Maintainability, testability, and adherence to patterns
**Target**:
- New service function: 100% test coverage
- Component changes: Maintain >80% coverage
- No new eslint errors or warnings
- Follows existing Chart.js patterns in codebase
- JSDoc comments on all new functions
- Type safety: Explicit types, no `any`

### NFR-003: Chart.js Compatibility
**Priority**: High
**Metric**: Proper use of Chart.js v4 API
**Target**:
- Use Chart.js v4 dual y-axis configuration correctly
- Register required Chart.js components (BarElement, BarController)
- Mixed chart type support (line + bar)
- Proper scale configuration with `yAxisID` mapping
- No Chart.js console warnings or errors

### NFR-004: Visual Consistency
**Priority**: Medium
**Metric**: Design adherence to existing patterns
**Target**:
- Colors match existing ENERGY_TYPE_CONFIG
- Chart styling consistent with UnifiedEnergyChart and current MonthlyMeterReadingsChart
- Legend format matches existing patterns
- Tooltip styling matches existing charts
- Mobile/desktop breakpoints align with project standards

### NFR-005: Backward Compatibility
**Priority**: Medium
**Metric**: No breaking changes to existing functionality
**Target**:
- Existing MonthlyMeterReadingsChart API unchanged (same props interface)
- MonthlyDataAggregationService existing functions unchanged
- New function added, old functions remain functional
- No regression in existing chart rendering
- No impact on other chart components (UnifiedEnergyChart, EnergyCharts)

## Technical Specifications

### Architecture

**Component Changes**:
```
MonthlyMeterReadingsChart.tsx (enhanced)
├── calculateMonthlyReadings() - existing service call
├── calculateMonthlyConsumption() - NEW service call
├── Transform to Chart.js dual-axis format
├── PowerChart (Line + Bar, dual y-axis)
└── GasChart (Line + Bar, dual y-axis)
```

**Service Layer Additions**:
```
MonthlyDataAggregationService.ts (enhanced)
├── calculateMonthlyReadings() - existing, unchanged
├── calculateMonthlyConsumption() - NEW function
│   ├── Input: MonthlyDataPoint[]
│   ├── Output: MonthlyConsumptionPoint[]
│   └── Logic: Current - Previous, handle nulls/quality
└── Helper: determineConsumptionQuality() - NEW
```

**Data Flow**:
1. User navigates to `/charts`, selects year
2. `MonthlyMeterReadingsChart` receives energyData and selectedYear
3. Service calculates monthly meter readings (existing)
4. Service calculates monthly consumption (NEW) from readings
5. Component transforms both into Chart.js dual-axis format
6. Chart.js renders line (meter) + bars (consumption) on dual axes
7. User hovers to see both values in tooltip

### Data Models

**MonthlyConsumptionPoint** (NEW type in `types.ts`):
```typescript
type MonthlyConsumptionPoint = {
  month: number; // 1-12 (January = 1)
  monthLabel: string; // "Jan", "Feb", ..., "Dec"
  consumption: number | null; // kWh or m³ consumed in this month
  isActual: boolean; // true if both current and previous readings are actual
  isDerived: boolean; // true if one or both readings are interpolated/extrapolated
  sourceReadings: {
    current: MonthlyDataPoint; // Current month's meter reading
    previous: MonthlyDataPoint | null; // Previous month's meter reading (null for January)
  };
};
```

**Chart.js Dual-Axis Configuration**:
```typescript
// Example structure
const chartData = {
  labels: ['Jan', 'Feb', 'Mar', ...], // 12 months
  datasets: [
    {
      // Dataset 1: Meter Readings (Line)
      type: 'line',
      label: 'Meter Reading',
      data: [1000, 1156, 1312, ...], // 12 meter values
      yAxisID: 'y-left',
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      // ... line styling (solid/dashed, points)
      order: 2, // Render on top
    },
    {
      // Dataset 2: Consumption (Bar)
      type: 'bar',
      label: 'Monthly Consumption',
      data: [null, 156, 156, ...], // 12 consumption values
      yAxisID: 'y-right',
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgb(75, 192, 192)',
      borderWidth: 1,
      barPercentage: 0.6,
      // ... bar styling (solid/hatched)
      order: 1, // Render behind line
    },
  ],
};

const chartOptions = {
  // ... existing options
  scales: {
    x: { /* existing x-axis config */ },
    'y-left': {
      type: 'linear',
      position: 'left',
      title: { display: true, text: 'Meter Reading (kWh)' },
      // ... styling
    },
    'y-right': {
      type: 'linear',
      position: 'right',
      title: { display: true, text: 'Monthly Consumption (kWh)' },
      grid: { drawOnChartArea: false }, // Don't draw grid for right axis
      // ... styling
    },
  },
};
```

### API/Interface Contracts

**MonthlyDataAggregationService.calculateMonthlyConsumption**:
```typescript
/**
 * Calculate monthly consumption from month-end meter readings
 *
 * Consumption for a month = Current month reading - Previous month reading
 * First month (January) will have null consumption unless previous December is provided
 *
 * @param monthlyData - Array of 12 MonthlyDataPoint objects (from calculateMonthlyReadings)
 * @param previousDecember - Optional: December reading from previous year for January calculation
 * @returns Array of 12 MonthlyConsumptionPoint objects
 *
 * @example
 * const readings = calculateMonthlyReadings(energyData, 2024, 'power');
 * const consumption = calculateMonthlyConsumption(readings);
 * // consumption[0].consumption === null (January, no previous data)
 * // consumption[1].consumption === readings[1].meterReading - readings[0].meterReading
 */
function calculateMonthlyConsumption(
  monthlyData: MonthlyDataPoint[],
  previousDecember?: MonthlyDataPoint
): MonthlyConsumptionPoint[];
```

**MonthlyDataAggregationService.determineConsumptionQuality** (helper):
```typescript
/**
 * Determine if consumption value is from actual or derived data
 *
 * @param current - Current month's data point
 * @param previous - Previous month's data point
 * @returns Object with isActual and isDerived flags
 */
function determineConsumptionQuality(
  current: MonthlyDataPoint,
  previous: MonthlyDataPoint
): { isActual: boolean; isDerived: boolean };
```

### Dependencies

**Existing Dependencies** (no new packages needed):
- `chart.js` ^4.4.1 - Already installed
- `react-chartjs-2` ^5.2.0 - Already installed
- `date-fns` ^2.30.0 - Already installed

**Chart.js Components to Register** (add to existing registration):
```typescript
import {
  // ... existing imports
  BarElement,
  BarController,
} from 'chart.js';

ChartJS.register(
  // ... existing registrations
  BarElement,
  BarController
);
```

**Internal Dependencies**:
- `@/app/types` - Add `MonthlyConsumptionPoint` type
- `@/app/services/MonthlyDataAggregationService` - Add new functions
- `@/app/constants/energyTypes` - Use existing colors
- `@/app/constants/ui` - Use existing chart constants

### Technology Stack

**Framework**: Next.js 14 (App Router)
**Language**: TypeScript 5
**Charts**: Chart.js 4 with react-chartjs-2 (mixed chart type: line + bar)
**Styling**: Tailwind CSS 4
**Testing**: Jest + React Testing Library

## Implementation Considerations

### SOLID Principles Application

**Single Responsibility Principle (SRP)**:
- `calculateMonthlyConsumption()` has one job: calculate differences between readings
- Component's new responsibility: render dual-axis chart (extends existing responsibility)
- Helper function `determineConsumptionQuality()` isolated for clarity

**Open/Closed Principle (OCP)**:
- Service extended with new function, existing functions unchanged
- Component enhanced with new dataset, existing logic preserved
- Chart configuration extended with right y-axis, left axis unchanged

**Liskov Substitution Principle (LSP)**:
- `MonthlyConsumptionPoint` type is compatible with existing data point patterns
- Service functions maintain consistent interface patterns

**Interface Segregation Principle (ISP)**:
- New function accepts minimal parameters needed
- Component props interface unchanged (no new required props)

**Dependency Inversion Principle (DIP)**:
- Component depends on service abstraction, not implementation details
- Service functions remain pure and testable in isolation

### Clean Code Guidelines

**Naming Conventions**:
- Function: `calculateMonthlyConsumption` (verb-first, clear purpose)
- Type: `MonthlyConsumptionPoint` (descriptive noun, matches pattern)
- Variables: `currentReading`, `previousReading`, `consumptionData` (readable)

**Function Design**:
- Keep `calculateMonthlyConsumption()` small (<50 lines)
- Single level of abstraction
- Pure function, no side effects
- Early returns for edge cases (null data)
- Extract quality determination to helper function

**Type Safety**:
- Explicit return type: `MonthlyConsumptionPoint[]`
- No `any` types
- Proper null handling (`| null` for intentional absence)
- Union types for data quality flags

**Constants**:
- Bar opacity: `const BAR_OPACITY = 0.6`
- Bar width: `const BAR_WIDTH_PERCENTAGE = 0.6`
- Add to `CHART_*` constants in ui.ts

**Error Handling**:
- Validate monthlyData has 12 elements
- Handle null readings gracefully (return null consumption)
- Warn on negative consumption (log for investigation)
- Throw on invalid input (e.g., empty array)

### Testing Strategy

**Unit Tests** (100% coverage for new code):

**MonthlyDataAggregationService.test.ts** (additions):
- `calculateMonthlyConsumption()`:
  - ✓ Calculates correct differences for 12 months
  - ✓ Returns null for first month (no previous data)
  - ✓ Handles null meter readings (returns null consumption)
  - ✓ Marks consumption as actual when both readings are actual
  - ✓ Marks consumption as derived when either reading is interpolated
  - ✓ Handles negative consumption (meter reset)
  - ✓ Accepts optional previous December for January calculation
  - ✓ Throws error for invalid input (not 12 months)

- `determineConsumptionQuality()`:
  - ✓ Returns isActual=true when both actual
  - ✓ Returns isDerived=true when current interpolated
  - ✓ Returns isDerived=true when previous interpolated
  - ✓ Returns isDerived=true when current extrapolated
  - ✓ Handles all combinations of actual/interpolated/extrapolated

**Component Tests** (maintain >80% coverage):

**MonthlyMeterReadingsChart.test.tsx** (additions):
- ✓ Renders dual-axis chart with meter and consumption datasets
- ✓ Configures left y-axis for meter readings
- ✓ Configures right y-axis for consumption
- ✓ Displays bars for consumption data
- ✓ Displays line for meter readings (existing test)
- ✓ Tooltip shows both meter and consumption values
- ✓ Legend includes both datasets
- ✓ Handles null consumption for first month
- ✓ Renders correctly on mobile (smaller fonts, legend bottom)
- ✓ Renders correctly on desktop (larger fonts, legend top)
- ✓ Negative consumption renders below zero

**Integration Tests**:
- ✓ Full page render with dual-axis charts
- ✓ Year navigation recalculates consumption correctly
- ✓ Both Power and Gas charts render dual axes independently

**Visual Regression Tests** (manual or automated):
- ✓ Screenshot comparison: dual-axis chart vs baseline
- ✓ Mobile viewport: bars and line visible
- ✓ Desktop viewport: axis labels readable
- ✓ Legend formatting correct
- ✓ Tooltip content correct

**Test-First Approach**:
1. Write test for `calculateMonthlyConsumption()` with sample data
2. Implement function to pass test
3. Write test for consumption quality determination
4. Implement helper function
5. Write component test with mocked dual-axis chart
6. Update component to render dual-axis chart
7. Write integration test
8. Verify end-to-end functionality

### Key Test Scenarios

**Happy Path**:
- 12 actual readings → 11 actual consumption values + 1 null (Jan)
- Consumption correctly calculated as differences
- Dual-axis chart renders both datasets
- Tooltips show both values

**Edge Cases**:
- Sparse data (only 3 readings) → Most consumption values null
- First month → Consumption = null
- Null meter reading mid-year → Consumption null for that month and next
- Negative consumption → Bar renders below zero, logged
- All interpolated data → All consumption marked as derived
- Mixed actual/interpolated → Consumption correctly marked

**Mobile**:
- 320px width → Axis labels readable, bars visible
- Tooltip fits on screen → No overflow
- Legend wraps → All items visible

**Performance**:
- 12 months of data → Render <600ms
- Year change → Recalculate and render <250ms

## Edge Cases & Error Handling

### Edge Case 1: First Month (January) Consumption
**Scenario**: No December data from previous year available.
**Handling**:
- Consumption = null for January
- Bar chart shows gap for January (no bar)
- Tooltip: "Consumption: N/A (first month)"
- Optional enhancement: Fetch previous December if needed (future improvement)

### Edge Case 2: Negative Consumption
**Scenario**: Meter reading decreases (e.g., meter reset, manual correction).
**Handling**:
- Allow negative values (don't clamp to zero)
- Render bar below zero line (downward bar)
- Color: Same scheme but with visual warning (red tint or special border)
- Tooltip: "Consumption: -50 kWh (meter reading decreased)"
- Log warning: `console.warn('Negative consumption detected for [month]')`
- Flag as potential data issue for user review

### Edge Case 3: Null Meter Readings
**Scenario**: One or both meter readings are null (gaps in data).
**Handling**:
- If current month null: Consumption = null, no bar
- If previous month null: Consumption = null for current, no bar
- Chart shows gap in bars corresponding to gap in line
- Tooltip: "Consumption: N/A (missing data)"
- No error, graceful degradation

### Edge Case 4: All Derived Data
**Scenario**: Entire year has interpolated/extrapolated readings.
**Handling**:
- All consumption values marked as derived
- All bars use hatched/striped pattern
- Tooltip indicates: "(derived from interpolated data)"
- Info message: "Limited actual readings. Consumption estimates based on interpolated data."
- Still render chart, but with clear data quality indication

### Edge Case 5: Single Reading Per Year
**Scenario**: User has only one actual reading in the year.
**Handling**:
- Most months will have null meter readings (except the one with actual reading)
- Consumption calculations will mostly be null
- Chart shows mostly gaps with one or two data points
- Info message: "Limited data. Add more readings for better consumption tracking."
- No error, graceful degradation

### Edge Case 6: Extreme Value Ranges
**Scenario**: Meter readings in thousands, consumption in tens (very different scales).
**Handling**:
- Left y-axis auto-scales to meter reading range (e.g., 1000-2000)
- Right y-axis auto-scales to consumption range (e.g., 0-200)
- Axes scale independently, no forced relationship
- Grid lines based on left axis only (right axis no grid to avoid clutter)
- Verify no visual overlap or confusion

### Edge Case 7: Mobile Narrow Screens (320px)
**Scenario**: Dual y-axis on very narrow mobile screens.
**Handling**:
- Left axis labels: 9px font, abbreviated if needed ("1.2k" vs "1,234")
- Right axis labels: 9px font, abbreviated
- Axis titles hidden on mobile (labels only)
- Bar width: Minimum 8px per bar (sufficient visibility)
- Touch target for bars: Expanded hit area (even if visual bar is small)
- Test specifically on 320px viewport

### Edge Case 8: Year Boundary Cross-Over
**Scenario**: Calculating January consumption requires previous December.
**Handling**:
- MVP: January consumption = null (no cross-year data)
- Future enhancement: Accept `previousDecember` parameter
  - Component could fetch Dec of prev year if needed
  - Service accepts optional parameter: `calculateMonthlyConsumption(monthlyData, previousDecember?)`
- Document limitation in user guide

## Assumptions

1. **Data Availability**: Monthly meter readings are available (via existing service)
2. **Chart.js Version**: Project uses Chart.js v4 with dual-axis and mixed chart support
3. **Calculation Method**: Simple subtraction (current - previous) is sufficient for consumption
4. **First Month**: Acceptable to show null consumption for January without cross-year data
5. **Negative Values**: Allowed and rendered (meter resets are rare but possible)
6. **Data Quality Propagation**: Consumption quality derived from meter reading quality (reasonable)
7. **Performance**: Adding bar dataset won't significantly impact render time (bars are simple)
8. **User Understanding**: Users understand dual y-axis concept with proper labeling
9. **Mobile Usage**: Touch interactions sufficient (no hover-dependent features)
10. **Unit Consistency**: Meter readings and consumption use same units (kWh or m³ per energy type)

## Open Questions

### Q1: First Month Consumption Strategy
**Question**: Should we support cross-year consumption calculation (fetch previous December)?
**Options**:
- A) Show null for January (MVP) - simple, no extra complexity
- B) Fetch previous December if available - complete data but requires extra API call/logic
- C) Show estimated consumption based on average - potentially misleading
**Recommendation**: Option A for MVP, Option B as future enhancement (pass previous December as optional param)

### Q2: Negative Consumption Visualization
**Question**: How should we visually indicate negative consumption (meter resets)?
**Options**:
- A) Standard bar below zero, same color - subtle
- B) Red tinted bar - clear warning but may conflict with Gas color
- C) Special icon/marker next to bar - clear but adds complexity
- D) Border style change (e.g., dashed border) - subtle but distinct
**Recommendation**: Option D (dashed border) + tooltip warning

### Q3: Derived Consumption Indicators
**Question**: How to visually distinguish consumption from derived (interpolated/extrapolated) meter readings?
**Options**:
- A) Hatched/striped bar pattern - clear but may look busy
- B) Lighter opacity (0.4 vs 0.6) - subtle, clean
- C) Dashed border - consistent with line chart pattern
- D) No visual difference, rely on tooltip - simplest but less discoverable
**Recommendation**: Option C (dashed border) - consistent with existing data quality indicators

### Q4: Y-Axis Scale Relationship
**Question**: Should the two y-axes have any proportional relationship?
**Options**:
- A) Independent auto-scaling (default) - clearest for each dataset
- B) Synchronized zero points - easier mental alignment
- C) Proportional scales (e.g., consumption max = 10% of meter max) - false relationship
**Recommendation**: Option A (independent) - most honest representation of data

### Q5: Legend Complexity
**Question**: How to handle legend with both meter reading quality AND consumption dataset?
**Options**:
- A) Combined legend: "Meter Reading (Actual/Interp/Extrap)" + "Monthly Consumption" - complete but long
- B) Separate legends: One for data quality, one for datasets - clear but takes space
- C) Simplified legend: "Meter Reading", "Consumption", hide quality indicators - cleaner but less info
- D) Tooltip-only quality info, legend just shows datasets - balanced
**Recommendation**: Option D - Legend shows "Meter Reading" (line) and "Monthly Consumption" (bar), quality details in tooltips

### Q6: Mobile Y-Axis Title Handling
**Question**: Should we hide y-axis titles on mobile due to space constraints?
**Options**:
- A) Hide both axis titles, show only values - clean but less clear
- B) Abbreviate titles ("Meter" / "Consumption") - compact but readable
- C) Keep full titles, reduce font - legible but cramped
- D) Rotate left title vertically, hide right title - asymmetric but functional
**Recommendation**: Option A - Rely on chart title and tooltip to provide context, axis labels only

## Success Metrics

**User Experience**:
- Users can see both meter state and consumption in one chart
- Clear visual distinction between meter reading (line) and consumption (bars)
- Tooltips provide complete information for each month
- Mobile experience is readable and functional
- No confusion between two y-axes

**Technical Quality**:
- All tests pass with >80% coverage
- Consumption calculation 100% accurate
- No performance regression (<600ms render)
- No Chart.js errors or warnings
- Code follows existing patterns and principles

**Functionality**:
- Dual y-axis correctly configured and scaled
- Consumption correctly calculated as month-to-month differences
- Data quality indicators work for both datasets
- Edge cases handled gracefully (nulls, negatives, first month)
- Works across all supported browsers and devices

**Visual Quality**:
- Chart is visually balanced (bars don't overpower line)
- Colors are coordinated and accessible
- Legend is clear and complete
- Responsive design maintains readability at all breakpoints
- Axes are properly labeled and scaled

## Related Documentation

- **Parent Feature**: `feature-dev/monthly-charts-redesign/requirements.md` - Original monthly charts redesign
- **Service Reference**: `src/app/services/MonthlyDataAggregationService.ts` - Existing calculation logic
- **Component Reference**: `src/app/components/energy/MonthlyMeterReadingsChart.tsx` - Component to enhance
- **Chart Patterns**: `src/app/components/energy/UnifiedEnergyChart.tsx` - Dual dataset examples
- **Type Definitions**: `src/app/types.ts` - Existing type patterns

## Next Steps

1. **Review Requirements**: Validate this specification with user/stakeholders
2. **Service Extension**: Implement `calculateMonthlyConsumption()` with tests
3. **Type Definition**: Add `MonthlyConsumptionPoint` to types.ts
4. **Component Enhancement**: Update MonthlyMeterReadingsChart with dual-axis configuration
5. **Chart.js Registration**: Register BarElement and BarController
6. **Testing**: Comprehensive unit and component tests
7. **Visual Testing**: Verify appearance on mobile and desktop
8. **Documentation**: Update component docs and user guide
9. **Deployment**: Release and gather user feedback

---

**Document Version**: 1.0
**Last Updated**: 2025-11-06
**Author**: Claude (Requirements Analyst Agent)
**Status**: Draft - Ready for Review
**Parent Feature**: Monthly Charts Redesign
