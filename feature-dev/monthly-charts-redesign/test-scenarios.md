# Test Scenarios: Monthly Charts View Redesign

## Overview
This document defines comprehensive test scenarios for the monthly meter readings chart feature, covering unit tests, component tests, integration tests, and edge cases.

---

## 1. MonthlyDataAggregationService Tests

### 1.1 calculateMonthlyReadings() Tests

#### Test 1.1.1: Exact Month-End Reading
**Scenario**: Energy reading exists on the last day of the month
**Setup**:
```typescript
const data = [
  { date: new Date(2024, 0, 31, 23, 59), type: 'power', amount: 1000 }, // Jan 31
  { date: new Date(2024, 1, 29, 23, 59), type: 'power', amount: 1100 }, // Feb 29 (leap)
];
const result = calculateMonthlyReadings(data, 2024, 'power');
```
**Expected**:
- January: `{ month: 1, meterReading: 1000, isActual: true, isInterpolated: false }`
- February: `{ month: 2, meterReading: 1100, isActual: true, isInterpolated: false }`
- March-December: `{ month: X, meterReading: null, isActual: false, isInterpolated: false }`

#### Test 1.1.2: Reading Within Tolerance (±3 days)
**Scenario**: Reading is 2 days before month end
**Setup**:
```typescript
const data = [
  { date: new Date(2024, 0, 29), type: 'power', amount: 1000 }, // Jan 29 (2 days before month end)
];
const result = calculateMonthlyReadings(data, 2024, 'power');
```
**Expected**:
- January: `{ month: 1, meterReading: 1000, isActual: true, isInterpolated: false }`

#### Test 1.1.3: Reading Outside Tolerance
**Scenario**: Reading is 5 days before month end, requires interpolation
**Setup**:
```typescript
const data = [
  { date: new Date(2024, 0, 15), type: 'power', amount: 1000 }, // Jan 15
  { date: new Date(2024, 1, 15), type: 'power', amount: 1100 }, // Feb 15
];
const result = calculateMonthlyReadings(data, 2024, 'power');
```
**Expected**:
- January: `{ month: 1, meterReading: ~1048, isActual: false, isInterpolated: true }`
  - Calculation: 1000 + (1100 - 1000) * (16 days / 31 days) ≈ 1048

#### Test 1.1.4: No Readings for Year
**Scenario**: Empty data array or no readings match the year
**Setup**:
```typescript
const data = [];
const result = calculateMonthlyReadings(data, 2024, 'power');
```
**Expected**:
- All 12 months: `{ month: X, meterReading: null, isActual: false, isInterpolated: false }`

#### Test 1.1.5: Single Reading in Year
**Scenario**: Only one reading exists for the year
**Setup**:
```typescript
const data = [
  { date: new Date(2024, 5, 15), type: 'power', amount: 1000 }, // June 15
];
const result = calculateMonthlyReadings(data, 2024, 'power');
```
**Expected**:
- June: `{ month: 6, meterReading: null, isActual: false, isInterpolated: false }` (no neighbors to interpolate)
- Other months: null

#### Test 1.1.6: Multiple Readings on Month End
**Scenario**: Two readings on the same day at month end
**Setup**:
```typescript
const data = [
  { date: new Date(2024, 0, 31, 10, 0), type: 'power', amount: 1000 }, // Jan 31 10:00
  { date: new Date(2024, 0, 31, 23, 0), type: 'power', amount: 1010 }, // Jan 31 23:00
];
const result = calculateMonthlyReadings(data, 2024, 'power');
```
**Expected**:
- January: `{ month: 1, meterReading: 1010, isActual: true }` (uses latest reading)

#### Test 1.1.7: Leap Year February
**Scenario**: Correctly handles February 29 in leap year
**Setup**:
```typescript
const data = [
  { date: new Date(2024, 1, 29), type: 'power', amount: 1000 }, // Feb 29, 2024 (leap)
];
const result = calculateMonthlyReadings(data, 2024, 'power');
```
**Expected**:
- February: `{ month: 2, meterReading: 1000, isActual: true }`

