# Monthly Charts View - Analysis Summary

## Executive Summary

I've completed a comprehensive analysis of the current charts implementation and created detailed requirements for the new monthly view feature. This document summarizes the findings and provides links to the complete documentation.

---

## Current State Analysis

### What Currently Works

**Location**: `/src/app/charts/page.tsx` with `UnifiedEnergyChart` component

The current implementation has:
- ✅ Three view modes: Measurements, Monthly, and Yearly
- ✅ Type filtering (Power/Gas/All)
- ✅ Date range filtering via timeline slider
- ✅ Year navigation with prev/next buttons and dropdown
- ✅ Mobile-responsive design with touch controls
- ✅ Chart.js line charts with tooltips
- ✅ Cost calculations with interpolation/extrapolation

### What Doesn't Work (Issues Identified)

**Problem 1: Unclear Data Representation**
- Current monthly view shows *consumption* (differences between readings)
- User wants to see *actual meter readings* at end of each month
- No clear distinction between actual measurements and calculated values

**Problem 2: Complex Architecture**
- `UnifiedEnergyChart` handles three different view modes in one component
- Violates Single Responsibility Principle
- Complex conditional rendering logic
- Monthly and yearly views mixed with measurements view

**Problem 3: Data Calculation Issues**
- `calculateConsumptionBetweenPeriods()` uses complex fallback logic
- Hard to predict which readings are used
- No clear indication of data quality (actual vs interpolated)

**Problem 4: Mixed Power and Gas Display**
- Single chart shows both Power and Gas
- Shared Y-axis makes comparison difficult when scales differ
- User wants separate charts for better clarity

---

## Proposed Solution

### High-Level Approach

**New Monthly View Features**:
1. Display **end-of-month meter readings** (not consumption)
2. Show **actual measurements** when data exists
3. Calculate and mark **interpolated values** when data is missing
4. Provide **separate charts** for Power and Gas
5. Include **year navigation** to view historical data
6. Use **visual indicators** (solid vs dashed lines) to distinguish data quality

### Architecture Changes

**New Service**: `MonthlyDataAggregationService`
- Pure functions for calculating end-of-month values
- Handles actual reading detection (±3 day tolerance)
- Performs linear interpolation when needed
- Returns structured data with quality indicators

**New Component**: `MonthlyMeterReadingsChart`
- Focused responsibility: render monthly meter readings only
- Separate from measurements and yearly views
- Two independent Chart.js line charts (Power and Gas)
- Year navigation UI
- Mobile-first responsive design

**Integration**: Update `/charts` page to use new component

---

## Key Requirements Summary

### Functional Requirements (Top 5)

1. **FR-001: Monthly View Focus**
   - Display 12 data points (Jan-Dec) showing end-of-month meter readings
   - Separate charts for Power and Gas
   - Clear month labels on X-axis

2. **FR-002: End-of-Month Value Calculation**
   - Use actual measurement if within ±3 days of month end
   - Calculate interpolated value if no measurement exists
   - Show null/gap if insufficient data for interpolation

3. **FR-003: Visual Data Quality Indicators**
   - Solid lines + filled markers = Actual data
   - Dashed lines + hollow markers = Interpolated data
   - Legend explains distinction
   - Tooltip shows "(Actual)" or "(Interpolated)"

4. **FR-004: Year Navigation**
   - Prev/Next buttons with dropdown
   - Shows all available years from data
   - Default to most recent year

5. **FR-005: Separate Power and Gas Charts**
   - Vertically stacked charts
   - Independent Y-axis scales
   - Shared X-axis for alignment
   - Consistent styling

### Non-Functional Requirements

- **Performance**: Chart render < 500ms, year navigation < 200ms
- **Code Quality**: 100% service test coverage, >80% component coverage
- **Accessibility**: WCAG 2.1 AA compliant, keyboard navigation
- **Mobile-First**: Touch targets ≥ 44x44px, responsive breakpoints

---

## Technical Approach

### Data Flow

```
User → ChartsPage → MonthlyMeterReadingsChart → MonthlyDataAggregationService
                                                          ↓
                                            [12 MonthlyDataPoints per type]
                                                          ↓
                                                    Chart.js Line Charts
```

