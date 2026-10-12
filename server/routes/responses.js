import express from "express";
import pool from "../db.js";

const router = express.Router();


// =====================================================
// GET ALL RESPONSE ACTIONS
// GET /api/responses
// =====================================================

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.device_id,
        d.device_name,
        d.ip_address,
        d.status AS device_status,
        d.risk_score,
        r.action,
        r.priority,
        r.reason,
        r.status,
        r.created_at
      FROM response_actions r
      LEFT JOIN devices d
        ON d.id = r.device_id
      ORDER BY r.created_at DESC
    `);

    res.json(result.rows);

  } catch (error) {
    console.error("GET /responses error:", error);
    next(error);
  }
});


// =====================================================
// GET RESPONSES FOR ONE DEVICE
// GET /api/responses/device/:deviceId
// =====================================================

router.get("/device/:deviceId", async (req, res, next) => {
  try {
    const deviceId = Number(req.params.deviceId);

    if (!Number.isInteger(deviceId) || deviceId < 1) {
      return res.status(400).json({
        error: "Invalid device ID"
      });
    }

    const result = await pool.query(`
      SELECT
        r.id,
        r.device_id,
        d.device_name,
        d.ip_address,
        d.status AS device_status,
        d.risk_score,
        r.action,
        r.priority,
        r.reason,
        r.status,
        r.created_at
      FROM response_actions r
      LEFT JOIN devices d
        ON d.id = r.device_id
      WHERE r.device_id = $1
      ORDER BY r.created_at DESC
    `, [deviceId]);

    res.json(result.rows);

  } catch (error) {
    console.error("GET device responses error:", error);
    next(error);
  }
});


// =====================================================
// UPDATE RESPONSE STATUS
// PATCH /api/responses/:id
// =====================================================

router.patch("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = [
      "PENDING",
      "SIMULATED",
      "EXECUTED",
      "FAILED",
      "CANCELLED"
    ];

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        error: "Invalid response ID"
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status"
      });
    }

    const result = await pool.query(`
      UPDATE response_actions
      SET status = $1
      WHERE id = $2
      RETURNING *
    `, [
      status,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Response action not found"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("PATCH /responses/:id error:", error);
    next(error);
  }
});


export default router;