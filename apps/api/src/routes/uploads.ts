import { Router } from "express";
import multer from "multer";
import { processUpload } from "../services/uploadPipeline";
import { recomputeScores } from "../services/scoring";
import { db } from "../db/client";

export const uploadsRouter = Router();

const upload = multer({ storage: multer.memoryStorage() });

uploadsRouter.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "Missing file" });
    return;
  }

  const category = String(req.body.category || "");
  const result = processUpload({
    fileName: req.file.originalname,
    categoryInput: category,
    buffer: req.file.buffer,
  });

  if (result.status === "success") {
    recomputeScores();
  }

  res.status(result.status === "success" ? 200 : 400).json(result);
});

uploadsRouter.get("/history", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT upload_id, category, file_name, uploaded_at, status, inserted_count, updated_count,
              duplicate_count, validation_errors
       FROM uploads
       ORDER BY uploaded_at DESC`,
    )
    .all();

  res.json(
    rows.map((row: any) => ({
      ...row,
      validation_errors: JSON.parse(row.validation_errors),
    })),
  );
});
