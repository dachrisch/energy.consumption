# Implementation Guide: Monthly Charts View Redesign

## Quick Start for Implementation Agent

This guide provides a step-by-step roadmap for implementing the monthly meter readings chart feature.

---

## Overview

**Goal**: Create a new monthly view that displays end-of-month meter readings (actual and interpolated) for Power and Gas in separate charts.

**Key Changes**:
1. New service: `MonthlyDataAggregationService` for data calculations
2. New component: `MonthlyMeterReadingsChart` for chart rendering
3. Integration with existing `/charts` page

**Estimated Effort**: 8-12 hours (including tests)

---

## Implementation Order

### Phase 1: Service Layer (Test-First)
**Priority**: High | **Estimated Time**: 3-4 hours

1. **Create Service Tests** (`MonthlyDataAggregationService.test.ts`)
   - Start with test file: `/src/app/services/__tests__/MonthlyDataAggregationService.test.ts`
   - Write all test scenarios from test-scenarios.md section 1
   - Focus on edge cases: leap years, sparse data, interpolation
   - Run tests (they will fail initially)

2. **Implement Service** (`MonthlyDataAggregationService.ts`)
   - Create file: `/src/app/services/MonthlyDataAggregationService.ts`
   - Implement functions one by one:
     - `getMonthEndDate(year, month)` - Use date-fns `endOfMonth()`
     - `findNearestReading(data, targetDate, tolerance)` - Binary search or linear scan
     - `interpolateValue(prev, next, target)` - Linear interpolation formula
     - `calculateMonthlyReadings(data, year, type)` - Main orchestrator
   - Run tests after each function
   - Achieve 100% test coverage

3. **Service Type Definitions**
   - Add `MonthlyDataPoint` type to `/src/app/types.ts`
   - Document with JSDoc comments

**Validation**: All service tests pass with 100% coverage

---

### Phase 2: Component Layer (Test-First)
**Priority**: High | **Estimated Time**: 4-5 hours

1. **Create Component Tests** (`MonthlyMeterReadingsChart.test.tsx`)
   - Create test file: `/src/app/components/energy/__tests__/MonthlyMeterReadingsChart.test.tsx`
   - Write rendering tests (section 2.1 of test scenarios)
   - Write year navigation tests (section 2.2)
   - Mock Chart.js to avoid rendering complexity
   - Mock `MonthlyDataAggregationService` with jest.mock()

2. **Create Component Structure** (`MonthlyMeterReadingsChart.tsx`)
   - Create file: `/src/app/components/energy/MonthlyMeterReadingsChart.tsx`
   - Start with basic structure:
     ```typescript
     interface MonthlyMeterReadingsChartProps {
       energyData: EnergyType[];
       selectedYear: number;
       onYearChange: (year: number) => void;
       availableYears: number[];
     }

     const MonthlyMeterReadingsChart: React.FC<MonthlyMeterReadingsChartProps> = ({
       energyData,
       selectedYear,
       onYearChange,
       availableYears,
     }) => {
       // Component implementation
     };
     ```

3. **Implement Year Navigation UI**
   - Year dropdown (similar to existing implementation in UnifiedEnergyChart)
   - Prev/Next buttons with proper disable logic
   - Mobile-responsive styling

4. **Implement Chart Rendering**
   - Call `calculateMonthlyReadings()` for Power and Gas
   - Transform data to Chart.js format
   - Configure Chart.js options (from requirements FR-009)
   - Render two separate Line charts
   - Style actual vs interpolated data points

5. **Add Empty States**
   - No data for year
   - No data at all
   - Partial data (only Power or only Gas)

**Validation**: Component tests pass with >80% coverage

---

### Phase 3: Integration
**Priority**: High | **Estimated Time**: 1-2 hours

1. **Update Charts Page** (`/src/app/charts/page.tsx`)
   - Import `MonthlyMeterReadingsChart`
   - Add state for selected year (if not already present)
   - Calculate available years from energy data
   - Replace or supplement existing monthly view

2. **Route Configuration**
   - Verify `/charts` route loads correctly
   - Test navigation from other pages

3. **Integration Tests**
   - Create/update test: `/src/app/charts/__tests__/page.test.tsx`
   - Test full page rendering with monthly chart
   - Test data fetching and passing to component

