# Technical Design: Dual Y-Axis Monthly Charts

## Overview
Detailed technical design for implementing dual y-axis visualization in the MonthlyMeterReadingsChart component, showing both cumulative meter readings (line chart, left axis) and monthly consumption differences (bar chart, right axis).

---

## Architecture Design

### High-Level Component Structure

```
MonthlyMeterReadingsChart Component
│
├── Year Navigation UI (existing)
│   ├── Previous Year Button
│   ├── Year Dropdown
│   └── Next Year Button
│
├── Data Processing Layer
│   ├── calculateMonthlyReadings() [existing]
│   ├── calculateMonthlyConsumption() [NEW]
│   └── transformToChartData() [enhanced]
│
├── Power Chart (Dual-Axis)
│   ├── Line Dataset → Left Y-Axis (Meter Readings)
│   ├── Bar Dataset → Right Y-Axis (Consumption)
│   ├── Shared X-Axis (Months)
│   └── Enhanced Tooltip
│
└── Gas Chart (Dual-Axis)
    ├── Line Dataset → Left Y-Axis (Meter Readings)
    ├── Bar Dataset → Right Y-Axis (Consumption)
    ├── Shared X-Axis (Months)
    └── Enhanced Tooltip
```

### Service Layer Enhancement

**File**: `/src/app/services/MonthlyDataAggregationService.ts`

**New Functions**:
1. `calculateMonthlyConsumption(monthlyData, previousDecember?)`
2. `determineConsumptionQuality(current, previous)`

**Existing Functions** (unchanged):
- `calculateMonthlyReadings()`
- `getMonthEndDate()`
- `findNearestReading()`
- `interpolateValue()`
- `extrapolateValue()`

---

## Data Flow Diagram

```
User Action: Select Year 2024
         ↓
ChartsPage passes energyData + selectedYear to Component
         ↓
MonthlyMeterReadingsChart receives props
         ↓
useMemo: Calculate Power Monthly Readings
         ↓ (existing service)
MonthlyDataAggregationService.calculateMonthlyReadings(energyData, 2024, 'power')
         ↓
Returns: MonthlyDataPoint[12] (meter readings with quality flags)
         ↓
useMemo: Calculate Power Monthly Consumption [NEW]
         ↓
MonthlyDataAggregationService.calculateMonthlyConsumption(powerMonthlyData)
         ↓
Returns: MonthlyConsumptionPoint[12] (consumption with quality flags)
         ↓
useMemo: Transform to Chart.js Data Format [ENHANCED]
         ↓
Create chartData with 2 datasets:
  - Dataset 1: Line (meter readings) → yAxisID: 'y-left'
  - Dataset 2: Bar (consumption) → yAxisID: 'y-right'
         ↓
Chart.js renders mixed chart (line + bar) with dual y-axes
         ↓
User hovers → Tooltip shows both meter reading and consumption
```

---

## Type Definitions

### New Type: MonthlyConsumptionPoint

**Location**: `/src/app/types.ts`

```typescript
/**
 * Data point representing monthly consumption (difference between meter readings)
 */
export type MonthlyConsumptionPoint = {
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

### Enhanced Constants

**Location**: `/src/app/constants/ui.ts`

```typescript
// Add to existing CHART_* constants
export const CHART_BAR = {
  opacity: 0.6,
  widthPercentage: 0.6,
  borderWidth: 1,
} as const;

export const CHART_AXIS_IDS = {
  leftYAxis: 'y-left',
  rightYAxis: 'y-right',
} as const;
```

---

## Service Implementation

### Function 1: calculateMonthlyConsumption()

**Signature**:
```typescript
export const calculateMonthlyConsumption = (
  monthlyData: MonthlyDataPoint[],
  previousDecember?: MonthlyDataPoint
): MonthlyConsumptionPoint[]
```

**Algorithm**:
```
1. Validate input:
   - Check monthlyData.length === 12
   - Throw error if invalid

2. Initialize results array (12 elements)

