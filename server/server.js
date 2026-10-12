
import express from "express";
import cors from "cors";

import pool, { initializeDatabase } from "./db.js";

import deviceRoutes from "./routes/devices.js";
import telemetryRoutes from "./routes/telemetry.js";
import threatRoutes from "./routes/threats.js";
import responseRoutes from "./routes/responses.js";

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_URL
  ].filter(Boolean)
}));

app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    service: "Mobile Botnet Detection API"
  });
});

// Dashboard statistics
app.get("/api/dashboard", async (req, res, next) => {
  try {
    const devices = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE status = 'NORMAL'
        )::int AS normal,
        COUNT(*) FILTER (
          WHERE status = 'SUSPICIOUS'
        )::int AS suspicious,
        COUNT(*) FILTER (
          WHERE status = 'BOTNET'
        )::int AS botnet,
        COUNT(*) FILTER (
          WHERE status = 'ISOLATED'
        )::int AS isolated,
        COALESCE(
          ROUND(AVG(risk_score)), 0
        )::int AS network_risk
      FROM devices
    `);

    const threats = await pool.query(`
      SELECT COUNT(*)::int AS active_threats
      FROM threats
      WHERE status = 'ACTIVE'
    `);

    res.json({
      ...devices.rows[0],
      ...threats.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// API routes
app.use("/api/devices", deviceRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/threats", threatRoutes);
app.use("/api/responses", responseRoutes);

// Central error handler
app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    error: "Internal server error"
  });
});

// Start only after PostgreSQL is ready
async function startServer() {
  try {
    await initializeDatabase();

    const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Backend running on http://0.0.0.0:${PORT}`
  );
  console.log("PostgreSQL connected successfully");
});

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Stop the existing process or set PORT to a free value and restart.`
        );
      } else {
        console.error("Backend startup failed:", error.message);
      }

      process.exit(1);
    });
  } catch (error) {
    console.error(
      "Backend startup failed:",
      error.message
    );

    process.exit(1);
  }
}

startServer();