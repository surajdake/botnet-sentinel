const CATEGORY_WEIGHTS = {
  NETWORK_ANOMALY: 1.0,
  CONNECTION_ANOMALY: 1.0,
  SUSPICIOUS_TRAFFIC: 1.0,
  BEHAVIORAL_ANOMALY: 1.0,
  C2_BEHAVIOR: 1.0,
  SCANNING_BEHAVIOR: 1.0,
  TRAFFIC_ANOMALY: 1.0
};

export function calculateRiskScore(indicators) {
  if (!Array.isArray(indicators) || indicators.length === 0) {
    return 0;
  }

  const total = indicators.reduce((sum, indicator) => {
    const weight =
      CATEGORY_WEIGHTS[indicator.type] ?? 1;

    return sum + Number(indicator.score || 0) * weight;
  }, 0);

  return Math.min(100, Math.round(total));
}

export function getEvidenceSummary(indicators) {
  if (!Array.isArray(indicators)) {
    return {
      indicator_count: 0,
      category_count: 0,
      categories: []
    };
  }

  const categories = [
    ...new Set(
      indicators
        .map(indicator => indicator.type)
        .filter(Boolean)
    )
  ];

  return {
    indicator_count: indicators.length,
    category_count: categories.length,
    categories
  };
}

export function calculateConfidence(indicators) {
  if (!Array.isArray(indicators) || indicators.length === 0) {
    return 50;
  }

  const categories = new Set(
    indicators
      .map(indicator => indicator.type)
      .filter(Boolean)
  );

  /*
   * Confidence here represents agreement between
   * independent behavioral indicators.
   * It is NOT a validated ML probability.
   */

  return Math.min(
    95,
    50 + categories.size * 8
  );
}

export function classifyRisk(score) {
  if (score >= 80) return "BOTNET";
  if (score >= 60) return "HIGH_RISK";
  if (score >= 30) return "SUSPICIOUS";

  return "NORMAL";
}