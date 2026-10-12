// ==========================================
// MOBILE BOTNET DETECTION
// RESPONSE ENGINE
// ==========================================

export function determineResponse({
  riskScore,
  classification,
  indicators = []
}) {
  const responses = [];

  // ==========================================
  // BOTNET DETECTION
  // ==========================================

  if (classification === "BOTNET" || riskScore >= 80) {
    responses.push({
      action: "ISOLATE_DEVICE",
      priority: "CRITICAL",
      reason: "Device reached botnet-level risk"
    });
  }

  // ==========================================
  // HIGH RISK
  // ==========================================

  else if (classification === "HIGH_RISK" || riskScore >= 60) {
    responses.push({
      action: "RESTRICT_DEVICE",
      priority: "HIGH",
      reason: "Device reached high-risk classification"
    });
  }

  // ==========================================
  // EXFILTRATION
  // ==========================================

  const exfiltrationDetected = indicators.some(
    indicator =>
      indicator.type === "DATA_EXFILTRATION"
  );

  if (exfiltrationDetected) {
    responses.push({
      action: "CONTAIN_DATA_TRANSFER",
      priority: "CRITICAL",
      reason: "Abnormal outbound data transfer detected"
    });
  }

  // ==========================================
  // C2 BEHAVIOR
  // ==========================================

  const c2Detected = indicators.some(
    indicator =>
      indicator.type === "C2_BEHAVIOR"
  );

  if (c2Detected) {
    responses.push({
      action: "INVESTIGATE_C2",
      priority: "HIGH",
      reason: "Possible command-and-control behavior detected"
    });
  }

  // ==========================================
  // SCANNING
  // ==========================================

  const scanningDetected = indicators.some(
    indicator =>
      indicator.type === "SCANNING_BEHAVIOR"
  );

  if (scanningDetected) {
    responses.push({
      action: "MONITOR_SCANNING",
      priority: "MEDIUM",
      reason: "Repeated network scanning behavior detected"
    });
  }

  // ==========================================
  // DEFAULT MONITORING
  // ==========================================

  if (responses.length === 0) {
    responses.push({
      action: "CONTINUE_MONITORING",
      priority: "LOW",
      reason: "No immediate containment action required"
    });
  }

  return {
    responseRequired: responses.some(
      response =>
        response.action !== "CONTINUE_MONITORING"
    ),
    responses
  };
}