"use server";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Energy from "@/models/Energy";

export const GET = async () => {
  try {
    await connectDB();
    const energyData = await Energy.find();
    return NextResponse.json(energyData);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: `Failed to fetch energy data: ${error}` },
      { status: 500 }
    );
  }
};
