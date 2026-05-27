import User from "../models/user.model.js";
import { asyncHandler } from "../middlewares/errorHandler.js";

// CREATE EMPLOYEE
export const createEmployee = asyncHandler(async (req, res) => {
  const { name, email, password, mobile } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email and password required",
    });
  }

  const existing = await User.findOne({ email });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Email already exists",
    });
  }

  const employee = new User({
    name,
    email,
    password,
    role: "employee",
    mobile: mobile || "",
  });

  await employee.save();

  res.status(201).json({
    success: true,
    message: "Employee created successfully",
    data: employee,
  });
});

// GET ALL EMPLOYEES (ADMIN ONLY)
export const getAllEmployees = asyncHandler(async (req, res) => {
  const employees = await User.find({ role: "employee" })
    .select("-password")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: employees.length,
    data: employees,
  });
});

// UPDATE EMPLOYEE
export const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, mobile } = req.body;

  const employee = await User.findOne({
    _id: id,
    role: "employee",
  });

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: "Employee not found",
    });
  }

  employee.name = name || employee.name;
  employee.email = email || employee.email;
  employee.mobile = mobile || employee.mobile;

  await employee.save();

  res.status(200).json({
    success: true,
    message: "Employee updated successfully",
    data: employee,
  });
});

// DELETE EMPLOYEE
export const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const employee = await User.findOne({
    _id: id,
    role: "employee",
  });

  if (!employee) {
    return res.status(404).json({
      success: false,
      message: "Employee not found",
    });
  }

  await employee.deleteOne();

  res.status(200).json({
    success: true,
    message: "Employee deleted successfully",
  });
});
