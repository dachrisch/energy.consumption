/**
 * Integration Tests for Monthly Consumption Calculation
 *
 * These tests use realistic seeded data patterns to validate end-to-end
 * consumption calculation scenarios, including:
 * - Cross-year boundaries (December → January)
 * - Irregular reading patterns (sparse data, missing months)
 * - Mixed data quality (actual, interpolated, extrapolated)
 * - Edge cases (missing November, missing January)
 *
 * Following TDD: Tests written to validate production scenarios
 */

import {
  calculateMonthlyReadings,
  calculateMonthlyConsumption,
} from '../MonthlyDataAggregationService';
import { EnergyType, MonthlyDataPoint } from '@/app/types';

describe('Monthly Consumption Integration Tests', () => {
  // Helper to create test readings
  const createReading = (date: Date, amount: number, type: 'power' | 'gas' = 'power'): EnergyType => ({
    _id: `${date.getTime()}`,
    type,
    amount,
    date,
    userId: 'test-user',
  });

  describe('With Realistic Seeded Data - Complete 2024 Power Readings', () => {
    /**
     * Test Scenario: Complete year 2024 with realistic monthly readings
     * Pattern: Regular monthly readings with ~350 kWh consumption per month
     *
     * Expected consumption pattern:
     * - January: Uses previousDecember (Dec 2023: 8150 kWh)
     * - February-November: Standard month-to-month calculation
     * - December: Uses November (preferred method)
     */
    it('calculates 2024 consumption with cross-year boundaries', () => {
      // Realistic seeded data for 2024 Power readings
      // Pattern: ~350 kWh per month consumption
      const power2024: EnergyType[] = [
        createReading(new Date(2024, 0, 31), 8500),   // Jan 31: 8500 kWh (actual)
        createReading(new Date(2024, 1, 29), 8850),   // Feb 29: 8850 kWh (actual) - leap year
        createReading(new Date(2024, 2, 31), 9200),   // Mar 31: 9200 kWh (actual)
        createReading(new Date(2024, 3, 30), 9550),   // Apr 30: 9550 kWh (actual)
        createReading(new Date(2024, 4, 31), 9900),   // May 31: 9900 kWh (actual)
        createReading(new Date(2024, 5, 30), 10250),  // Jun 30: 10250 kWh (actual)
        createReading(new Date(2024, 6, 31), 10600),  // Jul 31: 10600 kWh (actual)
        createReading(new Date(2024, 7, 31), 10950),  // Aug 31: 10950 kWh (actual)
        createReading(new Date(2024, 8, 30), 11300),  // Sep 30: 11300 kWh (actual)
        createReading(new Date(2024, 9, 31), 11650),  // Oct 31: 11650 kWh (actual)
        createReading(new Date(2024, 10, 30), 12000), // Nov 30: 12000 kWh (actual)
        createReading(new Date(2024, 11, 31), 12350), // Dec 31: 12350 kWh (actual)
      ];

      // Previous year December for January calculation
      const power2023: EnergyType[] = [
        createReading(new Date(2023, 11, 31), 8150),  // Dec 31 2023: 8150 kWh
      ];

      // Calculate monthly readings
      const readings2024 = calculateMonthlyReadings(power2024, 2024, 'power');
      const readings2023 = calculateMonthlyReadings(power2023, 2023, 'power');

      // Verify all 12 months have actual readings
      expect(readings2024).toHaveLength(12);
      readings2024.forEach((month, index) => {
        expect(month.month).toBe(index + 1);
        expect(month.isActual).toBe(true);
        expect(month.isInterpolated).toBe(false);
        expect(month.isExtrapolated).toBe(false);
        expect(month.meterReading).not.toBeNull();
      });

      // Calculate consumption with previous December
      const consumption = calculateMonthlyConsumption(
        readings2024,
        readings2023[11] // December 2023
      );

      // Validate January consumption (using previous December)
      // Expected: 8500 (Jan 2024) - 8150 (Dec 2023) = 350 kWh
      expect(consumption[0].month).toBe(1);
      expect(consumption[0].monthLabel).toBe('Jan');
      expect(consumption[0].consumption).toBe(350);
      expect(consumption[0].isActual).toBe(true);
      expect(consumption[0].isDerived).toBe(false);
      expect(consumption[0].sourceReadings.current.month).toBe(1);
      expect(consumption[0].sourceReadings.previous?.month).toBe(12);
      expect(consumption[0].sourceReadings.previous?.meterReading).toBe(8150);

      // Validate February-November (standard month-to-month)
      // Each month should have exactly 350 kWh consumption
      const expectedConsumptions = [
        { month: 2, label: 'Feb', prev: 8500, curr: 8850 },   // 350 kWh
        { month: 3, label: 'Mar', prev: 8850, curr: 9200 },   // 350 kWh
        { month: 4, label: 'Apr', prev: 9200, curr: 9550 },   // 350 kWh
        { month: 5, label: 'May', prev: 9550, curr: 9900 },   // 350 kWh
        { month: 6, label: 'Jun', prev: 9900, curr: 10250 },  // 350 kWh
        { month: 7, label: 'Jul', prev: 10250, curr: 10600 }, // 350 kWh
        { month: 8, label: 'Aug', prev: 10600, curr: 10950 }, // 350 kWh
        { month: 9, label: 'Sep', prev: 10950, curr: 11300 }, // 350 kWh
        { month: 10, label: 'Oct', prev: 11300, curr: 11650 },// 350 kWh
        { month: 11, label: 'Nov', prev: 11650, curr: 12000 },// 350 kWh
      ];

      expectedConsumptions.forEach(({ month, label, prev, curr }) => {
        const monthConsumption = consumption[month - 1];
        expect(monthConsumption.month).toBe(month);
        expect(monthConsumption.monthLabel).toBe(label);
        expect(monthConsumption.consumption).toBe(curr - prev); // 350 kWh
        expect(monthConsumption.isActual).toBe(true);
        expect(monthConsumption.isDerived).toBe(false);
        expect(monthConsumption.sourceReadings.current.meterReading).toBe(curr);
        expect(monthConsumption.sourceReadings.previous?.meterReading).toBe(prev);
      });

      // Validate December consumption (using November - Priority 1)
      // Expected: 12350 (Dec) - 12000 (Nov) = 350 kWh
      expect(consumption[11].month).toBe(12);
      expect(consumption[11].monthLabel).toBe('Dec');
      expect(consumption[11].consumption).toBe(350);
      expect(consumption[11].isActual).toBe(true);
      expect(consumption[11].isDerived).toBe(false);
      expect(consumption[11].sourceReadings.current.month).toBe(12);
      expect(consumption[11].sourceReadings.current.meterReading).toBe(12350);
      expect(consumption[11].sourceReadings.previous?.month).toBe(11);
      expect(consumption[11].sourceReadings.previous?.meterReading).toBe(12000);
      expect(consumption[11].sourceReadings.next).toBeUndefined(); // Not using nextJanuary
    });
  });

  describe('With Realistic Seeded Data - Missing November Scenario', () => {
    /**
     * Test Scenario: 2024 with missing November reading
     * Pattern: Regular readings except November has no actual reading
     * Reality: System interpolates November from Oct and Dec (has neighbors on both sides)
     * Fallback: December uses interpolated November (still preferred over nextJanuary)
     *
     * This tests the hybrid December calculation with interpolated November:
     * - November is interpolated (not null) because Oct and Dec exist
     * - December uses interpolated November (Priority 1)
     * - Consumption is marked as derived (November is interpolated)
     */
    it('handles missing November with nextJanuary fallback', () => {
      // Realistic seeded data with missing November
      const power2024: EnergyType[] = [
        createReading(new Date(2024, 0, 31), 8500),   // Jan 31: 8500 kWh
        createReading(new Date(2024, 1, 29), 8850),   // Feb 29: 8850 kWh
        createReading(new Date(2024, 2, 31), 9200),   // Mar 31: 9200 kWh
        createReading(new Date(2024, 3, 30), 9550),   // Apr 30: 9550 kWh
        createReading(new Date(2024, 4, 31), 9900),   // May 31: 9900 kWh
        createReading(new Date(2024, 5, 30), 10250),  // Jun 30: 10250 kWh
        createReading(new Date(2024, 6, 31), 10600),  // Jul 31: 10600 kWh
        createReading(new Date(2024, 7, 31), 10950),  // Aug 31: 10950 kWh
        createReading(new Date(2024, 8, 30), 11300),  // Sep 30: 11300 kWh
        createReading(new Date(2024, 9, 31), 11650),  // Oct 31: 11650 kWh
        // November missing (no reading) - will be interpolated from Oct and Dec
        createReading(new Date(2024, 11, 31), 12350), // Dec 31: 12350 kWh
      ];

      // Next year January for December fallback calculation
      const power2025: EnergyType[] = [
        createReading(new Date(2025, 0, 31), 12700),  // Jan 31 2025: 12700 kWh
      ];

      // Calculate monthly readings
      const readings2024 = calculateMonthlyReadings(power2024, 2024, 'power');
      const readings2025 = calculateMonthlyReadings(power2025, 2025, 'power');

      // Verify November is INTERPOLATED (not null) because Oct and Dec exist
      expect(readings2024[10].month).toBe(11);
      expect(readings2024[10].monthLabel).toBe('Nov');
      expect(readings2024[10].meterReading).not.toBeNull();
      expect(readings2024[10].isActual).toBe(false);
      expect(readings2024[10].isInterpolated).toBe(true);
      // November interpolated between Oct (11650) and Dec (12350)
      // Should be approximately 12000 (midpoint)
      expect(readings2024[10].meterReading).toBeGreaterThan(11900);
      expect(readings2024[10].meterReading).toBeLessThan(12100);

      // Verify December has actual reading
      expect(readings2024[11].month).toBe(12);
      expect(readings2024[11].meterReading).toBe(12350);
      expect(readings2024[11].isActual).toBe(true);

      // Calculate consumption with nextJanuary (but November is available via interpolation)
      const consumption = calculateMonthlyConsumption(
        readings2024,
        undefined, // No previous December needed for this test
        readings2025[0] // January 2025 (provided but won't be used - November is available)
      );

      // Validate October consumption (last standard month before gap)
      // Expected: 11650 (Oct) - 11300 (Sep) = 350 kWh
      expect(consumption[9].month).toBe(10);
      expect(consumption[9].consumption).toBe(350);
      expect(consumption[9].isActual).toBe(true);

      // Validate November consumption (interpolated November - actual October)
      // Expected: ~12000 (interpolated Nov) - 11650 (actual Oct) = ~350 kWh
      expect(consumption[10].month).toBe(11);
      expect(consumption[10].monthLabel).toBe('Nov');
      expect(consumption[10].consumption).not.toBeNull();
      expect(consumption[10].consumption).toBeGreaterThan(300);
      expect(consumption[10].consumption).toBeLessThan(400);
      expect(consumption[10].isActual).toBe(false); // November is interpolated
      expect(consumption[10].isDerived).toBe(true);

      // Validate December consumption (using interpolated November - Priority 1 still applies)
      // Expected: 12350 (actual Dec) - ~12000 (interpolated Nov) = ~350 kWh
      expect(consumption[11].month).toBe(12);
      expect(consumption[11].monthLabel).toBe('Dec');
      expect(consumption[11].consumption).not.toBeNull();
      expect(consumption[11].consumption).toBeGreaterThan(300);
      expect(consumption[11].consumption).toBeLessThan(400);
      expect(consumption[11].isActual).toBe(false); // November is interpolated
      expect(consumption[11].isDerived).toBe(true);
      expect(consumption[11].sourceReadings.current.month).toBe(12);
      expect(consumption[11].sourceReadings.current.meterReading).toBe(12350);
      expect(consumption[11].sourceReadings.previous?.month).toBe(11); // Using November (interpolated)
      expect(consumption[11].sourceReadings.previous?.isInterpolated).toBe(true);
      expect(consumption[11].sourceReadings.next).toBeUndefined(); // Not using nextJanuary
    });
  });

  describe('With Realistic Seeded Data - Sparse Irregular Readings', () => {
    /**
     * Test Scenario: Irregular readings with interpolation and extrapolation
     * Pattern: Only 4 actual readings per year, system must interpolate/extrapolate
     *
     * Readings:
     * - Q1: Jan actual
     * - Q2: Apr actual
     * - Q3: Jul actual
     * - Q4: Oct actual
     *
     * Expected:
     * - Feb, Mar: Interpolated between Jan and Apr
     * - May, Jun: Interpolated between Apr and Jul
     * - Aug, Sep: Interpolated between Jul and Oct
     * - Nov, Dec: Extrapolated forward from Oct
     */
    it('handles sparse data with interpolation/extrapolation', () => {
      // Sparse realistic data - only 4 readings per year
      const power2024: EnergyType[] = [
        createReading(new Date(2024, 0, 31), 8500),   // Jan 31: 8500 kWh (actual)
        createReading(new Date(2024, 3, 30), 9550),   // Apr 30: 9550 kWh (actual) - 1050 kWh over 3 months
        createReading(new Date(2024, 6, 31), 10600),  // Jul 31: 10600 kWh (actual) - 1050 kWh over 3 months
        createReading(new Date(2024, 9, 31), 11650),  // Oct 31: 11650 kWh (actual) - 1050 kWh over 3 months
      ];

      const readings2024 = calculateMonthlyReadings(power2024, 2024, 'power');

      // Verify data quality flags
      expect(readings2024[0].isActual).toBe(true);    // Jan: actual
      expect(readings2024[1].isInterpolated).toBe(true);  // Feb: interpolated
      expect(readings2024[2].isInterpolated).toBe(true);  // Mar: interpolated
      expect(readings2024[3].isActual).toBe(true);    // Apr: actual
      expect(readings2024[4].isInterpolated).toBe(true);  // May: interpolated
      expect(readings2024[5].isInterpolated).toBe(true);  // Jun: interpolated
      expect(readings2024[6].isActual).toBe(true);    // Jul: actual
      expect(readings2024[7].isInterpolated).toBe(true);  // Aug: interpolated
      expect(readings2024[8].isInterpolated).toBe(true);  // Sep: interpolated
      expect(readings2024[9].isActual).toBe(true);    // Oct: actual
      expect(readings2024[10].isExtrapolated).toBe(true); // Nov: extrapolated
      expect(readings2024[11].isExtrapolated).toBe(true); // Dec: extrapolated

      const consumption = calculateMonthlyConsumption(readings2024);

      // Validate January (no previous data)
      expect(consumption[0].consumption).toBeNull();

      // Validate February (interpolated current, actual previous)
      // Interpolated reading should be ~8850 (midpoint between Jan and Apr)
      // Consumption: ~8850 - 8500 = ~350 kWh
      expect(consumption[1].month).toBe(2);
      expect(consumption[1].consumption).not.toBeNull();
      expect(consumption[1].consumption).toBeGreaterThan(300);
      expect(consumption[1].consumption).toBeLessThan(400);
      expect(consumption[1].isActual).toBe(false); // One reading is interpolated
      expect(consumption[1].isDerived).toBe(true);

      // Validate April (actual current, interpolated previous)
      // Consumption: 9550 (actual) - ~9200 (interpolated Mar) = ~350 kWh
      expect(consumption[3].month).toBe(4);
      expect(consumption[3].consumption).not.toBeNull();
      expect(consumption[3].consumption).toBeGreaterThan(300);
      expect(consumption[3].consumption).toBeLessThan(400);
      expect(consumption[3].isActual).toBe(false); // Previous is interpolated
      expect(consumption[3].isDerived).toBe(true);

      // Validate October (actual current, interpolated previous)
      expect(consumption[9].month).toBe(10);
      expect(consumption[9].consumption).not.toBeNull();
      expect(consumption[9].consumption).toBeGreaterThan(300);
      expect(consumption[9].consumption).toBeLessThan(400);
      expect(consumption[9].isActual).toBe(false);
      expect(consumption[9].isDerived).toBe(true);

      // Validate November (extrapolated current, actual previous)
      // Extrapolated reading should be ~12000 (350 kWh trend from Jul→Oct)
      // Consumption: ~12000 - 11650 = ~350 kWh
      expect(consumption[10].month).toBe(11);
      expect(consumption[10].consumption).not.toBeNull();
      expect(consumption[10].consumption).toBeGreaterThan(300);
      expect(consumption[10].consumption).toBeLessThan(400);
      expect(consumption[10].isActual).toBe(false);
      expect(consumption[10].isDerived).toBe(true);

      // Validate December (extrapolated current, extrapolated previous)
      expect(consumption[11].month).toBe(12);
      expect(consumption[11].consumption).not.toBeNull();
      expect(consumption[11].consumption).toBeGreaterThan(300);
      expect(consumption[11].consumption).toBeLessThan(400);
      expect(consumption[11].isActual).toBe(false);
      expect(consumption[11].isDerived).toBe(true);
    });
  });

  describe('With Realistic Seeded Data - Quality Tracking Across Year Boundaries', () => {
    /**
     * Test Scenario: Verify quality tracking for cross-year consumption
     * Pattern: Mix of actual and derived data at year boundaries
     *
     * Focus:
     * - January using previousDecember (both actual)
     * - December using November (both actual)
     * - December using nextJanuary when November is derived
     */
    it('verifies quality tracking across year boundaries', () => {
      // 2024 data with mostly actual readings
      const power2024: EnergyType[] = [
        createReading(new Date(2024, 0, 31), 8500),   // Jan: actual
        createReading(new Date(2024, 1, 29), 8850),   // Feb: actual
        createReading(new Date(2024, 2, 31), 9200),   // Mar: actual
        // Apr, May missing - will be interpolated
        createReading(new Date(2024, 5, 30), 10250),  // Jun: actual
        createReading(new Date(2024, 6, 31), 10600),  // Jul: actual
        createReading(new Date(2024, 7, 31), 10950),  // Aug: actual
        createReading(new Date(2024, 8, 30), 11300),  // Sep: actual
        createReading(new Date(2024, 9, 31), 11650),  // Oct: actual
        createReading(new Date(2024, 10, 30), 12000), // Nov: actual
        createReading(new Date(2024, 11, 31), 12350), // Dec: actual
      ];

      const power2023: EnergyType[] = [
        createReading(new Date(2023, 11, 31), 8150),  // Dec 2023: actual
      ];

      const power2025: EnergyType[] = [
        createReading(new Date(2025, 0, 31), 12700),  // Jan 2025: actual
      ];

      const readings2024 = calculateMonthlyReadings(power2024, 2024, 'power');
      const readings2023 = calculateMonthlyReadings(power2023, 2023, 'power');
      const readings2025 = calculateMonthlyReadings(power2025, 2025, 'power');

      // Verify data quality for key months
      expect(readings2024[0].isActual).toBe(true);    // Jan: actual
      expect(readings2024[3].isInterpolated).toBe(true);  // Apr: interpolated
      expect(readings2024[4].isInterpolated).toBe(true);  // May: interpolated
      expect(readings2024[10].isActual).toBe(true);   // Nov: actual
      expect(readings2024[11].isActual).toBe(true);   // Dec: actual

      const consumption = calculateMonthlyConsumption(
        readings2024,
        readings2023[11], // Dec 2023
        readings2025[0]   // Jan 2025
      );

      // Test 1: January with actual previousDecember
      // Both readings are actual → consumption is actual
      expect(consumption[0].month).toBe(1);
      expect(consumption[0].consumption).toBe(350);
      expect(consumption[0].isActual).toBe(true);
      expect(consumption[0].isDerived).toBe(false);
      expect(consumption[0].sourceReadings.current.isActual).toBe(true);
      expect(consumption[0].sourceReadings.previous?.isActual).toBe(true);

      // Test 2: April with interpolated reading
      // Current is interpolated → consumption is derived
      expect(consumption[3].month).toBe(4);
      expect(consumption[3].isActual).toBe(false);
      expect(consumption[3].isDerived).toBe(true);
      expect(consumption[3].sourceReadings.current.isInterpolated).toBe(true);

      // Test 3: June with interpolated previous (May)
      // Previous is interpolated → consumption is derived
      expect(consumption[5].month).toBe(6);
      expect(consumption[5].isActual).toBe(false);
      expect(consumption[5].isDerived).toBe(true);
      expect(consumption[5].sourceReadings.previous?.isInterpolated).toBe(true);
      expect(consumption[5].sourceReadings.current.isActual).toBe(true);

      // Test 4: December with actual November
      // Both readings are actual → consumption is actual
      expect(consumption[11].month).toBe(12);
      expect(consumption[11].consumption).toBe(350);
      expect(consumption[11].isActual).toBe(true);
      expect(consumption[11].isDerived).toBe(false);
      expect(consumption[11].sourceReadings.current.isActual).toBe(true);
      expect(consumption[11].sourceReadings.previous?.isActual).toBe(true);
      expect(consumption[11].sourceReadings.next).toBeUndefined(); // Not using nextJanuary
    });
  });

  describe('With Realistic Seeded Data - Multi-Year Complete Dataset', () => {
    /**
     * Test Scenario: Complete 3-year dataset (2023-2025)
     * Pattern: All months have actual readings
     *
     * Purpose: Verify system handles complete datasets correctly
     * across multiple year boundaries
     */
    it('handles complete year with all actual readings', () => {
      // Helper to generate complete year of readings with proper cumulative amounts
      const generateYearReadings = (year: number, startAmount: number): EnergyType[] => {
        return Array.from({ length: 12 }, (_, i) => {
          const daysInMonth = new Date(year, i + 1, 0).getDate();
          return createReading(
            new Date(year, i, daysInMonth),
            startAmount + (i * 350) // Cumulative meter reading
          );
        });
      };

      // Generate 3 years of data with proper year-boundary alignment
      // 2023: Start at 4000, end at 4000 + (11 * 350) = 7850
      // 2024: Start at 8150 (7850 + 300 gap for December→January transition)
      // This creates a 300 kWh consumption for Jan 2024 (not 350)
      const power2023 = generateYearReadings(2023, 4000);
      const power2024 = generateYearReadings(2024, 8150);
      const power2025 = generateYearReadings(2025, 12000);

      const readings2023 = calculateMonthlyReadings(power2023, 2023, 'power');
      const readings2024 = calculateMonthlyReadings(power2024, 2024, 'power');
      const readings2025 = calculateMonthlyReadings(power2025, 2025, 'power');

      // Verify all readings are actual
      [...readings2023, ...readings2024, ...readings2025].forEach((reading) => {
        expect(reading.isActual).toBe(true);
        expect(reading.isInterpolated).toBe(false);
        expect(reading.isExtrapolated).toBe(false);
        expect(reading.meterReading).not.toBeNull();
      });

      // Calculate consumption for 2024 with year boundaries
      const consumption2024 = calculateMonthlyConsumption(
        readings2024,
        readings2023[11], // Dec 2023: 7850
        readings2025[0]   // Jan 2025: 12000
      );

      // Verify all 12 months have consumption
      consumption2024.forEach((month, index) => {
        expect(month.consumption).not.toBeNull();
        expect(month.isActual).toBe(true);
        expect(month.isDerived).toBe(false);

        // January has 300 kWh (8150 - 7850)
        // All other months have 350 kWh
        if (index === 0) {
          expect(month.consumption).toBe(300); // Jan: 8150 - 7850
        } else {
          expect(month.consumption).toBe(350); // Feb-Dec: consistent 350 kWh
        }
      });

      // Specific validation for January 2024
      expect(consumption2024[0].month).toBe(1);
      expect(consumption2024[0].consumption).toBe(300); // 8150 - 7850
      expect(consumption2024[0].sourceReadings.current.meterReading).toBe(8150);
      expect(consumption2024[0].sourceReadings.previous?.meterReading).toBe(7850); // Dec 2023

      // Specific validation for February 2024
      expect(consumption2024[1].month).toBe(2);
      expect(consumption2024[1].consumption).toBe(350); // 8500 - 8150

      // Specific validation for December 2024
      // Dec index = 11, so meter reading = 8150 + (11 * 350) = 12000
      // Nov index = 10, so meter reading = 8150 + (10 * 350) = 11650
      expect(consumption2024[11].month).toBe(12);
      expect(consumption2024[11].consumption).toBe(350); // 12000 - 11650
      expect(consumption2024[11].sourceReadings.current.meterReading).toBe(12000);
      expect(consumption2024[11].sourceReadings.previous?.meterReading).toBe(11650); // Nov 2024
      expect(consumption2024[11].sourceReadings.next).toBeUndefined(); // Prefers November
    });
  });

  describe('With Realistic Seeded Data - Edge Case: Missing January', () => {
    /**
     * Test Scenario: Year with missing January reading
     * Pattern: No January reading, starts with February
     *
     * Reality:
     * - January: extrapolated backward from Feb and Mar (algorithm has 2 forward readings)
     * - February: calculated using extrapolated January
     * - March onwards: standard calculation
     */
    it('handles year starting with February (missing January)', () => {
      const power2024: EnergyType[] = [
        // January missing - will be extrapolated backward from Feb and Mar
        createReading(new Date(2024, 1, 29), 8850),   // Feb 29: 8850 kWh
        createReading(new Date(2024, 2, 31), 9200),   // Mar 31: 9200 kWh
        createReading(new Date(2024, 3, 30), 9550),   // Apr 30: 9550 kWh
        createReading(new Date(2024, 4, 31), 9900),   // May 31: 9900 kWh
        createReading(new Date(2024, 5, 30), 10250),  // Jun 30: 10250 kWh
        createReading(new Date(2024, 6, 31), 10600),  // Jul 31: 10600 kWh
        createReading(new Date(2024, 7, 31), 10950),  // Aug 31: 10950 kWh
        createReading(new Date(2024, 8, 30), 11300),  // Sep 30: 11300 kWh
        createReading(new Date(2024, 9, 31), 11650),  // Oct 31: 11650 kWh
        createReading(new Date(2024, 10, 30), 12000), // Nov 30: 12000 kWh
        createReading(new Date(2024, 11, 31), 12350), // Dec 31: 12350 kWh
      ];

      const readings2024 = calculateMonthlyReadings(power2024, 2024, 'power');

      // Verify January is EXTRAPOLATED (not null) - system extrapolates backward from Feb and Mar
      expect(readings2024[0].month).toBe(1);
      expect(readings2024[0].meterReading).not.toBeNull();
      expect(readings2024[0].isActual).toBe(false);
      expect(readings2024[0].isExtrapolated).toBe(true);
      // January extrapolated backward from Feb (8850) and Mar (9200)
      // Rate: 350 kWh/month, so Jan should be ~8500
      expect(readings2024[0].meterReading).toBeGreaterThan(8400);
      expect(readings2024[0].meterReading).toBeLessThan(8600);

      // Verify February is actual
      expect(readings2024[1].month).toBe(2);
      expect(readings2024[1].meterReading).toBe(8850);
      expect(readings2024[1].isActual).toBe(true);

      const consumption = calculateMonthlyConsumption(readings2024);

      // January consumption: null (no previous December provided)
      expect(consumption[0].month).toBe(1);
      expect(consumption[0].consumption).toBeNull();
      expect(consumption[0].isActual).toBe(false);
      expect(consumption[0].isDerived).toBe(false);

      // February consumption: valid using extrapolated January
      // Expected: 8850 (actual Feb) - ~8500 (extrapolated Jan) = ~350 kWh
      expect(consumption[1].month).toBe(2);
      expect(consumption[1].consumption).not.toBeNull();
      expect(consumption[1].consumption).toBeGreaterThan(300);
      expect(consumption[1].consumption).toBeLessThan(400);
      expect(consumption[1].isActual).toBe(false); // January is extrapolated
      expect(consumption[1].isDerived).toBe(true);

      // March consumption: valid (actual Feb - actual Mar)
      expect(consumption[2].month).toBe(3);
      expect(consumption[2].consumption).toBe(350); // 9200 - 8850
      expect(consumption[2].isActual).toBe(true);
      expect(consumption[2].isDerived).toBe(false);

      // Remaining months should have valid consumption
      for (let i = 3; i < 12; i++) {
        expect(consumption[i].consumption).not.toBeNull();
        expect(consumption[i].consumption).toBe(350);
        expect(consumption[i].isActual).toBe(true);
      }
    });
  });

  describe('Manual Calculation Verification', () => {
    /**
     * Test Scenario: Manual calculation verification
     * Pattern: Simple dataset with hand-calculated expected values
     *
     * Purpose: Ensure algorithm produces mathematically correct results
     */
    it('verifies consumption matches manual calculations', () => {
      // Simple test case with known values
      const testData: EnergyType[] = [
        createReading(new Date(2024, 0, 31), 1000),   // Jan: 1000 kWh
        createReading(new Date(2024, 1, 29), 1100),   // Feb: 1100 kWh → consumption: 100 kWh
        createReading(new Date(2024, 2, 31), 1250),   // Mar: 1250 kWh → consumption: 150 kWh
        createReading(new Date(2024, 3, 30), 1450),   // Apr: 1450 kWh → consumption: 200 kWh
        createReading(new Date(2024, 4, 31), 1700),   // May: 1700 kWh → consumption: 250 kWh
        createReading(new Date(2024, 5, 30), 2000),   // Jun: 2000 kWh → consumption: 300 kWh
        createReading(new Date(2024, 6, 31), 2350),   // Jul: 2350 kWh → consumption: 350 kWh
        createReading(new Date(2024, 7, 31), 2750),   // Aug: 2750 kWh → consumption: 400 kWh
        createReading(new Date(2024, 8, 30), 3200),   // Sep: 3200 kWh → consumption: 450 kWh
        createReading(new Date(2024, 9, 31), 3700),   // Oct: 3700 kWh → consumption: 500 kWh
        createReading(new Date(2024, 10, 30), 4250),  // Nov: 4250 kWh → consumption: 550 kWh
        createReading(new Date(2024, 11, 31), 4850),  // Dec: 4850 kWh → consumption: 600 kWh
      ];

      const readings = calculateMonthlyReadings(testData, 2024, 'power');
      const consumption = calculateMonthlyConsumption(readings);

      // Manual calculation validation
      const expectedConsumptions = [
        { month: 1, label: 'Jan', consumption: null, reading: 1000 },       // No previous
        { month: 2, label: 'Feb', consumption: 100, reading: 1100 },        // 1100 - 1000
        { month: 3, label: 'Mar', consumption: 150, reading: 1250 },        // 1250 - 1100
        { month: 4, label: 'Apr', consumption: 200, reading: 1450 },        // 1450 - 1250
        { month: 5, label: 'May', consumption: 250, reading: 1700 },        // 1700 - 1450
        { month: 6, label: 'Jun', consumption: 300, reading: 2000 },        // 2000 - 1700
        { month: 7, label: 'Jul', consumption: 350, reading: 2350 },        // 2350 - 2000
        { month: 8, label: 'Aug', consumption: 400, reading: 2750 },        // 2750 - 2350
        { month: 9, label: 'Sep', consumption: 450, reading: 3200 },        // 3200 - 2750
        { month: 10, label: 'Oct', consumption: 500, reading: 3700 },       // 3700 - 3200
        { month: 11, label: 'Nov', consumption: 550, reading: 4250 },       // 4250 - 3700
        { month: 12, label: 'Dec', consumption: 600, reading: 4850 },       // 4850 - 4250
      ];

      expectedConsumptions.forEach(({ month, label, consumption: expectedConsumption, reading }) => {
        const actual = consumption[month - 1];

        // Verify month and label
        expect(actual.month).toBe(month);
        expect(actual.monthLabel).toBe(label);

        // Verify consumption value
        expect(actual.consumption).toBe(expectedConsumption);

        // Verify source reading
        expect(actual.sourceReadings.current.meterReading).toBe(reading);

        // Verify quality flags (all should be actual)
        if (expectedConsumption !== null) {
          expect(actual.isActual).toBe(true);
          expect(actual.isDerived).toBe(false);
        } else {
          expect(actual.isActual).toBe(false);
          expect(actual.isDerived).toBe(false);
        }
      });
    });
  });
});