#### Test 1.1.8: Non-Leap Year February
**Scenario**: Correctly handles February 28 in non-leap year
**Setup**:
```typescript
const data = [
  { date: new Date(2025, 1, 28), type: 'power', amount: 1000 }, // Feb 28, 2025 (non-leap)
];
const result = calculateMonthlyReadings(data, 2025, 'power');
```
**Expected**:
- February: `{ month: 2, meterReading: 1000, isActual: true }`

#### Test 1.1.9: Full Year with All Actual Readings
**Scenario**: User has reading at end of every month
**Setup**:
```typescript
const data = Array.from({ length: 12 }, (_, i) => ({
  date: new Date(2024, i, new Date(2024, i + 1, 0).getDate()), // Last day of each month
  type: 'power' as const,
  amount: 1000 + (i * 100),
}));
const result = calculateMonthlyReadings(data, 2024, 'power');
```
**Expected**:
- All 12 months have actual readings
- Values: 1000, 1100, 1200, ..., 2100
- All isActual: true, isInterpolated: false

#### Test 1.1.10: Sparse Data with Interpolation
**Scenario**: Readings only in Jan, Apr, Jul, Oct - others interpolated
**Setup**:
```typescript
const data = [
  { date: new Date(2024, 0, 31), type: 'power', amount: 1000 }, // Jan
  { date: new Date(2024, 3, 30), type: 'power', amount: 1300 }, // Apr
  { date: new Date(2024, 6, 31), type: 'power', amount: 1600 }, // Jul
  { date: new Date(2024, 9, 31), type: 'power', amount: 1900 }, // Oct
];
const result = calculateMonthlyReadings(data, 2024, 'power');
```
**Expected**:
- Jan: 1000 (actual)
- Feb: ~1100 (interpolated between Jan and Apr)
- Mar: ~1200 (interpolated between Jan and Apr)
- Apr: 1300 (actual)
- May: ~1400 (interpolated between Apr and Jul)
- Jun: ~1500 (interpolated between Apr and Jul)
- Jul: 1600 (actual)
- Aug: ~1700 (interpolated between Jul and Oct)
- Sep: ~1800 (interpolated between Jul and Oct)
- Oct: 1900 (actual)
- Nov: null (no data after Oct)
- Dec: null (no data after Oct)

### 1.2 findNearestReading() Tests

#### Test 1.2.1: Exact Match
**Scenario**: Reading exists on exact target date
**Setup**:
```typescript
const data = [
  { date: new Date(2024, 0, 31), type: 'power', amount: 1000 },
];
const result = findNearestReading(data, new Date(2024, 0, 31), 3);
```
**Expected**: Returns the reading with amount 1000

#### Test 1.2.2: Within Tolerance (Before)
**Scenario**: Reading is 2 days before target
**Setup**:
```typescript
const data = [
  { date: new Date(2024, 0, 29), type: 'power', amount: 1000 },
];
const result = findNearestReading(data, new Date(2024, 0, 31), 3);
```
**Expected**: Returns the reading with amount 1000

#### Test 1.2.3: Within Tolerance (After)
**Scenario**: Reading is 3 days after target
**Setup**:
```typescript
const data = [
  { date: new Date(2024, 1, 3), type: 'power', amount: 1000 },
];
const result = findNearestReading(data, new Date(2024, 0, 31), 3);
```
**Expected**: Returns the reading with amount 1000

#### Test 1.2.4: Outside Tolerance
**Scenario**: Reading is 5 days before target
**Setup**:
```typescript
const data = [
  { date: new Date(2024, 0, 26), type: 'power', amount: 1000 },
];
const result = findNearestReading(data, new Date(2024, 0, 31), 3);
```
**Expected**: Returns null

#### Test 1.2.5: Multiple Readings - Closest Wins
**Scenario**: Two readings within tolerance, pick closest
**Setup**:
```typescript
const data = [
  { date: new Date(2024, 0, 29), type: 'power', amount: 1000 }, // 2 days before
  { date: new Date(2024, 0, 30), type: 'power', amount: 1010 }, // 1 day before
];
const result = findNearestReading(data, new Date(2024, 0, 31), 3);
```
**Expected**: Returns reading with amount 1010 (1 day away is closer)

