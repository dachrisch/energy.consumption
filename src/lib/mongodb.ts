import mongoose from "mongoose";

export const connectDB = async (): Promise<boolean> => {
  if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
  }

  return mongoose
    .connect(uri, {dbName: 'energy_consumption'})
    .then(({ connection }) => connection.readyState === 1);
};

export default connectDB;
