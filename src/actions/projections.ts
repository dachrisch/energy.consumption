"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getProjectionService } from "@/services/serviceFactory";
import { EnergyOptions } from "@/app/types";
import { ProjectionResult } from "@/services/projections/ProjectionService";

// Initialize server infrastructure
import "@/lib/serverInit";

/**
 * Get projections for the current user
 */
export const getProjectionsAction = async (
  type: EnergyOptions
): Promise<ProjectionResult | null> => {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error("User not authenticated");
    }

    const projectionService = getProjectionService();
    return await projectionService.getProjections(session.user.id, type);
  } catch (error: any) {
    if (error?.message === "User not authenticated") {
      throw error;
    }
    console.error(`[getProjectionsAction] Error:`, error);
    return null;
  }
};