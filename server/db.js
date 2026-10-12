
import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url))
});

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 5000
});

export async function initializeDatabase() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        device_name VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45),
        status VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
        risk_score INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CHECK (risk_score BETWEEN 0 AND 100)
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS telemetry (
        id SERIAL PRIMARY KEY,
        device_id INTEGER NOT NULL
          REFERENCES devices(id) ON DELETE CASCADE,
        network_frequency INTEGER NOT NULL DEFAULT 0,
        failed_connections INTEGER NOT NULL DEFAULT 0,
        suspicious_requests INTEGER NOT NULL DEFAULT 0,
        risk_score INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
await client.query(`
  ALTER TABLE telemetry
  ADD COLUMN IF NOT EXISTS dns_requests INTEGER NOT NULL DEFAULT 0
`);

await client.query(`
  ALTER TABLE telemetry
  ADD COLUMN IF NOT EXISTS unique_destinations INTEGER NOT NULL DEFAULT 0
`);

await client.query(`
  ALTER TABLE telemetry
  ADD COLUMN IF NOT EXISTS periodic_connections INTEGER NOT NULL DEFAULT 0
`);

await client.query(`
  ALTER TABLE telemetry
  ADD COLUMN IF NOT EXISTS upload_bytes BIGINT NOT NULL DEFAULT 0
`);

await client.query(`
  ALTER TABLE telemetry
  ADD COLUMN IF NOT EXISTS download_bytes BIGINT NOT NULL DEFAULT 0
`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS threats (
        id SERIAL PRIMARY KEY,
        device_id INTEGER NOT NULL
          REFERENCES devices(id) ON DELETE CASCADE,
        threat_type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        description TEXT,
        risk_score INTEGER NOT NULL DEFAULT 0,
        detection_rule VARCHAR(100),
        evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
        confidence INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        detected_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      ALTER TABLE threats
      ADD COLUMN IF NOT EXISTS risk_score INTEGER NOT NULL DEFAULT 0
    `);

    await client.query(`
      ALTER TABLE threats
      ADD COLUMN IF NOT EXISTS detection_rule VARCHAR(100)
    `);

    await client.query(`
      ALTER TABLE threats
      ADD COLUMN IF NOT EXISTS evidence JSONB NOT NULL DEFAULT '{}'::jsonb
    `);

    await client.query(`
      ALTER TABLE threats
      ADD COLUMN IF NOT EXISTS confidence INTEGER NOT NULL DEFAULT 0
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_threats_active_device_type
      ON threats (device_id, threat_type, status, detected_at DESC)
    `);

    await client.query(`
  CREATE TABLE IF NOT EXISTS response_actions (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL
      REFERENCES devices(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'EXECUTED',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`);

    console.log("PostgreSQL tables ready");
  } finally {
    client.release();
  }
}

export default pool;