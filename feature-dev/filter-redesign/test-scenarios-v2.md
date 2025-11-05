# Test Scenarios: Filter Redesign V2 - Timeline & Multi-Select

## Document Information
- **Feature**: EnergyTableFilters Component Redesign V2
- **Component**: `/src/app/components/energy/EnergyTableFilters.tsx`
- **Test File**: `/src/app/components/energy/__tests__/EnergyTableFilters.test.tsx`
- **Status**: Test Scenarios Defined - Awaiting Implementation
- **Date**: 2025-11-04
- **Version**: 2.0 (Complete Rewrite)

---

## Test Strategy Overview

### Testing Approach
- **Framework**: Jest + React Testing Library
- **Coverage Target**: 100% of component logic
- **Test Co-location**: Tests in `__tests__/` subdirectory next to component
- **Test Philosophy**: Test behavior, not implementation details

### Major Changes from V1
- ❌ **Removed**: All date picker tests (replaced with timeline tests)
- ❌ **Removed**: Radio button tests (replaced with checkbox tests)
- ✅ **Added**: Timeline preset functionality tests
- ✅ **Added**: Multi-select checkbox tests
- ✅ **Updated**: Badge count logic tests
- ✅ **Updated**: Reset functionality tests

### Test Categories (V2)
1. **Rendering Tests** - Verify all elements render correctly
2. **Timeline Preset Tests** (NEW) - Test quick-select date range buttons
3. **Multi-Select Type Filter Tests** (NEW) - Test checkbox multi-select behavior
4. **Active Filter Badge Tests** (UPDATED) - Test updated badge logic
5. **Reset Tests** (UPDATED) - Test reset with new filters and styling
6. **Accessibility Tests** (UPDATED) - Verify WCAG compliance
7. **Responsive Tests** (UPDATED) - Verify mobile/desktop layouts
8. **Integration Tests** (NEW) - Test filter combinations
9. **Edge Case Tests** (NEW) - Test boundary conditions

---

## Test Structure Overview

```
EnergyTableFilters Test Suite (V2)
├── Rendering (8 tests)
│   ├── Basic rendering
│   ├── Container styling
│   ├── Labels and sections
│   └── Reset button styling
├── Timeline Preset Tests (10 tests)
│   ├── Render all presets
│   ├── Date calculations
│   ├── Active state management
│   └── Mobile scroll behavior
├── Multi-Select Type Filter (8 tests)
│   ├── Checkbox rendering
│   ├── Single and multiple selection
│   ├── Empty selection behavior
│   └── Visual feedback
├── Active Filter Badge (10 tests)
│   ├── Badge visibility logic
│   ├── Count calculations
│   └── Combined filter scenarios
├── Reset Functionality (5 tests)
│   ├── Reset button styling
│   ├── Clear timeline and types
│   └── Badge reset
├── Accessibility (6 tests)
│   ├── Keyboard navigation
│   ├── Screen reader support
│   └── ARIA attributes
├── Responsive Layout (4 tests)
│   ├── Mobile horizontal scroll
│   ├── Desktop flex wrap
│   └── Checkbox stacking
├── Integration Tests (5 tests)
│   ├── Timeline + type combinations
│   ├── Filter application
│   └── Parent callback verification
└── Edge Cases (6 tests)
    ├── Boundary date calculations
    ├── Empty state handling
    └── Rapid interactions
```

**Total Test Count**: ~62 tests (increased from 27 in V1)

---

## 1. Rendering Tests (8 tests)

### Test 1.1: Render All Filter Sections
**Priority**: 🔴 **HIGH**

```typescript
it("renders all filter sections", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  // Timeline section
  expect(screen.getByText("Timeline")).toBeInTheDocument();
  expect(screen.getByText("Last 7 days")).toBeInTheDocument();
  expect(screen.getByText("Last 30 days")).toBeInTheDocument();
  expect(screen.getByText("Last 90 days")).toBeInTheDocument();
  expect(screen.getByText("This month")).toBeInTheDocument();
  expect(screen.getByText("This year")).toBeInTheDocument();
  expect(screen.getByText("All time")).toBeInTheDocument();

  // Type section
  expect(screen.getByText("Type")).toBeInTheDocument();
  expect(screen.getByLabelText(/Power/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Gas/i)).toBeInTheDocument();

  // Reset button
  expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
});
```

**Acceptance**: All UI elements present in DOM

---

### Test 1.2: Timeline Presets Render in Correct Order
**Priority**: 🟡 **MEDIUM**

```typescript
it("renders timeline presets in correct order", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const buttons = screen.getAllByRole("button").filter(btn =>
    btn.textContent?.includes("days") ||
    btn.textContent?.includes("month") ||
    btn.textContent?.includes("year") ||
    btn.textContent?.includes("time")
  );

  expect(buttons[0]).toHaveTextContent("Last 7 days");
  expect(buttons[1]).toHaveTextContent("Last 30 days");
  expect(buttons[2]).toHaveTextContent("Last 90 days");
  expect(buttons[3]).toHaveTextContent("This month");
  expect(buttons[4]).toHaveTextContent("This year");
  expect(buttons[5]).toHaveTextContent("All time");
});
```

**Acceptance**: Timeline buttons display in specified order

---

### Test 1.3: Type Checkboxes Render (No "All" Option)
**Priority**: 🔴 **HIGH**

```typescript
it("renders type checkboxes without 'All' option", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  // Checkboxes present
  const powerCheckbox = screen.getByLabelText(/Power/i);
  const gasCheckbox = screen.getByLabelText(/Gas/i);
  expect(powerCheckbox).toBeInTheDocument();
  expect(gasCheckbox).toBeInTheDocument();

  // "All" option NOT present
  expect(screen.queryByText("All")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("All")).not.toBeInTheDocument();
});
```

**Acceptance**: Only Power and Gas checkboxes, no "All" option

---

### Test 1.4: Container Uses solid-container Class
**Priority**: 🟢 **LOW**

```typescript
it("uses solid-container class for consistency", () => {
  const { container } = render(<EnergyTableFilters {...defaultProps} />);
  const containerElement = container.querySelector(".solid-container");
  expect(containerElement).toBeInTheDocument();
});
```

**Acceptance**: Container has correct class

---

### Test 1.5: Filter Section Labels Present
**Priority**: 🟢 **LOW**

```typescript
it("has proper labels for filter sections", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  expect(screen.getByText("Timeline")).toBeInTheDocument();
  expect(screen.getByText("Type")).toBeInTheDocument();
});
```

