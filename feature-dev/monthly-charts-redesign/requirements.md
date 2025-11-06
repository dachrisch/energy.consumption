# Requirements Specification: Monthly Charts View Redesign

## Overview
The current `/charts` page implementation displays energy data using the `UnifiedEnergyChart` component with three view modes: measurements, monthly, and yearly. The user requires a complete redesign of the monthly view to provide a clearer, more focused visualization of end-of-month meter readings with proper handling of actual measurements and interpolated values.

## Current Application State

### Existing Implementation Analysis

**Location**: `/src/app/charts/page.tsx` and `/src/app/components/energy/UnifiedEnergyChart.tsx`

**Current Features**:
- Three view modes: Measurements, Monthly, and Yearly
- View mode toggle with radio button groups (primary control)
- Year navigation for monthly view (prev/next buttons + dropdown)
- Type filtering (Power/Gas/All) inherited from page-level filters
- Date range filtering inherited from page-level filters
- Data mode toggle (Meter Readings vs Consumption) for measurements view
- Line charts for all views using Chart.js
- Cost breakdown with interpolation/extrapolation indicators
- Mobile-responsive design with conditional rendering

**Current Monthly View Behavior**:
- Shows consumption data (differences between readings) as line chart
- Uses `calculateCosts()` from `costCalculation.ts` handler
- Automatically fills all 12 months of selected year
- Shows interpolated data (dashed lines) for missing periods
- Shows extrapolated data (longer dashed lines) for future predictions
- Includes cost breakdown tooltips
- Displays total consumption and cost summary

**Current Data Flow**:
1. `ChartsPage` fetches energy data and contracts
2. Filters applied via `EnergyTableFilters` (type and date range)
3. `UnifiedEnergyChart` receives filtered data
4. `calculateCosts()` processes data into monthly buckets
5. Chart.js renders line chart with datasets

**Integration Points**:
- `/api/energy` - Fetches all energy readings
- `/api/contracts` - Fetches contract pricing data
- `costCalculation.ts` - Handles monthly data aggregation and interpolation
- `chartData.ts` - Prepares Chart.js data structures
- `timeSeries.ts` - Pond library integration for time series operations

### Issues with Current Implementation

**Problem 1: Unclear Data Representation**
- Monthly view shows consumption (differences), not actual meter readings
- User wants to see end-of-month meter reading values
- Current approach calculates differences between periods, which is useful for consumption analysis but doesn't show the actual meter state

**Problem 2: Complex View Mode Switching**
- All three view modes (measurements, monthly, yearly) are in one component
- Monthly and yearly views share similar logic but measurements view is completely different
- This creates cognitive overhead and complex conditional rendering

**Problem 3: Mixed Concerns**
- UnifiedEnergyChart handles too many responsibilities:
  - View mode management
  - Year navigation
  - Data processing for three different visualizations
  - Chart configuration for measurements vs costs
  - Mobile responsive behavior
- Violates Single Responsibility Principle

**Problem 4: Data Calculation Logic**
- `calculateConsumptionBetweenPeriods()` in costCalculation.ts tries to find readings in exact periods or nearby
- Falls back to nearest readings, which can produce unexpected results
- No clear indication of data quality (actual reading vs interpolated)

## Platform Requirements

### Mobile (Primary)
**Target Platforms**: iOS and Android
**Minimum Requirements**:
- iOS: 14+
- Android: 10+
- Screen sizes: 320px - 428px width

**Mobile-Specific Considerations**:
- Touch-optimized year navigation controls (44x44px minimum)
- Mobile-friendly chart legend (bottom position)
- Smaller font sizes for labels (9-11px)
- Responsive chart height using clamp()
- Stacked layout for controls
- Touch-friendly dropdowns and buttons

### Desktop (Secondary)
**Minimum Requirements**:
- Browser support: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- Screen sizes: 1024px+ width

**Desktop-Specific Considerations**:
- Horizontal layout for controls where space allows
- Legend at top of charts
- Larger fonts (11-13px)
- Hover states for interactive elements
- Keyboard navigation support