3. For each month (1 to 12):
   a. Get current month's data point

   b. Get previous month's data point:
      - If month === 1 (January):
        * Use previousDecember if provided
        * Else previous = null
      - Else:
        * Use monthlyData[month - 2]

   c. Calculate consumption:
      - If current.meterReading is null → consumption = null
      - If previous is null → consumption = null
      - If previous.meterReading is null → consumption = null
      - Else → consumption = current.meterReading - previous.meterReading

   d. Determine quality:
      - If consumption is null → isActual = false, isDerived = false
      - Else → call determineConsumptionQuality(current, previous)

   e. Log warning if consumption < 0:
      - console.warn(`Negative consumption detected for ${monthLabel}: ${consumption}`)

   f. Create MonthlyConsumptionPoint and add to results

4. Return results array
```

**Code Structure**:
```typescript
export const calculateMonthlyConsumption = (
  monthlyData: MonthlyDataPoint[],
  previousDecember?: MonthlyDataPoint
): MonthlyConsumptionPoint[] => {
  // Validation
  if (monthlyData.length !== 12) {
    throw new Error('monthlyData must contain exactly 12 months');
  }

  const results: MonthlyConsumptionPoint[] = [];

  for (let i = 0; i < 12; i++) {
    const current = monthlyData[i];
    const previous = i === 0
      ? previousDecember || null
      : monthlyData[i - 1];

    // Calculate consumption
    let consumption: number | null = null;
    if (current.meterReading !== null && previous && previous.meterReading !== null) {
      consumption = current.meterReading - previous.meterReading;

      // Warn on negative consumption
      if (consumption < 0) {
        console.warn(
          `Negative consumption detected for ${current.monthLabel} (${current.month}): ${consumption}`
        );
      }
    }

    // Determine quality
    const quality = previous && consumption !== null
      ? determineConsumptionQuality(current, previous)
      : { isActual: false, isDerived: false };

    results.push({
      month: current.month,
      monthLabel: current.monthLabel,
      consumption,
      isActual: quality.isActual,
      isDerived: quality.isDerived,
      sourceReadings: {
        current,
        previous,
      },
    });
  }

  return results;
};
```

### Function 2: determineConsumptionQuality()

**Signature**:
```typescript
const determineConsumptionQuality = (
  current: MonthlyDataPoint,
  previous: MonthlyDataPoint
): { isActual: boolean; isDerived: boolean }
```

**Logic**:
```
If current.isActual AND previous.isActual:
  → isActual = true, isDerived = false
Else:
  → isActual = false, isDerived = true
```

**Code**:
```typescript
const determineConsumptionQuality = (
  current: MonthlyDataPoint,
  previous: MonthlyDataPoint
): { isActual: boolean; isDerived: boolean } => {
  const isActual = current.isActual && previous.isActual;
  const isDerived = !isActual;

  return { isActual, isDerived };
};
```

**Export**: Helper function can remain internal (not exported) as it's only used within the service.

---

## Component Implementation

### Data Processing Hooks

**Existing** (unchanged):
```typescript
const powerData = useMemo(
  () => calculateMonthlyReadings(energyData, selectedYear, 'power'),
  [energyData, selectedYear]
);

const gasData = useMemo(
  () => calculateMonthlyReadings(energyData, selectedYear, 'gas'),
  [energyData, selectedYear]
);
```

**New** (add after existing):
```typescript
const powerConsumption = useMemo(
  () => calculateMonthlyConsumption(powerData),
  [powerData]
);

