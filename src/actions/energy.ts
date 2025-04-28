"use server";
import { connectDB } from "@/lib/mongodb";
import Energy from "@/models/Energy";
import { ApiResult, EnergyType, EnergyBase } from "../app/types";
import { InsertOneResult } from "mongodb";
import { DeleteResult } from "mongoose";

export const addEnergyAction = async (
  energyData: EnergyBase
): Promise<ApiResult> =>
  connectDB().then(() =>
    new Energy(energyData).save().then((createResult: InsertOneResult) => ({
      success: "_id" in createResult,
    }))
  );

export const deleteEnergyAction = async (id: string): Promise<ApiResult> =>
  connectDB().then(() =>
    Energy.deleteOne({ _id: id }).then((deleteResult: DeleteResult) => ({
      success: deleteResult != undefined,
    }))
  );

export const importCSVAction = async (
  data: EnergyBase[],
  existingData: EnergyType[]
) => {
  try {
    // Sort data by date to ensure proper order
    const sortedData = [...data].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    const result = {
      success: 0,
      skipped: 0,
      error: 0,
    };

    // Add each entry individually
    for (const entry of sortedData) {
      try {
        // Check if entry already exists
        const exists = existingData.some(
          (existing) =>
            existing.date.getTime() == entry.date.getTime() &&
            existing.type == entry.type
        );

        if (exists) {
          result.skipped++;
          continue;
        }

        const addedResult = await addEnergyAction(entry);
        if ("success" in addedResult) {
          result.success++;
        } else {
          result.error++;
        }
      } catch (error) {
        console.error("Error importing entry:", error);
        result.error++;
      }
    }

    return result;
  } catch (error) {
    console.error("Error importing CSV data:", error);
    throw new Error("Failed to import CSV data");
  }
};
