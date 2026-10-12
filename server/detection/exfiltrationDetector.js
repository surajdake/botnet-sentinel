export function detectExfiltrationBehavior(telemetry) {
  const indicators = [];

  const uploadBytes =
    Number(telemetry.upload_bytes) || 0;

  const downloadBytes =
    Number(telemetry.download_bytes) || 0;

  const suspiciousRequests =
    Number(telemetry.suspicious_requests) || 0;

  const uniqueDestinations =
    Number(telemetry.unique_destinations) || 0;


  // ==========================================
  // HIGH OUTBOUND DATA
  // ==========================================

  if (uploadBytes >= 100000000) {
    indicators.push({
      rule: "HIGH_OUTBOUND_DATA",
      type: "DATA_EXFILTRATION",
      score: 15,
      description:
        "Unusually large amount of outbound data detected"
    });
  }


  // ==========================================
  // UPLOAD / DOWNLOAD IMBALANCE
  // ==========================================

  if (
    uploadBytes > 0 &&
    downloadBytes > 0 &&
    uploadBytes > downloadBytes * 3
  ) {
    indicators.push({
      rule: "UPLOAD_DOWNLOAD_IMBALANCE",
      type: "DATA_EXFILTRATION",
      score: 10,
      description:
        "Outbound traffic is substantially higher than inbound traffic"
    });
  }


  // ==========================================
  // MANY DESTINATIONS + HIGH UPLOAD
  // ==========================================

  if (
    uploadBytes >= 50000000 &&
    uniqueDestinations >= 20
  ) {
    indicators.push({
      rule: "MULTI_DESTINATION_UPLOAD",
      type: "DATA_EXFILTRATION",
      score: 15,
      description:
        "High outbound traffic observed across multiple destinations"
    });
  }


  // ==========================================
  // SUSPICIOUS REQUESTS + HIGH UPLOAD
  // ==========================================

  if (
    uploadBytes >= 50000000 &&
    suspiciousRequests >= 10
  ) {
    indicators.push({
      rule: "SUSPICIOUS_OUTBOUND_ACTIVITY",
      type: "DATA_EXFILTRATION",
      score: 15,
      description:
        "High outbound traffic coincides with suspicious requests"
    });
  }


  return indicators;
}