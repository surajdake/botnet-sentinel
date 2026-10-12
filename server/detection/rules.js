export const DETECTION_RULES = {
  HIGH_CONNECTION_FREQUENCY: {
    threshold: 100,
    score: 25,
    type: "NETWORK_ANOMALY",
    description: "Abnormally high network connection frequency"
  },

  FAILED_CONNECTIONS: {
    threshold: 10,
    score: 20,
    type: "CONNECTION_ANOMALY",
    description: "Large number of failed connections detected"
  },

  SUSPICIOUS_REQUESTS: {
    threshold: 10,
    score: 25,
    type: "SUSPICIOUS_TRAFFIC",
    description: "High number of suspicious network requests"
  },

  HIGH_RISK_TELEMETRY: {
    threshold: 70,
    score: 30,
    type: "BEHAVIORAL_ANOMALY",
    description: "Telemetry indicates highly abnormal device behavior"
  }
};