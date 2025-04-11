import { connectDB } from "@/lib/mongodb";
import FeatureFlag from "@/models/FeatureFlag";

const initFeatureFlags = async () => {
  try {
    await connectDB();
    
    // Initialize registration feature flag
    await FeatureFlag.findOneAndUpdate(
      { name: "registration" },
      { enabled: true },
      { upsert: true, new: true }
    );

    console.log("Feature flags initialized successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing feature flags:", error);
    process.exit(1);
  }
};

initFeatureFlags(); 