"use server";
import { connectDB } from "@/lib/mongodb";
import EnergyData from "@/models/EnergyData";
import { EnergyDataType, NewEnergyDataType } from "../app/types";
import { InsertOneResult } from "mongodb";
import { DeleteResult } from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export type ApiResult = { success: boolean } | Error;

export const addEnergy = async (
  newData: NewEnergyDataType
): Promise<ApiResult> => {
  await connectDB();
  // Get the session
  const session = await getServerSession(authOptions);
  console.log(`session ${session?.user}`)

  if (!session?.user?.id) {
    // If the user is not logged in or doesn't have an `id`, return an error
    return { success: false };
  }
  // Add userId to the energy data
  const energyData = new EnergyData({
    ...newData,
    userId: session.user.id,
  });

  console.log(`energyData ${energyData}`)

  return energyData.save().then((createResult: InsertOneResult) => ({
    success: "_id" in createResult,
  }));
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
