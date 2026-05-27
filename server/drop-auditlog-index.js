import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const dropIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const collection = mongoose.connection.db.collection("auditlogs");

    // Show existing indexes
    const indexes = await collection.indexes();
    console.log(
      "Existing indexes:",
      indexes.map((i) => i.name),
    );

    // Drop the bad unique index on customerId
    await collection.dropIndex("customerId_1");
    console.log("✅ Successfully dropped index 'customerId_1'");

    // Verify remaining indexes
    const remaining = await collection.indexes();
    console.log(
      "Remaining indexes:",
      remaining.map((i) => i.name),
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.message.includes("index not found")) {
      console.log("Index 'customerId_1' already removed – you're good to go!");
    }
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

dropIndex();