**Validation**: Page loads and displays charts correctly

---

### Phase 4: Polish & Testing
**Priority**: Medium | **Estimated Time**: 1-2 hours

1. **Mobile Responsiveness**
   - Test on viewports: 320px, 375px, 768px, 1024px, 1920px
   - Verify chart height, font sizes, touch targets
   - Adjust breakpoints if needed

2. **Accessibility**
   - Add ARIA labels to charts and controls
   - Test keyboard navigation
   - Verify color contrast

3. **Error Handling**
   - Test with API errors
   - Test with invalid data
   - Verify error boundaries work

4. **Documentation**
   - Add JSDoc comments to all functions
   - Update CLAUDE.md if needed
   - Create user guide (optional)

**Validation**: All tests pass, no accessibility issues, works on all devices

---

## Code Templates

### Service Template

```typescript
// /src/app/services/MonthlyDataAggregationService.ts

import { EnergyType, EnergyOptions } from "@/app/types";
import { endOfMonth, differenceInDays } from "date-fns";

/**
 * Data point representing meter reading for a specific month
 */
export type MonthlyDataPoint = {
  month: number; // 1-12
  monthLabel: string; // "Jan", "Feb", etc.
  meterReading: number | null;
  isInterpolated: boolean;
  isActual: boolean;
  calculationDetails?: {
    method: 'actual' | 'interpolated' | 'none';
    sourceReadings?: Array<{ date: Date; amount: number }>;
    interpolationRatio?: number;
  };
};

const MONTH_END_TOLERANCE_DAYS = 3;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Get the last moment of a specific month
 */
export const getMonthEndDate = (year: number, month: number): Date => {
  return endOfMonth(new Date(year, month - 1, 1));
};

/**
 * Find nearest reading to target date within tolerance
 */
export const findNearestReading = (
  energyData: EnergyType[],
  targetDate: Date,
  toleranceDays: number = MONTH_END_TOLERANCE_DAYS
): EnergyType | null => {
  // Implementation
};

/**
 * Linearly interpolate meter reading between two readings
 */
export const interpolateValue = (
  prevReading: EnergyType,
  nextReading: EnergyType,
  targetDate: Date
): number => {
  // Implementation
};

/**
 * Calculate monthly meter readings for a specific year and energy type
 */
export const calculateMonthlyReadings = (
  energyData: EnergyType[],
  year: number,
  type: EnergyOptions
): MonthlyDataPoint[] => {
  // Implementation
};
```

### Component Template

```typescript
// /src/app/components/energy/MonthlyMeterReadingsChart.tsx

"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { EnergyType, EnergyOptions } from "@/app/types";
import { calculateMonthlyReadings, MonthlyDataPoint } from "@/app/services/MonthlyDataAggregationService";
import { getEnergyTypeLabel, getEnergyTypeChartConfig } from "@/app/constants/energyTypes";
import { Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";

interface MonthlyMeterReadingsChartProps {
  energyData: EnergyType[];
  selectedYear: number;
  onYearChange: (year: number) => void;
  availableYears: number[];
}

const MonthlyMeterReadingsChart: React.FC<MonthlyMeterReadingsChartProps> = ({
  energyData,
  selectedYear,
  onYearChange,
  availableYears,
}) => {
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate monthly data
  const powerData = useMemo(
    () => calculateMonthlyReadings(energyData, selectedYear, 'power'),
    [energyData, selectedYear]
  );

  const gasData = useMemo(
    () => calculateMonthlyReadings(energyData, selectedYear, 'gas'),
    [energyData, selectedYear]
  );

  // Transform to Chart.js format
  const powerChartData = useMemo(() => {
    // Implementation
  }, [powerData]);

  const gasChartData = useMemo(() => {
    // Implementation
  }, [gasData]);

  // Chart options
  const chartOptions: ChartOptions<'line'> = useMemo(() => ({
    // Implementation from FR-009
  }), [isMobile]);

  // Empty state
  if (energyData.length === 0) {
    return <div className="text-center py-8">No meter readings available...</div>;
  }

  return (
    <div className="w-full space-y-6">
      {/* Year Navigation */}
      <div className="flex items-center justify-between">
        {/* Implementation */}
      </div>

      {/* Power Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Power Meter Readings</h3>
        <div className="relative w-full" style={{ height: 'clamp(300px, 50vh, 500px)' }}>
          <Line data={powerChartData} options={chartOptions} />
        </div>
      </div>

      {/* Gas Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Gas Meter Readings</h3>
        <div className="relative w-full" style={{ height: 'clamp(300px, 50vh, 500px)' }}>
          <Line data={gasChartData} options={chartOptions} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <svg width="24" height="12" viewBox="0 0 24 12">
            <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="6" r="4" fill="currentColor" />
          </svg>
          <span>Actual</span>
        </span>
        <span className="flex items-center gap-2">
          <svg width="24" height="12" viewBox="0 0 24 12">
            <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" />
            <circle cx="12" cy="6" r="4" fill="transparent" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span>Interpolated</span>
        </span>
      </div>
    </div>
  );
};

export default MonthlyMeterReadingsChart;
```