#### Test 1.2.6: Empty Data Array
**Scenario**: No readings available
**Setup**:
```typescript
const data = [];
const result = findNearestReading(data, new Date(2024, 0, 31), 3);
```
**Expected**: Returns null

### 1.3 interpolateValue() Tests

#### Test 1.3.1: Midpoint Interpolation
**Scenario**: Target is exactly between prev and next readings
**Setup**:
```typescript
const prev = { date: new Date(2024, 0, 1), type: 'power', amount: 1000 };
const next = { date: new Date(2024, 0, 31), type: 'power', amount: 1100 };
const target = new Date(2024, 0, 16); // Midpoint
const result = interpolateValue(prev, next, target);
```
**Expected**: 1050 (exactly halfway between 1000 and 1100)

#### Test 1.3.2: Quarter Point Interpolation
**Scenario**: Target is 25% between prev and next
**Setup**:
```typescript
const prev = { date: new Date(2024, 0, 1), type: 'power', amount: 1000 };
const next = { date: new Date(2024, 0, 31), type: 'power', amount: 1100 };
const target = new Date(2024, 0, 8); // ~25% through month
const result = interpolateValue(prev, next, target);
```
**Expected**: ~1025

#### Test 1.3.3: Target at Previous Reading
**Scenario**: Target date equals previous reading date
**Setup**:
```typescript
const prev = { date: new Date(2024, 0, 1), type: 'power', amount: 1000 };
const next = { date: new Date(2024, 0, 31), type: 'power', amount: 1100 };
const target = new Date(2024, 0, 1);
const result = interpolateValue(prev, next, target);
```
**Expected**: 1000 (ratio = 0)

#### Test 1.3.4: Target at Next Reading
**Scenario**: Target date equals next reading date
**Setup**:
```typescript
const prev = { date: new Date(2024, 0, 1), type: 'power', amount: 1000 };
const next = { date: new Date(2024, 0, 31), type: 'power', amount: 1100 };
const target = new Date(2024, 0, 31);
const result = interpolateValue(prev, next, target);
```
**Expected**: 1100 (ratio = 1)

#### Test 1.3.5: Invalid Order (Throws Error)
**Scenario**: Previous reading is after next reading
**Setup**:
```typescript
const prev = { date: new Date(2024, 0, 31), type: 'power', amount: 1100 };
const next = { date: new Date(2024, 0, 1), type: 'power', amount: 1000 };
const target = new Date(2024, 0, 15);
```
**Expected**: Throws Error: "Invalid reading order: prev must be before next"

#### Test 1.3.6: Same Date for Prev and Next
**Scenario**: Both readings on same date (invalid, but handle gracefully)
**Setup**:
```typescript
const prev = { date: new Date(2024, 0, 15), type: 'power', amount: 1000 };
const next = { date: new Date(2024, 0, 15), type: 'power', amount: 1100 };
const target = new Date(2024, 0, 15);
```
**Expected**: Throws Error: "Cannot interpolate between readings on same date"

### 1.4 getMonthEndDate() Tests

#### Test 1.4.1: Standard Month (31 days)
**Setup**: `getMonthEndDate(2024, 1)` // January
**Expected**: `new Date(2024, 0, 31, 23, 59, 59, 999)`

#### Test 1.4.2: Standard Month (30 days)
**Setup**: `getMonthEndDate(2024, 4)` // April
**Expected**: `new Date(2024, 3, 30, 23, 59, 59, 999)`

#### Test 1.4.3: Leap Year February
**Setup**: `getMonthEndDate(2024, 2)` // February 2024 (leap)
**Expected**: `new Date(2024, 1, 29, 23, 59, 59, 999)`

#### Test 1.4.4: Non-Leap Year February
**Setup**: `getMonthEndDate(2025, 2)` // February 2025 (non-leap)
**Expected**: `new Date(2025, 1, 28, 23, 59, 59, 999)`

#### Test 1.4.5: December (Year Boundary)
**Setup**: `getMonthEndDate(2024, 12)` // December
**Expected**: `new Date(2024, 11, 31, 23, 59, 59, 999)`

