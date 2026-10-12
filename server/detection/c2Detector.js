export function detectC2Behavior(telemetry) {
  const indicators = [];

  const networkFrequency =
    Number(telemetry.network_frequency) || 0;

  const failedConnections =
    Number(telemetry.failed_connections) || 0;

  const suspiciousRequests =
    Number(telemetry.suspicious_requests) || 0;

  /*
   * Prototype C2 behavioral indicators.
   *
   * These are heuristic signals for our project,
   * not proof of actual C2 communication.
   */

  if (
    networkFrequency >= 150 &&
    suspiciousRequests >= 10
  ) {
    indicators.push({
      rule: "C2_HIGH_FREQUENCY",
      type: "C2_BEHAVIOR",
      score: 15,
      description:
        "High-frequency network activity combined with suspicious requests"
    });
  }

  if (
    failedConnections >= 15 &&
    networkFrequency >= 100
  ) {
    indicators.push({
      rule: "C2_REPEATED_CONNECTIONS",
      type: "C2_BEHAVIOR",
      score: 15,
      description:
        "Repeated connection failures associated with abnormal network activity"
    });
  }

  return indicators;
}