### End-of-Month Calculation Logic

For each month (Jan-Dec):
1. Get month end date (last moment of month)
2. Search for reading within ±3 days
   - **Found?** → Use as actual reading
   - **Not found?** → Search for readings before and after month end
     - **Both exist?** → Interpolate: `value = prev + (next - prev) * ratio`
     - **Missing neighbor(s)?** → Return null (gap in chart)
3. Mark data point with quality flag (actual vs interpolated)

### Interpolation Formula

```typescript
// Linear interpolation between two readings
const timeDiff = nextDate - prevDate;
const targetDiff = targetDate - prevDate;
const ratio = targetDiff / timeDiff;
const interpolatedValue = prevAmount + (nextAmount - prevAmount) * ratio;
```

---

## Implementation Plan

### Phase 1: Service Layer (Test-First)
**Time**: 3-4 hours

1. Write service tests (`MonthlyDataAggregationService.test.ts`)
2. Implement service functions:
   - `getMonthEndDate()`
   - `findNearestReading()`
   - `interpolateValue()`
   - `calculateMonthlyReadings()`
3. Achieve 100% test coverage

### Phase 2: Component Layer (Test-First)
**Time**: 4-5 hours

1. Write component tests (`MonthlyMeterReadingsChart.test.tsx`)
2. Implement component:
   - Year navigation UI
   - Chart rendering (Power and Gas)
   - Data transformation for Chart.js
   - Empty states and error handling
3. Achieve >80% test coverage

### Phase 3: Integration
**Time**: 1-2 hours

1. Update `/charts` page to use new component
2. Test full page flow
3. Verify no regressions

### Phase 4: Polish & Testing
**Time**: 1-2 hours

1. Mobile responsiveness testing
2. Accessibility verification
3. Documentation updates
4. Final QA

**Total Estimated Time**: 8-12 hours

---

## Edge Cases Handled

1. **Leap Years**: Feb 29 vs Feb 28 correctly handled
2. **Sparse Data**: Only one or two readings per year
3. **Multiple Readings on Month End**: Uses closest to end of day
4. **Future Months**: Shows gaps (no extrapolation)
5. **Invalid Data**: Skips null/negative/non-numeric readings
6. **No Data for Year**: Shows empty state with helpful message
7. **Large Datasets**: Performance optimized for 10,000+ readings

---

## Deliverables Created

### 📄 Requirements Document
**File**: `/feature-dev/monthly-charts-redesign/requirements.md`

Comprehensive 50+ page specification covering:
- Current state analysis with screenshots references
- Platform requirements (mobile-first approach)
- 10 detailed functional requirements
- 4 non-functional requirements
- Technical specifications
- Data models and API contracts
- SOLID principles application
- Testing strategy
- Edge cases and error handling
- 5 open questions for decision
- Success metrics

### 📋 Test Scenarios Document
**File**: `/feature-dev/monthly-charts-redesign/test-scenarios.md`

Complete test plan with 60+ test scenarios:
- Unit tests for service functions (calculateMonthlyReadings, interpolation, etc.)
- Component tests (rendering, year navigation, mobile responsiveness)
- Integration tests (full page flow)
- Edge case tests (leap years, sparse data, boundaries)
- Visual regression tests
- Error handling tests
- User acceptance tests

### 🛠️ Implementation Guide
**File**: `/feature-dev/monthly-charts-redesign/IMPLEMENTATION_GUIDE.md`

Step-by-step guide for implementation agent:
- Phase-by-phase implementation plan
- Code templates for service and component
- Testing checklist
- Common pitfalls to avoid
- Performance optimization tips
- Debugging guidance

---

## Key Decisions Documented

### Decision 1: Tolerance Threshold
**Choice**: ±3 days from month end
**Rationale**: Balance between accuracy and flexibility; most users read meters weekly

### Decision 2: Interpolation Method
**Choice**: Linear interpolation
**Rationale**: Simple, fast, sufficient for energy data; can be enhanced later with weighted methods

### Decision 3: Missing Data Handling
**Choice**: Show null/gap in chart (no extrapolation)
**Rationale**: Safer than making assumptions; users understand gaps intuitively

