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

export const POST = async (request: Request) => {
  try {
    const data = await request.json();
    const energyData = new EnergyData({...data});
    await connectDB();
    energyData.save();
    return NextResponse.json(energyData);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to add energy data: ${error}` },
      { status: 500 }
    );
  }
};

export const DELETE = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: `Missing ID parameter in searchParams: ${searchParams}` },
        { status: 400 }
      );
    }

    await connectDB();
    EnergyData.deleteOne({_id: id});
       return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to delete energy data: ${error}` },
      { status: 500 }
    );
  }
};
