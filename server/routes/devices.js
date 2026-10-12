import express from "express";
import pool from "../db.js";

const router = express.Router();


// ============================================================
// GET ALL DEVICES
// ============================================================

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        device_name,
        ip_address,
        status,
        risk_score,
        created_at

      FROM devices

      ORDER BY created_at DESC
      `
    );

    res.json(result.rows);

  } catch (error) {
    next(error);
  }
});


// ============================================================
// GET SINGLE DEVICE + TELEMETRY + THREATS
// ============================================================

router.get("/:id", async (req, res, next) => {
  try {
    const deviceId = Number(req.params.id);

    if (!Number.isInteger(deviceId) || deviceId < 1) {
      return res.status(400).json({
        error: "Invalid device ID"
      });
    }


    // ----------------------------------------------------------
    // DEVICE
    // ----------------------------------------------------------

    const deviceResult = await pool.query(
      `
      SELECT
        id,
        device_name,
        ip_address,
        status,
        risk_score,
        created_at

      FROM devices

      WHERE id = $1
      `,
      [deviceId]
    );


    if (!deviceResult.rows.length) {
      return res.status(404).json({
        error: "Device not found"
      });
    }


    // ----------------------------------------------------------
    // TELEMETRY HISTORY
    // ----------------------------------------------------------

    const telemetryResult = await pool.query(
      `
      SELECT
        id,
        device_id,

        network_frequency,
        failed_connections,
        suspicious_requests,

        dns_requests,
        unique_destinations,
        periodic_connections,

        upload_bytes,
        download_bytes,

        risk_score,
        created_at

      FROM telemetry

      WHERE device_id = $1

      ORDER BY created_at DESC

      LIMIT 50
      `,
      [deviceId]
    );


    // ----------------------------------------------------------
    // THREATS
    // ----------------------------------------------------------

    const threatResult = await pool.query(
      `
      SELECT
        id,
        device_id,

        threat_type,
        severity,
        description,
        status,

        risk_score,
        detection_rule,
        evidence,
        confidence,

        detected_at

      FROM threats

      WHERE device_id = $1

      ORDER BY detected_at DESC

      LIMIT 50
      `,
      [deviceId]
    );


    // ----------------------------------------------------------
    // RESPONSE
    // ----------------------------------------------------------

    res.json({
      device: deviceResult.rows[0],

      telemetry: telemetryResult.rows,

      threats: threatResult.rows
    });

  } catch (error) {
    next(error);
  }
});


// ============================================================
// REGISTER NEW DEVICE
// ============================================================

router.post("/", async (req, res, next) => {
  try {
    const {
      device_name,
      ip_address
    } = req.body;


    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (
      !device_name ||
      typeof device_name !== "string" ||
      !device_name.trim()
    ) {
      return res.status(400).json({
        error: "Device name is required"
      });
    }


    // ----------------------------------------------------------
    // INSERT DEVICE
    // ----------------------------------------------------------

    const result = await pool.query(
      `
      INSERT INTO devices (
        device_name,
        ip_address
      )

      VALUES ($1, $2)

      RETURNING
        id,
        device_name,
        ip_address,
        status,
        risk_score,
        created_at
      `,
      [
        device_name.trim(),
        ip_address || null
      ]
    );


    res.status(201).json({
      message: "Device registered successfully",
      device: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});


// ============================================================
// ISOLATE DEVICE
// ============================================================

router.patch("/:id/isolate", async (req, res, next) => {
  try {
    const deviceId = Number(req.params.id);

    if (!Number.isInteger(deviceId) || deviceId < 1) {
      return res.status(400).json({
        error: "Invalid device ID"
      });
    }


    const result = await pool.query(
      `
      UPDATE devices

      SET status = 'ISOLATED'

      WHERE id = $1

      RETURNING
        id,
        device_name,
        ip_address,
        status,
        risk_score,
        created_at
      `,
      [deviceId]
    );


    if (!result.rows.length) {
      return res.status(404).json({
        error: "Device not found"
      });
    }


    res.json({
      message: "Device isolated successfully",
      device: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});


// ============================================================
// RESTORE DEVICE FROM ISOLATION
// ============================================================

router.patch("/:id/restore", async (req, res, next) => {
  try {
    const deviceId = Number(req.params.id);

    if (!Number.isInteger(deviceId) || deviceId < 1) {
      return res.status(400).json({
        error: "Invalid device ID"
      });
    }


    const result = await pool.query(
      `
      UPDATE devices

      SET status =
        CASE
          WHEN risk_score >= 80 THEN 'BOTNET'
          WHEN risk_score >= 60 THEN 'HIGH_RISK'
          WHEN risk_score >= 30 THEN 'SUSPICIOUS'
          ELSE 'NORMAL'
        END

      WHERE id = $1

      RETURNING
        id,
        device_name,
        ip_address,
        status,
        risk_score,
        created_at
      `,
      [deviceId]
    );


    if (!result.rows.length) {
      return res.status(404).json({
        error: "Device not found"
      });
    }


    res.json({
      message: "Device restored successfully",
      device: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});
// ==========================================
// GET DEVICE RESPONSE ACTIONS
// ==========================================

router.get("/:id/actions", async (req, res, next) => {
  try {
    const deviceId = Number(req.params.id);

    if (!Number.isInteger(deviceId) || deviceId < 1) {
      return res.status(400).json({
        error: "Invalid device ID"
      });
    }

    const device = await pool.query(
      `
      SELECT
        id,
        device_name,
        ip_address,
        status,
        risk_score
      FROM devices
      WHERE id = $1
      `,
      [deviceId]
    );

    if (!device.rows.length) {
      return res.status(404).json({
        error: "Device not found"
      });
    }

    const actions = await pool.query(
      `
      SELECT
        id,
        device_id,
        action,
        priority,
        reason,
        status,
        created_at
      FROM response_actions
      WHERE device_id = $1
      ORDER BY created_at DESC
      LIMIT 20
      `,
      [deviceId]
    );

    res.json({
      device: device.rows[0],
      actions: actions.rows
    });

  } catch (error) {
    next(error);
  }
});

export default router;