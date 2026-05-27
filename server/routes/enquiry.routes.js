import express from "express";
import {
  submitEnquiry,
  getAllEnquiries,
} from "../controllers/enquiry.controller.js";

import { authMiddleware, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

// PUBLIC
router.post("/submit", submitEnquiry);

// ADMIN / EMPLOYEE
router.get(
  "/all",
  authMiddleware,
  restrictTo("employee", "admin"),
  getAllEnquiries,
);

export default router;