**Acceptance**: Section labels visible

---

### Test 1.6: Reset Button Has Correct Styling
**Priority**: 🟡 **MEDIUM**

```typescript
it("reset button uses button-secondary styling", () => {
  render(<EnergyTableFilters {...defaultProps} />);
  const resetButton = screen.getByRole("button", { name: /reset/i });

  expect(resetButton).toHaveClass("button-secondary");
  expect(resetButton).toHaveClass("button-sm");
  expect(resetButton).not.toHaveClass("button-outline"); // V1 style removed
});
```

**Acceptance**: Reset button uses `button-secondary` class

---

### Test 1.7: Reset Button Has Text and Icon
**Priority**: 🟢 **LOW**

```typescript
it("reset button has text label and icon", () => {
  render(<EnergyTableFilters {...defaultProps} />);
  const resetButton = screen.getByRole("button", { name: /reset/i });

  expect(resetButton).toHaveTextContent("Reset");
  expect(resetButton).toBeInTheDocument();
});
```

**Acceptance**: Button shows both icon and text

---

### Test 1.8: Icons Display in Type Checkboxes
**Priority**: 🟢 **LOW**

```typescript
it("displays icons next to type checkbox labels", () => {
  const { container } = render(<EnergyTableFilters {...defaultProps} />);

  // Check for icon presence (depends on implementation)
  // May need to check for specific SVG elements or data-testid
  expect(container.querySelector('[data-testid="power-icon"]')).toBeInTheDocument();
  expect(container.querySelector('[data-testid="gas-icon"]')).toBeInTheDocument();
});
```

**Acceptance**: Icons visible next to checkbox labels

---

## 2. Timeline Preset Tests (10 tests)

### Test 2.1: Click Timeline Button Sets Date Range
**Priority**: 🔴 **HIGH**

```typescript
it("clicking 'Last 7 days' calls setDateRange with correct dates", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const last7DaysButton = screen.getByText("Last 7 days");
  fireEvent.click(last7DaysButton);

  expect(mockSetDateRange).toHaveBeenCalledTimes(1);

  const call = mockSetDateRange.mock.calls[0][0];
  const { start, end } = call;

  // Verify dates are correct (end = today, start = 6 days ago)
  expect(end).toBeInstanceOf(Date);
  expect(start).toBeInstanceOf(Date);

  const dayDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  expect(dayDiff).toBe(6); // 7 days inclusive
});
```

**Acceptance**: Date range calculated correctly for "Last 7 days"

---

### Test 2.2: Last 30 Days Date Calculation
**Priority**: 🔴 **HIGH**

```typescript
it("'Last 30 days' calculates correct date range", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const last30DaysButton = screen.getByText("Last 30 days");
  fireEvent.click(last30DaysButton);

  const call = mockSetDateRange.mock.calls[0][0];
  const { start, end } = call;

  const dayDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  expect(dayDiff).toBe(29); // 30 days inclusive
});
```

**Acceptance**: Date range calculated correctly for "Last 30 days"

---

### Test 2.3: Last 90 Days Date Calculation
**Priority**: 🟡 **MEDIUM**

```typescript
it("'Last 90 days' calculates correct date range", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const last90DaysButton = screen.getByText("Last 90 days");
  fireEvent.click(last90DaysButton);

  const call = mockSetDateRange.mock.calls[0][0];
  const { start, end } = call;

  const dayDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  expect(dayDiff).toBe(89); // 90 days inclusive
});
```

**Acceptance**: Date range calculated correctly for "Last 90 days"

---

### Test 2.4: This Month Date Calculation
**Priority**: 🟡 **MEDIUM**

```typescript
it("'This month' calculates correct date range", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const thisMonthButton = screen.getByText("This month");
  fireEvent.click(thisMonthButton);

  const call = mockSetDateRange.mock.calls[0][0];
  const { start, end } = call;

  const now = new Date();
  expect(end.getDate()).toBe(now.getDate()); // End is today
  expect(start.getDate()).toBe(1); // Start is 1st of month
  expect(start.getMonth()).toBe(now.getMonth());
  expect(start.getFullYear()).toBe(now.getFullYear());
});
```

**Acceptance**: Date range starts on 1st of current month

---

### Test 2.5: This Year Date Calculation
**Priority**: 🟡 **MEDIUM**

```typescript
it("'This year' calculates correct date range", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const thisYearButton = screen.getByText("This year");
  fireEvent.click(thisYearButton);

  const call = mockSetDateRange.mock.calls[0][0];
  const { start, end } = call;

  const now = new Date();
  expect(end.getDate()).toBe(now.getDate()); // End is today
  expect(start.getDate()).toBe(1); // Start is Jan 1
  expect(start.getMonth()).toBe(0); // January
  expect(start.getFullYear()).toBe(now.getFullYear());
});
```

**Acceptance**: Date range starts on January 1st of current year

---

### Test 2.6: All Time Clears Date Range
**Priority**: 🔴 **HIGH**

```typescript
it("'All time' sets date range to null", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const allTimeButton = screen.getByText("All time");
  fireEvent.click(allTimeButton);

  expect(mockSetDateRange).toHaveBeenCalledWith({
    start: null,
    end: null,
  });
});
```

**Acceptance**: "All time" clears date filter

---

### Test 2.7: Active Timeline Button Highlighted
**Priority**: 🟡 **MEDIUM**

```typescript
it("active timeline button has primary styling", () => {
  const { rerender } = render(
    <EnergyTableFilters
      {...defaultProps}
      dateRange={{
        start: new Date(2025, 0, 9),
        end: new Date(2025, 0, 15)
      }}
    />
  );

  // Assuming component tracks active preset internally
  const last7DaysButton = screen.getByText("Last 7 days");

  // Should have active styling
  expect(last7DaysButton).toHaveClass("bg-primary");
  expect(last7DaysButton).toHaveClass("text-primary-foreground");
});
```

**Acceptance**: Active preset visually highlighted

---

### Test 2.8: Only One Timeline Active at a Time
**Priority**: 🟡 **MEDIUM**

```typescript
it("only one timeline preset is active at a time", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const last7DaysButton = screen.getByText("Last 7 days");
  const last30DaysButton = screen.getByText("Last 30 days");

  // Click first preset
  fireEvent.click(last7DaysButton);
  expect(last7DaysButton).toHaveClass("bg-primary");
  expect(last30DaysButton).not.toHaveClass("bg-primary");

  // Click second preset
  fireEvent.click(last30DaysButton);
  expect(last7DaysButton).not.toHaveClass("bg-primary");
  expect(last30DaysButton).toHaveClass("bg-primary");
});
```

