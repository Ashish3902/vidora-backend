
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Remove deprecated options
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${process.env.DB_NAME || "videodb"}`,
      {
        // Remove deprecated options:
        // useNewUrlParser: true,     ❌ Remove this
        // useUnifiedTopology: true,  ❌ Remove this

        // Keep only these modern options:
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4, // Use IPv4
        retryWrites: true,
        w: "majority",
      }
    );

    console.log(
      `☘️ MongoDB connected! DB HOST: ${connectionInstance.connection.host}`
    );
    console.log(`📊 Database: ${connectionInstance.connection.name}`);
  } catch (error) {
    console.error("❌ MONGODB connection FAILED:", error.message);
    process.exit(1);
  }
};

export default connectDB;
