export function detectTrafficAnomaly(telemetry) {
  const indicators = [];

  const networkFrequency =
    Number(telemetry.network_frequency) || 0;

  const suspiciousRequests =
    Number(telemetry.suspicious_requests) || 0;

  const failedConnections =
    Number(telemetry.failed_connections) || 0;

  // High-volume suspicious traffic
  if (
    networkFrequency >= 150 &&
    suspiciousRequests >= 15
  ) {
    indicators.push({
      rule: "HIGH_VOLUME_SUSPICIOUS_TRAFFIC",
      type: "TRAFFIC_ANOMALY",
      score: 15,
      description:
        "High-volume network activity combined with suspicious requests"
    });
  }

  // Abnormal failure-to-traffic relationship
  if (
    networkFrequency >= 100 &&
    failedConnections >= 10
  ) {
    indicators.push({
      rule: "ABNORMAL_TRAFFIC_FAILURE_RATIO",
      type: "TRAFFIC_ANOMALY",
      score: 10,
      description:
        "Abnormally high network activity with repeated connection failures"
    });
  }

  return indicators;
}