const gasConsumption = useMemo(
  () => calculateMonthlyConsumption(gasData),
  [gasData]
);
```

### Chart Data Transformation

**Current** (single dataset - line only):
```typescript
const powerChartData = useMemo(() => {
  const labels = powerData.map(d => d.monthLabel);
  const values = powerData.map(d => d.meterReading);
  // ... create single line dataset
}, [powerData]);
```

**Enhanced** (two datasets - line + bar):
```typescript
const powerChartData = useMemo(() => {
  const labels = powerData.map(d => d.monthLabel);
  const config = getEnergyTypeChartConfig('power');

  return {
    labels,
    datasets: [
      // Dataset 1: Meter Readings (Line) → Left Y-Axis
      {
        type: 'line' as const,
        label: getEnergyTypeLabel('power'),
        data: powerData.map(d => d.meterReading),
        yAxisID: CHART_AXIS_IDS.leftYAxis,
        borderColor: config.borderColor,
        backgroundColor: config.backgroundColor,
        borderWidth: 2.5,
        tension: 0.4,
        order: 2, // Render on top of bars
        // ... existing point and segment styling
      },

      // Dataset 2: Monthly Consumption (Bar) → Right Y-Axis
      {
        type: 'bar' as const,
        label: 'Monthly Consumption',
        data: powerConsumption.map(d => d.consumption),
        yAxisID: CHART_AXIS_IDS.rightYAxis,
        backgroundColor: config.backgroundColor.replace('0.5', String(CHART_BAR.opacity)),
        borderColor: config.borderColor,
        borderWidth: CHART_BAR.borderWidth,
        barPercentage: CHART_BAR.widthPercentage,
        order: 1, // Render behind line
        // Border dash for derived consumption
        borderDash: powerConsumption.map(d => d.isDerived ? [5, 3] : []),
      },
    ],
  };
}, [powerData, powerConsumption]);
```

### Chart Options Enhancement

**Existing scales** (x-axis and y-axis):
```typescript
scales: {
  x: { /* existing config */ },
  y: { /* existing config */ },
}
```

**Enhanced scales** (dual y-axes):
```typescript
scales: {
  x: {
    /* existing x-axis config - unchanged */
  },

  // Rename 'y' to 'y-left' for meter readings
  'y-left': {
    type: 'linear' as const,
    position: 'left' as const,
    beginAtZero: false,
    grid: {
      color: 'rgba(0, 0, 0, 0.05)',
      drawBorder: false,
    },
    ticks: {
      padding: isMobile ? 4 : 8,
      font: { size: isMobile ? 9 : 11 },
    },
    title: {
      display: !isMobile,
      text: 'Meter Reading (kWh)', // Dynamic based on energy type
      font: {
        size: isMobile ? 10 : 12,
        weight: 'bold' as const,
      },
    },
  },

  // Add new 'y-right' for consumption
  'y-right': {
    type: 'linear' as const,
    position: 'right' as const,
    beginAtZero: true, // Consumption typically starts at 0
    grid: {
      drawOnChartArea: false, // Don't draw grid for right axis (avoid clutter)
    },
    ticks: {
      padding: isMobile ? 4 : 8,
      font: { size: isMobile ? 9 : 11 },
    },
    title: {
      display: !isMobile,
      text: 'Monthly Consumption (kWh)', // Dynamic based on energy type
      font: {
        size: isMobile ? 10 : 12,
        weight: 'bold' as const,
      },
    },
  },
}
```

### Tooltip Enhancement

**Current tooltip**:
```typescript
callbacks: {
  label: (context) => {
    const dataIndex = context.dataIndex;
    const dataPoint = powerData[dataIndex];
    const value = context.parsed.y;

    // ... format meter reading with quality indicator
  }
}
```

**Enhanced tooltip**:
```typescript
callbacks: {
  label: (context) => {
    const dataIndex = context.dataIndex;
    const isPowerChart = context.chart.data.datasets[0].label?.includes('Power');
    const monthlyData = isPowerChart ? powerData : gasData;
    const consumptionData = isPowerChart ? powerConsumption : gasConsumption;

    const datasetIndex = context.datasetIndex;

    if (datasetIndex === 0) {
      // Line dataset (meter reading)
      const dataPoint = monthlyData[dataIndex];
      const value = context.parsed.y;

      if (value === null) return 'No data';

      let typeIndicator = '';
      if (dataPoint.isActual) typeIndicator = ' (Actual)';
      else if (dataPoint.isInterpolated) typeIndicator = ' (Interpolated)';
      else if (dataPoint.isExtrapolated) typeIndicator = ' (Extrapolated)';

      return `Meter Reading: ${value.toFixed(2)} kWh${typeIndicator}`;
    } else {
      // Bar dataset (consumption)
      const consumptionPoint = consumptionData[dataIndex];
      const value = consumptionPoint.consumption;

      if (value === null) {
        return dataIndex === 0
          ? 'Consumption: N/A (first month)'
          : 'Consumption: N/A';
      }

      const derivedIndicator = consumptionPoint.isDerived ? ' (derived)' : '';
      return `Consumption: ${value.toFixed(2)} kWh${derivedIndicator}`;
    }
  },

  // Optional: Add title callback to show month and year
  title: (tooltipItems) => {
    const monthLabel = tooltipItems[0]?.label;
    return `${monthLabel} ${selectedYear}`;
  }
}
```

### Legend Enhancement

**Current legend**: Custom legend showing data quality types (Actual, Interpolated, Extrapolated)

**Enhanced legend**: Keep custom legend, add explanation for consumption bars

**Option 1** (Simpler - recommended):
Keep existing custom legend for data quality. Chart.js legend handles dataset labels automatically (Meter Reading + Monthly Consumption).

**Option 2** (More explicit):
Extend custom legend to include bar representation:
```typescript
<div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
  <span className="flex items-center gap-2">
    <svg width="24" height="12" viewBox="0 0 24 12">
      <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="6" r="4" fill="currentColor" />
    </svg>
    <span>Actual (meter)</span>
  </span>
  <span className="flex items-center gap-2">
    <svg width="24" height="12" viewBox="0 0 24 12">
      <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="2" strokeDasharray="5 5" />
      <circle cx="12" cy="6" r="4" fill="transparent" stroke="currentColor" strokeWidth="2" />
    </svg>
    <span>Interpolated</span>
  </span>
  <span className="flex items-center gap-2">
    <svg width="24" height="12" viewBox="0 0 24 12">
      <line x1="0" y1="6" x2="24" y2="6" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" />
      <circle cx="12" cy="6" r="4" fill="transparent" stroke="currentColor" strokeWidth="2" />
    </svg>
    <span>Extrapolated</span>
  </span>

  {/* NEW: Add bar legend */}
  <span className="flex items-center gap-2">
    <svg width="24" height="12" viewBox="0 0 24 12">
      <rect x="8" y="2" width="8" height="8" fill="currentColor" opacity="0.6" />
    </svg>
    <span>Consumption</span>
  </span>
