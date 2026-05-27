import express from "express";
import { authMiddleware, restrictTo } from "../middlewares/auth.js";
import {
  createApplicant,
  getApplicant,
  updatePersonalDetails,
  updateAddressDetails,
  updateEmploymentDetails,
  updateCoApplicants,
  uploadDocument,
} from "../controllers/applicant.controller.js";
import { downloadFullProfileZip } from "../controllers/download.controller.js";
import multer from "multer";

// Use memory storage – files will be available as buffer
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
router.use(authMiddleware);

router.post("/create", createApplicant);
router.get(
  "/download-full-profile/:customerId",
  restrictTo("admin", "employee"),
  downloadFullProfileZip,
);
router.get("/:customerId", getApplicant);
router.put("/personal/:applicantId", updatePersonalDetails);
router.put("/address/:applicantId", updateAddressDetails);
router.put("/employment/:applicantId", updateEmploymentDetails);
router.put("/co-applicants/:applicantId", updateCoApplicants);
router.post("/documents/:applicantId", upload.single("file"), uploadDocument);

export default router;
