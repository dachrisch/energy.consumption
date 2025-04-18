import { ContractType } from "../types";

export const fetchAndConvert = async (): Promise<ContractType[]> =>
  fetch("/api/contracts").then(async (response) => {
    if (!response.ok) throw new Error("Failed to fetch contracts");
    return response.json().then((data)=>data.map(
      (item: {
        startDate: string | number | Date;
        endDate?: string | number | Date;
      }) => ({
        ...item,
        startDate: new Date(item.startDate),
        ...(item.endDate && { endDate: new Date(item.endDate) }),
      })
    ));
  });