---

## 2. MonthlyMeterReadingsChart Component Tests

### 2.1 Rendering Tests

#### Test 2.1.1: Renders with Valid Data
**Scenario**: Component renders successfully with energy data
**Setup**:
```typescript
const props = {
  energyData: [
    { date: new Date(2024, 0, 31), type: 'power', amount: 1000 },
    { date: new Date(2024, 0, 31), type: 'gas', amount: 500 },
  ],
  selectedYear: 2024,
  onYearChange: jest.fn(),
  availableYears: [2024, 2023],
};
render(<MonthlyMeterReadingsChart {...props} />);
```
**Expected**:
- Component renders without errors
- Two charts visible (Power and Gas)
- Year navigation controls visible
- No error messages

#### Test 2.1.2: Renders Empty State (No Data)
**Scenario**: No data available for selected year
**Setup**:
```typescript
const props = {
  energyData: [],
  selectedYear: 2024,
  onYearChange: jest.fn(),
  availableYears: [],
};
render(<MonthlyMeterReadingsChart {...props} />);
```
**Expected**:
- Empty state message visible: "No meter readings available for 2024"
- No charts rendered
- "Add Data" link or suggestion visible

#### Test 2.1.3: Renders with Partial Data
**Scenario**: Only Power data exists, no Gas data
**Setup**:
```typescript
const props = {
  energyData: [
    { date: new Date(2024, 0, 31), type: 'power', amount: 1000 },
  ],
  selectedYear: 2024,
  onYearChange: jest.fn(),
  availableYears: [2024],
};
render(<MonthlyMeterReadingsChart {...props} />);
```
**Expected**:
- Power chart renders with data
- Gas chart renders but shows "No data" or all null values
- Both charts visible (consistent layout)

### 2.2 Year Navigation Tests

#### Test 2.2.1: Year Dropdown Interaction
**Scenario**: User clicks year dropdown and selects different year
**Setup**:
```typescript
const onYearChange = jest.fn();
const props = {
  energyData: mockData,
  selectedYear: 2024,
  onYearChange,
  availableYears: [2024, 2023, 2022],
};
render(<MonthlyMeterReadingsChart {...props} />);
const dropdown = screen.getByRole('button', { name: /2024/i });
fireEvent.click(dropdown);
const option2023 = screen.getByText('2023');
fireEvent.click(option2023);
```
**Expected**:
- `onYearChange(2023)` called once
- Dropdown closes after selection

#### Test 2.2.2: Previous Year Button
**Scenario**: User clicks previous year button
**Setup**:
```typescript
const onYearChange = jest.fn();
const props = {
  energyData: mockData,
  selectedYear: 2024,
  onYearChange,
  availableYears: [2024, 2023, 2022], // Sorted descending
};
render(<MonthlyMeterReadingsChart {...props} />);
const prevButton = screen.getByTitle('Previous year');
fireEvent.click(prevButton);
```
**Expected**:
- `onYearChange(2023)` called (next in descending list)

#### Test 2.2.3: Next Year Button
**Scenario**: User clicks next year button
**Setup**:
```typescript
const onYearChange = jest.fn();
const props = {
  energyData: mockData,
  selectedYear: 2023,
  onYearChange,
  availableYears: [2024, 2023, 2022],
};
render(<MonthlyMeterReadingsChart {...props} />);
const nextButton = screen.getByTitle('Next year');
fireEvent.click(nextButton);
```
**Expected**:
- `onYearChange(2024)` called (previous in descending list)

#### Test 2.2.4: Previous Button Disabled at Oldest Year
**Scenario**: Previous button disabled when at end of list
**Setup**:
```typescript
const props = {
  energyData: mockData,
  selectedYear: 2022,
  onYearChange: jest.fn(),
  availableYears: [2024, 2023, 2022], // 2022 is last (oldest)
};
render(<MonthlyMeterReadingsChart {...props} />);
const prevButton = screen.getByTitle('Previous year');
```
**Expected**:
- Button has disabled attribute
- Clicking does nothing

