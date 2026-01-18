"use server";
import { connectDB } from "@/lib/mongodb";
import Reading from "@/models/Reading";
import Meter from "@/models/Meter";
import { Reading as ReadingType, Meter as MeterType } from "@/app/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

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
  } catch (err: any) {
    console.error("[addReadingAction] Error:", err);
    return { success: false, error: err.message || "Failed to add reading" };
  }
}

export async function getReadings(meterId: string): Promise<ReadingType[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  await connectDB();
  return Reading.find({ meterId, userId: session.user.id }).sort({ date: -1 }).lean();
}

export async function deleteReadingAction(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    await connectDB();
    const result = await Reading.deleteOne({ _id: id, userId: session.user.id });
    return { success: result.deletedCount > 0 };
  } catch (err: any) {
    console.error("[deleteReadingAction] Error:", err);
    return { success: false, error: err.message || "Failed to delete reading" };
  }
}
