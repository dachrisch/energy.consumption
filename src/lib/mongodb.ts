import mongoose from "mongoose";

export const connectDB = async (): Promise<boolean> => {
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing environment variable: "MONGODB_URI"');
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  return mongoose
    .connect(uri, { dbName: "energy_consumption" })
    .then(({ connection }) => {
      if (connection.readyState !== 1) {
        throw new Error("Failed to connect to the database");
      }
      return true;
    })
    .catch((error) => {
      throw new Error(`Database connection error: ${error.message}`);
    });
};

export default connectDB;
