
export function detectMobileBehavior(telemetry) {
  const indicators = [];

  const dnsRequests =
    Number(telemetry.dns_requests) || 0;

  const uniqueDestinations =
    Number(telemetry.unique_destinations) || 0;

  const periodicConnections =
    Number(telemetry.periodic_connections) || 0;

  const uploadBytes =
    Number(telemetry.upload_bytes) || 0;

  const downloadBytes =
    Number(telemetry.download_bytes) || 0;

  // Unusually high DNS activity
  if (dnsRequests >= 100) {
    indicators.push({
      rule: "HIGH_DNS_ACTIVITY",
      type: "MOBILE_BEHAVIOR",
      score: 10,
      description:
        "Unusually high DNS request activity detected"
    });
  }

  // Large number of different destinations
  if (uniqueDestinations >= 25) {
    indicators.push({
      rule: "HIGH_DESTINATION_DIVERSITY",
      type: "MOBILE_BEHAVIOR",
      score: 10,
      description:
        "Device contacted an unusually large number of destinations"
    });
  }

  // Repeated periodic connections
  if (periodicConnections >= 30) {
    indicators.push({
      rule: "PERIODIC_CONNECTION_PATTERN",
      type: "MOBILE_BEHAVIOR",
      score: 15,
      description:
        "Repeated periodic connection behavior detected"
    });
  }

  // Unusual upload-heavy behavior
  if (
    uploadBytes > 0 &&
    uploadBytes > downloadBytes * 2
  ) {
    indicators.push({
      rule: "UPLOAD_HEAVY_TRAFFIC",
      type: "MOBILE_BEHAVIOR",
      score: 15,
      description:
        "Upload traffic is substantially higher than download traffic"
    });
  }

  return indicators;
}