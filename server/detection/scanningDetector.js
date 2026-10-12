export function detectScanningBehavior(telemetry) {
  const indicators = [];

  const networkFrequency =
    Number(telemetry.network_frequency) || 0;

  const failedConnections =
    Number(telemetry.failed_connections) || 0;

  /*
   * Prototype scanning indicators.
   * These identify unusually broad/failed connection
   * behavior from aggregated telemetry.
   */

  if (
    networkFrequency >= 200 &&
    failedConnections >= 20
  ) {
    indicators.push({
      rule: "HIGH_CONNECTION_SCAN",
      type: "SCANNING_BEHAVIOR",
      score: 15,
      description:
        "High connection volume with repeated connection failures"
    });
  }

  if (failedConnections >= 30) {
    indicators.push({
      rule: "REPEATED_CONNECTION_FAILURES",
      type: "SCANNING_BEHAVIOR",
      score: 20,
      description:
        "Repeated connection failures indicate possible scanning behavior"
    });
  }

  return indicators;
}