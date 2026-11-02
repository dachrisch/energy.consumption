export type ContractStatus = 'Active' | 'Ended' | 'Upcoming';

type ContractDate = string | Date;

const contractDay = (value: ContractDate): number => {
  const date = new Date(value);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

export function getContractStatus(
  startDate: ContractDate,
  endDate: ContractDate | undefined,
  today: Date = new Date(),
): ContractStatus {
  const current = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (contractDay(startDate) > current) {
    return 'Upcoming';
  }
  if (endDate && contractDay(endDate) < current) {
    return 'Ended';
  }
  return 'Active';
}
