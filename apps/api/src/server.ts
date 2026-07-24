import cors from "cors";
import express from "express";
import { db } from "./db/client";
import "./db/migrate";
import { dashboardRouter } from "./routes/dashboard";
import { sitesRouter } from "./routes/sites";
import { studiesRouter } from "./routes/studies";
import { uploadsRouter } from "./routes/uploads";
import { configurationRouter } from "./routes/configuration";
import { aiRouter } from "./routes/ai";

const app = express();

app.use(cors());
app.use(express.json({ limit: "8mb" }));

app.get("/health", (_req, res) => {
  const result = db.prepare("SELECT 1 AS ok").get();
  res.json({ status: "ok", db: result });
});

app.use("/api/dashboard", dashboardRouter);
app.use("/api/sites", sitesRouter);
app.use("/api/studies", studiesRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/configuration", configurationRouter);
app.use("/api/ai", aiRouter);

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