### Decision 4: Separate Charts
**Choice**: Two vertically stacked charts (Power and Gas)
**Rationale**: Independent Y-axis scales allow better readability; user requested

### Decision 5: Component Separation
**Choice**: Extract monthly view to new component
**Rationale**: Cleaner architecture, easier maintenance, follows SRP

---

## Open Questions for User/Stakeholders

### Q1: Extrapolation for Missing Data
When there's only data before OR after a month end (not both), should we:
- **A)** Show null (gap in chart) - safer, no assumptions ✅ **Recommended**
- **B)** Extrapolate from nearby readings - provides estimate but may be inaccurate
- **C)** Make it a user preference

### Q2: Month End Tolerance Configuration
Should the 3-day tolerance be:
- **A)** Hardcoded constant (simple, consistent) ✅ **Recommended for MVP**
- **B)** User preference in settings (flexible but more complex)
- **C)** Adaptive based on data density (smart but complex)

### Q3: Integration Approach
Should the monthly view:
- **A)** Replace current monthly view in UnifiedEnergyChart ✅ **Recommended**
- **B)** Coexist as separate route (e.g., `/charts/monthly`)
- **C)** Be toggleable between old and new view

### Q4: Chart Interaction
Should users be able to:
- **A)** View-only (current implementation) ✅ **Recommended for MVP**
- **B)** Click data points to see full reading details
- **C)** Click to navigate to readings page with filters applied

### Q5: Cost Display
Should monthly view show:
- **A)** Only meter readings (focus on what user requested) ✅ **Recommended**
- **B)** Meter readings + consumption calculated
- **C)** Meter readings + cost calculated

---

## Success Metrics

**User Experience**:
- ✅ Monthly view clearly shows end-of-month meter states
- ✅ Users can distinguish actual vs interpolated data at a glance
- ✅ Year navigation is intuitive and responsive
- ✅ Charts are readable on mobile and desktop

**Technical Quality**:
- ✅ All tests pass with required coverage (100% service, >80% component)
- ✅ No performance regressions (<500ms render time)
- ✅ Code follows project patterns (SOLID, clean code)
- ✅ WCAG 2.1 AA accessibility compliance

**Functionality**:
- ✅ Accurately calculates end-of-month readings
- ✅ Correctly identifies actual vs interpolated data
- ✅ Handles all edge cases gracefully
- ✅ Works across all supported browsers and devices

---

## Next Steps

### Immediate Actions

1. **Review Documentation**: Read through requirements.md for full details
2. **Answer Open Questions**: Resolve Q1-Q5 above
3. **Approve Requirements**: Confirm specifications meet expectations

### Implementation Sequence

1. **Phase 1**: Implement and test `MonthlyDataAggregationService`
2. **Phase 2**: Build and test `MonthlyMeterReadingsChart` component
3. **Phase 3**: Integrate with `/charts` page
4. **Phase 4**: Polish, accessibility, and final QA

### Post-Implementation

1. **User Testing**: Validate with real user data
2. **Feedback Collection**: Gather user input on interpolation accuracy
3. **Iteration**: Refine based on feedback
4. **Documentation Update**: Update user guide and technical docs

---

## Files in This Feature Directory

```
feature-dev/monthly-charts-redesign/
├── requirements.md           ← Full technical specification (PRIMARY DOC)
├── test-scenarios.md         ← Comprehensive test plan
├── IMPLEMENTATION_GUIDE.md   ← Step-by-step implementation guide
└── ANALYSIS_SUMMARY.md       ← This file (executive overview)
```

---

## Questions or Concerns?

**For detailed technical specs**: See `requirements.md`
**For test expectations**: See `test-scenarios.md`
**For implementation steps**: See `IMPLEMENTATION_GUIDE.md`

**Need clarification?** The requirements analyst agent (me!) is available to:
- Answer questions about specifications
- Clarify edge cases
- Refine requirements based on feedback
- Create additional documentation as needed

---

**Analysis Complete**: ✅
**Documentation Status**: Ready for Implementation
**Next Agent**: Implementation Agent (Developer)

---

**Document Version**: 1.0
**Date**: 2025-11-06
**Analyst**: Claude (Requirements Analyst Agent)
**Status**: ✅ Complete - Ready for Review & Implementation