#### Test 2.2.5: Next Button Disabled at Newest Year
**Scenario**: Next button disabled when at start of list
**Setup**:
```typescript
const props = {
  energyData: mockData,
  selectedYear: 2024,
  onYearChange: jest.fn(),
  availableYears: [2024, 2023, 2022], // 2024 is first (newest)
};
render(<MonthlyMeterReadingsChart {...props} />);
const nextButton = screen.getByTitle('Next year');
```
**Expected**:
- Button has disabled attribute
- Clicking does nothing

### 2.3 Chart Data Tests

#### Test 2.3.1: Power Chart Displays Correct Data
**Scenario**: Verify Power chart shows only Power readings
**Setup**:
```typescript
const props = {
  energyData: [
    { date: new Date(2024, 0, 31), type: 'power', amount: 1000 },
    { date: new Date(2024, 1, 29), type: 'power', amount: 1100 },
    { date: new Date(2024, 0, 31), type: 'gas', amount: 500 },
  ],
  selectedYear: 2024,
  onYearChange: jest.fn(),
  availableYears: [2024],
};
render(<MonthlyMeterReadingsChart {...props} />);
```
**Expected**:
- Power chart shows data for Jan (1000) and Feb (1100)
- Power chart does not show Gas data (500)
- Gas chart shows its own data separately

#### Test 2.3.2: Gas Chart Displays Correct Data
**Scenario**: Verify Gas chart shows only Gas readings
**Setup**:
```typescript
const props = {
  energyData: [
    { date: new Date(2024, 0, 31), type: 'gas', amount: 500 },
    { date: new Date(2024, 1, 29), type: 'gas', amount: 550 },
  ],
  selectedYear: 2024,
  onYearChange: jest.fn(),
  availableYears: [2024],
};
render(<MonthlyMeterReadingsChart {...props} />);
```
**Expected**:
- Gas chart shows data for Jan (500) and Feb (550)
- Gas chart does not show Power data

#### Test 2.3.3: Charts Show All 12 Months
**Scenario**: X-axis has labels for all 12 months
**Setup**: Render with any data
**Expected**:
- Both charts have 12 x-axis labels: Jan, Feb, Mar, ..., Dec
- Even months without data show on axis

#### Test 2.3.4: Actual Data Points Styled Correctly
**Scenario**: Actual readings have solid lines and filled markers
**Setup**: Mock Chart.js and inspect dataset configuration
**Expected**:
- Actual data points: `pointStyle: 'circle'`, `pointRadius: 5`, filled
- Line segments connecting actual points: solid (no borderDash)

#### Test 2.3.5: Interpolated Data Points Styled Correctly
**Scenario**: Interpolated values have dashed lines and hollow markers
**Setup**: Mock Chart.js and inspect dataset configuration
**Expected**:
- Interpolated points: `pointStyle: 'circle'`, `pointRadius: 5`, hollow (border only)
- Line segments involving interpolated points: `borderDash: [5, 5]`

### 2.4 Mobile Responsiveness Tests

#### Test 2.4.1: Mobile Layout (320px width)
**Scenario**: Component renders correctly on narrow mobile screen
**Setup**:
```typescript
global.innerWidth = 320;
global.dispatchEvent(new Event('resize'));
render(<MonthlyMeterReadingsChart {...props} />);
```
**Expected**:
- Year controls stacked vertically or compact horizontal
- Chart legends at bottom position
- Smaller font sizes (9-11px)
- Touch targets ≥ 44x44px
- Both charts visible and scrollable if needed

#### Test 2.4.2: Tablet Layout (768px width)
**Scenario**: Component renders correctly on tablet
**Setup**:
```typescript
global.innerWidth = 768;
global.dispatchEvent(new Event('resize'));
render(<MonthlyMeterReadingsChart {...props} />);
```
**Expected**:
- Year controls horizontal layout
- Chart legends at top position
- Medium font sizes (10-12px)
- Comfortable spacing

#### Test 2.4.3: Desktop Layout (1024px+ width)
**Scenario**: Component renders correctly on desktop
**Setup**:
```typescript
global.innerWidth = 1920;
global.dispatchEvent(new Event('resize'));
render(<MonthlyMeterReadingsChart {...props} />);
```
**Expected**:
- Year controls horizontal with comfortable spacing
- Chart legends at top position
- Larger font sizes (11-13px)
- Hover states visible