**Acceptance**: Only one preset highlighted at a time

---

### Test 2.9: Clicking Active Timeline Deselects It
**Priority**: 🟡 **MEDIUM**

```typescript
it("clicking active timeline button deselects it", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const last7DaysButton = screen.getByText("Last 7 days");

  // Click to activate
  fireEvent.click(last7DaysButton);
  expect(last7DaysButton).toHaveClass("bg-primary");

  // Click again to deactivate
  fireEvent.click(last7DaysButton);
  expect(last7DaysButton).not.toHaveClass("bg-primary");

  // Should call setDateRange with null (All time)
  expect(mockSetDateRange).toHaveBeenCalledWith({
    start: null,
    end: null,
  });
});
```

**Acceptance**: Clicking active preset deactivates it (→ All time)

---

### Test 2.10: Timeline Buttons Have Minimum Touch Target Size
**Priority**: 🟡 **MEDIUM**

```typescript
it("timeline buttons have minimum 44x44px touch target", () => {
  const { container } = render(<EnergyTableFilters {...defaultProps} />);

  const timelineButtons = container.querySelectorAll('[data-testid^="timeline-"]');

  timelineButtons.forEach(button => {
    const rect = button.getBoundingClientRect();
    expect(rect.height).toBeGreaterThanOrEqual(44);
    // Width may vary, but height is critical for touch targets
  });
});
```

**Acceptance**: All timeline buttons meet touch target requirements

---

## 3. Multi-Select Type Filter Tests (8 tests)

### Test 3.1: Checkboxes Render as Semantic Input Elements
**Priority**: 🔴 **HIGH**

```typescript
it("type filters use semantic checkbox inputs", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const powerCheckbox = screen.getByRole("checkbox", { name: /Power/i });
  const gasCheckbox = screen.getByRole("checkbox", { name: /Gas/i });

  expect(powerCheckbox).toBeInTheDocument();
  expect(gasCheckbox).toBeInTheDocument();
  expect(powerCheckbox.type).toBe("checkbox");
  expect(gasCheckbox.type).toBe("checkbox");
});
```

**Acceptance**: Real checkbox inputs present (not just visual)

---

### Test 3.2: Toggle Single Checkbox
**Priority**: 🔴 **HIGH**

```typescript
it("clicking power checkbox toggles selection", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const powerCheckbox = screen.getByRole("checkbox", { name: /Power/i });

  // Initially unchecked
  expect(powerCheckbox).not.toBeChecked();

  // Click to check
  fireEvent.click(powerCheckbox);
  expect(mockSetSelectedTypes).toHaveBeenCalledWith(["power"]);

  // Re-render with checked state
  const { rerender } = render(
    <EnergyTableFilters {...defaultProps} selectedTypes={["power"]} />
  );
  expect(powerCheckbox).toBeChecked();

  // Click to uncheck
  fireEvent.click(powerCheckbox);
  expect(mockSetSelectedTypes).toHaveBeenCalledWith([]);
});
```

**Acceptance**: Checkbox toggles on/off correctly

---

### Test 3.3: Select Multiple Checkboxes
**Priority**: 🔴 **HIGH**

```typescript
it("can select both power and gas simultaneously", () => {
  const { rerender } = render(
    <EnergyTableFilters {...defaultProps} selectedTypes={[]} />
  );

  const powerCheckbox = screen.getByRole("checkbox", { name: /Power/i });
  const gasCheckbox = screen.getByRole("checkbox", { name: /Gas/i });

  // Select Power
  fireEvent.click(powerCheckbox);
  expect(mockSetSelectedTypes).toHaveBeenCalledWith(["power"]);

  // Re-render with Power selected
  rerender(
    <EnergyTableFilters {...defaultProps} selectedTypes={["power"]} />
  );

  // Select Gas (should add to array, not replace)
  fireEvent.click(gasCheckbox);
  expect(mockSetSelectedTypes).toHaveBeenCalledWith(["power", "gas"]);
});
```

**Acceptance**: Multiple checkboxes can be selected

---

### Test 3.4: Empty Selection Shows All Data (Implicit "All")
**Priority**: 🔴 **HIGH**

```typescript
it("empty selection is treated as 'show all'", () => {
  render(<EnergyTableFilters {...defaultProps} selectedTypes={[]} />);

  const powerCheckbox = screen.getByRole("checkbox", { name: /Power/i });
  const gasCheckbox = screen.getByRole("checkbox", { name: /Gas/i });

  // Both unchecked
  expect(powerCheckbox).not.toBeChecked();
  expect(gasCheckbox).not.toBeChecked();

  // This should show all data in parent component
  // No filter applied when selectedTypes = []
});
```

**Acceptance**: Empty array = no type filter (show all)

---

### Test 3.5: Checked Checkbox Has Visual Feedback
**Priority**: 🟡 **MEDIUM**

```typescript
it("checked checkbox has primary styling", () => {
  render(
    <EnergyTableFilters {...defaultProps} selectedTypes={["power"]} />
  );

  const powerLabel = screen.getByText("Power").closest("label");
  const gasLabel = screen.getByText("Gas").closest("label");

  // Power checked - should have active styling
  expect(powerLabel).toHaveClass("bg-primary");
  expect(powerLabel).toHaveClass("text-primary-foreground");

  // Gas unchecked - should have inactive styling
  expect(gasLabel).not.toHaveClass("bg-primary");
  expect(gasLabel).toHaveClass("bg-transparent");
});
```

**Acceptance**: Visual distinction between checked/unchecked

---

### Test 3.6: Checkbox Labels Include Icons
**Priority**: 🟢 **LOW**

```typescript
it("checkbox labels display energy type icons", () => {
  const { container } = render(<EnergyTableFilters {...defaultProps} />);

  // Check for icon presence
  const powerIcon = container.querySelector('[data-testid="power-icon"]');
  const gasIcon = container.querySelector('[data-testid="gas-icon"]');

  expect(powerIcon).toBeInTheDocument();
  expect(gasIcon).toBeInTheDocument();
});
```

**Acceptance**: Icons visible in checkbox labels

---

### Test 3.7: Checkboxes Have Adequate Touch Targets
**Priority**: 🟡 **MEDIUM**

```typescript
it("checkbox buttons have minimum 44x44px touch target", () => {
  const { container } = render(<EnergyTableFilters {...defaultProps} />);

  const checkboxLabels = container.querySelectorAll('label[data-testid^="type-checkbox-"]');

  checkboxLabels.forEach(label => {
    const rect = label.getBoundingClientRect();
    expect(rect.height).toBeGreaterThanOrEqual(44);
  });
});
```