### Responsive Design
**Breakpoints**:
- Mobile: 320px - 767px (primary)
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Responsive Behavior**:
- Chart height: `clamp(300px, 50vh, 500px)`
- Controls stack vertically on mobile, horizontal on desktop
- Legend position changes (bottom on mobile, top on desktop)
- Font sizes scale with viewport
- Touch vs mouse interactions handled automatically

## Functional Requirements

### FR-001: Monthly View Focus
**Priority**: High
**Description**: The monthly view should clearly display end-of-month meter readings for each month of a selected year, showing both Power and Gas data in **separate charts**.

**Acceptance Criteria**:
- Display 12 data points per chart (one per month: Jan-Dec)
- Each data point represents the meter reading at the end of that month
- Two separate line charts: one for Power, one for Gas
- X-axis shows month labels (Jan, Feb, Mar, ..., Dec)
- Y-axis shows meter reading values (kWh)
- Charts are stacked vertically for clear comparison

### FR-002: End-of-Month Value Calculation
**Priority**: High
**Description**: Determine the meter reading value for the end of each month using actual measurements when available, or interpolated values when data is missing.

**Acceptance Criteria**:
- **Actual Measurement**: If a measurement exists on the last day of the month (±3 days tolerance), use it as actual data
- **Interpolated Value**: If no measurement exists within tolerance, calculate interpolated value:
  - Find nearest readings before and after the month end
  - Use linear interpolation: `value = prev + (next - prev) * ratio`
  - Where ratio = `(monthEnd - prevDate) / (nextDate - prevDate)`
  - Mark as interpolated with visual indicator
- **No Data**: If no readings exist before or after the month, show null/gap in chart
- Log calculation method for debugging (actual vs interpolated)

### FR-003: Visual Data Quality Indicators
**Priority**: High
**Description**: Clearly distinguish between actual measurements and interpolated values in the chart visualization.

**Acceptance Criteria**:
- **Actual data points**: Solid line connections, filled circle markers (radius: 5px)
- **Interpolated data points**: Dashed line connections (dash pattern: [5, 5]), hollow circle markers (radius: 5px, border: 2px)
- **Mixed connections**: If line connects actual to interpolated, use dashed pattern
- Chart legend includes explanation: "— Actual" and "- - Interpolated"
- Tooltip indicates data source: "(Actual reading)" or "(Interpolated)"
- Color-coded: Keep existing Power (teal) and Gas (red) colors

### FR-004: Year Navigation
**Priority**: High
**Description**: Allow users to navigate between different years to view historical monthly data.

**Acceptance Criteria**:
- Year selector with prev/next arrow buttons and dropdown
- Dropdown shows all available years based on data (sorted newest first)
- Prev button disabled when at oldest year with data
- Next button disabled when at newest year with data
- Default to most recent year with data on page load
- Year navigation persists selected year in component state
- Mobile: Compact year control with 44x44px touch targets
- Desktop: Slightly larger, comfortable mouse targets

### FR-005: Separate Power and Gas Charts
**Priority**: High
**Description**: Display Power and Gas data in separate, independent line charts for better readability and comparison.

**Acceptance Criteria**:
- Two vertically stacked charts with consistent styling
- Chart 1: Power meter readings over 12 months
- Chart 2: Gas meter readings over 12 months
- Shared X-axis (months) for visual alignment
- Independent Y-axis scales (each optimized for its data range)
- Both charts show actual vs interpolated indicators
- Equal height allocation for both charts
- Consistent styling: colors, fonts, spacing

### FR-006: Data Aggregation Service
**Priority**: High
**Description**: Create a dedicated service to calculate end-of-month meter readings with proper interpolation logic.

**Acceptance Criteria**:
- Service: `MonthlyDataAggregationService` in `/src/app/services/`
- Pure functions: no side effects, testable in isolation
- Input: Array of `EnergyType` readings, year, energy type
- Output: Array of 12 `MonthlyDataPoint` objects:
  ```typescript
  type MonthlyDataPoint = {
    month: number; // 1-12
    monthLabel: string; // "Jan", "Feb", etc.
    meterReading: number | null;
    isInterpolated: boolean;
    isActual: boolean;
    calculationDetails?: {
      method: 'actual' | 'interpolated' | 'none';
      sourceReadings?: { date: Date; amount: number }[];
    };
  };
  ```
