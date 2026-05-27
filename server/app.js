import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { config } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import applicantRoutes from "./routes/applicant.routes.js";
import enquiryRoutes from "./routes/enquiry.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import superAdminRoutes from "./routes/superAdmin.routes.js";
import loanRoutes from "./routes/loan.routes.js";

connectDB();

const app = express();

// Security & performance middlewares
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api", limiter);

// API versioning
app.use("/api/v1/applicant", applicantRoutes);
app.use("/api/enquiry", enquiryRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customer", customerRoutes);
if (process.env.ALLOW_SUPER_ADMIN_CREATION === "true") {
  app.use("/api/auth", superAdminRoutes);
  console.log("⚠️ Super admin creation route enabled");
}
app.use("/api/loans", loanRoutes);

// Health check
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

// 404 handler
app.use((req, res) =>
  res.status(404).json({ success: false, message: "Route not found" }),
);

// Global error handler
app.use(errorHandler);

export default app;
