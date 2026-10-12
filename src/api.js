const API_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "API request failed");
  }

  return data;
}

export const api = {

  // ==========================================
  // DASHBOARD
  // ==========================================

  getDashboard: () =>
    request("/dashboard"),


  // ==========================================
  // DEVICES
  // ==========================================

  getDevices: () =>
    request("/devices"),

  getDevice: (id) =>
    request(`/devices/${id}`),

  getDeviceActions: (deviceId) =>
    request(`/devices/${deviceId}/actions`),

  addDevice: (device) =>
    request("/devices", {
      method: "POST",
      body: JSON.stringify(device)
    }),

  isolateDevice: (id) =>
    request(`/devices/${id}/isolate`, {
      method: "PATCH"
    }),


  // ==========================================
  // TELEMETRY
  // ==========================================

  getTelemetry: () =>
    request("/telemetry"),

  submitTelemetry: (data) =>
    request("/telemetry", {
      method: "POST",
      body: JSON.stringify(data)
    }),


  // ==========================================
  // THREATS
  // ==========================================

  getThreats: () =>
    request("/threats"),

  getThreat: (id) =>
    request(`/threats/${id}`),

  investigateThreat: (id) =>
    request(`/threats/${id}/investigate`, {
      method: "PATCH"
    }),

  resolveThreat: (id) =>
    request(`/threats/${id}/resolve`, {
      method: "PATCH"
    }),


  // ==========================================
  // RESPONSE CENTER
  // ==========================================

  getResponseActions: () =>
    request("/responses"),

  getDeviceResponses: (deviceId) =>
  request(`/responses/device/${deviceId}`),

  updateResponseStatus: (id, status) =>
    request(`/responses/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status
      })
    })
};