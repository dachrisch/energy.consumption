"use server";
import { connectDB } from "@/lib/mongodb";
import Meter from "@/models/Meter";
import { Meter as MeterType } from "@/app/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export async function getMeters(): Promise<MeterType[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  await connectDB();
  return Meter.find({ userId: session.user.id }).lean();
}

export async function createMeter(data: Partial<MeterType>): Promise<MeterType> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");

  await connectDB();
  const meter = new Meter({
    ...data,
    userId: session.user.id,
  });
  return meter.save();
}
