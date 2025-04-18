"use server";

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Contract from "@/models/EnergyContract";

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

export const POST = async (request: Request) => {
  try {
    const data = await request.json();
    const contract = new Contract({...data});
    await connectDB();
    await contract.save();
    return NextResponse.json(contract);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to add contract: ${error}` },
      { status: 500 }
    );
  }
};

export const DELETE = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: `Missing ID parameter in searchParams: ${searchParams}` },
        { status: 400 }
      );
    }

    await connectDB();
    await Contract.deleteOne({_id: id});
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to delete contract: ${error}` },
      { status: 500 }
    );
  }
};