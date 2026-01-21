"use server";
import { connectDB } from "@/lib/mongodb";
import Contract from "@/models/Contract";
import { ContractBase, ContractType } from "@/app/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export async function addContractAction(data: ContractBase): Promise<{ success: boolean; error?: string }> {
  return addOrUpdateContractAction(data);
}

export async function addOrUpdateContractAction(data: ContractBase & { _id?: string }): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    await connectDB();
    if (data._id) {
      await Contract.findOneAndUpdate(
        { _id: data._id, userId: session.user.id },
        { ...data },
        { new: true }
      );
    } else {
      const contract = new Contract({
        ...data,
        userId: session.user.id
      });
      await contract.save();
    }
    return { success: true };
  } catch (err: any) {
    console.error("[addOrUpdateContractAction] Error:", err);
    return { success: false, error: err.message || "Failed to save contract" };
  }
}

export async function deleteContractAction(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  try {
    await connectDB();
    await Contract.findOneAndDelete({ _id: id, userId: session.user.id });
    return { success: true };
  } catch (err: any) {
    console.error("[deleteContractAction] Error:", err);
    return { success: false, error: err.message || "Failed to delete contract" };
  }
}

export async function getContractForMeter(meterId: string): Promise<ContractType | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  await connectDB();
  return Contract.findOne({ meterId, userId: session.user.id }).sort({ startDate: -1 }).lean();
}

export async function getContractsAction(): Promise<ContractType[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  await connectDB();
  return Contract.find({ userId: session.user.id }).sort({ startDate: -1 }).lean();
}
