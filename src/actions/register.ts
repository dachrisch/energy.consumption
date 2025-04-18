"use server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NewUserType } from "../app/types";
import { InsertOneResult } from "mongodb";
import { isFeatureEnabled } from "@/lib/featureFlags";

export const register = async (newUser: NewUserType): Promise<{success?: boolean, error?: string}> => {
  return isFeatureEnabled("registration")
    .then((registrationEnabled) => {
      if (!registrationEnabled) {
        return Promise.reject("Registration is currently disabled");
      }

      const { email, password, name } = newUser;
      return connectDB()
        .then(() => User.findOne({ email }))
        .then((userFound) => {
          if (userFound) {
            return Promise.reject("Email already exists!");
          }
          return bcrypt.hash(password, 10);
        })
        .then((hashedPassword) => {
          const user = new User({
            name,
            email,
            password: hashedPassword,
          });
          return user.save();
        })
        .then((createResult: InsertOneResult) => ({
          success: "_id" in createResult
        }));
    })
    .catch((error) => ({
      error: typeof error === 'string' ? error : error.message
    }));
};
