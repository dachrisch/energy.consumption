"use server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NewUserType } from "../app/types";
import { InsertOneResult } from "mongodb";

export const register = async (newUser: NewUserType) => {
  const { email, password, name } = newUser;
  await connectDB();
  const userFound = await User.findOne({ email });
  if (userFound) {
    return {
      error: "Email already exists!",
    };
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    name,
    email,
    password: hashedPassword,
  });
  return user
    .save()
    .then((createResult: InsertOneResult) => ({
      success: "_id" in createResult,
    }))
    .catch((error: Error) => error);
};
