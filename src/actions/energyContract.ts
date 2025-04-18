"use server";
import { EnergyContractBase, ApiResult } from "@/app/types";
import connectDB from "@/lib/mongodb";
import EnergyContract from "@/models/EnergyContract";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import { InsertOneResult } from "mongodb";

export const addContract = async (
  newData: EnergyContractBase
): Promise<ApiResult> => {
  await connectDB();
  // Get the session
  const session = await getServerSession(authOptions);
  console.log(`session ${session?.user}`);

  if (!session?.user?.id) {
    // If the user is not logged in or doesn't have an `id`, return an error
    return { success: false };
  }
  // Add userId to the energy data
  const energyContract = new EnergyContract({
    ...newData,
    userId: session.user.id,
  });

  console.log(`energyData ${energyContract}`);

  return energyContract.save().then((createResult: InsertOneResult) => ({
    success: "_id" in createResult,
  }));
};
