import mongoose from "mongoose";

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/energy_consumption';
  
  // Basic validation to prevent "Invalid scheme" error
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    console.warn(`[MongoDB] Invalid URI scheme detected: "${uri}". Falling back to localhost.`);
    uri = 'mongodb://localhost:27017/energy_consumption';
  }

  return mongoose
    .connect(uri)
    .then((mongoose) => {
      return mongoose;
    })
    .catch((error) => {
      throw new Error(`Database connection error: ${error.message}`);
    });
};

export default connectDB;