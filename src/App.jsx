
import { useState, useEffect, useCallback } from "react";
import { api } from "./api";
import ResponseCenter from "./ResponseCenter";
import "./App.css";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BrainCircuit,
  ChevronRight,
  Database,
  LayoutDashboard,
  Menu,
  Network,
  Search,
  Settings,
  Shield,
  Smartphone,
  Terminal,
  X,
} from "lucide-react";



/* ==========================================
   NAVIGATION
========================================== */

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Devices", icon: Smartphone },
  { name: "Threat Detection", icon: Shield },
  { name: "Response Center", icon: AlertTriangle },
  { name: "Intelligence", icon: BrainCircuit },
  { name: "Analytics", icon: BarChart3 },
 
];

/* ==========================================
   DATA HELPERS
========================================== */

// Supports several common API response formats.
// Adjust these mappings if your backend uses other names.

function firstNumber(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") {
      const number = Number(value);
      if (Number.isFinite(number)) return number;
    }
  }
  return null;
}

function normalizeDashboard(response) {
  const data = response?.data ?? response ?? {};
  const stats = data.stats ?? data.summary ?? {};

  
const devices = firstNumber(
  data.total,
  data.total_devices,
  data.totalDevices
);

const threats = firstNumber(
  data.active_threats,
  data.activeThreats,
  data.botnet
);

const suspicious = firstNumber(
  data.suspicious,
  data.suspicious_devices
);

const risk = firstNumber(
  data.network_risk,
  data.networkRisk
);

  return {
    devices,
    threats,
    suspicious,
    risk,
    lastScan: data.last_scan ?? data.lastScan ?? null,
    uptime: data.uptime ?? null,
    raw: data,
  };
}

function displayNumber(value) {
  return value === null || value === undefined
    ? "--"
    : value.toLocaleString();
}

