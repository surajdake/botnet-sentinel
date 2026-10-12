import { DETECTION_RULES } from "./rules.js";
import {
  calculateRiskScore,
  classifyRisk,
  getEvidenceSummary,
  calculateConfidence
} from "./riskEngine.js";
import { detectC2Behavior } from "./c2Detector.js";
import { detectScanningBehavior } from "./scanningDetector.js";
import { detectTrafficAnomaly } from "./trafficDetector.js";
import { detectMobileBehavior } from "./mobileBehaviorDetector.js";
import { detectExfiltrationBehavior } from "./exfiltrationDetector.js";


export function analyzeTelemetry(telemetry) {
  const indicators = [];

  const networkFrequency =
    Number(telemetry.network_frequency) || 0;

  const failedConnections =
    Number(telemetry.failed_connections) || 0;

  const suspiciousRequests =
    Number(telemetry.suspicious_requests) || 0;

  /*
   * Rule 1:
   * High connection frequency
   */
  if (
    networkFrequency >=
    DETECTION_RULES.HIGH_CONNECTION_FREQUENCY.threshold
  ) {
    indicators.push({
      rule: "HIGH_CONNECTION_FREQUENCY",
      type:
        DETECTION_RULES.HIGH_CONNECTION_FREQUENCY.type,
      score:
        DETECTION_RULES.HIGH_CONNECTION_FREQUENCY.score,
      description:
        DETECTION_RULES.HIGH_CONNECTION_FREQUENCY.description
    });
  }

  /*
   * Rule 2:
   * Failed connections
   */
  if (
    failedConnections >=
    DETECTION_RULES.FAILED_CONNECTIONS.threshold
  ) {
    indicators.push({
      rule: "FAILED_CONNECTIONS",
      type:
        DETECTION_RULES.FAILED_CONNECTIONS.type,
      score:
        DETECTION_RULES.FAILED_CONNECTIONS.score,
      description:
        DETECTION_RULES.FAILED_CONNECTIONS.description
    });
  }

  /*
   * Rule 3:
   * Suspicious requests
   */
  if (
    suspiciousRequests >=
    DETECTION_RULES.SUSPICIOUS_REQUESTS.threshold
  ) {
    indicators.push({
      rule: "SUSPICIOUS_REQUESTS",
      type:
        DETECTION_RULES.SUSPICIOUS_REQUESTS.type,
      score:
        DETECTION_RULES.SUSPICIOUS_REQUESTS.score,
      description:
        DETECTION_RULES.SUSPICIOUS_REQUESTS.description
    });
  }
  if (
  networkFrequency >= 150 &&
  failedConnections >= 15 &&
  suspiciousRequests >= 15
) {
  indicators.push({
    rule: "HIGH_RISK_TELEMETRY",
    type: DETECTION_RULES.HIGH_RISK_TELEMETRY.type,
    score: DETECTION_RULES.HIGH_RISK_TELEMETRY.score,
    description: DETECTION_RULES.HIGH_RISK_TELEMETRY.description
  });
}
// C2 beacon behavior detection
const c2Indicators =
  detectC2Behavior(telemetry);

indicators.push(...c2Indicators);
// Network scanning detection
const scanningIndicators =
  detectScanningBehavior(telemetry);

indicators.push(...scanningIndicators);
// Traffic anomaly detection
const trafficIndicators =
  detectTrafficAnomaly(telemetry);

indicators.push(...trafficIndicators);
// Mobile behavioral detection
const mobileIndicators =
  detectMobileBehavior(telemetry);

indicators.push(...mobileIndicators);
// ==========================================
// DATA EXFILTRATION DETECTION
// ==========================================

const exfiltrationIndicators =
  detectExfiltrationBehavior(telemetry);

indicators.push(...exfiltrationIndicators);
 const riskScore =
  calculateRiskScore(indicators);

const classification =
  classifyRisk(riskScore);

const confidence =
  calculateConfidence(indicators);

const evidence =
  getEvidenceSummary(indicators);

return {
  riskScore,
  classification,
  confidence,
  indicators,
  evidence
}
};