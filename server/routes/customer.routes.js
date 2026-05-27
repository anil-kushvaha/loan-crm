import express from "express";
import {
  convertEnquiryToCustomer,
  getAllCustomers,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller.js";

import { authMiddleware, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

router.use(authMiddleware, restrictTo("employee", "admin"));

// Convert enquiry to customer
router.post("/convert-enquiry", convertEnquiryToCustomer);

// Get all customers
router.get("/customers", getAllCustomers);

// Update customer
router.put("/customer/:id", updateCustomer);

// Delete customer
router.delete("/customer/:id", deleteCustomer);

export default router;
