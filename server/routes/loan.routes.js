import express from "express";
import {
  applyForLoan,
  getMyApplications,
  getAllApplications,
  updateApplicationStatus,
} from "../controllers/loanApplication.controller.js";
import { authMiddleware, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

// Customer routes
router.post(
  "/apply/:applicantId",
  authMiddleware,
  restrictTo("customer"),
  applyForLoan,
);
router.get(
  "/my-applications/:applicantId",
  authMiddleware,
  restrictTo("customer"),
  getMyApplications,
);

// Admin/Employee routes
router.get(
  "/all",
  authMiddleware,
  restrictTo("admin", "employee"),
  getAllApplications,
);
router.put(
  "/status/:applicationId",
  authMiddleware,
  restrictTo("admin", "employee"),
  updateApplicationStatus,
);

export default router;
