import crypto from "node:crypto";
import { parse as parseCsv } from "csv-parse/sync";
import XLSX from "xlsx";
import { z } from "zod";
import { db } from "../db/client";

export type UploadCategory =
  | "site_status"
  | "personnel_log"
  | "retention_tracker"
  | "enrollment_tracker"
  | "study_metadata"
  | "documents";

export type UploadResult = {
  uploadId: string;
  category: string;
  fileName: string;
  status: "success" | "failed";
  inserted: number;
  updated: number;
  duplicates: number;
  validationErrors: Array<{ row: number; message: string }>;
};

const categorySchema = z.enum([
  "site_status",
  "personnel_log",
  "retention_tracker",
  "enrollment_tracker",
  "study_metadata",
  "documents",
]);

const requiredColumns: Record<Exclude<UploadCategory, "documents">, string[]> = {
  site_status: ["study_id", "site_id", "site_number", "site_name", "country", "sponsor", "pi", "status", "status_date"],
  personnel_log: ["study_id", "site_id", "person_name", "role", "is_active"],
  retention_tracker: ["study_id", "site_id", "case_date", "case_type", "case_status", "severity"],
  enrollment_tracker: [
    "study_id",
    "site_id",
    "metric_date",
    "target_enrollment",
    "actual_enrollment",
    "screening_count",
    "randomized_count",
    "ltfu_cases",
    "withdrawals",
    "ip_discontinuations",
  ],
  study_metadata: ["study_id", "protocol_code", "title", "sponsor", "company", "country", "status"],
};