</div>
```

**Recommendation**: Use Chart.js built-in legend for datasets, keep custom legend for data quality. Total legend items: 5 (Meter Reading, Consumption, Actual, Interpolated, Extrapolated).

---

## Chart.js Configuration Reference

### Required Chart.js Components

**File**: `MonthlyMeterReadingsChart.tsx` (top of file)

```typescript
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,      // ADD
  BarController,   // ADD
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,      // ADD
  BarController,   // ADD
  Title,
  Tooltip,
  Legend
);
```

### Mixed Chart Type Configuration

Chart.js supports mixed chart types when datasets specify `type` property:

```typescript
{
  labels: ['Jan', 'Feb', ...],
  datasets: [
    { type: 'line', yAxisID: 'y-left', ... },  // Line dataset
    { type: 'bar', yAxisID: 'y-right', ... },  // Bar dataset
  ]
}
```

The Line component from react-chartjs-2 will automatically handle mixed types.

### Dual Y-Axis Configuration

**Key Concepts**:
1. **Axis IDs**: Each axis has unique ID ('y-left', 'y-right')
2. **Dataset Mapping**: Each dataset specifies its `yAxisID`
3. **Independent Scaling**: Each axis auto-scales to its dataset
4. **Grid Lines**: Only left axis shows grid (right axis: `drawOnChartArea: false`)

**Example**:
```typescript
scales: {
  'y-left': {
    type: 'linear',
    position: 'left',
    // ... config
  },
  'y-right': {
    type: 'linear',
    position: 'right',
    grid: { drawOnChartArea: false }, // Important: avoid double grid
    // ... config
  }
}
```

---

## Mobile Optimization

### Responsive Font Sizes

```typescript
const isMobile = useIsMobile(); // Hook to detect viewport width ≤ 768px

// Axis labels
ticks: {
  font: {
    size: isMobile ? 9 : 11, // Smaller on mobile
  }
}

// Axis titles
title: {
  display: !isMobile, // Hide axis titles on mobile (save space)
  font: {
    size: isMobile ? 10 : 12,
  }
}

