"use server";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import EnergyData from "@/models/EnergyData";

export const GET = async () => {
  try {
    await connectDB();
    const energyData = await EnergyData.find({});
    return NextResponse.json(energyData);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch energy data: ${error}` },
      { status: 500 }
    );
  }
};