const parseTable = (buffer: Buffer, fileName: string): Record<string, string>[] => {
  if (fileName.toLowerCase().endsWith(".csv")) {
    return parseCsv(buffer.toString("utf8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];
  }

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<string, string>[];
};

const ensureStudyAndSite = (row: Record<string, string>) => {
  const upsertStudy = db.prepare(
    `INSERT INTO studies (study_id, protocol_code, title, sponsor, company, country, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(study_id) DO UPDATE SET
       protocol_code = excluded.protocol_code,
       title = excluded.title,
       sponsor = excluded.sponsor,
       company = excluded.company,
       country = excluded.country,
       status = excluded.status,
       updated_at = CURRENT_TIMESTAMP`,
  );

  const upsertSite = db.prepare(
    `INSERT INTO sites (
      site_id, study_id, site_number, site_name, country, sponsor, principal_investigator, site_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(site_id) DO UPDATE SET
      study_id = excluded.study_id,
      site_number = excluded.site_number,
      site_name = excluded.site_name,
      country = excluded.country,
      sponsor = excluded.sponsor,
      principal_investigator = excluded.principal_investigator,
      site_status = excluded.site_status,
      updated_at = CURRENT_TIMESTAMP`,
  );

  const studyId = row.study_id?.trim();
  if (studyId) {
    upsertStudy.run(
      studyId,
      row.protocol_code?.trim() || `P-${studyId}`,
      row.title?.trim() || `Study ${studyId}`,
      row.sponsor?.trim() || "Unknown Sponsor",
      row.company?.trim() || row.sponsor?.trim() || "Unknown Company",
      row.country?.trim() || "Unknown",
      row.status?.trim() || "active",
    );
  }

  const siteId = row.site_id?.trim();
  if (studyId && siteId) {
    upsertSite.run(
      siteId,
      studyId,
      row.site_number?.trim() || siteId,
      row.site_name?.trim() || `Site ${siteId}`,
      row.country?.trim() || "Unknown",
      row.sponsor?.trim() || "Unknown Sponsor",
      row.pi?.trim() || row.principal_investigator?.trim() || "Unknown PI",
      row.status?.trim() || "active",
    );
  }
};

const validators: Partial<Record<UploadCategory, (row: Record<string, string>) => string[]>> = {
  site_status: (row) => {
    const errors: string[] = [];
    if (!row.site_id) errors.push("site_id is required");
    if (!row.study_id) errors.push("study_id is required");
    if (!row.status_date) errors.push("status_date is required");
    return errors;
  },
  personnel_log: (row) => {
    const errors: string[] = [];
    if (!row.person_name) errors.push("person_name is required");
    if (!row.role) errors.push("role is required");
    return errors;
  },
  retention_tracker: (row) => {
    const errors: string[] = [];
    if (!row.case_date) errors.push("case_date is required");
    if (!row.case_type) errors.push("case_type is required");
    if (!["open", "closed"].includes((row.case_status || "").toLowerCase())) {
      errors.push("case_status must be open or closed");
    }
    return errors;
  },
  enrollment_tracker: (row) => {
    const errors: string[] = [];
    if (!row.metric_date) errors.push("metric_date is required");
    if (Number(row.actual_enrollment) < 0) errors.push("actual_enrollment must be >= 0");
    if (Number(row.target_enrollment) < 0) errors.push("target_enrollment must be >= 0");
    return errors;
  },
  study_metadata: (row) => {
    const errors: string[] = [];
    if (!row.study_id) errors.push("study_id is required");
    if (!row.protocol_code) errors.push("protocol_code is required");
    if (!row.title) errors.push("title is required");
    return errors;
  },
};

export const processUpload = (params: {
  fileName: string;
  categoryInput: string;
  buffer: Buffer;
}): UploadResult => {
  const uploadId = crypto.randomUUID();
  const categoryResult = categorySchema.safeParse(params.categoryInput);

  if (!categoryResult.success) {
    return {
      uploadId,
      category: params.categoryInput,
      fileName: params.fileName,
      status: "failed",
      inserted: 0,
      updated: 0,
      duplicates: 0,
      validationErrors: [{ row: 0, message: "Invalid category" }],
    };
  }

  const category = categoryResult.data;
  const fileHash = crypto.createHash("sha256").update(params.buffer).digest("hex");

  const existingUpload = db
    .prepare("SELECT upload_id FROM uploads WHERE file_hash = ? AND category = ?")
    .get(fileHash, category) as { upload_id: string } | undefined;

  if (existingUpload) {
    return {
      uploadId,
      category,
      fileName: params.fileName,
      status: "failed",
      inserted: 0,
      updated: 0,
      duplicates: 1,
      validationErrors: [{ row: 0, message: "Duplicate upload detected" }],
    };
  }

  if (category === "documents") {
    db.prepare(
      `INSERT INTO uploads (upload_id, category, file_name, file_hash, status, inserted_count, updated_count, duplicate_count, validation_errors)
       VALUES (?, ?, ?, ?, 'success', 0, 0, 0, '[]')`,
    ).run(uploadId, category, params.fileName, fileHash);

    return {
      uploadId,
      category,
      fileName: params.fileName,
      status: "success",
      inserted: 0,
      updated: 0,
      duplicates: 0,
      validationErrors: [],
    };
  }

  const rows = parseTable(params.buffer, params.fileName);
  const expectedColumns = requiredColumns[category];
  const validationErrors: Array<{ row: number; message: string }> = [];

  if (rows.length === 0) {
    validationErrors.push({ row: 0, message: "No rows found in upload" });
  } else {
    const availableColumns = Object.keys(rows[0]);
    for (const column of expectedColumns) {
      if (!availableColumns.includes(column)) {
        validationErrors.push({ row: 0, message: `Missing required column: ${column}` });
      }
    }
  }

  let inserted = 0;
  let updated = 0;

  const insertStatus = db.prepare(
    `INSERT INTO site_status (site_id, study_id, status_date, site_status, notes)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertPersonnel = db.prepare(
    `INSERT INTO personnel (site_id, study_id, person_name, role, is_active, capacity_ratio)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertRetention = db.prepare(
    `INSERT INTO retention_cases (site_id, study_id, case_date, case_type, case_status, severity)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const upsertEnrollment = db.prepare(
    `INSERT INTO enrollment_metrics (
      site_id, study_id, metric_date, target_enrollment, actual_enrollment,
      screening_count, randomized_count, ltfu_cases, withdrawals, ip_discontinuations
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(site_id, study_id, metric_date) DO UPDATE SET
      target_enrollment = excluded.target_enrollment,
      actual_enrollment = excluded.actual_enrollment,
      screening_count = excluded.screening_count,
      randomized_count = excluded.randomized_count,
      ltfu_cases = excluded.ltfu_cases,
      withdrawals = excluded.withdrawals,
      ip_discontinuations = excluded.ip_discontinuations`,
  );
  const upsertStudy = db.prepare(
    `INSERT INTO studies (study_id, protocol_code, title, sponsor, company, country, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(study_id) DO UPDATE SET
       protocol_code = excluded.protocol_code,
       title = excluded.title,
       sponsor = excluded.sponsor,
       company = excluded.company,
       country = excluded.country,
       status = excluded.status,
       updated_at = CURRENT_TIMESTAMP`,
  );

  const tx = db.transaction(() => {
    rows.forEach((row, index) => {
      const rowErrors = validators[category]?.(row) ?? [];
      for (const error of rowErrors) {
        validationErrors.push({ row: index + 2, message: error });
      }

      if (rowErrors.length > 0) {
        return;
      }

      ensureStudyAndSite(row);

      if (category === "site_status") {
        insertStatus.run(row.site_id, row.study_id, row.status_date, row.status, row.notes ?? "");
        db.prepare("UPDATE sites SET site_status = ?, updated_at = CURRENT_TIMESTAMP WHERE site_id = ?").run(
          row.status,
          row.site_id,
        );
        inserted += 1;
      }

      if (category === "personnel_log") {
        insertPersonnel.run(
          row.site_id,
          row.study_id,
          row.person_name,
          row.role,
          String(row.is_active).toLowerCase() === "true" || String(row.is_active) === "1" ? 1 : 0,
          Number(row.capacity_ratio || 1),
        );
        inserted += 1;
      }

      if (category === "retention_tracker") {
        insertRetention.run(
          row.site_id,
          row.study_id,
          row.case_date,
          row.case_type,
          row.case_status.toLowerCase(),
          row.severity.toLowerCase(),
        );
        inserted += 1;
      }

      if (category === "enrollment_tracker") {
        const result = upsertEnrollment.run(
          row.site_id,
          row.study_id,
          row.metric_date,
          Number(row.target_enrollment || 0),
          Number(row.actual_enrollment || 0),
          Number(row.screening_count || 0),
          Number(row.randomized_count || 0),
          Number(row.ltfu_cases || 0),
          Number(row.withdrawals || 0),
          Number(row.ip_discontinuations || 0),
        );

        if (result.changes > 0) {
          inserted += 1;
        } else {
          updated += 1;
        }
      }

      if (category === "study_metadata") {
        upsertStudy.run(
          row.study_id,
          row.protocol_code,
          row.title,
          row.sponsor,
          row.company,
          row.country,
          row.status,
        );
        inserted += 1;
      }
    });
  });

  if (validationErrors.length === 0) {
    tx();
  }

  const status = validationErrors.length === 0 ? "success" : "failed";

  db.prepare(
    `INSERT INTO uploads (
      upload_id, category, file_name, file_hash, status, inserted_count, updated_count, duplicate_count, validation_errors
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    uploadId,
    category,
    params.fileName,
    fileHash,
    status,
    inserted,
    updated,
    0,
    JSON.stringify(validationErrors),
  );

  return {
    uploadId,
    category,
    fileName: params.fileName,
    status,
    inserted,
    updated,
    duplicates: 0,
    validationErrors,
  };
};
