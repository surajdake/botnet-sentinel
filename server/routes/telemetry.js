import express from "express";
import pool from "../db.js";

import { analyzeTelemetry } from "../detection/detectionEngine.js";
import { analyzeDeviceHistory } from "../detection/historyDetector.js";
import { determineResponse } from "../response/responseEngine.js";
import { getAnomalyPrediction } from "../ml/anomalyService.js";

const router = express.Router();


// ============================================================
// POST TELEMETRY
// ============================================================

router.post("/", async (req, res, next) => {

  const {
    device_id,

    network_frequency = 0,
    failed_connections = 0,
    suspicious_requests = 0,

    dns_requests = 0,
    unique_destinations = 0,
    periodic_connections = 0,

    upload_bytes = 0,
    download_bytes = 0

  } = req.body;


  // ============================================================
  // CONVERT INPUT
  // ============================================================

  const deviceId = Number(device_id);

  const metrics = {
    network_frequency: Number(network_frequency),
    failed_connections: Number(failed_connections),
    suspicious_requests: Number(suspicious_requests),

    dns_requests: Number(dns_requests),
    unique_destinations: Number(unique_destinations),
    periodic_connections: Number(periodic_connections),

    upload_bytes: Number(upload_bytes),
    download_bytes: Number(download_bytes)
  };


  // ============================================================
  // VALIDATE DEVICE ID
  // ============================================================

  if (
    !Number.isInteger(deviceId) ||
    deviceId < 1
  ) {

    return res.status(400).json({
      error: "Invalid device_id"
    });

  }


  // ============================================================
  // VALIDATE TELEMETRY
  // ============================================================

  const invalidMetric = Object.entries(metrics).find(
    ([, value]) =>
      !Number.isInteger(value) ||
      value < 0
  );


  if (invalidMetric) {

    return res.status(400).json({
      error:
        `Invalid telemetry value for ${invalidMetric[0]}. ` +
        "All telemetry values must be non-negative integers."
    });

  }


  // ============================================================
  // DATABASE CONNECTION
  // ============================================================

  const client = await pool.connect();


  try {

    await client.query("BEGIN");


    // ============================================================
    // GET DEVICE
    // ============================================================

    const deviceResult = await client.query(
      `
      SELECT
        id,
        device_name,
        ip_address,
        status,
        risk_score
      FROM devices
      WHERE id = $1
      FOR UPDATE
      `,
      [deviceId]
    );


    if (!deviceResult.rows.length) {

      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Device not found"
      });

    }


    // IMPORTANT:
    // device is the actual row, not the PostgreSQL result object.

    const device = deviceResult.rows[0];


    // ============================================================
    // CURRENT TELEMETRY ANALYSIS
    // ============================================================

    const detection = analyzeTelemetry(metrics);
    const mlPrediction = await getAnomalyPrediction(metrics);

    let {
      riskScore,
      classification,
      confidence,
      indicators,
      evidence
    } = detection;


    // Make sure arrays/objects always exist.

    indicators = Array.isArray(indicators)
      ? indicators
      : [];

    evidence = evidence || {};

   const mlScore = Number(mlPrediction?.anomaly_score || 0) * 100;
const mlContribution = Math.round(mlScore * 0.35);

if (mlPrediction?.anomaly) {
  indicators.push({
    rule: "ML_ANOMALY_DETECTION",
    type: "ML_ANOMALY",
    score: Math.min(40, mlContribution),
    description:
      "ML anomaly detector classified telemetry as statistically unusual relative to safe baseline behavior."
  });

  riskScore = Math.min(100, riskScore + mlContribution);
}

    confidence = Math.min(
      99,
      Number(confidence || 0) +
      Number(mlPrediction?.confidence || 0) * 10
    );

    evidence = {
      ...evidence,
      ml: {
        model: mlPrediction?.model || "IsolationForest",
        anomaly: Boolean(mlPrediction?.anomaly),
        anomaly_score: Number(mlPrediction?.anomaly_score || 0),
        confidence: Number(mlPrediction?.confidence || 0),
        source: "ML_ANOMALY_DETECTION"
      }
    };


    // ============================================================
    // HISTORICAL BEHAVIOR ANALYSIS
    // ============================================================

    const history = await analyzeDeviceHistory(
      client,
      deviceId,
      metrics
    );

console.log("DEBUG RISK BREAKDOWN:", {
  deviceId,
  baseRiskScore: detection.riskScore,
  mlAnomaly: mlPrediction?.anomaly,
  mlAnomalyScore: mlPrediction?.anomaly_score,
  riskAfterML: riskScore,
  historyScore: history?.historyScore,
  historyIndicators: history?.indicators?.map(i => ({
    rule: i.rule,
    score: i.score
  })),
  baseIndicators: detection.indicators.map(i => ({
  rule: i.rule,
  score: i.score,
  type: i.type
})),

  mlAnomaly: mlPrediction?.anomaly,
  mlAnomalyScore: mlPrediction?.anomaly_score,
  riskAfterML: riskScore,
  historyScore: history?.historyScore
});


    // ============================================================
    // ADD HISTORICAL EVIDENCE
    // ============================================================

    if (
      history &&
      Array.isArray(history.indicators) &&
      history.indicators.length > 0
    ) {

      indicators = [
        ...indicators,
        ...history.indicators
      ];


      // Add historical score.

      riskScore = Math.min(
        100,
        riskScore + Number(history.historyScore || 0)
      );


      // ========================================================
      // RECLASSIFY
      // ========================================================

      if (riskScore >= 80) {

        classification = "BOTNET";

      } else if (riskScore >= 60) {

        classification = "HIGH_RISK";

      } else if (riskScore >= 30) {

        classification = "SUSPICIOUS";

      } else {

        classification = "NORMAL";

      }


      // ========================================================
      // UPDATE CONFIDENCE
      // ========================================================

      confidence = Math.min(
        99,
        Number(confidence || 0) +
        history.indicators.length * 5
      );


      // ========================================================
      // ADD HISTORICAL EVIDENCE
      // ========================================================

      evidence = {

        ...evidence,

        historical: {

          available:
            history.historyAvailable ?? true,

          records_analyzed:
            history.recordsAnalyzed ?? 0,

          history_score:
            history.historyScore ?? 0,

          indicators:
            history.indicators.length,

          baseline_records_analyzed:
            history.baselineRecordsAnalyzed ?? 0,

          baseline_anomalies:
            history.baselineAnomalies ?? []

        }

      };

    }


    // ============================================================
    // FINAL RESPONSE DECISION
    // ============================================================
    //
    // IMPORTANT:
    // Response Engine runs AFTER ALL detection analysis.
    //
    // ============================================================
    // PostgreSQL stores risk_score as an INTEGER.
// ML/history calculations can produce decimal values.
riskScore = Math.round(
  Math.min(100, Math.max(0, Number(riskScore) || 0))
);
// PostgreSQL stores confidence as INTEGER.
// Detection/ML calculations can produce decimal confidence values.
confidence = Math.round(
  Math.min(99, Math.max(0, Number(confidence) || 0))
);
//classification

if (riskScore >= 80) {
  classification = "BOTNET";
} else if (riskScore >= 60) {
  classification = "HIGH_RISK";
} else if (riskScore >= 30) {
  classification = "SUSPICIOUS";
} else {
  classification = "NORMAL";
}

    const responseDecision = determineResponse({

      riskScore,
      classification,
      indicators

    });


    const responses = Array.isArray(
      responseDecision?.responses
    )
      ? responseDecision.responses
      : [];


    // ============================================================
    // CHECK WHETHER DEVICE SHOULD BE ISOLATED
    // ============================================================

const shouldIsolate = responses.some(
  response =>
    response.action === "ISOLATE_DEVICE"
);

// Keep detection status separate from response actions.
// Isolation is simulated, so do not mark the device as ISOLATED.

const finalStatus = classification;


    // ============================================================
    // STORE TELEMETRY
    // ============================================================
console.log("DEBUG TELEMETRY VALUES:", {
  deviceId,
  network_frequency: metrics.network_frequency,
  failed_connections: metrics.failed_connections,
  suspicious_requests: metrics.suspicious_requests,
  dns_requests: metrics.dns_requests,
  unique_destinations: metrics.unique_destinations,
  periodic_connections: metrics.periodic_connections,
  upload_bytes: metrics.upload_bytes,
  download_bytes: metrics.download_bytes,
  riskScore
});
    const telemetryResult = await client.query(
      `
      INSERT INTO telemetry (

        device_id,

        network_frequency,
        failed_connections,
        suspicious_requests,

        dns_requests,
        unique_destinations,
        periodic_connections,

        upload_bytes,
        download_bytes,

        risk_score

      )

      VALUES (

        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10

      )

      RETURNING *
      `,
      [

        deviceId,

        metrics.network_frequency,
        metrics.failed_connections,
        metrics.suspicious_requests,

        metrics.dns_requests,
        metrics.unique_destinations,
        metrics.periodic_connections,

        metrics.upload_bytes,
        metrics.download_bytes,

        riskScore

      ]
    );


    // ============================================================
    // UPDATE DEVICE STATUS
    // ============================================================

    await client.query(
      `
      UPDATE devices

      SET
        risk_score = $1,
        status = $2

      WHERE id = $3
      `,
      [

        riskScore,
        finalStatus,
        deviceId

      ]
    );

// ============================================================
// EXECUTE RESPONSE ACTIONS
// ============================================================

const responseActions = [];

for (const response of responses) {

  // ========================================================
  // RESPONSE COOLDOWN / DUPLICATE PREVENTION
  // ========================================================

  const existingAction = await client.query(
    `
    SELECT id
    FROM response_actions
    WHERE device_id = $1
      AND action = $2
      AND reason = $3
      AND created_at >= NOW() - INTERVAL '10 minutes'
    LIMIT 1
    `,
    [
      deviceId,
      response.action,
      response.reason
    ]
  );

  // If the same response was already generated recently,
  // do not create another duplicate action.
  if (existingAction.rows.length > 0) {
    continue;
  }


  // ========================================================
  // DEVICE ISOLATION
  // ========================================================

if (response.action === "ISOLATE_DEVICE") {
  console.log(
    `[SIMULATION] Device ${deviceId} would be isolated. ` +
    "No actual device isolation was performed."
  );
}



  // ========================================================
  // STORE RESPONSE ACTION
  // ========================================================

  const actionResult = await client.query(
    `
    INSERT INTO response_actions (
      device_id,
      action,
      priority,
      reason,
      status
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5
    )
    RETURNING *
    `,
    [
      deviceId,
      response.action,
      response.priority,
      response.reason,
      "SIMULATED" // For now, we simulate the action without actually executing it.
    ]
  );


  if (actionResult.rows.length > 0) {

    responseActions.push(
      actionResult.rows[0]
    );

  }

}


    // ============================================================
    // CREATE THREATS
    // ============================================================

    const threatsCreated = [];
    const seenThreats = new Set();

    const dedupeThreatKey = (deviceId, indicator) => {
      const threatType = String(
        indicator?.type || "UNKNOWN_ANOMALY"
      ).toUpperCase();

      const detectionRule = String(
        indicator?.rule || indicator?.type || "UNKNOWN_RULE"
      ).toUpperCase();

      return `${deviceId}:${threatType}:${detectionRule}`;
    };

    if (indicators.length > 0) {

      for (const indicator of indicators) {
        const threatKey = dedupeThreatKey(deviceId, indicator);

        if (seenThreats.has(threatKey)) {
          continue;
        }

        const threatType =
  String(
    indicator?.type || "UNKNOWN_ANOMALY"
  ).toUpperCase();

const detectionRule =
  String(
    indicator?.rule ||
    indicator?.type ||
    "UNKNOWN_RULE"
  ).toUpperCase();

const existingThreat = await client.query(
  `
  SELECT id
  FROM threats
  WHERE device_id = $1
    AND threat_type = $2
    AND detection_rule = $3
    AND status IN ('ACTIVE', 'INVESTIGATING')
  ORDER BY detected_at DESC
  LIMIT 1
  `,
  [
    deviceId,
    threatType,
    detectionRule
  ]
);

        if (existingThreat.rows.length > 0) {
          seenThreats.add(threatKey);
          continue;
        }

        // ======================================================
        // DETERMINE SEVERITY
        // ======================================================

        let severity = "LOW";


        if (riskScore >= 80) {

          severity = "HIGH";

        } else if (riskScore >= 60) {

          severity = "MEDIUM";

        }


        // ======================================================
        // DETECTION EVIDENCE
        // ======================================================

        const indicatorEvidence = {

          telemetry: metrics,

          indicator: {

            rule:
              indicator.rule || null,

            type:
              indicator.type || null,

            score:
              Number(indicator.score || 0),

            description:
              indicator.description || ""

          }

        };


        // ======================================================
        // INSERT THREAT
        // ======================================================

        const threatResult = await client.query(
          `
          INSERT INTO threats (

            device_id,

            threat_type,
            severity,
            description,

            risk_score,
            detection_rule,
            evidence,
            confidence

          )

          VALUES (

            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8

          )

          RETURNING *
          `,
          [

            deviceId,

            threatType,

            severity,

            indicator.description ||
              "Suspicious device behavior detected",

            riskScore,

            detectionRule,

            JSON.stringify(
              indicatorEvidence
            ),

            confidence

          ]
        );


        if (threatResult.rows.length > 0) {
          seenThreats.add(threatKey);
          threatsCreated.push(
            threatResult.rows[0]
          );

        }

      }

    }


    // ============================================================
    // COMMIT TRANSACTION
    // ============================================================

    await client.query("COMMIT");


    // ============================================================
    // FINAL RESPONSE
    // ============================================================

    return res.status(201).json({

      message:
        "Telemetry analyzed successfully",


      telemetry:
        telemetryResult.rows[0],


      detection: {

        risk_score:
          riskScore,

        classification:
          classification,

        confidence:
          confidence,

        ml:
          mlPrediction,

        indicators:
          indicators,

        evidence:
          evidence

      },


      response: {

        required:
          responseDecision?.responseRequired ?? false,

        actions:
          responseActions

      },


      device_status:
        finalStatus,


      threats:
        threatsCreated

    });


  } catch (error) {

    // ==========================================================
    // ROLLBACK
    // ==========================================================

    try {

      await client.query("ROLLBACK");

    } catch (rollbackError) {

      console.error(
        "Rollback failed:",
        rollbackError.message
      );

    }


    console.error(
      "Telemetry processing error:",
      error
    );


    next(error);


  } finally {

    client.release();

  }

});


// ============================================================
// GET RECENT TELEMETRY
// ============================================================

router.get("/", async (req, res, next) => {

  try {

    const result = await pool.query(
      `
      SELECT

        t.id,
        t.device_id,

        d.device_name,
        d.ip_address,

        t.network_frequency,
        t.failed_connections,
        t.suspicious_requests,

        t.dns_requests,
        t.unique_destinations,
        t.periodic_connections,

        t.upload_bytes,
        t.download_bytes,

        t.risk_score,

        t.created_at

      FROM telemetry t

      JOIN devices d
        ON d.id = t.device_id

      ORDER BY
        t.created_at DESC

      LIMIT 100
      `
    );


    res.json(result.rows);


  } catch (error) {

    next(error);

  }

});


export default router;