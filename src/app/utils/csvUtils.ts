import { EnergyBase } from "../types";
import { parseDateFlexible } from "./dateUtils";
import csv from "csv-parser";
import stream from "stream";

export type Separator = "," | "\t";

export interface CSVParseResult {
  data: EnergyBase[];
  errors: string[];
}

export const parseCSVData = async (
  csvData: string,
  separator: Separator
): Promise<CSVParseResult> => {
  const energyData: EnergyBase[] = [];
  const errors: string[] = [];

  // Check if the input data has any CSV-like structure
  const firstLine = csvData.split("\n")[0].trim();
  const isCSV = firstLine.includes(separator) || firstLine.split("\t").length > 1;

  if (!isCSV) {
    return { data: [], errors: ["Clipboard data is not a valid CSV format."] };
  }

  const csvStream = new stream.PassThrough();
  csvStream.write(csvData);
  csvStream.end();

  return await new Promise((resolve) => {
    csvStream
      .pipe(
        csv({
          separator: separator,
          mapHeaders: ({ header }) => header.toLowerCase(),
        })
      )
      .on("data", (data) => {
        // If the CSV data contains valid fields, process them
        if (data.amount && data.date && data.type) {
          energyData.push({
            amount: parseFloat(data.amount),
            date: parseDateFlexible(data.date),
            type: data.type,
          });
        } else {
          errors.push("Invalid row in CSV data");
        }
      })
      .on("end", () => {
        if (errors.length > 0) {
          resolve({ data: [], errors });
        } else {
          resolve({ data: energyData, errors: [] });
        }
      })
      .on("error", () => {
        errors.push("Error parsing CSV data");
        resolve({ data: [], errors });
      });
  });
};
