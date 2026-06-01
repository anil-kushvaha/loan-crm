import express from "express";
import { login, setPassword } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", login);
router.post("/set-password", setPassword); // <-- add this

export default router;