/* ==========================================
   MAIN APPLICATION
========================================== */

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [refreshSeconds, setRefreshSeconds] = useState(() => {
    const savedValue = Number(localStorage.getItem("sentinel-refresh-seconds"));
    return [15, 30, 60].includes(savedValue) ? savedValue : 30;
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await api.getDashboard();

      console.log("Dashboard API response:", response);

      setDashboardData(normalizeDashboard(response));
      setLastUpdated(new Date());
      setApiError("");
    } catch (error) {
      console.error("Dashboard API error:", error);
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(loadDashboard, refreshSeconds * 1000);

    return () => clearInterval(interval);
  }, [loadDashboard, refreshSeconds]);

  const connected = dashboardData !== null && !apiError;

  return (
    <div className="application">
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          mobileMenu ? "sidebar-open" : ""
        }`}
      >
        <div className="brand">
          <div className="brand-logo">
            <Shield size={22} strokeWidth={2.2} />
          </div>

          <div className="brand-text">
            <h2>MOBILE BOTNET</h2>
            <h2>DETECTION</h2>
            <span>SECURITY PLATFORM</span>
          </div>

          <button
            className="close-sidebar"
            onClick={() => setMobileMenu(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="system-status">
          <span
            className="status-dot"
            style={{
              background: connected
                ? "#22c55e"
                : "#ef4444",
            }}
          />

          <span>
            {connected
              ? "API CONNECTED"
              : loading
              ? "CONNECTING..."
              : "API DISCONNECTED"}
          </span>
        </div>

        <div className="navigation-section">
          <div className="section-label">
            COMMAND CENTER
          </div>

          {navigation.map((item) => {
            const Icon = item.icon;
            const selected = activePage === item.name;

            return (
              <button
                key={item.name}
                className={`navigation-item ${
                  selected ? "selected" : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  setMobileMenu(false);
                }}
              >
                <Icon size={18} />
                <span>{item.name}</span>

                {selected && (
                  <ChevronRight size={15} />
                )}
              </button>
            );
          })}
        </div>

        <div className="sidebar-system">
          <div className="section-label">
            SYSTEM
          </div>

          <button
            className="navigation-item"
            onClick={() => setActivePage("Event Logs")}
          >
            <Terminal size={18} />
            <span>Event Logs</span>
          </button>

          <button
            className="navigation-item"
            onClick={() => setActivePage("Data Sources")}
          >
            <Database size={18} />
            <span>Data Sources</span>
          </button>

          <button
            className="navigation-item"
            onClick={() => setActivePage("Settings")}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </div>

        <div className="engine-card">
          <div className="engine-icon">
            <BrainCircuit size={18} />
          </div>

          <div className="engine-info">
            <strong>AI ENGINE</strong>
            <span>
              {connected
                ? "API available"
                : "Waiting for connection"}
            </span>
          </div>

          <span className="engine-dot" />
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={20} />
          </button>

          <div className="breadcrumb">
            <span>SECURITY</span>
            <ChevronRight size={13} />
            <strong>{activePage.toUpperCase()}</strong>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <Search size={16} />

              <input
                type="text"
                placeholder="Search devices, threats..."
              />

              <kbd>⌘ K</kbd>
            </div>

            <button
              className="notification-button"
              aria-label="Notifications"
            >
              <Bell size={17} />
            </button>

            <div className="profile">MB</div>
          </div>
        </header>

        {/* PAGE CONTENT */}

        <div className="page">
          {activePage === "Dashboard" && (
            <>
              {apiError && (
                <div
                  role="alert"
                  style={{
                    padding: "14px",
                    marginBottom: "20px",
                    border: "1px solid #ef4444",
                    borderRadius: "10px",
                    color: "#fca5a5",
                  }}
                >
                  API connection error: {apiError}

                  <button
                    onClick={loadDashboard}
                    style={{
                      marginLeft: "15px",
                      cursor: "pointer",
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              <Dashboard
                data={dashboardData}
                loading={loading}
                lastUpdated={lastUpdated}
              />
            </>
          )}

          {activePage === "Devices" && (
            <DevicesPage />
          )}

          {activePage === "Threat Detection" && (
            <ThreatsPage />
          )}
          {activePage === "Response Center" && (
            <ResponseCenter />
          )}
          {activePage === "Intelligence" && (
            <IntelligencePage />
          )}
          {activePage === "Analytics" && (
            <AnalyticsPage />
          )}
          {activePage === "Settings" && (
            <SettingsPage
              refreshSeconds={refreshSeconds}
              onRefreshSecondsChange={(value) => {
                localStorage.setItem("sentinel-refresh-seconds", String(value));
                setRefreshSeconds(value);
              }}
              connected={connected}
            />
          )}

          {activePage !== "Dashboard" &&
           activePage !== "Devices" &&
           activePage !== "Threat Detection" &&
           activePage !== "Response Center" &&
           activePage !== "Intelligence" &&
           activePage !== "Analytics" &&
           activePage !== "Settings" && (
          <PlaceholderPage title={activePage} />
          )}
        </div>
      </main>
    </div>
  );
}

/* ==========================================
   DASHBOARD
========================================== */

function Dashboard({ data, loading, lastUpdated }) {
  const devices = data?.devices ?? null;
  const threats = data?.threats ?? null;
  const suspicious = data?.suspicious ?? null;
  const risk = data?.risk ?? null;

  const suspiciousPercent =
    devices !== null &&
    devices > 0 &&
    suspicious !== null
      ? ((suspicious / devices) * 100).toFixed(1)
      : null;

  return (
    <>
      {/* HERO */}

      <section className="hero">
        <div className="hero-content">
          <div className="live-label">
            <span />
            LIVE MOBILE NETWORK INTELLIGENCE
          </div>

          <h1>
            Your network.
            <br />
            <span>Under intelligence.</span>
          </h1>

          <p>
            AI-powered behavioral analysis for mobile
            botnet detection and network security
            monitoring.
          </p>
        </div>

        <div className="system-meta">
          <div>
            <span>LAST UPDATE</span>
            <strong>
              {lastUpdated
                ? lastUpdated.toLocaleTimeString()
                : "--:--:--"}
            </strong>
          </div>

          <div>
            <span>UPTIME</span>
            <strong>{data?.uptime ?? "--"}</strong>
          </div>
        </div>
      </section>

      {/* KPI CARDS */}

      <section className="kpi-grid">
        <MetricCard
          icon={<Smartphone />}
          title="MONITORED DEVICES"
          value={displayNumber(devices)}
          footer={
            loading
              ? "Loading..."
              : devices === null
              ? "No data"
              : "Devices recorded"
          }
          type="normal"
        />

        <MetricCard
          icon={<Shield />}
          title="ACTIVE THREATS"
          value={displayNumber(threats)}
          footer={
            threats === null
              ? "No data"
              : "Currently active"
          }
          type="danger"
        />

        <MetricCard
          icon={<AlertTriangle />}
          title="SUSPICIOUS"
          value={displayNumber(suspicious)}
          footer={
            suspiciousPercent === null
              ? "No data"
              : `${suspiciousPercent}%`
          }
          type="warning"
        />

        <MetricCard
          icon={<Activity />}
          title="NETWORK RISK"
          value={displayNumber(risk)}
          suffix="/100"
          footer={
            risk === null
              ? "NO DATA"
              : risk >= 75
              ? "HIGH RISK"
              : risk >= 40
              ? "MODERATE RISK"
              : "LOW RISK"
          }
          type="blue"
        />
      </section>

      {/* MAIN PANELS */}

      <section className="dashboard-grid">
        <NetworkTopology />

        <AIAnalyst risk={risk} />
      </section>

      {/* BOTTOM PANELS */}
   <section className="bottom-grid">
  <TelemetryPanel />
  <ThreatActivityPanel />
  </section>
    </>
  );
}
/* ==========================================
   TELEMETRY PANEL
========================================== */

function TelemetryPanel() {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await api.getTelemetry();
        const data = Array.isArray(response)
          ? response
          : response.telemetry ??
            response.data?.telemetry ??
            response.data ??
            [];

        if (mounted) {
          setRecords(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (err) {
        if (mounted) setError(err.message);
      }
    }

    load();
    const interval = setInterval(load, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

const latest = Object.values(
  [...records]
    .sort(
      (a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
    )
    .reduce((acc, item) => {
      if (!acc[item.device_id]) {
        acc[item.device_id] = item;
      }
      return acc;
    }, {})
).slice(0, 8);

  const maxFrequency = Math.max(
    1,
    ...latest.map(
      (item) => Number(item.network_frequency) || 0
    )
  );

  return (
    <section className="panel data-panel">
      <div style={{ width: "100%" }}>
        <span className="panel-label">
          NETWORK TELEMETRY
        </span>

        <h2>Network activity</h2>

        {error && (
          <p role="alert">Telemetry error: {error}</p>
        )}

        {!error && latest.length === 0 && (
          <p>No telemetry available</p>
        )}

        <div style={{ marginTop: 24 }}>
          {latest.map((item) => {
            const frequency =
              Number(item.network_frequency) || 0;

            const width =
              (frequency / maxFrequency) * 100;

            return (
              <div
                key={item.id}
                style={{ marginBottom: 18 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    fontSize: 12,
                  }}
                >
                  <span>
                    Device #{item.device_id}
                  </span>

                  <span>
                    {frequency} events
                  </span>
                </div>

                <div
                  style={{
                    height: 8,
                    background: "#263244",
                    borderRadius: 8,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${width}%`,
                      background:
                        frequency > 500
                          ? "#ef4444"
                          : frequency > 200
                          ? "#eab308"
                          : "#8b5cf6",
                      borderRadius: 8,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ========================================== 
trestactivitypanel
========================================== */

function ThreatActivityPanel() {
  const [threats, setThreats] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const response = await api.getThreats();

        const data = Array.isArray(response)
          ? response
          : response.threats ??
            response.data?.threats ??
            response.data ??
            [];

        if (mounted) {
          setThreats(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (err) {
        if (mounted) setError(err.message);
      }
    }

    load();
    const interval = setInterval(load, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const active = threats.filter(
    (item) =>
      String(item.status).toUpperCase() === "ACTIVE"
  );

  return (
    <section className="panel data-panel">
      <div style={{ width: "100%" }}>
        <span className="panel-label">
          THREAT ACTIVITY
        </span>

        <h2>Active security events</h2>

        <p>{active.length} active threats</p>

        {error && (
          <p role="alert">Threat API error: {error}</p>
        )}

        {!error && active.length === 0 && (
          <p>No active threats recorded</p>
        )}

        <div style={{ marginTop: 20 }}>
          {active.map((threat) => {
            const severity =
              String(threat.severity).toUpperCase();

            const color =
              severity === "CRITICAL" ||
              severity === "HIGH"
                ? "#ef4444"
                : severity === "MEDIUM"
                ? "#eab308"
                : "#22c55e";

            return (
              <div
                key={threat.id}
                style={{
                  padding: 14,
                  marginBottom: 12,
                  background: "#151c2b",
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <strong style={{ fontSize: 12 }}>
                    {threat.threat_type}
                  </strong>

                  <span
                    style={{
                      color,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {severity}
                  </span>
                </div>

                <p style={{ fontSize: 12 }}>
                  Device #{threat.device_id}
                </p>

                <span style={{ fontSize: 11 }}>
                  {threat.description ||
                    "Security event detected"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ==========================================
   METRIC CARD
========================================== */

function MetricCard({
  icon,
  title,
  value,
  suffix,
  footer,
  type,
}) {
  return (
    <div className={`metric-card ${type}`}>
      <div className="metric-icon">{icon}</div>

      <div className="metric-content">
        <span className="metric-title">
          {title}
        </span>

        <div className="metric-value">
          {value}

          {suffix && <small>{suffix}</small>}
        </div>

        <span className="metric-footer">
          ─ {footer}
        </span>
      </div>
    </div>
  );
}

/* ==========================================
   NETWORK TOPOLOGY
========================================== */


function NetworkTopology() {
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadDevices = async () => {
      try {
        const response = await api.getDevices();

        const list = Array.isArray(response)
          ? response
          : response.devices ??
            response.data?.devices ??
            response.data ??
            [];

        if (mounted) {
          setDevices(Array.isArray(list) ? list : []);
          setError("");
        }
      } catch (err) {
        if (mounted) setError(err.message);
      }
    };

    loadDevices();

    const interval = setInterval(loadDevices, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const getColor = (status) => {
    switch (String(status).toUpperCase()) {
      case "NORMAL":
        return "#22c55e";
      case "SUSPICIOUS":
        return "#eab308";
      case "BOTNET":
        return "#ef4444";
      case "ISOLATED":
        return "#64748b";
      default:
        return "#94a3b8";
    }
  };

  async function handleIsolate(device) {
    const confirmed = window.confirm(
      `Isolate ${device.device_name ?? "Device"}?`
    );

    if (!confirmed) return;

    try {
      await api.isolateDevice(device.id);

      const response = await api.getDevices();

      setDevices(
        Array.isArray(response)
          ? response
          : response.devices ?? response.data?.devices ?? []
      );

      alert("Device isolated successfully!");
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <section className="panel topology-panel">
      <div className="panel-header">
        <div>
          <span className="panel-label">
            NETWORK TOPOLOGY
          </span>
          <h2>Live topology</h2>
        </div>

        <div className="legend">
          <span><i className="green" />Normal</span>
          <span><i className="yellow" />Suspicious</span>
          <span><i className="red" />Botnet</span>
        </div>
      </div>

      <div
        className="topology"
        style={{
          position: "relative",
          minHeight: 360,
          overflow: "hidden",
        }}
      >
        <div className="radar radar-one" />
        <div className="radar radar-two" />
        <div className="radar radar-three" />

        <div className="cross horizontal" />
        <div className="cross vertical" />

        <div
          className="gateway-node"
          style={{ zIndex: 3 }}
        >
          <div><Shield size={19} /></div>
          <span>GATEWAY</span>
        </div>

        <svg
          viewBox="0 0 1000 500"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {devices.map((device, index) => {
            const angle =
              (2 * Math.PI * index) / devices.length;

            const x = 50 + 37 * Math.cos(angle);
            const y = 50 + 36 * Math.sin(angle);

            return (
              <line
                key={device.id ?? index}
                x1="50%"
                y1="50%"
                x2={`${x}%`}
                y2={`${y}%`}
                stroke={getColor(device.status)}
                strokeWidth="1.5"
                strokeOpacity="0.45"
                strokeDasharray="5 5"
              />
            );
          })}
        </svg>

        {devices.map((device, index) => {
          const angle =
            (2 * Math.PI * index) / devices.length;

          const x = 50 + 37 * Math.cos(angle);
          const y = 50 + 36 * Math.sin(angle);

          return (
            <div
              key={device.id ?? index}
              title={`${device.device_name ?? "Device"}
Status: ${device.status ?? "Unknown"}

IP: ${device.ip_address ?? "Unknown"}`}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                color: getColor(device.status),
              }}
            >
              <div
                style={{
                  width: 29,
                  height: 29,
                  borderRadius: "50%",
                  background: "#111827",
                  border: `2px solid ${getColor(device.status)}`,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Smartphone size={14} />
              </div>

              <span
                style={{
                  fontSize: 9,
                  maxWidth: 85,
                  textAlign: "center",
                  overflowWrap: "anywhere",
                }}
              >
                {device.device_name ??
                  device.name ??
                  `Device ${index + 1}`}
              </span>
            </div>
          );
        })}

        {error && (
          <div className="empty-topology">
            Failed to load devices: {error}
          </div>
        )}

        {!error && devices.length === 0 && (
          <div className="empty-topology">
            No devices available
          </div>
        )}
      </div>
    </section>
  );
}

/* ==========================================
   AI ANALYST
========================================== */


function AIAnalyst({ risk }) {
  const [telemetry, setTelemetry] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadTelemetry() {
      try {
        const response = await api.getTelemetry();

        const records = Array.isArray(response)
          ? response
          : response.telemetry ??
            response.data?.telemetry ??
            response.data ??
            [];

        if (mounted) {
          setTelemetry(
            Array.isArray(records) ? records : []
          );
          setError("");
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTelemetry();

    const interval = setInterval(
      loadTelemetry,
      30000
    );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const average = (field) => {
    if (!telemetry.length) return null;

    const values = telemetry
      .map((item) => Number(item[field]))
      .filter(Number.isFinite);

    if (!values.length) return null;

    return Math.round(
      values.reduce((sum, value) => sum + value, 0)
      / values.length
    );
  };

  const frequency = average("network_frequency");
  const failed = average("failed_connections");
  const suspicious = average("suspicious_requests");
  const telemetryRisk = average("risk_score");

  const currentRisk = risk ?? telemetryRisk;

  const riskLabel =
    currentRisk === null
      ? "NO DATA"
      : currentRisk >= 75
      ? "HIGH RISK"
      : currentRisk >= 40
      ? "MODERATE RISK"
      : "LOW RISK";

  const bars = [
    {
      title: "Network frequency",
      value: frequency,
      max: 1000
    },
    {
      title: "Failed connections",
      value: failed,
      max: 150
    },
    {
      title: "Suspicious requests",
      value: suspicious,
      max: 100
    },
    {
      title: "Telemetry risk",
      value: telemetryRisk,
      max: 100
    }
  ];

  return (
    <section className="panel analyst-panel">
      <div className="panel-header">
        <div>
          <span className="panel-label">
            AI ANALYST
          </span>
          <h2>Threat assessment</h2>
        </div>

        <div className="ai-live">
          <span />
          {error ? "ERROR" : "API"}
        </div>
      </div>

      <div className="risk-section">
        <div
          className="risk-gauge"
          style={{
            background:
              currentRisk === null
                ? undefined
                : `conic-gradient(
                    ${
                      currentRisk >= 75
                        ? "#ef4444"
                        : currentRisk >= 40
                        ? "#eab308"
                        : "#22c55e"
                    } ${Math.min(
                      100,
                      Math.max(0, currentRisk)
                    )}%,
                    #263244 0
                  )`
          }}
        >
          <div className="risk-inner">
            <strong>
              {currentRisk ?? "--"}
            </strong>
            <span>/100</span>
          </div>
        </div>

        <div className="risk-info">
          <span>RISK SCORE</span>
          <h3>{riskLabel}</h3>
          <p>
            {loading
              ? "Loading telemetry..."
              : error
              ? `Telemetry error: ${error}`
              : telemetry.length
              ? `Analyzing ${telemetry.length} telemetry records`
              : "Waiting for device telemetry"}
          </p>
        </div>
      </div>

      <div className="analysis-bars">
        {bars.map((bar) => (
          <div
            className="analysis-item"
            key={bar.title}
          >
            <div>
              <span>{bar.title}</span>
              <small>
                {bar.value ?? "--"}
              </small>
            </div>

            <div className="analysis-track">
              <span
                style={{
                  display: "block",
                  width: `${
                    bar.value === null
                      ? 0
                      : Math.min(
                          100,
                          Math.max(
                            0,
                            (bar.value / bar.max) * 100
                          )
                        )
                  }%`,
                  height: "100%",
                  background: "#8b5cf6",
                  borderRadius: "inherit"
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
/* ==========================================
   DATA PANEL
========================================== */

function DataPanel({ icon, title, subtitle }) {
  return (
    <section className="panel data-panel">
      <div className="data-icon">
        {icon}
      </div>

      <div>
        <span className="panel-label">
          {title}
        </span>

        <h3>Visualization pending</h3>

        <p>{subtitle}</p>
      </div>
    </section>
  );
}

/* ==========================================
   DEVICES PAGE
========================================== */

function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  async function loadDevices() {
    try {
      setError("");

      const response = await api.getDevices();

      const list = Array.isArray(response)
        ? response
        : response.devices ??
          response.data?.devices ??
          response.data ??
          [];

      setDevices(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDevices();
  }, []);

  async function handleIsolate(device) {
    const deviceId = device.id ?? device._id;

    if (!deviceId) {
      alert("Device ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      `Isolate ${
        device.device_name ??
        device.name ??
        "this device"
      }?`
    );

    if (!confirmed) return;

    try {
      await api.isolateDevice(deviceId);

      await loadDevices();

      if (selectedDevice?.id === deviceId) {
        setSelectedDevice((previous) =>
          previous
            ? {
                ...previous,
                status: "ISOLATED"
              }
            : previous
        );
      }

      alert("Device isolated successfully.");
    } catch (err) {
      alert(`Isolation failed: ${err.message}`);
    }
  }

async function handleViewDetails(device) {
  const deviceId = device.id ?? device._id;

  if (!deviceId) {
    alert("Device ID is missing.");
    return;
  }

  try {
    setDetailLoading(true);

    const response = await api.getDevice(deviceId);

    // Backend returns:
    // {
    //   id,
    //   device_name,
    //   ip_address,
    //   status,
    //   risk_score,
    //   telemetry: [],
    //   threats: []
    // }

    setSelectedDevice(response);

  } catch (err) {
    alert(`Failed to load device details: ${err.message}`);
  } finally {
    setDetailLoading(false);
  }
}
  return (
    <section className="panel" style={{ padding: 24 }}>
      <span className="panel-label">
        DEVICE MONITORING
      </span>

      <h2>Monitored Devices</h2>

      {loading && (
        <p>Loading devices...</p>
      )}

      {error && (
        <p role="alert">
          Failed to load devices: {error}
        </p>
      )}

      {!loading &&
        !error &&
        devices.length === 0 && (
          <p>No devices registered yet.</p>
        )}

      {!loading &&
        !error &&
        devices.map((device, index) => {
          const deviceId =
            device.id ?? device._id;

          const status = String(
            device.status ?? "UNKNOWN"
          ).toUpperCase();

          const deviceName =
            device.device_name ??
            device.name ??
            device.deviceName ??
            `Device ${index + 1}`;

          return (
            <div
              key={deviceId ?? index}
              style={{
                padding: 18,
                marginTop: 14,
                border: "1px solid #334155",
                borderRadius: 12
              }}
            >
              <Smartphone size={20} />

              <h3>
                {deviceName}
              </h3>

              <p>
                IP:{" "}
                {device.ip_address ??
                  device.ipAddress ??
                  device.ip ??
                  "Unknown"}
              </p>

              <p>
                Status:{" "}
                <strong>
                  {status}
                </strong>
              </p>

              <p>
                Risk Score:{" "}
                <strong>
                  {device.risk_score ?? 0}/100
                </strong>
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 14,
                  flexWrap: "wrap"
                }}
              >
                <button
                  onClick={() =>
                    handleViewDetails(device)
                  }
                >
                  {detailLoading
                    ? "Loading..."
                    : "View Details"}
                </button>

                {[
                  "SUSPICIOUS",
                  "HIGH_RISK",
                  "BOTNET"
                ].includes(status) && (
                  <button
                    onClick={() =>
                      handleIsolate(device)
                    }
                  >
                    Isolate Device
                  </button>
                )}
              </div>
            </div>
          );
        })}

      {/* ======================================
          DEVICE INVESTIGATION PANEL
      ====================================== */}

      {selectedDevice && (
        <div
          style={{
            marginTop: 24,
            padding: 24,
            border: "1px solid #475569",
            borderRadius: 14
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <span className="panel-label">
                DEVICE INVESTIGATION
              </span>

              <h2>
                {selectedDevice.device_name ??
                  selectedDevice.name ??
                  "Unknown Device"}
              </h2>
            </div>

            <button
              onClick={() =>
                setSelectedDevice(null)
              }
            >
              Close
            </button>
          </div>

          <hr />

          <h3>
            Current Status
          </h3>

          <p>
            Status:{" "}
            <strong>
              {selectedDevice.status ??
                "UNKNOWN"}
            </strong>
          </p>

          <p>
            IP Address:{" "}
            {selectedDevice.ip_address ??
              "Unknown"}
          </p>

          <p>
            Risk Score:{" "}
            <strong>
              {selectedDevice.risk_score ?? 0}
              /100
            </strong>
          </p>

          {/* TELEMETRY */}

          <h3
            style={{
              marginTop: 24
            }}
          >
            Telemetry History
          </h3>

          {selectedDevice.telemetry?.length ? (
            selectedDevice.telemetry.map(
              (item) => (
                <div
                  key={item.id}
                  style={{
                    padding: 14,
                    marginTop: 10,
                    border:
                      "1px solid #334155",
                    borderRadius: 10
                  }}
                >
                  <p>
                    Network Frequency:{" "}
                    {item.network_frequency}
                  </p>

                  <p>
                    Failed Connections:{" "}
                    {item.failed_connections}
                  </p>

                  <p>
                    Suspicious Requests:{" "}
                    {item.suspicious_requests}
                  </p>

                  <p>
                    Risk Score:{" "}
                    <strong>
                      {item.risk_score}/100
                    </strong>
                  </p>

                  <small>
                    {new Date(
                      item.created_at
                    ).toLocaleString()}
                  </small>
                </div>
              )
            )
          ) : (
            <p>
              No telemetry records found.
            </p>
          )}

          {/* THREATS */}
      {/* ======================================
    DETECTION EVIDENCE
====================================== */}

<h3
  style={{
    marginTop: 24
  }}
>
  Detection Evidence
</h3>

{selectedDevice.telemetry?.length ? (
  (() => {
    const latest = selectedDevice.telemetry[0];

    const frequency =
      Number(latest.network_frequency) || 0;

    const failed =
      Number(latest.failed_connections) || 0;

    const suspicious =
      Number(latest.suspicious_requests) || 0;

    const indicators = [];

    if (frequency >= 100) {
      indicators.push({
        name: "High connection frequency",
        score: 25
      });
    }

    if (failed >= 10) {
      indicators.push({
        name: "Large number of failed connections",
        score: 20
      });
    }

    if (suspicious >= 10) {
      indicators.push({
        name: "High number of suspicious requests",
        score: 25
      });
    }

    if (
      frequency >= 150 &&
      failed >= 15 &&
      suspicious >= 15
    ) {
      indicators.push({
        name: "Highly abnormal device behavior",
        score: 30
      });
    }

    if (indicators.length === 0) {
      return (
        <p>
          No detection indicators triggered.
        </p>
      );
    }

    return indicators.map(
      (indicator, index) => (
        <div
          key={index}
          style={{
            padding: 14,
            marginTop: 10,
            border: "1px solid #334155",
            borderRadius: 10
          }}
        >
          <strong>
            {indicator.name}
          </strong>

          <p>
            Risk contribution: +{indicator.score}
          </p>
        </div>
      )
    );
  })()
) : (
  <p>
    No telemetry available for analysis.
  </p>
)}
          <h3
            style={{
              marginTop: 24
            }}
          >
            Detected Threats
          </h3>

          {selectedDevice.threats?.length ? (
            selectedDevice.threats.map(
              (threat) => (
                <div
                  key={threat.id}
                  style={{
                    padding: 14,
                    marginTop: 10,
                    border:
                      "1px solid #334155",
                    borderRadius: 10
                  }}
                >
                  <strong>
                    {threat.threat_type}
                  </strong>

                  <p>
                    Severity:{" "}
                    {threat.severity}
                  </p>

                  <p>
                    Status:{" "}
                    {threat.status}
                  </p>

                  <p>
                    {threat.description}
                  </p>

                  <small>
                    {new Date(
                      threat.detected_at
                    ).toLocaleString()}
                  </small>
                </div>
              )
            )
          ) : (
            <p>
              No threats found for this device.
            </p>
          )}
        </div>
      )}
    </section>
  );
}



/* ==========================================
   THREAT DETECTION PAGE
========================================== */
function ThreatsPage() {
  const [threats, setThreats] = useState([]);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const [loading, setLoading] = useState(true);
  const [investigationLoading, setInvestigationLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD ALL THREATS
  // =====================================================

  async function loadThreats() {
    try {
      setError("");

      const response = await api.getThreats();

      const list = Array.isArray(response)
        ? response
        : response.threats ??
          response.data?.threats ??
          response.data ??
          [];

      setThreats(Array.isArray(list) ? list : []);

    } catch (err) {
      setError(err.message);

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadThreats();
  }, []);


  // =====================================================
  // OPEN THREAT INVESTIGATION
  // =====================================================

  async function handleViewDetails(threat) {
    const threatId = threat.id ?? threat._id;

    if (!threatId) {
      alert("Threat ID is missing.");
      return;
    }

    try {
      setInvestigationLoading(true);
      setError("");

      const detail = await api.getThreat(threatId);

      setSelectedThreat(detail);

      // Load related device information
      if (detail.device_id) {
        try {
          const device = await api.getDevice(detail.device_id);
          setSelectedDevice(device);
        } catch {
          setSelectedDevice(null);
        }
      }

    } catch (err) {
      setError(`Unable to load threat details: ${err.message}`);

    } finally {
      setInvestigationLoading(false);
    }
  }


  // =====================================================
  // INVESTIGATE THREAT
  // =====================================================

  async function handleInvestigate() {
    if (!selectedThreat?.id) return;

    try {
      setInvestigationLoading(true);

      await api.investigateThreat(selectedThreat.id);

      const updated = await api.getThreat(selectedThreat.id);

      setSelectedThreat(updated);

      await loadThreats();

    } catch (err) {
      alert(`Investigation failed: ${err.message}`);

    } finally {
      setInvestigationLoading(false);
    }
  }


  // =====================================================
  // RESOLVE THREAT
  // =====================================================

  async function handleResolve(threatId = selectedThreat?.id) {
    if (!threatId) {
      alert("Threat ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      "Mark this threat as resolved?"
    );

    if (!confirmed) return;

    try {
      setInvestigationLoading(true);

      await api.resolveThreat(threatId);

      await loadThreats();

      const updated = await api.getThreat(threatId);

      setSelectedThreat(updated);

      alert("Threat resolved successfully.");

    } catch (err) {
      alert(`Resolution failed: ${err.message}`);

    } finally {
      setInvestigationLoading(false);
    }
  }


  // =====================================================
  // ISOLATE RELATED DEVICE
  // =====================================================

  async function handleIsolateDevice() {
    if (!selectedThreat?.device_id) {
      alert("Device ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      `Isolate ${
        selectedThreat.device_name ??
        "this device"
      }?`
    );

    if (!confirmed) return;

    try {
      setInvestigationLoading(true);

      await api.isolateDevice(
        selectedThreat.device_id
      );

      // Refresh device information
      try {
        const device = await api.getDevice(
          selectedThreat.device_id
        );

        setSelectedDevice(device);
      } catch {
        // Device detail refresh is optional
      }

      await loadThreats();

      alert("Device isolated successfully.");

    } catch (err) {
      alert(`Isolation failed: ${err.message}`);

    } finally {
      setInvestigationLoading(false);
    }
  }


  // =====================================================
  // CLOSE INVESTIGATION
  // =====================================================

  function closeInvestigation() {
    setSelectedThreat(null);
    setSelectedDevice(null);
  }


  // =====================================================
  // HELPERS
  // =====================================================

  function severityColor(severity) {
    switch (String(severity).toUpperCase()) {
      case "CRITICAL":
        return "#ef4444";

      case "HIGH":
        return "#f97316";

      case "MEDIUM":
        return "#eab308";

      case "LOW":
        return "#22c55e";

      default:
        return "#94a3b8";
    }
  }


  function statusColor(status) {
    switch (String(status).toUpperCase()) {
      case "ACTIVE":
        return "#ef4444";

      case "INVESTIGATING":
        return "#eab308";

      case "RESOLVED":
        return "#22c55e";

      default:
        return "#94a3b8";
    }
  }


  // =====================================================
  // UI
  // =====================================================

  return (
    <section
      className="panel"
      style={{
        padding: 24,
        position: "relative"
      }}
    >

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          marginBottom: 24
        }}
      >

        <div>
          <span className="panel-label">
            THREAT INTELLIGENCE
          </span>

          <h2>
            Detected Threats
          </h2>

          <p
            style={{
              color: "#94a3b8",
              marginTop: 6
            }}
          >
            Security events detected by the
            mobile botnet analysis engine.
          </p>
        </div>

        <div
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid #334155",
            color: "#94a3b8",
            fontSize: 12
          }}
        >
          {threats.length} events
        </div>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          style={{
            padding: 14,
            marginBottom: 16,
            borderRadius: 10,
            border: "1px solid #7f1d1d",
            background: "rgba(127,29,29,0.15)",
            color: "#fca5a5"
          }}
        >
          {error}
        </div>
      )}


      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            color: "#94a3b8"
          }}
        >
          Loading threat intelligence...
        </div>
      )}


      {/* =================================================
          EMPTY
      ================================================= */}

      {!loading &&
        !error &&
        threats.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              border: "1px dashed #334155",
              borderRadius: 12,
              color: "#94a3b8"
            }}
          >
            No security threats detected.
          </div>
        )}


      {/* =================================================
          THREAT LIST
      ================================================= */}

      {!loading &&
        threats.map((threat, index) => {

          const threatId =
            threat.id ??
            threat._id ??
            index;

          const threatType =
            threat.threat_type ??
            threat.type ??
            "UNKNOWN_THREAT";

          const severity =
            String(
              threat.severity ?? "UNKNOWN"
            ).toUpperCase();

          const status =
            String(
              threat.status ?? "UNKNOWN"
            ).toUpperCase();

          return (
            <div
              key={threatId}
              style={{
                padding: 20,
                marginTop: 14,
                border: "1px solid #334155",
                borderRadius: 14,
                background:
                  "rgba(15,23,42,0.45)"
              }}
            >

              {/* TOP ROW */}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "flex-start",
                  gap: 20
                }}
              >

                <div
                  style={{
                    display: "flex",
                    gap: 14
                  }}
                >

                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      display: "grid",
                      placeItems: "center",
                      background:
                        "rgba(239,68,68,0.12)",
                      color: "#f87171"
                    }}
                  >
                    <AlertTriangle size={20} />
                  </div>

                  <div>

                    <h3
                      style={{
                        margin: 0,
                        letterSpacing:
                          "0.02em"
                      }}
                    >
                      {threatType}
                    </h3>

                    <p
                      style={{
                        margin:
                          "5px 0 0",
                        color: "#64748b",
                        fontSize: 12
                      }}
                    >
                      Threat ID #{threatId}
                    </p>

                  </div>

                </div>


                {/* BADGES */}

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap"
                  }}
                >

                  <span
                    style={{
                      padding:
                        "5px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      color:
                        severityColor(
                          severity
                        ),
                      border:
                        `1px solid ${severityColor(
                          severity
                        )}55`,
                      background:
                        `${severityColor(
                          severity
                        )}12`
                    }}
                  >
                    {severity}
                  </span>

                  <span
                    style={{
                      padding:
                        "5px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      color:
                        statusColor(status),
                      border:
                        `1px solid ${statusColor(
                          status
                        )}55`,
                      background:
                        `${statusColor(
                          status
                        )}12`
                    }}
                  >
                    {status}
                  </span>

                </div>

              </div>


              {/* DESCRIPTION */}

              <p
                style={{
                  margin:
                    "16px 0",
                  color: "#cbd5e1",
                  lineHeight: 1.6
                }}
              >
                {threat.description ??
                  "Security event detected by the analysis engine."}
              </p>


              {/* DEVICE */}

              <div
                style={{
                  display: "flex",
                  gap: 30,
                  flexWrap: "wrap",
                  color: "#94a3b8",
                  fontSize: 13
                }}
              >

                <span>
                  Device:{" "}
                  <strong
                    style={{
                      color: "#e2e8f0"
                    }}
                  >
                    {threat.device_name ??
                      `Device #${threat.device_id}`}
                  </strong>
                </span>

                {threat.ip_address && (
                  <span>
                    IP:{" "}
                    <strong
                      style={{
                        color: "#e2e8f0"
                      }}
                    >
                      {threat.ip_address}
                    </strong>
                  </span>
                )}

              </div>


              {/* ACTIONS */}

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginTop: 18,
                  flexWrap: "wrap"
                }}
              >

                <button
                  onClick={() =>
                    handleViewDetails(
                      threat
                    )
                  }
                  style={{
                    padding:
                      "9px 14px",
                    borderRadius: 8,
                    border:
                      "1px solid #475569",
                    background:
                      "#111827",
                    color: "#e2e8f0",
                    cursor: "pointer"
                  }}
                >
                  View Details
                </button>


                {status === "ACTIVE" && (
                  <button
                    onClick={() =>
                      handleResolve(
                        threatId
                      )
                    }
                    style={{
                      padding:
                        "9px 14px",
                      borderRadius: 8,
                      border: "none",
                      background:
                        "#16a34a",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                  >
                    Resolve
                  </button>
                )}

              </div>

            </div>
          );
        })}


      {/* =================================================
          INVESTIGATION OVERLAY
      ================================================= */}

      {selectedThreat && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background:
              "rgba(2,6,23,0.82)",
            backdropFilter:
              "blur(8px)",
            padding: 30,
            overflowY: "auto"
          }}
        >

          <div
            style={{
              maxWidth: 1000,
              margin: "40px auto",
              background: "#090d18",
              border:
                "1px solid #334155",
              borderRadius: 18,
              padding: 26,
              boxShadow:
                "0 25px 80px rgba(0,0,0,0.55)"
            }}
          >

            {/* HEADER */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "flex-start",
                gap: 20
              }}
            >

              <div>

                <span className="panel-label">
                  DEVICE INVESTIGATION
                </span>

                <h2
                  style={{
                    marginTop: 8
                  }}
                >
                  {selectedThreat.threat_type}
                </h2>

                <p
                  style={{
                    color: "#64748b"
                  }}
                >
                  Threat #{selectedThreat.id}
                </p>

              </div>

              <button
                onClick={closeInvestigation}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 9,
                  border:
                    "1px solid #334155",
                  background:
                    "#111827",
                  color: "#cbd5e1",
                  cursor: "pointer"
                }}
              >
                <X size={18} />
              </button>

            </div>


            {/* STATUS GRID */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(180px,1fr))",
                gap: 12,
                marginTop: 24
              }}
            >

              <div className="panel">
                <span className="panel-label">
                  SEVERITY
                </span>

                <h3
                  style={{
                    color:
                      severityColor(
                        selectedThreat.severity
                      )
                  }}
                >
                  {selectedThreat.severity}
                </h3>
              </div>


              <div className="panel">
                <span className="panel-label">
                  STATUS
                </span>

                <h3
                  style={{
                    color:
                      statusColor(
                        selectedThreat.status
                      )
                  }}
                >
                  {selectedThreat.status}
                </h3>
              </div>


              <div className="panel">
                <span className="panel-label">
                  DEVICE RISK
                </span>

                <h3>
                  {selectedThreat.device_risk_score ??
                    selectedThreat.risk_score ??
                    "--"}
                  /100
                </h3>
              </div>

            </div>


            {/* DEVICE INFORMATION */}

            <div
              style={{
                marginTop: 20,
                padding: 20,
                border:
                  "1px solid #1e293b",
                borderRadius: 12
              }}
            >

              <span className="panel-label">
                AFFECTED DEVICE
              </span>

              <h3>
                {selectedThreat.device_name ??
                  `Device #${selectedThreat.device_id}`}
              </h3>

              <p>
                IP Address:{" "}
                {selectedThreat.ip_address ??
                  "Unknown"}
              </p>

              <p>
                Device Status:{" "}
                {selectedThreat.device_status ??
                  selectedDevice?.status ??
                  "Unknown"}
              </p>

            </div>


            {/* THREAT DESCRIPTION */}

            <div
              style={{
                marginTop: 20,
                padding: 20,
                border:
                  "1px solid #1e293b",
                borderRadius: 12
              }}
            >

              <span className="panel-label">
                DETECTION EVIDENCE
              </span>

              <p
                style={{
                  color: "#cbd5e1",
                  lineHeight: 1.7
                }}
              >
                {selectedThreat.description ??
                  "No additional evidence recorded."}
              </p>

              <div
                style={{
                  marginTop: 15,
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 12
                }}
              >

                <div>
                  <small
                    style={{
                      color: "#64748b"
                    }}
                  >
                    Detection Rule
                  </small>

                  <div>
                    {selectedThreat.detection_rule ??
                      "Rule-based analysis"}
                  </div>
                </div>


                <div>
                  <small
                    style={{
                      color: "#64748b"
                    }}
                  >
                    Confidence
                  </small>

                  <div>
                    {selectedThreat.confidence ??
                      "--"}
                    {selectedThreat.confidence != null &&
                      "%"}
                  </div>
                </div>


                <div>
                  <small
                    style={{
                      color: "#64748b"
                    }}
                  >
                    Detected At
                  </small>

                  <div>
                    {selectedThreat.detected_at
                      ? new Date(
                          selectedThreat.detected_at
                        ).toLocaleString()
                      : "Unknown"}
                  </div>
                </div>

              </div>

            </div>


            {/* DEVICE TELEMETRY */}

            {selectedDevice?.telemetry?.length > 0 && (
              <div
                style={{
                  marginTop: 20,
                  padding: 20,
                  border:
                    "1px solid #1e293b",
                  borderRadius: 12
                }}
              >

                <span className="panel-label">
                  RECENT TELEMETRY
                </span>

                {selectedDevice.telemetry
                  .slice(0, 5)
                  .map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding:
                          "12px 0",
                        borderBottom:
                          "1px solid #1e293b"
                      }}
                    >

                      <div>
                        Network Frequency:{" "}
                        {item.network_frequency}
                      </div>

                      <div>
                        Failed Connections:{" "}
                        {item.failed_connections}
                      </div>

                      <div>
                        Suspicious Requests:{" "}
                        {item.suspicious_requests}
                      </div>

                      <div
                        style={{
                          color: "#a78bfa"
                        }}
                      >
                        Risk Score:{" "}
                        {item.risk_score}/100
                      </div>

                    </div>
                  ))}

              </div>
            )}


            {/* ACTION BAR */}

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 25,
                paddingTop: 20,
                borderTop:
                  "1px solid #1e293b",
                flexWrap: "wrap"
              }}
            >

              {selectedThreat.status ===
                "ACTIVE" && (
                <button
                  onClick={
                    handleInvestigate
                  }
                  disabled={
                    investigationLoading
                  }
                  style={{
                    padding:
                      "11px 18px",
                    border: "none",
                    borderRadius: 9,
                    background:
                      "#eab308",
                    color: "#111827",
                    fontWeight: 700,
                    cursor:
                      "pointer"
                  }}
                >
                  {investigationLoading
                    ? "Processing..."
                    : "Start Investigation"}
                </button>
              )}


              {selectedThreat.status !==
                "RESOLVED" && (
                <button
                  onClick={
                    handleResolve
                  }
                  disabled={
                    investigationLoading
                  }
                  style={{
                    padding:
                      "11px 18px",
                    border: "none",
                    borderRadius: 9,
                    background:
                      "#16a34a",
                    color: "#fff",
                    fontWeight: 700,
                    cursor:
                      "pointer"
                  }}
                >
                  Resolve Threat
                </button>
              )}


              {selectedThreat.device_id &&
                selectedThreat.device_status !==
                  "ISOLATED" && (
                <button
                  onClick={
                    handleIsolateDevice
                  }
                  disabled={
                    investigationLoading
                  }
                  style={{
                    padding:
                      "11px 18px",
                    border:
                      "1px solid #ef4444",
                    borderRadius: 9,
                    background:
                      "rgba(239,68,68,0.1)",
                    color: "#f87171",
                    fontWeight: 700,
                    cursor:
                      "pointer"
                  }}
                >
                  Isolate Device
                </button>
              )}

            </div>

          </div>

        </div>
      )}

    </section>
  );
}
/* ==========================================
   INTELLIGENCE PAGE
========================================== */

