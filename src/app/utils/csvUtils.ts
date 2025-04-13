import {  NewEnergyDataType } from "../types";
import { parseDateFlexible } from "./dateUtils";
import csv from "csv-parser";
import stream from "stream";

export type Separator = "," | "\t";

export interface CSVParseResult {
  data: NewEnergyDataType[];
  errors: string[];
}

export const parseCSVData = async (
  csvData: string,
  separator: Separator
): Promise<CSVParseResult> => {
  const energyData: NewEnergyDataType[] = [];

  const csvStream = new stream.PassThrough();

  csvStream.write(csvData);
  csvStream.end();
  csvStream
    .pipe(
      csv({
        separator: separator,
        mapHeaders: ({ header }) => header.toLowerCase(),
      })
    )
    .on("data", (data) => {
      energyData.push({
        amount: parseFloat(data.amount),
        date: parseDateFlexible(data.date),
        type: data.type,
      });
    });

  return await new Promise((resolve) =>
    csvStream.on("finish", () => resolve({ data: energyData, errors: [] }))
  );
};
