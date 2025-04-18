"use server";
import { ContractBase, ApiResult } from "@/app/types";
import connectDB from "@/lib/mongodb";
import Contract from "@/models/Contract";
import { DeleteResult, InsertOneResult, ObjectId } from "mongodb";

export const addOrUpdateContractAction = async (
  contractData: ContractBase & { _id?: string }
): Promise<ApiResult> =>
  connectDB().then(async () => {
    if (contractData._id) {
      // Update existing contract
      Contract.findByIdAndUpdate(new ObjectId(contractData._id), contractData, {
        new: true,
      }).then((result) => ({ success: !!result }));
    } else {
      // Create new contract
      const contract = new Contract(contractData);
      return contract.save().then((createResult: InsertOneResult) => ({
        success: "_id" in createResult,
      }));
    }
  });

export const deleteContractAction = async (id: string): Promise<ApiResult> =>
  connectDB().then(() =>
    Contract.deleteOne({ _id: id })
      .then((deleteResult: DeleteResult) => ({
        success: deleteResult != undefined,
      }))
  );