function IntelligencePage() {
  const [threats, setThreats] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([api.getThreats(), api.getTelemetry()])
      .then(([threatResponse, telemetryResponse]) => {
        if (!active) return;
        setThreats(Array.isArray(threatResponse) ? threatResponse : threatResponse.threats ?? []);
        setTelemetry(Array.isArray(telemetryResponse) ? telemetryResponse : telemetryResponse.telemetry ?? []);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const threatGroups = [
    { label: "C2 / beaconing", match: /c2|beacon|command.?and.?control/i, tone: "#f97316" },
    { label: "Scanning", match: /scan|recon/i, tone: "#facc15" },
    { label: "Exfiltration", match: /exfil|upload/i, tone: "#ef4444" },
    { label: "Baseline anomalies", match: /device_baseline_anomaly|device.?baseline/i, tone: "#38bdf8" },
    { label: "Other detections", match: null, tone: "#38bdf8" }
  ];
  const indicators = threatGroups.map((group) => ({
    ...group,
    value: group.match
      ? threats.filter((threat) => group.match.test(`${threat.detection_rule ?? ""} ${threat.threat_type ?? ""} ${threat.description ?? ""}`)).length
      : threats.filter((threat) => !threatGroups.slice(0, 4).some((known) => known.match.test(`${threat.detection_rule ?? ""} ${threat.threat_type ?? ""} ${threat.description ?? ""}`))).length
  }));
  const feed = threats.slice(0, 5).map((threat) => ({
    title: threat.threat_type ?? "Security event",
    detail: `${threat.device_name ?? `Device ${threat.device_id}`} · ${threat.severity ?? "Unclassified"} · ${threat.status ?? "Unknown status"}`,
    time: threat.detected_at ? new Date(threat.detected_at).toLocaleString() : ""
  }));
  const highRiskTelemetry = telemetry.filter((record) => Number(record.risk_score) >= 60).length;

  return (
    <section style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <span className="panel-label">THREAT INTELLIGENCE</span>
        <h2 style={{ margin: "8px 0 0" }}>Security intelligence overview</h2>
      </div>

      {error && <div role="alert" style={{ color: "#fca5a5", marginBottom: 16 }}>Could not load intelligence data: {error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {indicators.map((item) => (
          <div key={item.label} style={{ background: "rgba(15,23,42,0.8)", border: "1px solid #334155", borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>{item.label}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: item.tone }}>{loading ? "..." : item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 16 }}>
        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid #334155", borderRadius: 14, padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Behavioral summary</h3>
          <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
            {loading
              ? "Loading recent telemetry and threat records..."
              : `${threats.length} threat records and ${telemetry.length} recent telemetry records are available. ${highRiskTelemetry} telemetry records have a risk score of 60 or higher. These are detection signals for analyst review, not a claim that every event is confirmed malware.`}
          </p>
        </div>

        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid #334155", borderRadius: 14, padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Recent feed</h3>
          {loading ? <p style={{ color: "#94a3b8" }}>Loading recent events...</p> : feed.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {feed.map((item, index) => (
                <div key={`${item.title}-${index}`} style={{ borderBottom: "1px solid #334155", paddingBottom: 10 }}>
                  <strong>{item.title}</strong>
                  <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>{item.detail}</div>
                  {item.time && <time style={{ color: "#64748b", fontSize: 12 }}>{item.time}</time>}
                </div>
              ))}
            </div>
          ) : <p style={{ color: "#94a3b8" }}>No threat records are available yet.</p>}
        </div>
      </div>
    </section>
  );
}

/* ==========================================
   ANALYTICS PAGE
========================================== */

function AnalyticsPage() {
  const [threats, setThreats] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    Promise.all([api.getThreats(), api.getTelemetry(), api.getResponseActions()])
      .then(([threatResponse, telemetryResponse, responseResponse]) => {
        if (!active) return;
        setThreats(Array.isArray(threatResponse) ? threatResponse : threatResponse.threats ?? []);
        setTelemetry(Array.isArray(telemetryResponse) ? telemetryResponse : telemetryResponse.telemetry ?? []);
        setResponses(Array.isArray(responseResponse) ? responseResponse : responseResponse.responses ?? []);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const riskByDay = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    const values = telemetry
      .filter((record) => {
        const recordedAt = new Date(record.created_at);
        return recordedAt >= day && recordedAt < nextDay;
      })
      .map((record) => Number(record.risk_score))
      .filter(Number.isFinite);
    return {
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
      value: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0,
      count: values.length
    };
  });
  const averageRisk = telemetry.length
    ? Math.round(telemetry.reduce((sum, record) => sum + (Number(record.risk_score) || 0), 0) / telemetry.length)
    : null;
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  const threatsThisWeek = threats.filter((threat) => new Date(threat.detected_at) >= weekStart).length;
  
const activeResponses = responses.filter(
  (response) =>
    !["SIMULATED", "EXECUTED", "COMPLETED", "CANCELLED", "FAILED"].includes(
      String(response.status).toUpperCase()
    )
).length;

  const detectionTypes = [
    { name: "C2 / beaconing", match: /c2|beacon|command.?and.?control/i, tone: "#f97316" },
    { name: "Scanning", match: /scan|recon/i, tone: "#facc15" },
    { name: "Exfiltration", match: /exfil|upload/i, tone: "#ef4444" },
    { name: "Baseline anomalies", match: /device_baseline_anomaly|device.?baseline/i, tone: "#38bdf8" },
    { name: "Other", match: null, tone: "#38bdf8" }
  ];
  const types = detectionTypes.map((type) => ({
    ...type,
    count: type.match
      ? threats.filter((threat) => type.match.test(`${threat.detection_rule ?? ""} ${threat.threat_type ?? ""} ${threat.description ?? ""}`)).length
      : threats.filter((threat) => !detectionTypes.slice(0, 4).some((known) => known.match.test(`${threat.detection_rule ?? ""} ${threat.threat_type ?? ""} ${threat.description ?? ""}`))).length
  }));
  const maxTypeCount = Math.max(1, ...types.map((type) => type.count));

  return (
    <section style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <span className="panel-label">ANALYTICS</span>
        <h2 style={{ margin: "8px 0 0" }}>Risk and detection trends</h2>
      </div>
      {error && <div role="alert" style={{ color: "#fca5a5", marginBottom: 16 }}>Could not load analytics data: {error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16 }}>
        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid #334155", borderRadius: 14, padding: 18 }}>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>Risk index</div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>{loading ? "..." : averageRisk === null ? "No data" : `${averageRisk}/100`}</div>
        </div>
        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid #334155", borderRadius: 14, padding: 18 }}>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>Threats this week</div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>{loading ? "..." : threatsThisWeek}</div>
        </div>
        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid #334155", borderRadius: 14, padding: 18 }}>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>Active responses</div>
          <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>{loading ? "..." : activeResponses}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 16, marginTop: 24 }}>
        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid #334155", borderRadius: 14, padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Risk over time</h3>
          <div style={{ display: "flex", alignItems: "end", gap: 10, height: 180, paddingTop: 20 }}>
            {riskByDay.map((day, index) => (
              <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "end", gap: 8 }}>
                <div title={day.count ? `Average risk ${day.value}; ${day.count} records` : "No telemetry records"} style={{ width: "100%", maxWidth: 30, height: `${Math.max(3, day.value)}%`, background: day.count ? "linear-gradient(180deg, #38bdf8 0%, #2563eb 100%)" : "#334155", borderRadius: 8 }} />
                <span style={{ color: "#94a3b8", fontSize: 10 }}>{day.label}</span>
              </div>
            ))}
          </div>
          {!loading && !telemetry.length && <p style={{ color: "#94a3b8", marginBottom: 0 }}>No telemetry records are available for the chart.</p>}
        </div>

        <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid #334155", borderRadius: 14, padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>Detection types</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {types.map((item) => (
              <div key={item.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "#cbd5e1" }}>
                  <span>{item.name}</span>
                  <span>{item.count} events</span>
                </div>
                <div style={{ height: 8, background: "#1e293b", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${(item.count / maxTypeCount) * 100}%`, height: "100%", background: item.tone, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==========================================
   SETTINGS PAGE
========================================== */

function SettingsPage({
  refreshSeconds,
  onRefreshSecondsChange,
  connected,
}) {
  return (
    <section style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <span className="panel-label">SYSTEM SETTINGS</span>
        <h2 style={{ margin: "8px 0 0" }}>
          Dashboard configuration
        </h2>
        <p style={{ color: "#94a3b8" }}>
          Configure monitoring preferences and review platform status.
        </p>
      </div>

      {/* DASHBOARD REFRESH */}
      <div
        style={{
          maxWidth: 620,
          background: "rgba(15,23,42,0.8)",
          border: "1px solid #334155",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <label
          htmlFor="dashboard-refresh"
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Dashboard refresh interval
        </label>

        <p style={{ color: "#94a3b8", marginTop: 0 }}>
          Choose how often the dashboard requests updated summary data.
          This preference is saved in this browser.
        </p>

        <select
          id="dashboard-refresh"
          value={refreshSeconds}
          onChange={(event) =>
            onRefreshSecondsChange(Number(event.target.value))
          }
          style={{
            padding: "10px 12px",
            background: "#0f172a",
            color: "#e2e8f0",
            border: "1px solid #475569",
            borderRadius: 8,
          }}
        >
          <option value={15}>Every 15 seconds</option>
          <option value={30}>Every 30 seconds</option>
          <option value={60}>Every 60 seconds</option>
        </select>
      </div>

      {/* PLATFORM STATUS */}
      <div
        style={{
          maxWidth: 620,
          marginTop: 20,
          background: "rgba(15,23,42,0.8)",
          border: "1px solid #334155",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Platform capabilities</h3>

        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            color: "#cbd5e1",
            lineHeight: 1.9,
          }}
        >
          <li>
            Backend API connection:{" "}
            <strong style={{ color: connected ? "#4ade80" : "#f87171" }}>
              {connected ? "Connected" : "Unavailable"}
            </strong>
          </li>
          <li>Detection: rule-based behavioral analysis</li>
          <li>Machine learning: Isolation Forest integration requires runtime verification</li>
          <li>Response workflow: backend-supported response records</li>
          <li>Device isolation: not confirmed as a real device action</li>
        </ul>
      </div>

      {/* PERMISSIONS AND PRIVACY */}
      <div
        style={{
          maxWidth: 620,
          marginTop: 20,
          background: "rgba(15,23,42,0.8)",
          border: "1px solid #334155",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Permissions &amp; Privacy</h3>

        <p style={{ color: "#94a3b8", lineHeight: 1.7 }}>
          Review the data and device access used by SENTINEL. Android
          permissions are managed by the mobile app and operating system.
          This dashboard does not grant permissions on the user's behalf.
        </p>

        <div
          style={{
            padding: 14,
            marginTop: 14,
            borderRadius: 10,
            background: "rgba(30,41,59,0.65)",
            border: "1px solid #334155",
          }}
        >
          <strong>Device telemetry</strong>
          <p style={{ color: "#94a3b8", marginBottom: 0 }}>
            The mobile app can send supported device metrics to the backend
            for analysis. The actual collected fields depend on the app's
            implementation.
          </p>
        </div>

        <div
          style={{
            padding: 14,
            marginTop: 12,
            borderRadius: 10,
            background: "rgba(30,41,59,0.65)",
            border: "1px solid #334155",
          }}
        >
          <strong>Network access</strong>
          <p style={{ color: "#94a3b8", marginBottom: 0 }}>
            SENTINEL needs network connectivity to communicate with its
            configured backend. The device must be able to reach that server.
          </p>
        </div>

        <div
          style={{
            padding: 14,
            marginTop: 12,
            borderRadius: 10,
            background: "rgba(30,41,59,0.65)",
            border: "1px solid #334155",
          }}
        >
          <strong>Privacy and response safety</strong>
          <p style={{ color: "#94a3b8", marginBottom: 0 }}>
            Use only authorized test devices. Response actions must be
            clearly identified as simulated unless actual device enforcement
            has been implemented and verified.
          </p>
        </div>
      </div>
    </section>
  );
}


/* ==========================================
   PLACEHOLDER PAGE
========================================== */

function PlaceholderPage({ title }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">
        <Shield size={26} />
      </div>

      <span className="panel-label">
        MOBILE BOTNET DETECTION
      </span>

      <h1>{title}</h1>

      <p>
        This module is awaiting backend integration.
      </p>

      <div className="waiting-badge">
        <span />
        COMING SOON
      </div>
    </div>
  );
}

export default App;