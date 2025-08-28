console.log("DB ENV:", process.env.MONGO_DB_URI); // Debug log
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGO_DB_URI);
    console.log(
      `\nMongoDB connected! Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MONGODB connection FAILED ", error);
    process.exit(1);
  }
};

export default connectDB;
