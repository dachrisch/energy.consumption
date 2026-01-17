"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getProjectionService } from "@/services/serviceFactory";
import { EnergyOptions } from "@/app/types";
import { ProjectionResult } from "@/services/projections/ProjectionService";

/**
 * Get projections for the current user
 * 
 * @param type - Energy type (power/gas)
 * @returns Projection result or null if not available
 */
export const getProjectionsAction = async (
  type: EnergyOptions
): Promise<ProjectionResult | null> => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const projectionService = getProjectionService();
  return await projectionService.getProjections(session.user.id, type);
};
