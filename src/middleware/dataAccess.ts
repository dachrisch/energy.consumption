import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectDB from "@/lib/mongodb";

// Extend NextRequest to include userId
declare module "next/server" {
  interface NextRequest {
    userId?: string;
  }
}
// Define a specific type for the handler
type MiddlewareHandler = (req: NextRequest) => Promise<NextResponse>;
export async function withDataAccess(
  req: NextRequest,
  handler: MiddlewareHandler
) {
  try {
    // Get the current user's session
    const token = await getToken({ req });
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await connectDB();

    // Add user filter to the request
    req.userId = token.sub;

    // Execute the handler with the modified request
    return handler(req);
  } catch (error) {
    console.error("Data access error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