### 2.5 Accessibility Tests

#### Test 2.5.1: Keyboard Navigation - Year Dropdown
**Scenario**: User can navigate year dropdown with keyboard
**Setup**:
```typescript
render(<MonthlyMeterReadingsChart {...props} />);
const dropdown = screen.getByRole('button', { name: /2024/i });
dropdown.focus();
fireEvent.keyDown(dropdown, { key: 'Enter' });
fireEvent.keyDown(dropdown, { key: 'ArrowDown' });
fireEvent.keyDown(dropdown, { key: 'Enter' });
```
**Expected**:
- Dropdown opens on Enter
- Arrow keys navigate options
- Enter selects option
- Focus management works correctly

#### Test 2.5.2: Keyboard Navigation - Prev/Next Buttons
**Scenario**: User can use prev/next buttons with keyboard
**Setup**:
```typescript
render(<MonthlyMeterReadingsChart {...props} />);
const nextButton = screen.getByTitle('Next year');
nextButton.focus();
fireEvent.keyDown(nextButton, { key: 'Enter' });
```
**Expected**:
- Button activates on Enter or Space
- Focus visible indicator

#### Test 2.5.3: ARIA Labels and Roles
**Scenario**: Screen readers can understand component structure
**Setup**: Render component and inspect ARIA attributes
**Expected**:
- Year dropdown has `role="button"` or `role="combobox"`
- Charts have descriptive `aria-label` (e.g., "Power meter readings for 2024")
- Prev/Next buttons have `aria-label` describing action

#### Test 2.5.4: Color Contrast
**Scenario**: Text and visual elements meet WCAG AA contrast ratio
**Setup**: Inspect computed styles
**Expected**:
- Text vs background: ≥ 4.5:1 contrast
- Chart colors distinguishable (Power teal, Gas red)
- Data point markers visible against chart background

---

## 3. Integration Tests (Charts Page)

### 3.1 Full Page Rendering
**Scenario**: Charts page loads and displays monthly chart
**Setup**:
```typescript
render(<ChartsPage />);
await waitFor(() => expect(screen.getByText('Energy Charts')).toBeInTheDocument());
```
**Expected**:
- Page renders successfully
- Monthly chart component loads
- Data fetches from API
- No errors in console

### 3.2 Data Fetching
**Scenario**: Page fetches energy data and passes to chart
**Setup**:
```typescript
const mockFetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve([/* mock data */]),
}));
global.fetch = mockFetch;
render(<ChartsPage />);
await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('/api/energy'));
```
**Expected**:
- Fetch called for energy data
- Data passed to MonthlyMeterReadingsChart
- Loading state shown then hidden

### 3.3 Year Selection Persistence
**Scenario**: Selected year persists during navigation within page
**Setup**:
```typescript
render(<ChartsPage />);
// Select year 2023
const dropdown = screen.getByRole('button', { name: /2024/i });
fireEvent.click(dropdown);
fireEvent.click(screen.getByText('2023'));
// Verify selected year persists
```
**Expected**:
- Year selection updates chart
- State persists until user changes it

---

## 4. Edge Case Tests

### 4.1 Leap Year Edge Cases

#### Test 4.1.1: Feb 29 Reading in Leap Year
**Scenario**: Reading on Feb 29, 2024
**Expected**: Treated as actual month-end reading

#### Test 4.1.2: Feb 28 Reading in Non-Leap Year
**Scenario**: Reading on Feb 28, 2025
**Expected**: Treated as actual month-end reading

#### Test 4.1.3: Feb 27 in Leap Year (Within Tolerance)
**Scenario**: Reading on Feb 27, 2024 (2 days before Feb 29)
**Expected**: Treated as actual (within 3-day tolerance)

### 4.2 Data Quality Edge Cases

#### Test 4.2.1: Negative Meter Reading
**Scenario**: Reading has negative amount (data error)
**Expected**: Skip invalid reading, log warning, treat as missing data

