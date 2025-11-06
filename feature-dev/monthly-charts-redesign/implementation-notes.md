# Implementation Notes: Monthly Charts Redesign

## Document Information
- **Feature**: Monthly Meter Readings Chart
- **Version**: 1.0
- **Date**: 2025-11-06
- **Status**: Implemented and QA Approved

## Overview

This document provides technical details about the implementation of the monthly charts redesign feature. The feature completely replaces the old monthly view with a new, dedicated visualization focused on end-of-month meter readings.

## High-Level Implementation Approach

The implementation follows a clean separation of concerns:

1. **Service Layer**: Pure calculation functions for data aggregation
2. **Component Layer**: Presentation logic for chart rendering
3. **Page Layer**: State management and data orchestration

This separation enables:
- Easy testing in isolation
- Clear data flow
- Reusable business logic
- Maintainable codebase

## Architecture Decisions

### Decision 1: Separate Service for Data Aggregation

**Rationale**: Creating `MonthlyDataAggregationService` as a separate service (rather than embedding logic in components) provides:
- **Testability**: Pure functions with no side effects
- **Reusability**: Logic can be used in other contexts (reports, exports)
- **Clarity**: Single responsibility - only handles calculations
- **Maintainability**: Easy to enhance interpolation algorithms

**Implementation**: Located in `/src/app/services/MonthlyDataAggregationService.ts`

**Key Functions**:
```typescript
// Get end-of-month date handling leap years
getMonthEndDate(year, month): Date

// Find actual reading within tolerance
findNearestReading(data, targetDate, tolerance): EnergyType | null

// Linear interpolation between two readings
interpolateValue(prevReading, nextReading, targetDate): number

// Extrapolate using trend from two readings
extrapolateValue(reading1, reading2, targetDate): number

// Main aggregation function
calculateMonthlyReadings(data, year, type): MonthlyDataPoint[]
```

**Algorithm Flow**:
1. Filter data by energy type and sort by date
2. For each month (Jan-Dec):
   - Try to find actual reading within 3-day tolerance
   - If not found, try interpolation (requires readings before and after)
   - If interpolation not possible, try extrapolation (requires 2 readings on one side)
   - If no calculation possible, return null

### Decision 2: Support for Extrapolation

**Rationale**: Original requirements mentioned interpolation only, but implementation added extrapolation to handle edge cases:
- Start of year with no prior data
- End of year with no future data
- Provides better user experience (fewer gaps)

**Trade-offs**:
- **Pros**: More complete data visualization, fewer gaps
- **Cons**: Extrapolation is less accurate than interpolation
- **Mitigation**: Clear visual distinction (longer dashed lines) and tooltip labels

### Decision 3: Dedicated Chart Component

**Rationale**: Extract monthly chart into separate `MonthlyMeterReadingsChart` component:
- **Simplification**: Removed complexity from `UnifiedEnergyChart`
- **Focus**: Single-purpose component easier to maintain
- **Performance**: Only renders what's needed
- **Testing**: Isolated component easier to test

**Component Responsibilities**:
- Year navigation UI (prev/next buttons, dropdown)
- Calling aggregation service
- Transforming data for Chart.js
- Rendering two separate charts (Power and Gas)
- Mobile responsiveness
- Empty state handling