**Acceptance**: Touch targets meet accessibility requirements

---

### Test 3.8: Keyboard Space Toggles Checkbox
**Priority**: 🟡 **MEDIUM**

```typescript
it("pressing space key toggles checkbox", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const powerCheckbox = screen.getByRole("checkbox", { name: /Power/i });

  // Focus and press space
  powerCheckbox.focus();
  fireEvent.keyDown(powerCheckbox, { key: " ", code: "Space" });

  expect(mockSetSelectedTypes).toHaveBeenCalled();
});
```

**Acceptance**: Keyboard navigation works

---

## 4. Active Filter Badge Tests (10 tests)

### Test 4.1: Badge Hidden When No Filters Active
**Priority**: 🔴 **HIGH**

```typescript
it("shows no badge when no filters are active", () => {
  render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={[]}
      dateRange={{ start: null, end: null }}
    />
  );

  const badge = screen.queryByText(/^\d+$/);
  expect(badge).not.toBeInTheDocument();
});
```

**Acceptance**: Badge hidden when count = 0

---

### Test 4.2: Badge Shows Count 1 When Only Timeline Active
**Priority**: 🔴 **HIGH**

```typescript
it("shows badge with count 1 when only timeline filter active", () => {
  render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={[]}
      dateRange={{
        start: new Date(2025, 0, 1),
        end: new Date(2025, 0, 15)
      }}
    />
  );

  const badge = screen.getByText("1");
  expect(badge).toBeInTheDocument();
  expect(badge).toHaveClass("bg-primary");
});
```

**Acceptance**: Timeline filter counts as 1

---

### Test 4.3: Badge Shows Count 1 When Only Type Active (Single)
**Priority**: 🔴 **HIGH**

```typescript
it("shows badge with count 1 when one type selected", () => {
  render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={["power"]}
      dateRange={{ start: null, end: null }}
    />
  );

  const badge = screen.getByText("1");
  expect(badge).toBeInTheDocument();
});
```

**Acceptance**: Single type selection counts as 1

---

### Test 4.4: Badge Shows Count 1 When Multiple Types Selected
**Priority**: 🔴 **HIGH**

```typescript
it("shows badge with count 1 when multiple types selected (still counts as 1 filter)", () => {
  render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={["power", "gas"]}
      dateRange={{ start: null, end: null }}
    />
  );

  const badge = screen.getByText("1");
  expect(badge).toBeInTheDocument();

  // Should NOT show "2" even though 2 types selected
  expect(screen.queryByText("2")).not.toBeInTheDocument();
});
```

**Acceptance**: Multiple types count as 1 filter (not number of types)

---

### Test 4.5: Badge Shows Count 2 When Both Filters Active
**Priority**: 🔴 **HIGH**

```typescript
it("shows badge with count 2 when timeline and type both active", () => {
  render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={["power"]}
      dateRange={{
        start: new Date(2025, 0, 1),
        end: new Date(2025, 0, 15)
      }}
    />
  );

  const badge = screen.getByText("2");
  expect(badge).toBeInTheDocument();
});
```

**Acceptance**: Maximum badge count is 2

---

### Test 4.6: Badge Hidden When "All Time" Selected (No Other Filters)
**Priority**: 🟡 **MEDIUM**

```typescript
it("badge hidden when 'All time' is active (equivalent to no filter)", () => {
  render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={[]}
      dateRange={{ start: null, end: null }}  // All time
    />
  );

  const badge = screen.queryByText(/^\d+$/);
  expect(badge).not.toBeInTheDocument();
});
```

**Acceptance**: "All time" doesn't count as active filter

---

### Test 4.7: Badge Updates When Filters Change
**Priority**: 🟡 **MEDIUM**

```typescript
it("badge count updates reactively when filters change", () => {
  const { rerender } = render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={[]}
      dateRange={{ start: null, end: null }}
    />
  );

  // Initially no badge
  expect(screen.queryByText("1")).not.toBeInTheDocument();

  // Add type filter
  rerender(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={["power"]}
      dateRange={{ start: null, end: null }}
    />
  );
  expect(screen.getByText("1")).toBeInTheDocument();

  // Add timeline filter
  rerender(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={["power"]}
      dateRange={{
        start: new Date(2025, 0, 1),
        end: new Date(2025, 0, 15)
      }}
    />
  );
  expect(screen.getByText("2")).toBeInTheDocument();

  // Clear all
  rerender(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={[]}
      dateRange={{ start: null, end: null }}
    />
  );
  expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
});
```

**Acceptance**: Badge updates immediately when filters change

---

### Test 4.8: Badge Styling Correct
**Priority**: 🟢 **LOW**

```typescript
it("badge has correct styling classes", () => {
  render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={["power"]}
      dateRange={{ start: null, end: null }}
    />
  );

  const badge = screen.getByText("1");
  expect(badge).toHaveClass("px-2");
  expect(badge).toHaveClass("py-1");
  expect(badge).toHaveClass("rounded-full");
  expect(badge).toHaveClass("bg-primary");
  expect(badge).toHaveClass("text-primary-foreground");
  expect(badge).toHaveClass("text-xs");
});
```

**Acceptance**: Badge has correct design system classes

---

### Test 4.9: Badge Position Next to Reset Button
**Priority**: 🟢 **LOW**

```typescript
it("badge is positioned next to reset button", () => {
  const { container } = render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={["power"]}
      dateRange={{ start: null, end: null }}
    />
  );

  const resetButton = screen.getByRole("button", { name: /reset/i });
  const badge = screen.getByText("1");

  // Badge and reset button should be in same flex container
  const resetContainer = resetButton.parentElement;
  expect(resetContainer).toContainElement(badge);
});
```

**Acceptance**: Badge positioned correctly in layout

---

### Test 4.10: Badge Never Shows Count > 2
**Priority**: 🟡 **MEDIUM**

```typescript
it("badge never shows count greater than 2", () => {
  render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={["power", "gas"]}
      dateRange={{
        start: new Date(2025, 0, 1),
        end: new Date(2025, 0, 15)
      }}
    />
  );

  // Even with both types + timeline, max is 2
  const badge = screen.getByText("2");
  expect(badge).toBeInTheDocument();
  expect(screen.queryByText("3")).not.toBeInTheDocument();
  expect(screen.queryByText("4")).not.toBeInTheDocument();
});
```

