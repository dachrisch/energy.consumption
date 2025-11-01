import { ContractBase, ContractType, EnergyBase } from "@/app/types";

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Contract validation service
 * Encapsulates all contract validation logic following SRP
 */
export class ContractValidationService {
  /**
   * Validate contract prices
   */
  static validatePrices(basePrice: number, workingPrice: number): ValidationResult {
    if (basePrice < 0 || workingPrice < 0) {
      return {
        isValid: false,
        error: "Prices cannot be negative",
      };
    }

    return { isValid: true };
  }

  /**
   * Validate contract dates
   */
  static validateDates(startDate: Date, endDate?: Date): ValidationResult {
    if (endDate && endDate < startDate) {
      return {
        isValid: false,
        error: "End date must be after start date",
      };
    }

    return { isValid: true };
  }

  /**
   * Check if a new contract overlaps with existing contracts
   */
  static detectOverlap(
    newContract: ContractBase,
    existingContracts: ContractType[]
  ): ValidationResult {
    const hasOverlap = existingContracts.some((contract: ContractType) => {
      if (contract.type !== newContract.type) {
        return false;
      }

      const newStart = newContract.startDate.getTime();
      const newEnd = newContract.endDate?.getTime() || Infinity;
      const existingStart = contract.startDate.getTime();
      const existingEnd = contract.endDate?.getTime() || Infinity;

      const startsBeforeExistingEnds = newStart < existingEnd;
      const endsAfterExistingStarts = newEnd > existingStart;

      return startsBeforeExistingEnds && endsAfterExistingStarts;
    });

    if (hasOverlap) {
      return {
        isValid: false,
        error: `A ${newContract.type} contract already exists for this date range`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate complete contract data
   */
  static validateContract(
    contract: ContractBase,
    existingContracts: ContractType[]
  ): ValidationResult {
    const priceValidation = this.validatePrices(contract.basePrice, contract.workingPrice);
    if (!priceValidation.isValid) {
      return priceValidation;
    }

    const dateValidation = this.validateDates(contract.startDate, contract.endDate);
    if (!dateValidation.isValid) {
      return dateValidation;
    }

    const overlapValidation = this.detectOverlap(contract, existingContracts);
    if (!overlapValidation.isValid) {
      return overlapValidation;
    }

    return { isValid: true };
  }
}

/**
 * Energy data validation service
 */
export class EnergyValidationService {
  /**
   * Validate energy amount
   */
  static validateAmount(amount: number): ValidationResult {
    if (isNaN(amount) || amount <= 0) {
      return {
        isValid: false,
        error: "Please enter a valid amount greater than 0",
      };
    }

    return { isValid: true };
  }

  /**
   * Check if new reading is lower than previous reading
   */
  static shouldConfirmLowerReading(
    newData: EnergyBase,
    latestValues: Record<string, number>
  ): boolean {
    const currentValue = latestValues[newData.type];
    return newData.amount < currentValue;
  }
}
