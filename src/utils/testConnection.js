// src/utils/testConnection.js
import mongoose from "mongoose";

const testConnection = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
    console.log("✅ Database connection test successful!");

    // Test a simple query
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "📁 Available collections:",
      collections.map((c) => c.name)
    );

    mongoose.disconnect();
  } catch (error) {
    console.error("❌ Database connection test failed:", error.message);
  }
};

// Uncomment to test
// testConnection();

export default testConnection;
