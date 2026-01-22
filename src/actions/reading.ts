"use server";
import { connectDB } from "@/lib/mongodb";
import Reading from "@/models/Reading";
import Meter from "@/models/Meter";
import { Reading as ReadingType, SimplifiedProjectionResult } from "@/app/types";
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
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    await connectDB();
    
    let meterId = data.meterId;

    // Handle transparent meter creation
    if (!meterId && data.newMeter) {
      const newMeter = new Meter({
        ...data.newMeter,
        userId: session.user.id,
        unit: data.newMeter.type === "power" ? "kWh" : "m³"
      });
      const savedMeter = await newMeter.save();
      meterId = savedMeter._id;
    }

    if (!meterId) {
      return { success: false, error: "Meter ID is required" };
    }

    const reading = new Reading({
      meterId,
      value: data.value,
      date: data.date,
      userId: session.user.id
    });

    await reading.save();
    return { success: true };
  } catch (err) {
    const error = err as Error;
    console.error("[addReadingAction] Error:", error);
    return { success: false, error: error.message || "Failed to add reading" };
  }
}

export async function getReadings(meterId: string): Promise<ReadingType[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  await connectDB();
  const readings = await Reading.find({ meterId, userId: session.user.id }).sort({ date: -1 }).lean();
  return (readings as any[]).map(r => ({
    ...r,
    _id: r._id.toString(),
    date: r.date.toISOString() // Dates also need conversion to be "plain"
  }));
}

export async function deleteReadingAction(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    await connectDB();
    const result = await Reading.deleteOne({ _id: id, userId: session.user.id });
    return { success: result.deletedCount > 0 };
  } catch (err) {
    const error = err as Error;
    console.error("[deleteReadingAction] Error:", error);
    return { success: false, error: error.message || "Failed to delete reading" };
  }
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