// Tooltips
tooltip: {
  titleFont: {
    size: isMobile ? 12 : 14,
  },
  bodyFont: {
    size: isMobile ? 11 : 13,
  }
}
```

### Chart Height

```typescript
<div className="relative w-full" style={{ height: 'clamp(300px, 50vh, 500px)' }}>
  <Line data={powerChartData} options={chartOptions} />
</div>
```

This ensures:
- Minimum: 300px (readable on narrow screens)
- Preferred: 50vh (half viewport height)
- Maximum: 500px (not too tall on large screens)

### Bar Width on Mobile

```typescript
barPercentage: 0.6, // 60% of category width
```

With 12 categories and ~320px width:
- Category width ≈ 26px
- Bar width ≈ 16px (sufficient visibility)

If bars too narrow, consider:
- Increase `barPercentage` to 0.8 on mobile
- Use conditional config based on `isMobile`

---

## Error Handling

### Service Layer

**Function**: `calculateMonthlyConsumption()`

**Error Cases**:
1. **Invalid array length**:
   ```typescript
   if (monthlyData.length !== 12) {
     throw new Error('monthlyData must contain exactly 12 months');
   }
   ```

2. **Null handling**: Gracefully return null consumption (no error)

3. **Negative consumption**: Log warning, but allow (not an error):
   ```typescript
   if (consumption < 0) {
     console.warn(`Negative consumption: ${monthLabel} = ${consumption}`);
   }
   ```

### Component Layer

**Error Cases**:
1. **Empty energyData**: Handled by existing empty state
2. **Service throws error**: Wrap in try-catch (defensive):
   ```typescript
   try {
     const consumption = calculateMonthlyConsumption(powerData);
     setPowerConsumption(consumption);
   } catch (error) {
     console.error('Failed to calculate consumption:', error);
     setPowerConsumption([]); // Fallback to empty
   }
   ```

3. **Chart.js errors**: Chart.js will log warnings if config invalid (test thoroughly)

---

## Performance Considerations

### Memoization

All expensive calculations wrapped in `useMemo`:
```typescript
const powerData = useMemo(() => calculateMonthlyReadings(...), [energyData, selectedYear]);
const powerConsumption = useMemo(() => calculateMonthlyConsumption(powerData), [powerData]);
const powerChartData = useMemo(() => transformToChartData(...), [powerData, powerConsumption]);
```

**Benefit**: Recalculate only when dependencies change.

### Calculation Complexity

- `calculateMonthlyConsumption()`: O(n) where n = 12 (constant)
- Loop through 12 months, each iteration O(1)
- **Total**: ~5ms on typical hardware

### Render Performance

- Chart.js initial render: ~200-400ms for dual-axis chart
- Re-render on year change: ~100-200ms (only data changes, config same)
- **Target**: <600ms total (acceptable)

### Optimization Tips

1. **Avoid re-creating chart options**: Define `chartOptions` in useMemo
2. **Minimize dataset properties**: Only set necessary props
3. **Disable animations on mobile** (if needed):
   ```typescript
   animation: {
     duration: isMobile ? 0 : 750, // Disable on mobile for performance
   }
   ```

---

## Testing Strategy

### Unit Tests (Service)

**File**: `/src/app/services/__tests__/MonthlyDataAggregationService.test.ts`

**Add test suites**:
1. `calculateMonthlyConsumption()`
   - Happy path (12 actual readings)
   - With previous December
   - Null meter readings
   - Negative consumption
   - Invalid input (error throwing)

2. `determineConsumptionQuality()`
   - Both actual → isActual=true
   - Current interpolated → isDerived=true
   - Previous extrapolated → isDerived=true
   - Both derived → isDerived=true

**Coverage Target**: 100%

### Component Tests

**File**: `/src/app/components/energy/__tests__/MonthlyMeterReadingsChart.test.tsx`

**Add test cases**:
1. Renders dual-axis chart (2 datasets per chart)
2. Left y-axis configured for meter readings
3. Right y-axis configured for consumption
4. Tooltip shows both values
5. Legend includes both datasets
6. Mobile responsive (axis titles hidden)
7. Desktop rendering (all labels visible)

**Approach**: Mock Chart.js component, verify data structure passed to it.

**Coverage Target**: >80% (maintain existing coverage)

### Integration Tests

**File**: `/src/app/charts/__tests__/page.test.tsx`

**Test cases**:
1. Page renders with dual-axis charts
2. Year change recalculates consumption
3. Both Power and Gas charts independent

**Coverage Target**: >70%

---

## Migration Plan

### Phase 1: Service Layer (1-2 hours)
1. Add `MonthlyConsumptionPoint` type to `types.ts`
2. Implement `calculateMonthlyConsumption()` in service
3. Implement `determineConsumptionQuality()` helper
4. Write unit tests (100% coverage)
5. Verify tests pass

### Phase 2: Component Enhancement (2-3 hours)
1. Register BarElement and BarController in Chart.js
2. Add consumption calculation hooks
3. Enhance chart data transformation (add bar dataset)
4. Update chart options (dual y-axes)
5. Enhance tooltips (show both values)
6. Update legend (if needed)
7. Test component rendering locally

### Phase 3: Testing (2-3 hours)
1. Write component tests
2. Write integration tests
3. Manual testing (mobile, desktop, different data scenarios)
4. Visual regression testing (screenshots)
5. Performance testing (measure render times)

### Phase 4: Documentation & Deployment (1 hour)
1. Update CLAUDE.md with dual-axis pattern
2. Update user guide (if exists)
3. Add code comments/JSDoc
4. Create PR with detailed description
5. Review and merge

**Total Estimated Time**: 6-9 hours

---

## Rollback Plan

### If Issues Arise

1. **Service errors**: Service is additive, no breaking changes. Can disable consumption calculation without affecting meter readings.

2. **Component rendering issues**: Fallback by:
   - Remove bar dataset (revert to line only)
   - Keep left y-axis as-is
   - Remove right y-axis config

3. **Performance issues**:
   - Disable animations on mobile
   - Reduce bar rendering complexity
   - Add loading state during calculation

4. **Chart.js errors**:
   - Verify Chart.js version compatibility
   - Check for version-specific API changes
   - Consult Chart.js documentation for dual-axis examples

### Monitoring

After deployment:
- Monitor for console errors (Chart.js warnings)
- Check render times (performance regression)
- Gather user feedback (clarity, usability)
- Review analytics (any increase in page load errors)

---

## Future Enhancements

### Potential Improvements

1. **Cross-Year Consumption**:
   - Fetch previous December for January consumption
   - Add API endpoint for single month lookup
   - Optional: Cache previous year's December in component

2. **Consumption Breakdown**:
   - Show consumption by day (drill-down)
   - Show consumption by time of day (if data available)
   - Add consumption trends (increasing/decreasing indicators)

3. **Cost Overlay**:
   - Add third dataset: Cost per month (from contract prices)
   - Requires integration with cost calculation logic
   - Could use tertiary y-axis or tooltip-only display

4. **Comparison Mode**:
   - Compare two years side-by-side
   - Overlay previous year's consumption (dashed)
   - Show year-over-year % change

5. **Annotations**:
   - Mark months with unusual consumption (outliers)
   - Annotate contract changes
   - Highlight meter resets or data quality issues

6. **Export**:
   - Export chart as image (PNG/SVG)
   - Export data as CSV
   - Share chart link with specific year selected

---

## References

### Chart.js Documentation
- [Dual Axes](https://www.chartjs.org/docs/latest/axes/)
- [Mixed Chart Types](https://www.chartjs.org/docs/latest/charts/mixed.html)
- [Bar Chart](https://www.chartjs.org/docs/latest/charts/bar.html)
- [Tooltips](https://www.chartjs.org/docs/latest/configuration/tooltip.html)

### Project Files
- Service: `/src/app/services/MonthlyDataAggregationService.ts`
- Component: `/src/app/components/energy/MonthlyMeterReadingsChart.tsx`
- Types: `/src/app/types.ts`
- Constants: `/src/app/constants/ui.ts`, `/src/app/constants/energyTypes.ts`

### Related Patterns
- UnifiedEnergyChart: Examples of multiple datasets
- Timeline Slider: Service pattern and testing approach
- Cost Calculation: Dual data visualization (cost + consumption)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-06
**Author**: Claude (Requirements Analyst Agent)
**Status**: Ready for Implementation
**Estimated Implementation Time**: 6-9 hours
