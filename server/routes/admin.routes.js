import express from "express";
import {
  createEmployee,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
} from "../controllers/admin.controller.js";

import { authMiddleware, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

// Only admin access
router.use(authMiddleware, restrictTo("admin"));

// Create Employee
router.post("/create-employee", createEmployee);

// Get All Employees
router.get("/employees", getAllEmployees);

// Update Employee
router.put("/employee/:id", updateEmployee);

// Delete Employee
router.delete("/employee/:id", deleteEmployee);

export default router;