#### Test 4.2.2: Null Amount
**Scenario**: Reading has null amount
**Expected**: Skip invalid reading, log warning

#### Test 4.2.3: Non-Numeric Amount
**Scenario**: Reading has string amount (data corruption)
**Expected**: Skip invalid reading, log warning

#### Test 4.2.4: Future Date Reading
**Scenario**: Reading has date in future (e.g., 2030)
**Expected**: Include in calculations (valid scenario - user might backfill)

### 4.3 Boundary Conditions

#### Test 4.3.1: Year 2000
**Scenario**: Data from year 2000
**Expected**: Handles correctly (within reasonable range)

#### Test 4.3.2: Year 2100
**Scenario**: Data from year 2100
**Expected**: Handles correctly (edge of reasonable range)

#### Test 4.3.3: Year 1999
**Scenario**: Data from year 1999
**Expected**: Valid but may log warning (very old data)

#### Test 4.3.4: Exactly at Tolerance Boundary
**Scenario**: Reading exactly 3 days before month end
**Expected**: Included as actual (≤ 3 days, inclusive)

### 4.4 Performance Edge Cases

#### Test 4.4.1: Large Dataset (10,000 readings)
**Scenario**: User has 10,000 readings across multiple years
**Expected**:
- Calculations complete in < 100ms
- No performance degradation
- Memory usage reasonable

#### Test 4.4.2: Rapid Year Changes
**Scenario**: User rapidly clicks prev/next year buttons
**Expected**:
- Debouncing or throttling prevents excessive calculations
- No race conditions
- UI remains responsive

---

## 5. Visual Regression Tests

### 5.1 Chart Styling
**Scenario**: Verify chart appearance matches design
**Expected**:
- Power chart: Teal color scheme
- Gas chart: Red color scheme
- Consistent spacing and padding
- Legends readable and positioned correctly

### 5.2 Actual vs Interpolated Indicators
**Scenario**: Verify visual distinction is clear
**Expected**:
- Solid lines vs dashed lines clearly distinguishable
- Filled vs hollow markers clearly distinguishable
- Legend shows both styles

### 5.3 Mobile Responsive Snapshots
**Scenario**: Visual snapshots at different breakpoints
**Expected**:
- 320px width: Compact, readable
- 768px width: Comfortable spacing
- 1920px width: Full layout, no awkward stretching

---

## 6. Error Handling Tests

### 6.1 API Errors
**Scenario**: Energy data fetch fails
**Expected**:
- Error message shown to user
- Component gracefully handles missing data
- Retry option available

### 6.2 Invalid Props
**Scenario**: Component receives invalid props
**Expected**:
- PropTypes validation fails (development)
- Default values used where possible
- Error boundary catches render errors

### 6.3 Chart.js Errors
**Scenario**: Chart.js fails to render (library error)
**Expected**:
- Error boundary catches error
- Fallback UI shown
- Error logged for debugging

---

## 7. User Acceptance Tests

### 7.1 User Can Understand Data Quality
**Scenario**: User views chart and distinguishes actual vs interpolated
**Expected**:
- Visual indicators are intuitive
- Tooltip explains data source
- Legend is clear

### 7.2 User Can Navigate Years Easily
**Scenario**: User wants to see data from previous year
**Expected**:
- Year controls are discoverable
- Navigation is intuitive (prev/next make sense)
- Dropdown shows all available years

### 7.3 User Can Compare Power and Gas
**Scenario**: User wants to compare Power and Gas trends
**Expected**:
- Separate charts allow independent Y-axis scaling
- Vertically stacked for easy visual comparison
- Shared X-axis (months) aligns data points

---

## Test Coverage Goals

**Unit Tests**: 100% coverage for MonthlyDataAggregationService
**Component Tests**: >80% coverage for MonthlyMeterReadingsChart
**Integration Tests**: Key user flows covered
**Edge Cases**: All identified edge cases tested
**Accessibility**: WCAG 2.1 AA compliance verified

---

**Document Version**: 1.0
**Last Updated**: 2025-11-06
**Author**: Claude (Requirements Analyst Agent)
