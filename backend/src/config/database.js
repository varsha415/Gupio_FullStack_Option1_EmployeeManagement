import mongoose from "mongoose";

export async function connectDatabase() {
  const { MONGO_URI } = process.env;
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is required. Set it in the backend environment.");
  }
  if (/[<>]/.test(MONGO_URI) || MONGO_URI.includes("your-atlas-cluster-host")) {
    throw new Error(
      "MONGO_URI still contains placeholder values. Copy the connection string from MongoDB Atlas > Connect > Drivers, then replace its password and database name placeholders."
    );
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.info(`MongoDB connected: ${mongoose.connection.name}`);
}