**Acceptance**: Maximum badge count is 2

---

## 5. Reset Functionality Tests (5 tests)

### Test 5.1: Reset Button Calls onReset Callback
**Priority**: 🔴 **HIGH**

```typescript
it("calls onReset when reset button clicked", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const resetButton = screen.getByRole("button", { name: /reset/i });
  fireEvent.click(resetButton);

  expect(mockOnReset).toHaveBeenCalledTimes(1);
});
```

**Acceptance**: Reset callback invoked

---

### Test 5.2: Reset Clears All Type Selections
**Priority**: 🔴 **HIGH**

```typescript
it("reset button clears all type selections", () => {
  const mockReset = jest.fn(() => {
    // Simulate parent component reset logic
    mockSetSelectedTypes([]);
    mockSetDateRange({ start: null, end: null });
  });

  render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={["power", "gas"]}
      onReset={mockReset}
    />
  );

  const resetButton = screen.getByRole("button", { name: /reset/i });
  fireEvent.click(resetButton);

  expect(mockReset).toHaveBeenCalled();

  // After reset, checkboxes should be unchecked
  // (Requires re-render with updated props)
});
```

**Acceptance**: Reset clears type filter

---

### Test 5.3: Reset Clears Timeline Preset
**Priority**: 🔴 **HIGH**

```typescript
it("reset button clears timeline preset", () => {
  const mockReset = jest.fn(() => {
    mockSetDateRange({ start: null, end: null });
  });

  render(
    <EnergyTableFilters
      {...defaultProps}
      dateRange={{
        start: new Date(2025, 0, 1),
        end: new Date(2025, 0, 15)
      }}
      onReset={mockReset}
    />
  );

  const resetButton = screen.getByRole("button", { name: /reset/i });
  fireEvent.click(resetButton);

  expect(mockReset).toHaveBeenCalled();
});
```

**Acceptance**: Reset clears timeline filter

---

### Test 5.4: Reset Hides Badge
**Priority**: 🟡 **MEDIUM**

```typescript
it("badge disappears after reset", () => {
  const { rerender } = render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={["power"]}
      dateRange={{
        start: new Date(2025, 0, 1),
        end: new Date(2025, 0, 15)
      }}
    />
  );

  // Badge showing
  expect(screen.getByText("2")).toBeInTheDocument();

  // Reset
  rerender(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={[]}
      dateRange={{ start: null, end: null }}
    />
  );

  // Badge hidden
  expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
});
```

**Acceptance**: Badge count returns to 0 after reset

---

### Test 5.5: Reset Button Accessibility Attributes
**Priority**: 🟡 **MEDIUM**

```typescript
it("reset button has proper accessibility attributes", () => {
  render(<EnergyTableFilters {...defaultProps} />);
  const resetButton = screen.getByRole("button", { name: /reset/i });

  expect(resetButton).toHaveAttribute("title", "Reset all filters");
  expect(resetButton).toHaveAttribute("aria-label", "Reset all filters");
});
```

**Acceptance**: ARIA labels present

---

## 6. Accessibility Tests (6 tests)

### Test 6.1: Timeline Buttons Keyboard Accessible
**Priority**: 🔴 **HIGH**

```typescript
it("timeline buttons are keyboard accessible via Tab", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const last7DaysButton = screen.getByText("Last 7 days");

  // Should be focusable
  last7DaysButton.focus();
  expect(document.activeElement).toBe(last7DaysButton);

  // Should be activatable with Enter/Space
  fireEvent.keyDown(last7DaysButton, { key: "Enter", code: "Enter" });
  expect(mockSetDateRange).toHaveBeenCalled();
});
```

**Acceptance**: Tab navigation works on timeline buttons

---

### Test 6.2: Checkboxes Are Semantic Input Elements
**Priority**: 🔴 **HIGH**

```typescript
it("type checkboxes are real checkbox inputs for accessibility", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const powerCheckbox = screen.getByRole("checkbox", { name: /Power/i });
  const gasCheckbox = screen.getByRole("checkbox", { name: /Gas/i });

  // Must be actual <input type="checkbox">
  expect(powerCheckbox.tagName).toBe("INPUT");
  expect(powerCheckbox.type).toBe("checkbox");
  expect(gasCheckbox.tagName).toBe("INPUT");
  expect(gasCheckbox.type).toBe("checkbox");
});
```

**Acceptance**: Real checkbox inputs (not just visual)

---

### Test 6.3: Timeline Buttons Have ARIA Attributes
**Priority**: 🟡 **MEDIUM**

```typescript
it("timeline buttons have proper ARIA attributes", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const last7DaysButton = screen.getByText("Last 7 days");

  expect(last7DaysButton).toHaveAttribute("role", "button");
  expect(last7DaysButton).toHaveAttribute("aria-pressed"); // true/false for active state
});
```

**Acceptance**: ARIA attributes present

---

### Test 6.4: Focus States Visible
**Priority**: 🟡 **MEDIUM**

```typescript
it("all interactive elements have visible focus states", () => {
  const { container } = render(<EnergyTableFilters {...defaultProps} />);

  const interactiveElements = container.querySelectorAll("button, input[type='checkbox']");

  interactiveElements.forEach(element => {
    element.focus();

    // Check for focus-visible or focus classes (depends on implementation)
    const computedStyle = window.getComputedStyle(element);
    // Should have outline or box-shadow for focus
    expect(
      computedStyle.outline !== "none" ||
      computedStyle.boxShadow !== "none"
    ).toBe(true);
  });
});
```

**Acceptance**: Focus states visually distinguishable

---

### Test 6.5: Labels Properly Associated with Inputs
**Priority**: 🟡 **MEDIUM**

```typescript
it("checkbox labels are properly associated with inputs", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const powerLabel = screen.getByText("Power");
  const gasLabel = screen.getByText("Gas");

  // Labels should be associated with inputs
  // Either via <label> wrapping or for/id attributes
  expect(powerLabel.tagName).toBe("LABEL");
  expect(gasLabel.tagName).toBe("LABEL");
});
```

**Acceptance**: Semantic label/input association

---

### Test 6.6: Color Contrast Meets WCAG AA
**Priority**: 🟢 **LOW** (Manual Test Required)

```typescript
it("color contrast meets WCAG AA standards", () => {
  // This test would require a color contrast checking library
  // or manual verification with tools like axe-core

  const { container } = render(<EnergyTableFilters {...defaultProps} />);

  // Placeholder - actual implementation would check computed colors
  expect(container).toBeInTheDocument();

  // Manual verification:
  // - Text on buttons: 4.5:1 minimum
  // - UI components: 3:1 minimum
});
```

