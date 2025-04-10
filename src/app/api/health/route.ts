import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export const GET = async () => {
  try {
    // Check database connection
    const dbConnected = await connectDB();
    
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        status: dbConnected ? "connected" : "disconnected"
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }, { status: 500 });
  }
}; 