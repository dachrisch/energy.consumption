"use server";
import { connectDB } from "@/lib/mongodb";
import EnergyData from "@/models/EnergyData";
import { EnergyDataType } from "../app/types";
import { InsertOneResult } from "mongodb";
import { DeleteResult } from "mongoose";

export type ApiResult = { success: boolean } | Error;

export const addEnergy = async (
  newData: Omit<EnergyDataType, "_id">
): Promise<ApiResult> => {
  await connectDB();
  const energyData = new EnergyData(newData);
  console.log(`addEnergy: ${energyData}, newData: ${JSON.stringify(newData)}`);
  return energyData
    .save()
    .then((createResult: InsertOneResult) => ({
      success: "_id" in createResult,
    }))
    .catch((error: Error) => error);
};

export const deleteEnergy = async (id: string): Promise<ApiResult> => {
  await connectDB();

  console.log(`deleteEnergy: ${id}`);
  return EnergyData.deleteOne({ _id: id })
    .then((deleteResult: DeleteResult) => ({
      success: deleteResult != undefined,
    }))
    .catch((error: Error) => error);
};

export const importCSV = async (
  data: Omit<EnergyDataType, "_id">[],
  existingData: EnergyDataType[]
) => {
  try {
    // Sort data by date to ensure proper order
    const sortedData = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const result = {
      success: 0,
      skipped: 0,
      error: 0,
    };

    // Add each entry individually
    for (const entry of sortedData) {
      try {
        console.log(
          `entry: ${JSON.stringify(entry)} in ${JSON.stringify(existingData)}`
        );
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

        const addedResult = await addEnergy(entry);
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
