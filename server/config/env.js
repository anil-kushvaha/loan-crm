import dotenv from "dotenv";
dotenv.config();

const requiredEnv = ["MONGO_URI", "JWT_SECRET", "PORT"];
for (const env of requiredEnv) {
  if (!process.env[env]) {
    console.error(`Missing required env: ${env}`);
    process.exit(1);
  }
}

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || "development",
};