**Acceptance**: Manual verification with axe-core or Lighthouse

---

## 7. Responsive Layout Tests (4 tests)

### Test 7.1: Timeline Buttons in Horizontal Scroll Container on Mobile
**Priority**: 🟡 **MEDIUM**

```typescript
it("timeline buttons in horizontal scroll container on mobile", () => {
  // Mock mobile viewport
  global.innerWidth = 375;

  const { container } = render(<EnergyTableFilters {...defaultProps} />);

  const scrollContainer = container.querySelector(".overflow-x-auto");
  expect(scrollContainer).toBeInTheDocument();

  const buttonsContainer = scrollContainer?.querySelector(".flex");
  expect(buttonsContainer).toHaveClass("flex");
  expect(buttonsContainer).not.toHaveClass("flex-wrap"); // No wrap on mobile
});
```

**Acceptance**: Timeline scrolls horizontally on mobile

---

### Test 7.2: Timeline Buttons Wrap on Desktop
**Priority**: 🟡 **MEDIUM**

```typescript
it("timeline buttons wrap on desktop", () => {
  // Mock desktop viewport
  global.innerWidth = 1024;

  const { container } = render(<EnergyTableFilters {...defaultProps} />);

  const scrollContainer = container.querySelector(".overflow-x-auto");

  // On desktop, overflow should be visible (via sm: breakpoint)
  expect(scrollContainer).toHaveClass("sm:overflow-visible");
});
```

**Acceptance**: Timeline wraps on desktop

---

### Test 7.3: Checkboxes Stack Vertically on Mobile
**Priority**: 🟡 **MEDIUM**

```typescript
it("type checkboxes stack vertically on mobile", () => {
  global.innerWidth = 375;

  const { container } = render(<EnergyTableFilters {...defaultProps} />);

  const checkboxContainer = container.querySelector('[data-testid="type-filter-container"]');
  expect(checkboxContainer).toHaveClass("flex-col");
});
```

**Acceptance**: Checkboxes vertical on mobile

---

### Test 7.4: Type Filter and Reset Inline on Desktop
**Priority**: 🟢 **LOW**

```typescript
it("type filter and reset button in same row on desktop", () => {
  global.innerWidth = 1024;

  const { container } = render(<EnergyTableFilters {...defaultProps} />);

  const typeResetContainer = container.querySelector('[data-testid="type-reset-row"]');
  expect(typeResetContainer).toHaveClass("sm:flex-row");
});
```

**Acceptance**: Desktop layout uses horizontal row

---

## 8. Integration Tests (5 tests)

### Test 8.1: Timeline and Type Filters Combine Correctly
**Priority**: 🔴 **HIGH**

```typescript
it("timeline and type filters work together with AND logic", () => {
  render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={["power"]}
      dateRange={{
        start: new Date(2025, 0, 1),
        end: new Date(2025, 0, 15)
      }}
    />
  );

  // Both filters should be active
  const powerCheckbox = screen.getByRole("checkbox", { name: /Power/i });
  expect(powerCheckbox).toBeChecked();

  const last7DaysButton = screen.getByText("Last 7 days"); // Assuming it matches
  // Should have active styling (implementation dependent)

  // Badge should show 2
  expect(screen.getByText("2")).toBeInTheDocument();
});
```

**Acceptance**: Filters combine with AND logic

---

### Test 8.2: Parent Receives Correct State on Timeline Change
**Priority**: 🔴 **HIGH**

```typescript
it("parent component receives correct date range when timeline clicked", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const last30DaysButton = screen.getByText("Last 30 days");
  fireEvent.click(last30DaysButton);

  expect(mockSetDateRange).toHaveBeenCalledTimes(1);

  const call = mockSetDateRange.mock.calls[0][0];
  expect(call).toHaveProperty("start");
  expect(call).toHaveProperty("end");
  expect(call.start).toBeInstanceOf(Date);
  expect(call.end).toBeInstanceOf(Date);
});
```

**Acceptance**: Parent state updates correctly

---

### Test 8.3: Parent Receives Correct Array on Type Change
**Priority**: 🔴 **HIGH**

```typescript
it("parent component receives array of selected types", () => {
  render(<EnergyTableFilters {...defaultProps} selectedTypes={[]} />);

  const powerCheckbox = screen.getByRole("checkbox", { name: /Power/i });
  fireEvent.click(powerCheckbox);

  expect(mockSetSelectedTypes).toHaveBeenCalledWith(["power"]);

  // Select gas too
  const gasCheckbox = screen.getByRole("checkbox", { name: /Gas/i });
  fireEvent.click(gasCheckbox);

  expect(mockSetSelectedTypes).toHaveBeenCalledWith(["power", "gas"]);
});
```

**Acceptance**: Parent receives array of selected types

---

### Test 8.4: Reset Triggers Parent State Reset
**Priority**: 🔴 **HIGH**

```typescript
it("reset button triggers parent to clear all state", () => {
  const mockReset = jest.fn();

  render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={["power"]}
      dateRange={{
        start: new Date(2025, 0, 1),
        end: new Date(2025, 0, 15)
      }}
      onReset={mockReset}
    />
  );

  const resetButton = screen.getByRole("button", { name: /reset/i });
  fireEvent.click(resetButton);

  expect(mockReset).toHaveBeenCalledTimes(1);

  // Parent should handle:
  // - setSelectedTypes([])
  // - setDateRange({ start: null, end: null })
});
```

**Acceptance**: Reset callback invoked, parent clears state

---

### Test 8.5: Component Re-renders Correctly When Props Change
**Priority**: 🟡 **MEDIUM**

```typescript
it("component updates correctly when parent changes props", () => {
  const { rerender } = render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={[]}
      dateRange={{ start: null, end: null }}
    />
  );

  // Initially no active filters
  expect(screen.queryByText("1")).not.toBeInTheDocument();

  // Parent updates props
  rerender(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={["power", "gas"]}
      dateRange={{
        start: new Date(2025, 0, 1),
        end: new Date(2025, 0, 15)
      }}
    />
  );

  // Component should reflect new state
  const powerCheckbox = screen.getByRole("checkbox", { name: /Power/i });
  const gasCheckbox = screen.getByRole("checkbox", { name: /Gas/i });
  expect(powerCheckbox).toBeChecked();
  expect(gasCheckbox).toBeChecked();
  expect(screen.getByText("2")).toBeInTheDocument();
});
```

**Acceptance**: Component is fully controlled by props

