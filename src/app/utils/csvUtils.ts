import { EnergyData, EnergyType } from "../types";
import { parseDateFlexible } from "./dateUtils";

export interface CSVParseResult {
  data: Omit<EnergyData, "_id">[];
  errors: string[];
}

export function parseCSVData(text: string): CSVParseResult {
  const data: Omit<EnergyData, "_id">[] = [];
  const errors: string[] = [];

  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    errors.push("CSV must have a header row and at least one data row.");
    return { data, errors };
  }

  const headers = lines[0].split("\t").map((h) => h.trim().toLowerCase());
  const expectedHeaders = ["date", "type", "amount"];

  // Basic header check
  if (!expectedHeaders.every((h) => headers.includes(h))) {
    errors.push(
      `CSV headers must include: ${expectedHeaders.join(", ")}. Got: ${headers}`
    );
    // Allow proceeding if headers are just different, but log error
  }

  lines.slice(1).forEach((line, index) => {
    const values = line.split("\t").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      // Only map known headers to avoid issues with extra columns
      if (expectedHeaders.includes(header)) {
        row[header] = values[i];
      }
    });

    const dateString = row.date;
    let date = null;
    const type = row.type?.toLowerCase() as EnergyType;
    const amountStr = row.amount;
    const amount = parseFloat(amountStr);

    // Validate each row
    if (!dateString) {
      errors.push(`Row ${index + 2}: Missing date.`);
    }

    try {
      date = parseDateFlexible(dateString);
    } catch {
      errors.push(`Row ${index + 2}: Invalid date: ${dateString}`);
    }
    if (!type || (type !== "power" && type !== "gas")) {
      errors.push(
        `Row ${index + 2}: Invalid type '${
          row.type || ""
        }'. Must be 'power' or 'gas'.`
      );
    }
    if (!amountStr || isNaN(amount)) {
      errors.push(
        `Row ${index + 2}: Invalid amount '${
          amountStr || ""
        }'. Must be a number.`
      );
    } else if (amount <= 0) {
      errors.push(`Row ${index + 2}: Amount must be positive (${amount}).`);
    }

    // If all required fields are present and valid enough to form an entry
    if (date && (type === "power" || type === "gas") && !isNaN(amount)) {
      data.push({ date: date, type, amount });
    } else if (!date && !type && !amountStr) {
      // Skip potentially empty lines without error
    } else {
      // Log error for rows that have some data but are invalid overall
      if (!errors.find((e) => e.startsWith(`Row ${index + 2}`))) {
        // Avoid duplicate row errors
        errors.push(`Row ${index + 2}: Invalid data, skipping.`);
      }
    }
  });

  if (data.length === 0 && errors.length === 0) {
    errors.push("No valid data rows found in the CSV.");
  }

  return { data, errors };
}