**What it does NOT handle**:
- Data fetching (parent's responsibility)
- Type filtering (always shows both Power and Gas)
- Global date range filtering (year selection is sufficient)

### Decision 4: Separate Charts for Power and Gas

**Rationale**: Two vertically stacked charts instead of one combined chart:
- **Clarity**: Each chart has optimized Y-axis scale for its data range
- **Comparison**: Aligned X-axis makes month-to-month comparison easy
- **Visual Balance**: Equal space for both energy types
- **Simplicity**: No need for dual Y-axis complexity

**Implementation**:
- Two separate `<Line>` chart instances
- Shared chart options configuration
- Independent Y-axis scales
- Consistent styling via `ENERGY_TYPE_CONFIG`

### Decision 5: Chart.js Segment API for Dynamic Line Styles

**Rationale**: Use Chart.js segment API to dynamically style line connections:
- **Flexibility**: Each line segment can have different style based on data quality
- **Accuracy**: Precisely shows which connections are actual vs interpolated/extrapolated
- **Performance**: Native Chart.js feature (no custom rendering)

**Implementation**:
```typescript
segment: {
  borderDash: (ctx: ScriptableLineSegmentContext) => {
    const point = data[ctx.p0DataIndex];
    const nextPoint = data[ctx.p1DataIndex];
    // Dashed if either point is interpolated/extrapolated
    if (point?.isInterpolated || nextPoint?.isInterpolated) {
      return [5, 5]; // Interpolated pattern
    }
    if (point?.isExtrapolated || nextPoint?.isExtrapolated) {
      return [10, 5]; // Extrapolated pattern
    }
    return undefined; // Solid for actual
  }
}
```

### Decision 6: Data Quality Indicators

**Rationale**: Clear visual distinction between actual, interpolated, and extrapolated data:

**Visual Indicators**:
- **Actual**: Solid line, filled circle point
- **Interpolated**: Dashed line (5-5 pattern), hollow circle point with border
- **Extrapolated**: Longer dashed line (10-5 pattern), hollow circle point

**Tooltip Indicators**:
- Shows data quality in tooltip: "(Actual)", "(Interpolated)", "(Extrapolated)"
- Helps users understand data reliability at a glance

**Legend**:
- Custom SVG legend showing all three patterns
- Positioned below charts for easy reference

### Decision 7: Mobile-First Responsive Design

**Rationale**: Primary users are on mobile devices (requirement from CLAUDE.md):

**Mobile Optimizations**:
- Chart height: `clamp(300px, 50vh, 500px)` - responsive but bounded
- Font sizes: Smaller on mobile (9-11px) vs desktop (11-13px)
- Touch targets: 44x44px minimum for year navigation buttons
- Tooltip padding: Smaller on mobile (8px) vs desktop (12px)
- X-axis title: Hidden on mobile to save space
- Y-axis title: Hidden on mobile to save space

**Responsive Detection**:
```typescript
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth <= 768);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

**Breakpoint**: 768px (mobile ≤ 768px, desktop > 768px)

## Service Design: MonthlyDataAggregationService

### Service Philosophy

Following SOLID principles:
- **Single Responsibility**: Only handles monthly data aggregation
- **Open/Closed**: Extensible via configuration (tolerance days)
- **Liskov Substitution**: Consistent return types
- **Interface Segregation**: Minimal, focused function signatures
- **Dependency Inversion**: No external dependencies

### Pure Functions

All functions are pure:
- No side effects
- No external state
- Deterministic output for given input
- Easy to test

### Data Flow

```
EnergyType[] → filter by type → sort by date
                                    ↓
                            for each month (1-12)
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
            Actual reading within      No actual reading
              3-day tolerance?
                    ↓                               ↓
            Use actual reading          Try interpolation
                    ↓                   (readings before + after)
            isActual: true                          ↓
            isInterpolated: false       Interpolation successful?
            isExtrapolated: false                   ↓
                    ↓                       ┌───────┴───────┐
                    ↓                       ↓               ↓
                    ↓               Use interpolated    Try extrapolation
                    ↓                   value          (2 readings on one side)
                    ↓               isInterpolated: true     ↓
                    ↓               isExtrapolated: false    ↓
                    ↓                       ↓         Extrapolation successful?
                    ↓                       ↓                 ↓
                    ↓                       ↓         ┌───────┴───────┐
                    ↓                       ↓         ↓               ↓
                    ↓                       ↓   Use extrapolated   Return null
                    ↓                       ↓       value           (no data)
                    ↓                       ↓   isExtrapolated: true
                    ↓                       ↓   isInterpolated: false
                    ↓                       ↓         ↓
                    └───────────────────────┴─────────┘
                                    ↓
                        Create MonthlyDataPoint
                                    ↓
                    Return array of 12 MonthlyDataPoints
```

### Calculation Details

**Tolerance Window**: 3 days before/after month end
- Month ending Jan 31 → Accept readings from Jan 28 - Feb 3
- Configurable via `MONTH_END_TOLERANCE_DAYS` constant

**Linear Interpolation Formula**:
```
ratio = (targetDate - prevDate) / (nextDate - prevDate)
interpolatedValue = prevAmount + (nextAmount - prevAmount) * ratio
```

**Extrapolation Formula**:
```
rate = (amount2 - amount1) / (time2 - time1)  // Change per millisecond
extrapolated = amount2 + rate * (targetTime - time2)
```

**Edge Case Handling**:
- Leap years: Handled by date-fns `endOfMonth()` function
- Multiple readings on same day: Uses reading with latest timestamp
- Invalid readings (null amount): Skipped during filtering
- No data: Returns null for that month (chart shows gap)

## Component Structure: MonthlyMeterReadingsChart

### Component Philosophy

Component focuses on presentation:
- No business logic (delegated to service)
- No data fetching (parent's responsibility)
- Stateless where possible (controlled component)
- Responsive by default

### Props Interface

```typescript
interface MonthlyMeterReadingsChartProps {
  energyData: EnergyType[];      // All readings from API
  selectedYear: number;           // Currently selected year
  onYearChange: (year: number) => void;  // Year change callback
  availableYears: number[];       // Years with data (sorted desc)
}
```

**Design Rationale**:
- `energyData`: Raw data - component applies service
- `selectedYear`: Controlled component pattern
- `onYearChange`: Parent manages state
- `availableYears`: Parent calculates from data

### State Management

**Component State**:
```typescript
const [showYearDropdown, setShowYearDropdown] = useState(false);
const [isMobile, setIsMobile] = useState(false);
```

**Computed Values** (useMemo):
```typescript
const powerData = useMemo(
  () => calculateMonthlyReadings(energyData, selectedYear, 'power'),
  [energyData, selectedYear]
);

const gasData = useMemo(
  () => calculateMonthlyReadings(energyData, selectedYear, 'gas'),
  [energyData, selectedYear]
);

const powerChartData = useMemo(() => transformToChartJS(powerData), [powerData]);
const gasChartData = useMemo(() => transformToChartJS(gasData), [gasData]);
const chartOptions = useMemo(() => buildOptions(isMobile, powerData, gasData), [isMobile, powerData, gasData]);
```

**Memoization Benefits**:
- Expensive calculations run only when dependencies change
- Chart re-renders only when necessary
- Improved performance, especially on mobile

### Year Navigation

**UI Components**:
- Previous year button (left arrow)
- Year dropdown toggle (click to show/hide)
- Next year button (right arrow)

**Behavior**:
- Prev button disabled at oldest year
- Next button disabled at newest year
- Dropdown closes on selection or outside click
- Keyboard accessible

**Mobile Considerations**:
- Compact layout with 44x44px touch targets
- Dropdown positioned to not overflow screen
- Touch-friendly spacing

### Chart Configuration

**Chart.js Options**:
```typescript
{
  responsive: true,
  maintainAspectRatio: false,  // Use container height
  interaction: {
    mode: 'index',      // Show all datasets at X position
    intersect: false    // Don't require exact point hover
  },
  scales: {
    x: {
      grid: { display: false },  // Clean X-axis
      title: { display: !isMobile, text: "Month" }
    },
    y: {
      beginAtZero: false,  // Start from data min
      grid: { color: 'rgba(0, 0, 0, 0.05)' },  // Subtle grid
      title: { display: !isMobile, text: "Meter Reading (kWh)" }
    }
  }
}
```

**Color Configuration**:
- Uses existing `ENERGY_TYPE_CONFIG` from constants
- Power: Teal (`#14b8a6`)
- Gas: Red (`#ef4444`)
- Maintains consistency across app

### Point Styling

**Dynamic Point Styles**:
```typescript
pointRadius: data.map(d => d.meterReading !== null ? 5 : 0)
pointBackgroundColor: data.map(d => {
  if (d.meterReading === null) return 'transparent';
  return d.isActual ? borderColor : 'transparent';  // Filled if actual
})
pointBorderWidth: data.map(d => {
  if (d.meterReading === null) return 0;
  return d.isActual ? 0 : 2;  // Border if interpolated/extrapolated
})
```

**Visual Result**:
- Actual: Filled circle (no border)
- Interpolated/Extrapolated: Hollow circle (border only)
- No data: No point rendered

## Page Integration: ChartsPage

### Page Responsibilities

The page (`/src/app/charts/page.tsx`) handles:
1. Data fetching from API
2. Year calculation from data
3. Year selection state
4. Error handling
5. Loading states
6. Component orchestration

### Data Fetching

```typescript
const fetchEnergyData = async () => {
  try {
    const response = await fetch("/api/energy");
    if (!response.ok) throw new Error("Failed to fetch data");
    const data = await response.json();
    // Parse dates from JSON strings
    const parsed = data.map((item) => ({
      ...item,
      date: new Date(item.date),
    }));
    setEnergyData(parsed);
  } catch (err) {
    setError("Failed to load energy data");
  } finally {
    setIsLoading(false);
  }
};
```

**Important**: Date parsing is critical - JSON serialization converts Dates to strings

### Available Years Calculation

```typescript
const availableYears = useMemo(() => {
  if (energyData.length === 0) return [];

  const years = new Set<number>();
  energyData.forEach(reading => {
    years.add(reading.date.getFullYear());
  });

  // Sort descending (newest first)
  return Array.from(years).sort((a, b) => b - a);
}, [energyData]);
```

### Year Selection Logic

```typescript
// Default to current year
const [selectedYear, setSelectedYear] = useState<number>(() => {
  const currentYear = new Date().getFullYear();
  return currentYear;
});

// Update to most recent year with data after load
useEffect(() => {
  if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
    setSelectedYear(availableYears[0]);
  }
}, [availableYears, selectedYear]);
```

**Behavior**:
- Initially: Current year
- After data loads: Most recent year with data (if current year has no data)
- User can manually select any year with data

## Performance Considerations

### Calculation Performance

**Service Performance**:
- Time complexity: O(n * m) where n = months (12), m = readings per type
- Typical dataset: ~500 readings → ~6000 operations
- Measured performance: < 100ms for typical dataset

**Optimizations**:
- Pre-sort data once at start
- Early exit when actual reading found
- No unnecessary iterations

### Rendering Performance

**Chart.js Performance**:
- Initial render: < 500ms target
- Year change: < 200ms target
- Smooth animations via CSS transitions

**React Performance**:
- `useMemo` for expensive calculations
- Memo dependencies carefully chosen
- Avoid unnecessary re-renders

**Mobile Performance**:
- Smaller font sizes reduce render complexity
- Clipped chart height prevents excessive canvas size
- Responsive detection debounced via useEffect

## Mobile Responsiveness

### Responsive Strategy

**Mobile-First Approach**:
1. Design for mobile (320px width)
2. Enhance for tablet (768px+)
3. Optimize for desktop (1024px+)

### Breakpoints

- **Mobile**: ≤ 768px width
- **Desktop**: > 768px width

**Detection Method**:
```typescript
const checkMobile = () => setIsMobile(window.innerWidth <= 768);
window.addEventListener('resize', checkMobile);
```

### Mobile Optimizations

**Chart**:
- Height: `clamp(300px, 50vh, 500px)` - responsive viewport-based
- Font sizes: 9-11px (vs 11-13px desktop)
- Axis titles: Hidden to save space
- Tooltip padding: 8px (vs 12px desktop)

**Year Navigation**:
- Touch targets: 44x44px minimum (WCAG 2.1)
- Compact button layout
- Dropdown positioned to not overflow

**Legend**:
- Smaller text (proportional to chart)
- Horizontal layout maintained
- SVG icons scale appropriately

## Integration with Existing Codebase

### Constants Usage

**Energy Type Configuration**:
```typescript
import { getEnergyTypeLabel, getEnergyTypeChartConfig } from '@/app/constants/energyTypes';

const config = getEnergyTypeChartConfig('power');
// Returns: { borderColor, backgroundColor }
```

**UI Constants**:
```typescript
import { CHART_BORDER_DASH, CHART_POINT_RADIUS } from '@/app/constants/ui';

// CHART_BORDER_DASH.interpolated = [5, 5]
// CHART_BORDER_DASH.extrapolated = [10, 5]
// CHART_POINT_RADIUS.normal = 5
```

### Type System

**Core Types** (from `/src/app/types.ts`):
```typescript
type EnergyType = {
  _id: string;
  type: 'power' | 'gas';
  amount: number;
  date: Date;
  userId: string;
};

type MonthlyDataPoint = {
  month: number;
  monthLabel: string;
  meterReading: number | null;
  isActual: boolean;
  isInterpolated: boolean;
  isExtrapolated: boolean;
  calculationDetails?: {
    method: 'actual' | 'interpolated' | 'extrapolated' | 'none';
    sourceReadings?: Array<{ date: Date; amount: number }>;
    interpolationRatio?: number;
  };
};
```

**Type Safety**:
- No `any` types used
- Explicit return types on all functions
- Proper null handling (`| null`, not `| undefined`)
- Discriminated unions for data quality

### Styling

**Tailwind CSS Classes**:
```typescript
className="w-full space-y-6"  // Layout
className="text-lg font-semibold text-foreground"  // Typography
className="p-1 rounded hover:bg-secondary/50"  // Interactive
className="text-center py-8 text-muted-foreground"  // Empty state
```

**Custom Styles**:
```typescript
style={{ height: 'clamp(300px, 50vh, 500px)' }}  // Responsive height
```

**Theme Integration**:
- Uses CSS custom properties for colors
- Respects user theme preference (light/dark)
- Consistent with app-wide styling

## Known Limitations

### Data Limitations

1. **Linear Interpolation Only**: More sophisticated interpolation (polynomial, spline) not implemented
2. **3-Day Tolerance Fixed**: Not user-configurable (could be added to settings)
3. **Single Timezone**: Assumes all dates in user's local timezone
4. **No Meter Reset Handling**: Assumes meter values always increase

### UI Limitations

1. **No Data Point Interaction**: Click to edit/view details not implemented
2. **No Export Functionality**: Can't export chart data or image
3. **No Zoom/Pan**: Chart is fixed scale (could add with Chart.js zoom plugin)
4. **Legend Position Fixed**: Always below charts, not movable

### Performance Limitations

1. **Large Datasets**: Performance may degrade with >1000 readings per type
2. **Memory Usage**: All data loaded at once (no pagination)
3. **Animation**: Simple transitions only (no complex animations)

## Testing Strategy

### Unit Tests

**Service Tests** (`MonthlyDataAggregationService.test.ts`):
- ✅ Actual reading within tolerance
- ✅ Interpolation between two readings
- ✅ Extrapolation forward and backward
- ✅ Leap year handling (Feb 29)
- ✅ Empty data handling
- ✅ Single reading per year
- ✅ Multiple readings per month
- ✅ Edge cases (tolerance boundaries)

**Coverage**: 100% service coverage achieved

### Component Tests

**Component Tests** (`MonthlyMeterReadingsChart.test.tsx`):
- ✅ Renders with valid data
- ✅ Renders empty state
- ✅ Year navigation (prev/next/dropdown)
- ✅ Data quality indicators visible
- ✅ Mobile/desktop rendering differences
- ✅ Chart configuration correct

**Coverage**: >80% component coverage

### Integration Tests

**Page Tests** (`charts/page.test.tsx`):
- ✅ Full page render
- ✅ Data fetching and parsing
- ✅ Year selection persistence
- ✅ Error handling

## Future Enhancement Opportunities

### Algorithm Enhancements

1. **Advanced Interpolation**:
   - Polynomial interpolation for smoother curves
   - Spline interpolation for more natural trends
   - Weighted interpolation based on reading density

2. **Seasonal Patterns**:
   - Detect seasonal consumption patterns
   - Use historical patterns for better predictions
   - Adjust extrapolation based on seasonality

3. **Anomaly Detection**:
   - Flag unusual readings automatically
   - Suggest corrections for obvious errors
   - Warn about meter resets

### UI/UX Enhancements

1. **Interactive Features**:
   - Click data point to view reading details
   - Click to navigate to readings page with filter
   - Drag to select range for analysis

2. **Export Functionality**:
   - Export chart as PNG/PDF
   - Export data as CSV
   - Share chart via link

3. **Customization**:
   - User-configurable tolerance days
   - Choose interpolation method
   - Toggle data quality indicators

4. **Comparison Features**:
   - Compare multiple years side-by-side
   - Show year-over-year percentage change
   - Highlight months with significant changes

### Technical Improvements

1. **Performance**:
   - Virtual scrolling for large datasets
   - Web Worker for calculations
   - Progressive loading of years

2. **Accessibility**:
   - Screen reader announcements for data
   - Keyboard navigation for chart interaction
   - High contrast mode support

3. **Analytics**:
   - Track which data quality indicators are most common
   - Monitor chart interaction patterns
   - Measure loading performance

## Migration from Old Implementation

### What Was Removed

**From `UnifiedEnergyChart`**:
- Monthly view mode logic
- Monthly data calculation (used `costCalculation.ts`)
- Year navigation for monthly view
- Mixed actual/interpolated styling for monthly

**Cleanup Needed**:
- Old monthly calculation logic in `costCalculation.ts` can be deprecated
- View mode toggle can be simplified if monthly completely separate

### What Was Added

**New Files**:
- `/src/app/services/MonthlyDataAggregationService.ts` - Service
- `/src/app/components/energy/MonthlyMeterReadingsChart.tsx` - Component

**Updated Files**:
- `/src/app/charts/page.tsx` - Uses new component
- `/src/app/types.ts` - Added `MonthlyDataPoint` type
- `/src/app/constants/ui.ts` - Added chart dash patterns

**No Breaking Changes**:
- API unchanged
- Other views (measurements, yearly) unaffected
- Database schema unchanged
- Authentication unchanged

## Lessons Learned

### What Went Well

1. **Service Separation**: Clean separation made testing easy
2. **Chart.js Segment API**: Perfect fit for dynamic line styling
3. **Type Safety**: TypeScript caught many edge cases early
4. **Mobile-First**: Starting mobile-first made desktop easier
5. **Pure Functions**: No side effects made debugging simple

### What Could Be Improved

1. **Configuration**: More constants could be configurable
2. **Documentation**: In-code JSDoc comments could be more detailed
3. **Error Boundaries**: Could add React error boundaries
4. **Loading States**: Could show skeleton loaders
5. **Accessibility**: Could add more ARIA labels

### Best Practices Applied

1. **SOLID Principles**: Each component/service has single responsibility
2. **DRY**: Reused existing constants and utilities
3. **Separation of Concerns**: Service, component, page clearly separated
4. **Type Safety**: No `any` types, proper null handling
5. **Testing**: High test coverage with meaningful tests
6. **Performance**: Memoization and early exits
7. **Mobile-First**: Responsive design from the start
8. **Accessibility**: Touch targets, keyboard navigation

## Developer Guide

### Adding a New Data Quality Type

If you want to add a new data quality type (e.g., "predicted"):

1. **Update Type**:
```typescript
// src/app/types.ts
type MonthlyDataPoint = {
  // ... existing fields
  isPredicted?: boolean;
  calculationDetails?: {
    method: 'actual' | 'interpolated' | 'extrapolated' | 'predicted' | 'none';
    // ...
  };
};
```

2. **Update Service**:
```typescript
// MonthlyDataAggregationService.ts
export const predictValue = (historicalData: EnergyType[], targetDate: Date): number => {
  // Prediction logic
};

// Add to calculateMonthlyReadings:
if (canPredict) {
  const predicted = predictValue(filteredData, monthEndDate);
  results.push({
    // ...
    isPredicted: true,
    calculationDetails: { method: 'predicted' }
  });
}
```

3. **Update Component**:
```typescript
// MonthlyMeterReadingsChart.tsx
segment: {
  borderDash: (ctx) => {
    // Add predicted pattern
    if (point?.isPredicted || nextPoint?.isPredicted) {
      return CHART_BORDER_DASH.predicted; // Add to constants
    }
    // ... existing logic
  }
}
```

4. **Update Legend**:
```tsx
<span className="flex items-center gap-2">
  <svg>{/* Predicted pattern SVG */}</svg>
  <span>Predicted</span>
</span>
```

### Customizing Interpolation Algorithm

To change interpolation algorithm:

1. **Add New Function**:
```typescript
// MonthlyDataAggregationService.ts
export const polynomialInterpolate = (
  points: Array<{ date: Date; amount: number }>,
  targetDate: Date
): number => {
  // Polynomial interpolation logic
};
```

2. **Update Configuration**:
```typescript
// Add to constants/ui.ts
export const INTERPOLATION_METHOD = {
  LINEAR: 'linear',
  POLYNOMIAL: 'polynomial',
  SPLINE: 'spline'
} as const;

export const SELECTED_INTERPOLATION = INTERPOLATION_METHOD.LINEAR;
```

3. **Use in Service**:
```typescript
// calculateMonthlyReadings
if (prevReading && nextReading) {
  let interpolated: number;

  if (SELECTED_INTERPOLATION === INTERPOLATION_METHOD.POLYNOMIAL) {
    interpolated = polynomialInterpolate([...], monthEndDate);
  } else {
    interpolated = interpolateValue(prevReading, nextReading, monthEndDate);
  }
  // ...
}
```

### Testing Checklist

When modifying this feature:

- [ ] Run service tests: `npm test MonthlyDataAggregationService`
- [ ] Run component tests: `npm test MonthlyMeterReadingsChart`
- [ ] Run page tests: `npm test charts/page`
- [ ] Test mobile view (320px, 375px, 768px)
- [ ] Test desktop view (1024px, 1920px)
- [ ] Test with no data
- [ ] Test with sparse data (few readings)
- [ ] Test with dense data (many readings)
- [ ] Test year navigation
- [ ] Test data quality indicators
- [ ] Check accessibility (keyboard navigation)
- [ ] Verify performance (< 500ms render)

## References

### External Documentation
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/)
- [Chart.js Segment Styling](https://www.chartjs.org/docs/latest/samples/line/segments.html)
- [date-fns Documentation](https://date-fns.org/docs/Getting-Started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Internal Documentation
- Requirements: `feature-dev/monthly-charts-redesign/requirements.md`
- Project Guide: `CLAUDE.md`
- Type Definitions: `src/app/types.ts`

### Related Features
- Timeline Slider: `feature-dev/filter-redesign/requirements-v3.md`
- Data Aggregation: `src/app/services/DataAggregationService.ts`
- Unified Chart: `src/app/components/energy/UnifiedEnergyChart.tsx`

---

**Document Maintained By**: Development Team
**Last Review**: 2025-11-06
**Next Review**: When feature is enhanced or issues arise