- Function: `calculateMonthlyReadings(data, year, type): MonthlyDataPoint[]`
- Function: `getMonthEndDate(year, month): Date` - returns last moment of month
- Function: `findNearestReading(data, targetDate, tolerance): Reading | null`
- Function: `interpolateValue(prevReading, nextReading, targetDate): number`
- All functions documented with JSDoc
- 100% test coverage required

### FR-007: Chart Component Separation
**Priority**: Medium
**Description**: Extract monthly chart logic into dedicated component, separate from measurements and yearly views.

**Acceptance Criteria**:
- New component: `MonthlyMeterReadingsChart` in `/src/app/components/energy/`
- Props interface:
  ```typescript
  interface MonthlyMeterReadingsChartProps {
    energyData: EnergyType[];
    selectedYear: number;
    onYearChange: (year: number) => void;
    availableYears: number[];
  }
  ```
- Component handles:
  - Year navigation UI
  - Calling MonthlyDataAggregationService
  - Rendering two separate Chart.js line charts
  - Mobile responsiveness
  - Loading states
  - Empty states
- Does NOT handle:
  - Data fetching (parent's responsibility)
  - Type filtering (shows both Power and Gas always)
  - Date range filtering (year navigation is sufficient)

### FR-008: Mobile-First Responsive Design
**Priority**: High
**Description**: Ensure all new components and charts work seamlessly on mobile devices (primary target) and scale up to desktop.

**Acceptance Criteria**:
- Charts use responsive container with `clamp(300px, 50vh, 500px)` height per chart
- Year navigation:
  - Mobile: Stacked controls, 44x44px touch targets
  - Desktop: Horizontal layout, hover states
- Chart legends:
  - Mobile: Bottom position, smaller fonts (10px)
  - Desktop: Top position, larger fonts (12px)
- Font sizes:
  - Mobile: Labels 9-10px, values 11-12px
  - Desktop: Labels 11-12px, values 13-14px
- Touch interactions prioritized (no hover-dependent features)
- All interactive elements meet WCAG 2.1 touch target minimum (44x44px)
- Tested on viewport widths: 320px, 375px, 768px, 1024px, 1920px

### FR-009: Chart Configuration and Styling
**Priority**: Medium
**Description**: Configure Chart.js options for optimal display of monthly meter readings.

**Acceptance Criteria**:
- Chart type: Line chart with points
- Responsive: `maintainAspectRatio: false`
- Interaction mode: `mode: 'index', intersect: false`
- Tooltips:
  - Show month, meter reading, data quality indicator
  - Format: "Jan 2024: 1,234 kWh (Actual)" or "Feb 2024: 1,245 kWh (Interpolated)"
  - Background: `rgba(0, 0, 0, 0.8)`, corner radius: 8px
- X-axis:
  - Labels: Short month names (Jan, Feb, Mar, ...)
  - Grid: Hidden
  - Title: "Month"
- Y-axis:
  - Scale: Auto-scaled to data range with 10% padding
  - Grid: Light gray `rgba(0, 0, 0, 0.05)`
  - Title: "Meter Reading (kWh)"
  - Format: Thousands separator
- Legend:
  - Items: "Actual", "Interpolated"
  - Point styles: Filled circle, Hollow circle
  - Position: Bottom (mobile), Top (desktop)
- Colors use existing ENERGY_TYPE_CONFIG (Power: teal, Gas: red)

### FR-010: Empty and Error States
**Priority**: Medium
**Description**: Handle cases where data is missing or incomplete with clear messaging.

**Acceptance Criteria**:
- **No data for year**: Show message "No meter readings available for [year]. Try selecting a different year."
- **No data at all**: Show message "No meter readings available. Add energy readings to see monthly charts."
- **Partial data**: Chart renders with gaps where data is missing (null values)
- **No contract data**: Monthly view doesn't require contracts (meter readings only), so this doesn't block display
- All messages styled consistently with existing error/info styling
- Include helpful action: "Go to Add Data" link

## Non-Functional Requirements

### NFR-001: Performance
**Priority**: High
**Metric**: Chart render time
**Target**:
- Initial chart render: < 500ms for 12 months of data
- Year navigation: < 200ms to recalculate and re-render
- Data aggregation: < 100ms for typical dataset (500 readings)

### NFR-002: Code Quality
**Priority**: High
**Metric**: Maintainability and testability
**Target**:
- All services have 100% test coverage
- Components have >80% test coverage
- TSDoc comments on all public functions
- No eslint errors or warnings
- Follows existing project patterns (constants, services, handlers)

### NFR-003: Accessibility
**Priority**: Medium
**Metric**: WCAG 2.1 AA compliance
**Target**:
- Touch targets minimum 44x44px
- Color contrast ratio ≥ 4.5:1 for text
- Charts include ARIA labels
- Keyboard navigation support for year controls
- Screen reader friendly tooltips

### NFR-004: Browser Compatibility
**Priority**: Medium
**Metric**: Cross-browser functionality
**Target**:
- Chrome 90+, Safari 14+, Firefox 88+, Edge 90+
- iOS Safari 14+, Chrome Mobile 90+
- No polyfills required (Next.js handles transpilation)

## Technical Specifications

### Architecture

**Component Hierarchy**:
```
ChartsPage (page.tsx)
└── MonthlyMeterReadingsChart (new component)
    ├── YearNavigation (inline UI)
    ├── PowerChart (Chart.js Line)
    └── GasChart (Chart.js Line)
```

**Service Layer**:
```
MonthlyDataAggregationService
├── calculateMonthlyReadings()
├── getMonthEndDate()
├── findNearestReading()
└── interpolateValue()
```

**Data Flow**:
1. User navigates to `/charts`
2. ChartsPage fetches energy data from API
3. User selects year via YearNavigation
4. MonthlyMeterReadingsChart calls MonthlyDataAggregationService
5. Service processes data into 12 monthly data points per type
6. Component renders two Chart.js charts
7. User interacts with charts (tooltips, hover)

### Data Models

**MonthlyDataPoint**:
```typescript
type MonthlyDataPoint = {
  month: number; // 1-12 (January = 1)
  monthLabel: string; // "Jan", "Feb", ..., "Dec"
  meterReading: number | null; // Meter reading in kWh, null if no data
  isInterpolated: boolean; // true if value was calculated via interpolation
  isActual: boolean; // true if value comes from actual measurement
  calculationDetails?: {
    method: 'actual' | 'interpolated' | 'none';
    sourceReadings?: Array<{
      date: Date;
      amount: number;
    }>;
    interpolationRatio?: number; // For debugging interpolation
  };
};
```

**MonthlyChartData** (internal to component):
```typescript
type MonthlyChartData = {
  labels: string[]; // ["Jan", "Feb", ..., "Dec"]
  datasets: Array<{
    label: string; // "Power" or "Gas"
    data: (number | null)[]; // 12 values
    borderColor: string;
    backgroundColor: string;
    pointStyle: 'circle';
    pointRadius: number[];
    pointBorderWidth: number[];
    pointBackgroundColor: string[];
    borderDash: number[][];
    segment: {
      borderDash: (ctx: ScriptableLineSegmentContext) => number[];
    };
  }>;
};
```

### API/Interface Contracts

**MonthlyDataAggregationService.calculateMonthlyReadings**:
```typescript
/**
 * Calculate end-of-month meter readings for a specific year and energy type
 *
 * @param energyData - Array of all energy readings
 * @param year - Target year (e.g., 2024)
 * @param type - Energy type ("power" or "gas")
 * @returns Array of 12 MonthlyDataPoint objects (one per month)
 */
function calculateMonthlyReadings(
  energyData: EnergyType[],
  year: number,
  type: EnergyOptions
): MonthlyDataPoint[];
```

**MonthlyDataAggregationService.findNearestReading**:
```typescript
/**
 * Find the nearest energy reading to a target date within tolerance
 *
 * @param energyData - Array of energy readings (must be sorted by date)
 * @param targetDate - The date to search near
 * @param toleranceDays - Maximum days away from target (default: 3)
 * @returns The nearest reading or null if none within tolerance
 */
function findNearestReading(
  energyData: EnergyType[],
  targetDate: Date,
  toleranceDays: number = 3
): EnergyType | null;
```

**MonthlyDataAggregationService.interpolateValue**:
```typescript
/**
 * Linearly interpolate a meter reading value for a target date
 * between two known readings
 *
 * @param prevReading - Reading before target date
 * @param nextReading - Reading after target date
 * @param targetDate - Date to interpolate for
 * @returns Interpolated meter reading value
 * @throws Error if prevReading is after nextReading
 */
function interpolateValue(
  prevReading: EnergyType,
  nextReading: EnergyType,
  targetDate: Date
): number;
```

**MonthlyMeterReadingsChart Props**:
```typescript
interface MonthlyMeterReadingsChartProps {
  energyData: EnergyType[]; // All energy readings from API
  selectedYear: number; // Currently selected year
  onYearChange: (year: number) => void; // Callback when year changes
  availableYears: number[]; // Years with available data (sorted desc)
}
```

### Dependencies

**Existing Dependencies** (no new dependencies needed):
- `chart.js` ^4.4.1 - Chart rendering
- `react-chartjs-2` ^5.2.0 - React wrapper for Chart.js
- `date-fns` ^2.30.0 - Date manipulation and formatting

**Internal Dependencies**:
- `@/app/types` - EnergyType, EnergyOptions
- `@/app/constants/energyTypes` - ENERGY_TYPE_CONFIG, getEnergyTypeLabel
- `@/app/constants/ui` - Chart styling constants

### Technology Stack

**Framework**: Next.js 14 (App Router)
**Language**: TypeScript 5
**Styling**: Tailwind CSS 4
**Charts**: Chart.js 4 with react-chartjs-2
**Date Handling**: date-fns
**Testing**: Jest + React Testing Library

## Implementation Considerations

### SOLID Principles Application

**Single Responsibility Principle (SRP)**:
- `MonthlyDataAggregationService`: Only handles data aggregation logic
- `MonthlyMeterReadingsChart`: Only handles chart rendering and year navigation
- `ChartsPage`: Only handles page-level state and data fetching
- Each function in the service has a single, well-defined purpose

**Open/Closed Principle (OCP)**:
- Interpolation logic can be extended with new methods (weighted average, polynomial) without modifying existing code
- Chart configuration can be extended via options object
- New data quality indicators can be added without changing core logic

**Liskov Substitution Principle (LSP)**:
- MonthlyDataAggregationService returns consistent MonthlyDataPoint structure
- Can be swapped with alternative aggregation services that implement same interface

**Interface Segregation Principle (ISP)**:
- MonthlyMeterReadingsChart only receives props it needs (no excess data)
- Service functions have focused, minimal parameter lists

**Dependency Inversion Principle (DIP)**:
- Component depends on service abstraction, not concrete implementation
- Service functions are pure and don't depend on external state
- Data fetching abstracted to page level

### Clean Code Guidelines

**Naming Conventions**:
- Services: `[Purpose]Service.ts` (e.g., MonthlyDataAggregationService.ts)
- Components: `[Feature][Type].tsx` (e.g., MonthlyMeterReadingsChart.tsx)
- Functions: Verb-first naming (calculateMonthlyReadings, findNearestReading)
- Types: Descriptive nouns (MonthlyDataPoint, not DataPoint)

**Function Design**:
- Keep functions small (< 30 lines)
- Single level of abstraction per function
- Avoid side effects (pure functions preferred)
- Use early returns for error cases
- Document with JSDoc including examples

**Type Safety**:
- Explicit return types on all functions
- No `any` types (use `unknown` if necessary)
- Proper null handling (use `| null` not `| undefined` for intentional absence)
- Discriminated unions for data quality states

**Constants**:
- All magic numbers in constants files
- Tolerance days: `MONTH_END_TOLERANCE_DAYS = 3`
- Chart heights, colors, sizes in ui.ts or energyTypes.ts

### Testing Strategy

**Unit Tests** (100% coverage required):
- `MonthlyDataAggregationService.test.ts`:
  - Test `calculateMonthlyReadings()` with various data scenarios
  - Test `findNearestReading()` with edge cases (no data, exact match, outside tolerance)
  - Test `interpolateValue()` with boundary conditions
  - Test month end date calculation for all months (including leap years)
  - Test with empty data arrays
  - Test with single reading per year
  - Test with multiple readings per month

**Component Tests** (>80% coverage):
- `MonthlyMeterReadingsChart.test.tsx`:
  - Render with valid data
  - Render with no data (empty state)
  - Year navigation (prev/next buttons, dropdown)
  - Mobile vs desktop rendering
  - Chart legend and tooltips
  - Data quality indicators (actual vs interpolated)

**Integration Tests**:
- `charts/page.test.tsx`:
  - Full page render with monthly chart
  - Data fetching and passing to component
  - Year selection persistence

**Test-First Approach**:
1. Write tests for `MonthlyDataAggregationService` functions first
2. Implement functions to pass tests
3. Write component tests with mocked service
4. Implement component
5. Write integration tests
6. Verify end-to-end functionality

**Key Test Scenarios**:
- Exact month-end reading exists → Use as actual
- Reading within 3 days of month end → Use as actual
- No reading within 3 days → Interpolate from neighbors
- Only readings before month end → Extrapolate? Or null? (Decision needed)
- Only readings after month end → Extrapolate? Or null? (Decision needed)
- Leap year February (29 days)
- Year with no data → Show empty state
- Single reading in entire year → Most months null

## Edge Cases & Error Handling

### Edge Case 1: Sparse Data
**Scenario**: User has only one or two readings per year
**Handling**:
- Cannot interpolate without readings on both sides
- Show actual readings for months where they exist
- Show null (gap) for other months
- Display info message: "Limited data available. Add more readings for better monthly tracking."

### Edge Case 2: Leap Year
**Scenario**: Calculating end of February in a leap year
**Handling**:
- `getMonthEndDate()` must correctly handle Feb 29 vs Feb 28
- Use date-fns `endOfMonth()` function (handles leap years automatically)
- Test explicitly with years 2024 (leap) and 2025 (non-leap)

### Edge Case 3: Multiple Readings on Month End
**Scenario**: User entered multiple readings on the same day at month end
**Handling**:
- Use the reading with timestamp closest to end of day (23:59:59)
- If multiple readings have same date, use the last one entered (latest _id or highest amount)
- Log warning for debugging: "Multiple readings found for month end"

### Edge Case 4: Future Months
**Scenario**: User selects current year but we're only in March
**Handling**:
- Show actual/interpolated data for Jan, Feb, Mar
- Show null (gaps) for Apr-Dec
- Do NOT extrapolate future months (different from yearly view behavior)
- Info message: "Future months will update as you add new readings"

### Edge Case 5: No Data for Selected Year
**Scenario**: User selects year with no readings
**Handling**:
- Show empty state with message
- Suggest selecting different year or adding data
- Don't show error (not an error, just no data)

### Edge Case 6: Invalid Year Selection
**Scenario**: Year prop is invalid or out of range
**Handling**:
- Validate year is reasonable: 2000 ≤ year ≤ 2100
- If invalid, default to current year
- Log warning for debugging

### Edge Case 7: Data Type Mismatch
**Scenario**: Energy reading amount is null or invalid
**Handling**:
- Skip invalid readings (don't use in calculations)
- Log warning: "Skipping invalid reading: [details]"
- If all readings invalid, treat as no data scenario

## Assumptions

1. **Date Tolerance**: 3 days before/after month end is acceptable threshold for "actual" data
2. **Interpolation Method**: Linear interpolation is sufficient accuracy (could be enhanced later with weighted or polynomial)
3. **Data Continuity**: Users will generally have readings at least every few months (not years of gaps)
4. **Meter Reading Monotonicity**: Meter readings generally increase over time (no resets)
5. **Time Zone**: All dates stored/compared in user's local timezone (no UTC conversion needed)
6. **Year Range**: Data exists between 2000-2100 (reasonable for energy monitoring)
7. **Chart.js Version**: Project uses Chart.js v4 (segment styling API available)
8. **Mobile Viewports**: Primary mobile widths are 320px (iPhone SE) and 375px (iPhone 12/13)
9. **Performance**: Typical dataset has < 1000 readings total (reasonable for personal energy tracking)
10. **User Interaction**: Users understand difference between actual and interpolated data with visual + text explanation

## Open Questions

### Q1: Extrapolation for Missing Data
**Question**: When there's only data before or after a month end, should we extrapolate or show null?
**Options**:
- A) Show null (gap in chart) - safer, no assumptions
- B) Extrapolate from nearby readings - provides estimate but may be inaccurate
- C) Configurable per user preference
**Recommendation**: Option A for initial implementation (less risk of misleading data)

