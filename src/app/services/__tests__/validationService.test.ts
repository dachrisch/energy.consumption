import {
  ContractValidationService,
  EnergyValidationService,
} from '../validationService';
import { ContractBase, ContractType, EnergyBase } from '@/app/types';

describe('ContractValidationService', () => {
  describe('validatePrices', () => {
    it('should return valid for positive prices', () => {
      const result = ContractValidationService.validatePrices(100, 0.25);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for negative base price', () => {
      const result = ContractValidationService.validatePrices(-100, 0.25);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Prices cannot be negative');
    });

    it('should return invalid for negative working price', () => {
      const result = ContractValidationService.validatePrices(100, -0.25);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Prices cannot be negative');
    });

    it('should return invalid for both prices negative', () => {
      const result = ContractValidationService.validatePrices(-100, -0.25);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Prices cannot be negative');
    });

    it('should accept zero prices', () => {
      const result = ContractValidationService.validatePrices(0, 0);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateDates', () => {
    it('should return valid for start date without end date', () => {
      const startDate = new Date('2024-01-01');
      const result = ContractValidationService.validateDates(startDate);
      expect(result.isValid).toBe(true);
    });

    it('should return valid when end date is after start date', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      const result = ContractValidationService.validateDates(startDate, endDate);
      expect(result.isValid).toBe(true);
    });

    it('should return invalid when end date is before start date', () => {
      const startDate = new Date('2024-12-31');
      const endDate = new Date('2024-01-01');
      const result = ContractValidationService.validateDates(startDate, endDate);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('End date must be after start date');
    });

    it('should return valid when end date equals start date', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-01');
      const result = ContractValidationService.validateDates(startDate, endDate);
      expect(result.isValid).toBe(true);
    });
  });

  describe('detectOverlap', () => {
    const existingContracts: ContractType[] = [
      {
        _id: '1',
        userId: 'user1',
        type: 'power',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
        basePrice: 100,
        workingPrice: 0.25,
      },
      {
        _id: '2',
        userId: 'user1',
        type: 'gas',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-09-30'),
        basePrice: 80,
        workingPrice: 0.15,
      },
    ];

    it('should return valid for non-overlapping contract', () => {
      const newContract: ContractBase = {
        type: 'power',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-12-31'),
        basePrice: 110,
        workingPrice: 0.28,
      };
      const result = ContractValidationService.detectOverlap(
        newContract,
        existingContracts
      );
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for overlapping contract of same type', () => {
      const newContract: ContractBase = {
        type: 'power',
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-08-31'),
        basePrice: 110,
        workingPrice: 0.28,
      };
      const result = ContractValidationService.detectOverlap(
        newContract,
        existingContracts
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('already exists for this date range');
    });

    it('should return valid for overlapping contract of different type', () => {
      const newContract: ContractBase = {
        type: 'power',
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-08-31'),
        basePrice: 110,
        workingPrice: 0.28,
      };
      const gasContracts = existingContracts.filter((c) => c.type === 'gas');
      const result = ContractValidationService.detectOverlap(
        newContract,
        gasContracts
      );
      expect(result.isValid).toBe(true);
    });

    it('should detect overlap with open-ended existing contract', () => {
      const openEndedContracts: ContractType[] = [
        {
          _id: '3',
          userId: 'user1',
          type: 'power',
          startDate: new Date('2024-01-01'),
          basePrice: 100,
          workingPrice: 0.25,
        },
      ];
      const newContract: ContractBase = {
        type: 'power',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-12-31'),
        basePrice: 110,
        workingPrice: 0.28,
      };
      const result = ContractValidationService.detectOverlap(
        newContract,
        openEndedContracts
      );
      expect(result.isValid).toBe(false);
    });

    it('should detect overlap when new contract is open-ended', () => {
      const newContract: ContractBase = {
        type: 'power',
        startDate: new Date('2024-05-01'),
        basePrice: 110,
        workingPrice: 0.28,
      };
      const result = ContractValidationService.detectOverlap(
        newContract,
        existingContracts
      );
      expect(result.isValid).toBe(false);
    });

    it('should allow empty existing contracts list', () => {
      const newContract: ContractBase = {
        type: 'power',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        basePrice: 100,
        workingPrice: 0.25,
      };
      const result = ContractValidationService.detectOverlap(newContract, []);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateContract', () => {
    it('should return valid for a valid contract', () => {
      const contract: ContractBase = {
        type: 'power',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        basePrice: 100,
        workingPrice: 0.25,
      };
      const result = ContractValidationService.validateContract(contract, []);
      expect(result.isValid).toBe(true);
    });

    it('should return first validation error encountered', () => {
      const contract: ContractBase = {
        type: 'power',
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01'),
        basePrice: -100,
        workingPrice: 0.25,
      };
      const result = ContractValidationService.validateContract(contract, []);
      expect(result.isValid).toBe(false);
      // Should catch price validation first
      expect(result.error).toBe('Prices cannot be negative');
    });
  });
});

describe('EnergyValidationService', () => {
  describe('validateAmount', () => {
    it('should return valid for positive amount', () => {
      const result = EnergyValidationService.validateAmount(1000);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for zero amount', () => {
      const result = EnergyValidationService.validateAmount(0);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid amount greater than 0');
    });

    it('should return invalid for negative amount', () => {
      const result = EnergyValidationService.validateAmount(-100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid amount greater than 0');
    });

    it('should return invalid for NaN', () => {
      const result = EnergyValidationService.validateAmount(NaN);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Please enter a valid amount greater than 0');
    });

    it('should accept decimal amounts', () => {
      const result = EnergyValidationService.validateAmount(123.45);
      expect(result.isValid).toBe(true);
    });
  });

  describe('shouldConfirmLowerReading', () => {
    const latestValues = {
      power: 5000,
      gas: 3000,
    };

    it('should return true when new power reading is lower', () => {
      const newData: EnergyBase = {
        date: new Date(),
        type: 'power',
        amount: 4500,
      };
      const result = EnergyValidationService.shouldConfirmLowerReading(
        newData,
        latestValues
      );
      expect(result).toBe(true);
    });

    it('should return false when new power reading is higher', () => {
      const newData: EnergyBase = {
        date: new Date(),
        type: 'power',
        amount: 5500,
      };
      const result = EnergyValidationService.shouldConfirmLowerReading(
        newData,
        latestValues
      );
      expect(result).toBe(false);
    });

    it('should return false when new power reading equals current', () => {
      const newData: EnergyBase = {
        date: new Date(),
        type: 'power',
        amount: 5000,
      };
      const result = EnergyValidationService.shouldConfirmLowerReading(
        newData,
        latestValues
      );
      expect(result).toBe(false);
    });

    it('should return true when new gas reading is lower', () => {
      const newData: EnergyBase = {
        date: new Date(),
        type: 'gas',
        amount: 2500,
      };
      const result = EnergyValidationService.shouldConfirmLowerReading(
        newData,
        latestValues
      );
      expect(result).toBe(true);
    });

    it('should return false when new gas reading is higher', () => {
      const newData: EnergyBase = {
        date: new Date(),
        type: 'gas',
        amount: 3500,
      };
      const result = EnergyValidationService.shouldConfirmLowerReading(
        newData,
        latestValues
      );
      expect(result).toBe(false);
    });
  });
});
