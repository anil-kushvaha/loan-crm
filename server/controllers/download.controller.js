import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generatePdf } from "html-pdf-node";
import axios from "axios";
import Applicant from "../models/applicant.model.js";
import LoanApplication from "../models/LoanApplication.js";
import { buildFullProfileHTML } from "../utils/pdfGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generatePDFFromHTML = async (htmlContent, outputPath) => {
  const options = { format: "A4", printBackground: true };
  const file = { content: htmlContent };
  const pdfBuffer = await generatePdf(file, options);
  fs.writeFileSync(outputPath, pdfBuffer);
};

// Download a remote file and return a readable stream
const downloadFile = async (url) => {
  const response = await axios({
    method: "GET",
    url,
    responseType: "stream",
    timeout: 30000,
  });
  return response.data;
};

export const downloadFullProfileZip = async (req, res) => {
  const { customerId } = req.params;
  try {
    const { default: archiver } = await import("archiver");
    const applicant = await Applicant.findOne({ customerId });
    if (!applicant) {
      return res
        .status(404)
        .json({ success: false, message: "Applicant not found" });
    }
    const loanApps = await LoanApplication.find({
      applicantId: applicant._id,
    }).sort({ appliedAt: -1 });

    // 1. Generate PDF profile
    const htmlContent = buildFullProfileHTML(applicant, loanApps);
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const pdfPath = path.join(tempDir, `profile_${applicant.customerId}.pdf`);
    await generatePDFFromHTML(htmlContent, pdfPath);

    // 2. Create ZIP
    const zipPath = path.join(
      tempDir,
      `full_profile_${applicant.customerId}.zip`,
    );
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      res.download(
        zipPath,
        `Full_Profile_${applicant.customerId}.zip`,
        (err) => {
          // Cleanup
          try {
            fs.unlinkSync(pdfPath);
          } catch (e) {}
          try {
            fs.unlinkSync(zipPath);
          } catch (e) {}
          if (err) console.error("Download error:", err);
        },
      );
    });

    archive.pipe(output);
    archive.file(pdfPath, {
      name: `applicant_profile_${applicant.customerId}.pdf`,
    });

    // 3. Add each uploaded document (remote files)
    for (const doc of applicant.documents) {
      const fileUrl = doc.documentUrl;
      if (!fileUrl) {
        console.warn("Document has no URL:", doc);
        continue;
      }
      try {
        // Create a safe file name
        const safeName = `${doc.documentName}_${doc.documentType}`.replace(
          /[^a-z0-9._-]/gi,
          "_",
        );
        const ext = path.extname(fileUrl).split("?")[0]; // remove query params
        const fileName = `${safeName}${ext}`;
        const fileStream = await downloadFile(fileUrl);
        archive.append(fileStream, { name: fileName });
        console.log(`Added document: ${fileName} from ${fileUrl}`);
      } catch (err) {
        console.error(
          `Failed to download document ${doc.documentName} (${doc.documentUrl}):`,
          err.message,
        );
        // Continue with other files – don't break the whole ZIP
      }
    }

    await archive.finalize();
  } catch (error) {
    console.error("ZIP error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
