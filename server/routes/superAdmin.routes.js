import express from "express";
import { createSuperAdmin } from "../controllers/superAdmin.controller.js";

const router = express.Router();

router.post("/create-super-admin", createSuperAdmin); // no asyncHandler wrapper

export default router;
