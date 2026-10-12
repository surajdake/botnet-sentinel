import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
const pythonExecutable = process.env.PYTHON_BIN || "python";
const predictScript = path.resolve(projectRoot, "ml", "predict.py");

function fallbackHeuristic(telemetry = {}) {
  const values = [
    Number(telemetry.network_frequency || 0),
    Number(telemetry.failed_connections || 0),
    Number(telemetry.suspicious_requests || 0),
    Number(telemetry.dns_requests || 0),
    Number(telemetry.unique_destinations || 0),
    Number(telemetry.periodic_connections || 0),
    Number(telemetry.upload_bytes || 0) / 10_000_000,
    Number(telemetry.download_bytes || 0) / 10_000_000
  ];

  const score = Math.min(
    1,
    values.reduce((sum, value) => sum + Math.min(1, value / 80), 0) / values.length
  );

  const anomaly = score >= 0.55;

  return {
    anomaly,
    anomaly_score: Number(score.toFixed(4)),
    confidence: Number(Math.min(0.98, 0.55 + score * 0.35).toFixed(4)),
    model: "IsolationForest",
    fallback: true
  };
}

export async function getAnomalyPrediction(telemetry = {}) {
  try {
    const payload = {
      network_frequency: Number(telemetry.network_frequency || 0),
      failed_connections: Number(telemetry.failed_connections || 0),
      suspicious_requests: Number(telemetry.suspicious_requests || 0),
      dns_requests: Number(telemetry.dns_requests || 0),
      unique_destinations: Number(telemetry.unique_destinations || 0),
      periodic_connections: Number(telemetry.periodic_connections || 0),
      upload_bytes: Number(telemetry.upload_bytes || 0),
      download_bytes: Number(telemetry.download_bytes || 0)
    };

    const stdout = execFileSync(
      pythonExecutable,
      [predictScript],
      {
        cwd: projectRoot,
        input: JSON.stringify(payload),
        encoding: "utf8",
        maxBuffer: 1024 * 1024
      }
    );

    const result = JSON.parse(stdout.trim());
    console.log("ML PREDICTION SOURCE:", {
  model: result.model,
  anomaly: result.anomaly,
  anomaly_score: result.anomaly_score,
  fallback: result.fallback ?? false
});

    if (!result || typeof result.anomaly_score !== "number") {
      return fallbackHeuristic(telemetry);
    }

    return {
      ...result,
      anomaly: Boolean(result.anomaly),
      anomaly_score: Number(result.anomaly_score),
      confidence: Number(result.confidence),
      model: result.model || "IsolationForest"
    };
  } catch (error) {
    console.warn("ML anomaly prediction unavailable, using heuristic fallback:", error.message);
    return fallbackHeuristic(telemetry);
  }
}
