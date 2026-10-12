export async function analyzeDeviceTrend(client, deviceId) {
  const result = await client.query(
    `
    SELECT
      risk_score,
      network_frequency,
      failed_connections,
      suspicious_requests,
      created_at
    FROM telemetry
    WHERE device_id = $1
    ORDER BY created_at DESC
    LIMIT 5
    `,
    [deviceId]
  );

  const records = result.rows;

  if (records.length < 3) {
    return {
      trendAvailable: false,
      trendScore: 0,
      indicators: [],
      recordsAnalyzed: records.length
    };
  }

  const indicators = [];

  // Reverse so oldest observation comes first
  const chronological = [...records].reverse();

  const riskScores = chronological.map(
    record => Number(record.risk_score)
  );

  // ------------------------------------------
  // Risk escalation
  // ------------------------------------------

  const firstRisk = riskScores[0];
  const lastRisk =
    riskScores[riskScores.length - 1];

  const riskIncrease = lastRisk - firstRisk;

  if (riskIncrease >= 25) {
    indicators.push({
      rule: "RAPID_RISK_ESCALATION",
      type: "BEHAVIOR_TREND",
      score: 15,
      description:
        "Device risk score increased significantly across recent observations"
    });
  }

  // ------------------------------------------
  // Consistent upward trend
  // ------------------------------------------

  let upwardChanges = 0;

  for (let i = 1; i < riskScores.length; i++) {
    if (riskScores[i] > riskScores[i - 1]) {
      upwardChanges++;
    }
  }

  if (upwardChanges >= 3) {
    indicators.push({
      rule: "CONSISTENT_RISK_INCREASE",
      type: "BEHAVIOR_TREND",
      score: 10,
      description:
        "Device risk increased across multiple consecutive observations"
    });
  }

  // ------------------------------------------
  // Increasing network activity
  // ------------------------------------------

  const networkValues = chronological.map(
    record => Number(record.network_frequency)
  );

  if (
    networkValues.length >= 3 &&
    networkValues[networkValues.length - 1] >
      networkValues[0] * 1.5
  ) {
    indicators.push({
      rule: "INCREASING_NETWORK_ACTIVITY",
      type: "BEHAVIOR_TREND",
      score: 10,
      description:
        "Network activity increased substantially over recent observations"
    });
  }

  const trendScore = Math.min(
    35,
    indicators.reduce(
      (sum, indicator) => sum + indicator.score,
      0
    )
  );

  return {
    trendAvailable: true,
    trendScore,
    indicators,
    recordsAnalyzed: records.length,
    riskIncrease
  };
}