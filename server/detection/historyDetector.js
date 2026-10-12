const BASELINE_METRICS = [
  { key: "network_frequency", label: "network frequency", minimumChange: 20 },
  { key: "failed_connections", label: "failed connections", minimumChange: 3 },
  { key: "suspicious_requests", label: "suspicious requests", minimumChange: 3 },
  { key: "dns_requests", label: "DNS requests", minimumChange: 15 },
  { key: "unique_destinations", label: "unique destinations", minimumChange: 5 },
  { key: "periodic_connections", label: "periodic connections", minimumChange: 5 },
  { key: "upload_bytes", label: "upload volume", minimumChange: 1048576 },
  { key: "download_bytes", label: "download volume", minimumChange: 1048576 }
];

export function detectBaselineAnomalies(currentMetrics, records) {
  if (!Array.isArray(records) || records.length < 5) {
    return [];
  }

  return BASELINE_METRICS.flatMap((metric) => {
    const currentValue = Number(currentMetrics[metric.key]);
    const values = records
      .map((record) => Number(record[metric.key]))
      .filter(Number.isFinite);

    if (!Number.isFinite(currentValue) || values.length < 5) {
      return [];
    }

    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
    const deviation = currentValue - average;
    const threshold = Math.max(metric.minimumChange, Math.sqrt(variance) * 3);

    if (deviation <= threshold) {
      return [];
    }

    return [{
      metric: metric.key,
      label: metric.label,
      observed: currentValue,
      baseline_average: Math.round(average),
      deviation: Math.round(deviation)
    }];
  });
}

export async function analyzeDeviceHistory(client, deviceId, currentMetrics) {
  const result = await client.query(
    `
    SELECT
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
    LIMIT 30
    `,
    [deviceId]
  );

  const records = result.rows;

  if (records.length < 3) {
    return {
      historyAvailable: false,
      historyScore: 0,
      indicators: [],
      recordsAnalyzed: records.length,
      baselineAnomalies: []
    };
  }

  const indicators = [];
  const recentRecords = records.slice(0, 10);

  // Persistent elevated risk
  const elevatedRecords = recentRecords.filter(
    record => Number(record.risk_score) >= 60
  );

  if (elevatedRecords.length >= 3) {
    indicators.push({
      rule: "PERSISTENT_HIGH_RISK",
      type: "HISTORICAL_BEHAVIOR",
      score: 15,
      description:
        "Device repeatedly produced elevated-risk telemetry"
    });
  }

  // Persistent periodic activity
  const periodicRecords = recentRecords.filter(
    record =>
      Number(record.periodic_connections) >= 30
  );

  if (periodicRecords.length >= 3) {
    indicators.push({
      rule: "PERSISTENT_PERIODIC_ACTIVITY",
      type: "HISTORICAL_BEHAVIOR",
      score: 15,
      description:
        "Periodic connection behavior persisted across multiple observations"
    });
  }

  // Persistent suspicious traffic
  const suspiciousRecords = recentRecords.filter(
    record =>
      Number(record.suspicious_requests) >= 10
  );

  if (suspiciousRecords.length >= 3) {
    indicators.push({
      rule: "PERSISTENT_SUSPICIOUS_TRAFFIC",
      type: "HISTORICAL_BEHAVIOR",
      score: 15,
      description:
        "Suspicious request activity persisted across multiple observations"
    });
  }

  const baselineAnomalies = detectBaselineAnomalies(
    currentMetrics,
    records
  );

  if (baselineAnomalies.length > 0) {
    indicators.push({
      rule: "DEVICE_BASELINE_ANOMALY",
      type: "BEHAVIORAL_ANOMALY",
      score: Math.min(25, 10 + (baselineAnomalies.length - 1) * 5),
      description: `Telemetry exceeded this device's baseline for ${baselineAnomalies.map((item) => item.label).join(", ")}`
    });
  }

  const historyScore = Math.min(
    45,
    indicators.reduce(
      (sum, indicator) => sum + indicator.score,
      0
    )
  );

  return {
    historyAvailable: true,
    historyScore,
    indicators,
    recordsAnalyzed: recentRecords.length,
    baselineRecordsAnalyzed: records.length,
    baselineAnomalies
  };
}