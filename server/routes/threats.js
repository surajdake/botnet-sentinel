import express from "express";
import pool from "../db.js";

const router = express.Router();


// =====================================================
// GET ALL THREATS
// GET /api/threats
// =====================================================

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        t.*,
        d.device_name,
        d.ip_address
      FROM threats t
      JOIN devices d
        ON d.id = t.device_id
      ORDER BY t.detected_at DESC
    `);

    res.json(result.rows);

  } catch (error) {
    next(error);
  }
});


// =====================================================
// GET SINGLE THREAT
// GET /api/threats/:id
// =====================================================

router.get("/:id", async (req, res, next) => {
  try {
    const threatId = Number(req.params.id);

    if (!Number.isInteger(threatId) || threatId < 1) {
      return res.status(400).json({
        error: "Invalid threat ID"
      });
    }

    const result = await pool.query(
      `
      SELECT
        t.*,
        d.device_name,
        d.ip_address,
        d.status AS device_status,
        d.risk_score AS device_risk_score
      FROM threats t
      JOIN devices d
        ON d.id = t.device_id
      WHERE t.id = $1
      `,
      [threatId]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: "Threat not found"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    next(error);
  }
});


// =====================================================
// MARK THREAT AS INVESTIGATING
// PATCH /api/threats/:id/investigate
// =====================================================

router.patch("/:id/investigate", async (req, res, next) => {
  try {
    const threatId = Number(req.params.id);

    if (!Number.isInteger(threatId) || threatId < 1) {
      return res.status(400).json({
        error: "Invalid threat ID"
      });
    }

    const result = await pool.query(
      `
      UPDATE threats
      SET status = 'INVESTIGATING'
      WHERE id = $1
      RETURNING *
      `,
      [threatId]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: "Threat not found"
      });
    }

    res.json({
      message: "Threat marked as investigating",
      threat: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});


// =====================================================
// RESOLVE THREAT
// PATCH /api/threats/:id/resolve
// =====================================================

router.patch("/:id/resolve", async (req, res, next) => {
  try {
    const threatId = Number(req.params.id);

    if (!Number.isInteger(threatId) || threatId < 1) {
      return res.status(400).json({
        error: "Invalid threat ID"
      });
    }

    const result = await pool.query(
      `
      UPDATE threats
      SET status = 'RESOLVED'
      WHERE id = $1
      RETURNING *
      `,
      [threatId]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: "Threat not found"
      });
    }

    res.json({
      message: "Threat resolved successfully",
      threat: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});


export default router;