### Q2: Month End Tolerance Configuration
**Question**: Should the 3-day tolerance be configurable?
**Options**:
- A) Hardcoded constant (simple, consistent)
- B) User preference in settings (flexible but more complex)
- C) Adaptive based on data density (smart but complex)
**Recommendation**: Option A for MVP, can be enhanced later

### Q3: Integration with Existing View Modes
**Question**: Should monthly view remain in UnifiedEnergyChart or be completely separate?
**Options**:
- A) Extract to separate component, remove from UnifiedEnergyChart
- B) Keep in UnifiedEnergyChart but simplify logic
- C) Create parallel implementation, deprecate old monthly view
**Recommendation**: Option A (cleaner separation, easier maintenance)

### Q4: Historical Data Migration
**Question**: How to handle users with existing monthly view bookmarks/preferences?
**Options**:
- A) Redirect to new monthly view (seamless)
- B) Show migration notice
- C) Keep both views temporarily
**Recommendation**: Option A (view mode switching already exists, no breaking change)

### Q5: Chart Interaction Features
**Question**: Should users be able to interact with data points (click to see details, edit, etc.)?
**Options**:
- A) View-only (current implementation)
- B) Click to see full reading details
- C) Click to navigate to readings page with filters
**Recommendation**: Option A for MVP, Option C for future enhancement

