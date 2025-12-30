import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export const GET = async () => {
  let status = "healthy";
  let databaseStatus: { status: string; error?: string } = { status: "connected" };

  try {
    await connectDB();
  } catch (error) {
    status = "unhealthy";
    databaseStatus = {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    database: databaseStatus
  });
}; 