---

## 9. Edge Case Tests (6 tests)

### Test 9.1: Timeline Calculation on Month Boundary (January 1)
**Priority**: 🟡 **MEDIUM**

```typescript
it("calculates 'This month' correctly on January 1st", () => {
  // Mock current date to January 1
  const mockDate = new Date(2025, 0, 1); // Jan 1, 2025
  jest.spyOn(global, "Date").mockImplementation(() => mockDate);

  render(<EnergyTableFilters {...defaultProps} />);

  const thisMonthButton = screen.getByText("This month");
  fireEvent.click(thisMonthButton);

  const call = mockSetDateRange.mock.calls[0][0];
  const { start, end } = call;

  // Start should be Jan 1
  expect(start.getDate()).toBe(1);
  expect(start.getMonth()).toBe(0); // January

  // End should also be Jan 1 (today)
  expect(end.getDate()).toBe(1);
  expect(end.getMonth()).toBe(0);
});
```

**Acceptance**: Edge case date calculations correct

---

### Test 9.2: Timeline Calculation Spanning Year Boundary
**Priority**: 🟡 **MEDIUM**

```typescript
it("calculates 'Last 30 days' correctly when spanning year boundary", () => {
  // Mock current date to January 15
  const mockDate = new Date(2025, 0, 15); // Jan 15, 2025
  jest.spyOn(global, "Date").mockImplementation(() => mockDate);

  render(<EnergyTableFilters {...defaultProps} />);

  const last30DaysButton = screen.getByText("Last 30 days");
  fireEvent.click(last30DaysButton);

  const call = mockSetDateRange.mock.calls[0][0];
  const { start, end } = call;

  // Start should be Dec 17, 2024
  expect(start.getFullYear()).toBe(2024);
  expect(start.getMonth()).toBe(11); // December
  expect(start.getDate()).toBe(17);

  // End should be Jan 15, 2025
  expect(end.getFullYear()).toBe(2025);
  expect(end.getMonth()).toBe(0); // January
  expect(end.getDate()).toBe(15);
});
```

**Acceptance**: Cross-year calculations correct

---

### Test 9.3: No Types Selected Shows All Data
**Priority**: 🔴 **HIGH**

```typescript
it("empty type selection is treated as 'show all' in parent logic", () => {
  // This test verifies the expected behavior documented in requirements
  render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={[]}
      dateRange={{ start: null, end: null }}
    />
  );

  // All checkboxes unchecked
  const powerCheckbox = screen.getByRole("checkbox", { name: /Power/i });
  const gasCheckbox = screen.getByRole("checkbox", { name: /Gas/i });

  expect(powerCheckbox).not.toBeChecked();
  expect(gasCheckbox).not.toBeChecked();

  // Parent component should interpret [] as "show all"
  // This is documented behavior but tested in parent component
});
```

**Acceptance**: Empty array behavior documented and verified

---

### Test 9.4: Rapid Timeline Button Clicks Don't Cause Issues
**Priority**: 🟢 **LOW**

```typescript
it("handles rapid timeline button clicks gracefully", () => {
  render(<EnergyTableFilters {...defaultProps} />);

  const last7DaysButton = screen.getByText("Last 7 days");
  const last30DaysButton = screen.getByText("Last 30 days");

  // Rapid clicks
  fireEvent.click(last7DaysButton);
  fireEvent.click(last30DaysButton);
  fireEvent.click(last7DaysButton);

  // Should have been called 3 times
  expect(mockSetDateRange).toHaveBeenCalledTimes(3);

  // Last call should be for "Last 7 days"
  const lastCall = mockSetDateRange.mock.calls[2][0];
  const dayDiff = Math.floor((lastCall.end - lastCall.start) / (1000 * 60 * 60 * 24));
  expect(dayDiff).toBe(6); // 7 days inclusive
});
```

**Acceptance**: No race conditions or errors

---

### Test 9.5: Reset with No Active Filters Doesn't Error
**Priority**: 🟢 **LOW**

```typescript
it("reset button works even when no filters active", () => {
  render(
    <EnergyTableFilters
      {...defaultProps}
      selectedTypes={[]}
      dateRange={{ start: null, end: null }}
    />
  );

  const resetButton = screen.getByRole("button", { name: /reset/i });

  // Should not throw error
  expect(() => {
    fireEvent.click(resetButton);
  }).not.toThrow();

  expect(mockOnReset).toHaveBeenCalledTimes(1);
});
```

**Acceptance**: Reset always safe to call

---

### Test 9.6: Timeline Scroll Position Preserved on Checkbox Toggle
**Priority**: 🟢 **LOW** (Manual Test Recommended)

```typescript
it("timeline scroll position preserved when toggling checkbox", () => {
  const { container } = render(<EnergyTableFilters {...defaultProps} />);

  const scrollContainer = container.querySelector(".overflow-x-auto");

  // Scroll timeline container
  if (scrollContainer) {
    scrollContainer.scrollLeft = 100;
  }

  const powerCheckbox = screen.getByRole("checkbox", { name: /Power/i });
  fireEvent.click(powerCheckbox);

  // Scroll position should not reset
  expect(scrollContainer?.scrollLeft).toBe(100);
});
```

**Acceptance**: No unwanted scroll resets

---

## Test Execution & Coverage

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- EnergyTableFilters.test.tsx

# Run tests with coverage
npm test -- --coverage --collectCoverageFrom=src/app/components/energy/EnergyTableFilters.tsx

# Run tests in watch mode
npm test -- --watch

# Run tests matching pattern
npm test -- --testNamePattern="Timeline"
```

### Coverage Targets

| Metric      | Target | Expected |
|-------------|--------|----------|
| Statements  | 100%   | 100%     |
| Branches    | 100%   | 100%     |
| Functions   | 100%   | 100%     |
| Lines       | 100%   | 100%     |

### Test Count Summary

| Category                | Test Count |
|-------------------------|------------|
| Rendering               | 8          |
| Timeline Presets        | 10         |
| Multi-Select Checkboxes | 8          |
| Active Filter Badge     | 10         |
| Reset Functionality     | 5          |
| Accessibility           | 6          |
| Responsive Layout       | 4          |
| Integration             | 5          |
| Edge Cases              | 6          |
| **TOTAL**               | **62**     |

**Increase from V1**: 27 tests → 62 tests (+130%)

---

## Mock Setup (Updated for V2)

```typescript
// Mock functions
const mockSetSelectedTypes = jest.fn();  // NEW: Array instead of single value
const mockSetDateRange = jest.fn();       // Unchanged
const mockOnReset = jest.fn();            // Unchanged

