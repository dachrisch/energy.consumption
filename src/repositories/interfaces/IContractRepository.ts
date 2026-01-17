import { ContractType, EnergyOptions } from '@/app/types';

export interface IContractRepository {
  /**
   * Find all contracts for a user
   * @param userId - User ID
   * @returns Array of contracts
   */
  findAll(userId: string): Promise<ContractType[]>;

  /**
   * Find the active contract for a specific energy type and date
   * @param userId - User ID
   * @param type - Energy type (power/gas)
   * @param date - Date to check for active contract (default: now)
   * @returns Active contract or null
   */
  findActive(userId: string, type: EnergyOptions, date?: Date): Promise<ContractType | null>;

  /**
   * Create a new contract
   * @param contract - Contract data
   * @returns Created contract
   */
  create(contract: Omit<ContractType, '_id'>): Promise<ContractType>;

  /**
   * Update a contract
   * @param id - Contract ID
   * @param userId - User ID
   * @param data - Partial data to update
   * @returns Updated contract or null
   */
  update(id: string, userId: string, data: Partial<Omit<ContractType, '_id' | 'userId'>>): Promise<ContractType | null>;

  /**
   * Delete a contract
   * @param id - Contract ID
   * @param userId - User ID
   * @returns true if deleted
   */
  delete(id: string, userId: string): Promise<boolean>;
}
