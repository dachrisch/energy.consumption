"use server";
import { ContractBase, ApiResult } from "@/app/types";
import connectDB from "@/lib/mongodb";
import Contract from "@/models/Contract";
import { InsertOneResult } from "mongodb";

export const addContractAction = async (
  contractData: ContractBase
): Promise<ApiResult> => {
  await connectDB();
  
  const contract = new Contract(contractData);

  return contract.save().then((createResult: InsertOneResult) => ({
    success: "_id" in createResult,
  }));
};