// Default props (V2)
const defaultProps = {
  selectedTypes: [] as EnergyOptions[],   // NEW: Array
  setSelectedTypes: mockSetSelectedTypes, // NEW: Setter for array
  dateRange: { start: null, end: null },  // Unchanged
  setDateRange: mockSetDateRange,         // Unchanged
  onReset: mockOnReset,                   // Unchanged
};

beforeEach(() => {
  jest.clearAllMocks();
});
```

---

## Manual Testing Checklist

### Mobile Testing (Real Devices)
- [ ] iPhone SE (375px) - Timeline horizontal scroll works
- [ ] iPhone 12/13 (390px) - Checkboxes tap easily
- [ ] iPhone Pro Max (428px) - Layout doesn't break
- [ ] Android small (360px) - All elements visible
- [ ] Android medium (412px) - Touch targets adequate
- [ ] Tablet (768px) - Responsive breakpoint works

### Desktop Testing (Browsers)
- [ ] Chrome - Timeline wraps correctly
- [ ] Safari - All interactions work
- [ ] Firefox - Styling consistent
- [ ] Edge - No layout issues

### Accessibility Testing
- [ ] Keyboard navigation - Tab through all elements
- [ ] Screen reader (NVDA/VoiceOver) - All elements announced
- [ ] High contrast mode - Elements visible
- [ ] Zoom to 200% - No overflow or broken layout

### Performance Testing
- [ ] React DevTools Profiler - Render < 50ms
- [ ] Large dataset (1000+ readings) - No lag
- [ ] Rapid filter changes - No stuttering

---

## Known Test Limitations

### Limitations
1. **Timeline Date Calculations**: Tests use mocked dates; real-world DST edge cases may not be covered
2. **Horizontal Scroll**: JSDOM doesn't fully simulate scroll behavior; manual testing required
3. **Visual Styles**: Tests verify classes but not actual computed styles
4. **Touch Interactions**: Tests use click events; real touch gestures not simulated

### Acceptable Trade-offs
- Timeline preset library logic well-tested by native Date methods
- Scroll behavior tested manually on real devices
- Visual regression testing separate from unit tests
- Touch gestures work if click events work (React synthetic events)

---

## Test Maintenance

### When to Update Tests

1. **Add New Timeline Preset**:
   - Update `Test 1.2` (preset order)
   - Add date calculation test (new Test 2.X)
   - Update badge count tests if logic changes

2. **Add New Energy Type**:
   - Update `Test 1.3` (checkbox rendering)
   - Add checkbox toggle test (new Test 3.X)
   - Update integration tests

3. **Change Badge Logic**:
   - Update all badge tests (Section 4)
   - Verify integration tests

4. **Change Reset Behavior**:
   - Update reset tests (Section 5)
   - Verify integration tests

### Test Quality Standards
- ✅ Tests focus on user-visible behavior
- ✅ Use React Testing Library queries (role, label, text)
- ✅ Avoid testing implementation details
- ✅ Clear test descriptions
- ✅ No brittle selectors (use semantic queries)

---

## Appendices

### A. Test Utilities

```typescript
// Custom render with common props
function renderFilters(overrideProps = {}) {
  return render(
    <EnergyTableFilters {...defaultProps} {...overrideProps} />
  );
}

// Helper: Get timeline button by label
function getTimelineButton(label: string) {
  return screen.getByRole("button", { name: new RegExp(label, "i") });
}

// Helper: Get checkbox by type
function getTypeCheckbox(type: "Power" | "Gas") {
  return screen.getByRole("checkbox", { name: new RegExp(type, "i") });
}

// Helper: Calculate expected date range
function calculateExpectedRange(preset: string) {
  const end = new Date();
  let start = new Date();

  switch(preset) {
    case "Last 7 days":
      start.setDate(end.getDate() - 6);
      break;
    case "Last 30 days":
      start.setDate(end.getDate() - 29);
      break;
    // ... more cases
  }

  return { start, end };
}
```

### B. Mock Timeline Presets Configuration

For testing purposes, use the actual configuration from `timelinePresets.ts`:

```typescript
import { TIMELINE_PRESETS } from "@/app/constants/timelinePresets";

// Use in tests
TIMELINE_PRESETS.forEach(preset => {
  it(`'${preset.label}' calculates correct date range`, () => {
    // Test each preset
  });
});
```

### C. Related Test Files

- **Component Tests**: `/src/app/components/energy/__tests__/EnergyTableFilters.test.tsx`
- **Parent Component**: `/src/app/readings/__tests__/page.test.tsx` (if exists)
- **Shared Components**: `/src/app/components/shared/__tests__/` (if ButtonGroupCheckbox created)

---

## Revision History

| Version | Date       | Author      | Changes                                          |
|---------|------------|-------------|--------------------------------------------------|
| 2.0     | 2025-11-04 | Claude (QA) | Complete rewrite for V2 redesign                 |
|         |            |             | - Timeline preset tests (10 tests)               |
|         |            |             | - Multi-select checkbox tests (8 tests)          |
|         |            |             | - Updated badge logic tests (10 tests)           |
|         |            |             | - Integration and edge case tests (11 tests)     |
|         |            |             | - Total: 62 tests (up from 27)                   |
| 1.0     | 2025-11-04 | Claude (QA) | Initial test scenarios (V1) - See test-scenarios.md |

---

## Conclusion

**Status**: ✅ **TEST SCENARIOS DEFINED - READY FOR IMPLEMENTATION**

This document defines a comprehensive test suite for the V2 filter redesign:

- **62 test scenarios** (130% increase from V1)
- **100% coverage target** for all new functionality
- **9 test categories** covering all aspects of the redesign
- **Clear acceptance criteria** for each test
- **Mock setup and utilities** provided

**Test Strategy**:
- ✅ **Test-First Development**: Write tests before implementation
- ✅ **Behavior-Driven**: Test user-visible behavior, not internals
- ✅ **Comprehensive Coverage**: Unit, integration, accessibility, and edge cases
- ✅ **Maintainable**: Clear structure and documentation

**Next Steps**:
1. Review test scenarios with developer
2. Implement timeline preset functionality
3. Write corresponding tests (TDD approach)
4. Implement multi-select checkboxes
5. Write corresponding tests
6. Achieve 100% coverage
7. Manual QA on real devices

**Estimated Testing Time**: 4-6 hours (test writing + debugging)

---

**Document Status**: ✅ **COMPLETE**