## Success Metrics

**User Experience**:
- Monthly view clearly shows end-of-month meter states
- Users can distinguish actual vs interpolated data at a glance
- Year navigation is intuitive and responsive
- Charts are readable on mobile and desktop

**Technical Quality**:
- All tests pass with >80% coverage
- No performance regressions (<500ms render time)
- No new eslint errors or warnings
- Code follows existing project patterns

**Functionality**:
- Accurately calculates end-of-month readings
- Correctly identifies actual vs interpolated data
- Handles all edge cases gracefully
- Works across all supported browsers and devices

## Migration Strategy

**Phase 1: Create New Service**
1. Implement `MonthlyDataAggregationService` with tests
2. Verify calculations with existing data
3. Document service API

**Phase 2: Build New Component**
1. Create `MonthlyMeterReadingsChart` component
2. Integrate with service
3. Test mobile and desktop rendering
4. Verify accessibility

**Phase 3: Update Charts Page**
1. Import new component
2. Wire up to page state
3. Test view mode switching
4. Verify no regressions in other views

**Phase 4: Cleanup**
1. Remove old monthly view logic from UnifiedEnergyChart (if separate route chosen)
2. Update documentation
3. Remove unused code

**Phase 5: User Testing**
1. Test with real user data
2. Gather feedback on interpolation accuracy
3. Verify edge cases in production
4. Monitor performance metrics

## Related Documentation

- **Existing Feature Docs**: `feature-dev/filter-redesign/requirements-v3.md` - Timeline slider patterns
- **Component Patterns**: `CLAUDE.md` - Project architecture and conventions
- **Service Patterns**: `src/app/services/DataAggregationService.ts` - Service structure reference
- **Chart Patterns**: `src/app/components/energy/UnifiedEnergyChart.tsx` - Existing chart implementation
- **Mobile-First Guide**: `feature-dev/MOBILE_FIRST_UPDATE.md` - Responsive design patterns

## Next Steps

1. **Requirements Review**: Review this specification with user/stakeholders
2. **Technical Design**: Create detailed technical design document (if needed)
3. **Service Implementation**: Build and test MonthlyDataAggregationService
4. **Component Implementation**: Build and test MonthlyMeterReadingsChart
5. **Integration**: Wire up to ChartsPage
6. **Testing**: Comprehensive testing across devices and scenarios
7. **Documentation**: Update user guide and technical docs
8. **Deployment**: Release and monitor

---

**Document Version**: 1.0
**Last Updated**: 2025-11-06
**Author**: Claude (Requirements Analyst Agent)
**Status**: Draft - Pending Review