---

## Testing Checklist

- [ ] Service tests pass (100% coverage)
- [ ] Component tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] Manual testing on mobile (320px, 375px)
- [ ] Manual testing on tablet (768px)
- [ ] Manual testing on desktop (1024px+)
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Color contrast meets WCAG AA
- [ ] No console errors or warnings
- [ ] Chart tooltips work correctly
- [ ] Year navigation works smoothly
- [ ] Empty states display correctly
- [ ] Interpolation calculations verified
- [ ] Leap year handling verified

---

## Common Pitfalls to Avoid

1. **Month Indexing**: JavaScript months are 0-indexed (Jan = 0), but our API uses 1-indexed (Jan = 1). Be consistent!

2. **Date Comparisons**: Use `.getTime()` for date comparisons to avoid timezone issues

3. **Tolerance Boundary**: `≤ 3 days` means 3 days is included (not `< 3`)

4. **Null Handling**: Distinguish between `null` (no data) and `0` (zero reading)

5. **Chart.js Reactivity**: Remember to use `useMemo()` for chart data to prevent unnecessary re-renders

6. **Mobile Touch Targets**: All interactive elements must be ≥ 44x44px

7. **Interpolation Edge Cases**: Always check if both prev and next readings exist before interpolating

8. **Type Filtering**: Service receives already-filtered data by type (don't filter again in component)

---

## Performance Optimization

1. **Memoization**: Use `useMemo()` for expensive calculations
2. **Data Processing**: Do calculations in service, not in render
3. **Chart.js Config**: Memoize chart options to prevent re-renders
4. **Debouncing**: If year navigation becomes laggy, debounce calculations

---

## Debugging Tips

1. **Service Issues**: Add `calculationDetails` to MonthlyDataPoint for debugging
2. **Chart Not Rendering**: Check browser console for Chart.js errors
3. **Data Missing**: Log `energyData` prop to verify data is passed correctly
4. **Interpolation Wrong**: Log prev/next readings and calculated ratio
5. **Test Failures**: Run single test with `.only()` to isolate issue

---

## Post-Implementation

After implementation is complete:

1. **Update CLAUDE.md**: Document the new monthly view pattern
2. **User Guide**: Consider creating user-facing documentation
3. **Changelog**: Add entry to CHANGELOG.md
4. **Git Commit**: Use conventional commit format:
   ```
   feat(charts): add monthly meter readings view with interpolation

   - New MonthlyDataAggregationService for end-of-month calculations
   - Separate Power and Gas charts in monthly view
   - Visual indicators for actual vs interpolated data
   - Mobile-first responsive design

   Closes #[issue-number]

   Co-Authored-By: Claude <noreply@anthropic.com>
   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

---

## Questions During Implementation?

Refer back to:
- **requirements.md** - Detailed specifications
- **test-scenarios.md** - Expected behaviors
- **Existing code patterns**: Look at `DataAggregationService.ts` and `UnifiedEnergyChart.tsx` for reference

---

**Ready to implement?** Start with Phase 1 (Service Layer) and work through the phases sequentially. Remember: test-first approach ensures correctness!

**Document Version**: 1.0
**Last Updated**: 2025-11-06
**Author**: Claude (Requirements Analyst Agent)
