import { IReading, IContract } from '../types/models';

export interface Gap {
  startDate: Date;
  endDate: Date;
}

export function findContractGaps(readings: IReading[], contracts: IContract[]): Gap[] {
  if (readings.length < 1) {return [];}
  
  const readingDates = readings.map(r => new Date(r.date).getTime());
  const minReadingDate = new Date(Math.min(...readingDates));
  const maxReadingDate = new Date(Math.max(...readingDates));

  const sortedContracts = [...contracts].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  
  const gaps: Gap[] = [];

  // Reset times to midnight for date comparisons
  const normalize = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };
  
  const startLimit = normalize(minReadingDate);
  const endLimit = normalize(maxReadingDate);

  let currentPointer = startLimit;

  for (const contract of sortedContracts) {
    const cStart = normalize(new Date(contract.startDate));
    const cEnd = contract.endDate ? normalize(new Date(contract.endDate)) : new Date(2099, 11, 31);

    if (cStart > currentPointer) {
      // Gap found!
      gaps.push({
        startDate: new Date(currentPointer),
        endDate: new Date(cStart.getTime() - 24 * 60 * 60 * 1000)
      });
    }
    
    currentPointer = new Date(Math.max(currentPointer.getTime(), cEnd.getTime() + 24 * 60 * 60 * 1000));
    
    if (currentPointer > endLimit) {break;}
  }

  if (currentPointer <= endLimit) {
    gaps.push({
      startDate: new Date(currentPointer),
      endDate: new Date(endLimit)
    });
  }

  return gaps;
}