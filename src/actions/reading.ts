import Reading from "@/models/Reading";
import Meter from "@/models/Meter";
import { Reading as ReadingType, Meter as MeterType, SimplifiedProjectionResult } from "@/app/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { SimplifiedProjectionService } from "@/services/projections/SimplifiedProjectionService";
import { getContractForMeter } from "./contract";

export async function addReadingAction(data: {
  meterId?: string;
  value: number;
  date: Date;
  newMeter?: {
    name: string;
    meterNumber: string;
    type: "power" | "gas";
  };
}): Promise<{ success: boolean; error?: string }> {
// ... keep existing code ...
}

export async function getReadings(meterId: string): Promise<ReadingType[]> {
// ... keep existing code ...
}

export async function deleteReadingAction(id: string): Promise<{ success: boolean; error?: string }> {
// ... keep existing code ...
}

export async function getSimplifiedProjections(meterId: string): Promise<SimplifiedProjectionResult | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  try {
    const [readings, contract] = await Promise.all([
      getReadings(meterId),
      getContractForMeter(meterId)
    ]);

    return SimplifiedProjectionService.calculateProjections(meterId, readings, contract);
  } catch (err) {
    console.error("[getSimplifiedProjections] Error:", err);
    return null;
  }
}
