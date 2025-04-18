"use server";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Contract from "@/models/Contract";

export const GET = async () => {
  try {
    await connectDB();
    const contracts = await Contract.find({});
    return NextResponse.json(contracts);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch contracts: ${error}` },
      { status: 500 }
    );
  }
};
