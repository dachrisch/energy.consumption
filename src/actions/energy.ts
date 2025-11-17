"use server";
import { connectDB } from "@/lib/mongodb";
import Energy from "@/models/Energy";
import { ApiResult, EnergyType, EnergyBase } from "../app/types";
import { InsertOneResult } from "mongodb";
import { DeleteResult } from "mongoose";
import { checkBackendFlag } from "@/lib/backendFlags";
import { getEnergyCrudService } from "@/services";
import { getServerSession } from "next-auth";

// Initialize server infrastructure (event handlers, etc.)
// This runs once when the server actions module is first loaded
import "@/lib/serverInit";

export const addEnergyAction = async (
  energyData: EnergyBase
): Promise<ApiResult> => {
  // Check if new backend should be used
  const session = await getServerSession();
  const useNewBackend = session?.user?.id
    ? await checkBackendFlag('form', session.user.id)
    : false;

  if (useNewBackend && session?.user?.id) {
    // NEW BACKEND: Use services layer
    try {
      const service = getEnergyCrudService();
      await service.create({
        userId: session.user.id,
        type: energyData.type,
        date: energyData.date,
        amount: energyData.amount,
      });
      // Event automatically emitted by service
      return { success: true };
    } catch (error) {
      console.error('[addEnergyAction] New backend error:', error);
      return { success: false };
    }
  } else {
    // OLD BACKEND: Direct Mongoose
    return connectDB().then(() =>
      new Energy(energyData).save().then((createResult: InsertOneResult) => ({
        success: "_id" in createResult,
      }))
    );
  }
};

export const deleteEnergyAction = async (id: string): Promise<ApiResult> => {
  // Check if new backend should be used
  const session = await getServerSession();
  const useNewBackend = session?.user?.id
    ? await checkBackendFlag('form', session.user.id)
    : false;

  if (useNewBackend && session?.user?.id) {
    // NEW BACKEND: Use services layer
    try {
      const service = getEnergyCrudService();
      const deleted = await service.delete(id, session.user.id);
      // Event automatically emitted by service
      return { success: deleted };
    } catch (error) {
      console.error('[deleteEnergyAction] New backend error:', error);
      return { success: false };
    }
  } else {
    // OLD BACKEND: Direct Mongoose
    return connectDB().then(() =>
      Energy.deleteOne({ _id: id }).then((deleteResult: DeleteResult) => ({
        success: deleteResult != undefined,
      }))
    );
  }
};

export const importCSVAction = async (
  data: EnergyBase[],
  existingData: EnergyType[]
) => {
  try {
    // Check if new backend should be used
    const session = await getServerSession();
    const useNewBackend = session?.user?.id
      ? await checkBackendFlag('csv_import', session.user.id)
      : false;

    // Sort data by date to ensure proper order
    const sortedData = [...data].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    const result = {
      success: 0,
      skipped: 0,
      error: 0,
    };

    if (useNewBackend && session?.user?.id) {
      // NEW BACKEND: Use createMany (bulk operation)
      try {
        // Filter out existing entries
        const newEntries = sortedData.filter(
          (entry) =>
            !existingData.some(
              (existing) =>
                existing.date.getTime() === entry.date.getTime() &&
                existing.type === entry.type
            )
        );

        result.skipped = sortedData.length - newEntries.length;

        if (newEntries.length > 0) {
          const service = getEnergyCrudService();

          // Prepare data with userId
          const readingsToCreate = newEntries.map((entry) => ({
            userId: session.user!.id,
            type: entry.type,
            date: entry.date,
            amount: entry.amount,
          }));

          // Bulk create (emits single BULK_IMPORTED event)
          const created = await service.createMany(readingsToCreate);
          result.success = created.length;
        }

        console.log(
          `[importCSVAction] New backend: ${result.success} created, ${result.skipped} skipped`
        );
        return result;
      } catch (error) {
        console.error('[importCSVAction] New backend error:', error);
        result.error = sortedData.length - result.skipped;
        return result;
      }
    } else {
      // OLD BACKEND: Individual inserts (slower)
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
    }
  } catch (error) {
    console.error("Error importing CSV data:", error);
    throw new Error("Failed to import CSV data");
  }
};
