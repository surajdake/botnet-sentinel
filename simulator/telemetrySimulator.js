const API_URL = "http://localhost:5000/api/telemetry";

const devices = [1, 2, 3];

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/*
=========================================================
CONTROLLED SECURITY SCENARIOS
=========================================================
*/

const scenarios = {

  NORMAL: {
    name: "NORMAL_DEVICE",

    generate(deviceId) {
      return {
        device_id: deviceId,
        network_frequency: randomBetween(5, 25),
        failed_connections: randomBetween(0, 2),
        suspicious_requests: randomBetween(0, 2),

        dns_requests: randomBetween(5, 20),
        unique_destinations: randomBetween(1, 5),
        periodic_connections: randomBetween(0, 2),

        upload_bytes: randomBetween(5000, 50000),
        download_bytes: randomBetween(20000, 150000)
      };
    }
  },

  SUSPICIOUS: {
    name: "SUSPICIOUS_BEHAVIOR",

    generate(deviceId) {
      return {
        device_id: deviceId,
        network_frequency: randomBetween(60, 100),
        failed_connections: randomBetween(3, 8),
        suspicious_requests: randomBetween(5, 12),

        dns_requests: randomBetween(20, 50),
        unique_destinations: randomBetween(8, 20),
        periodic_connections: randomBetween(3, 8),

        upload_bytes: randomBetween(100000, 500000),
        download_bytes: randomBetween(300000, 1000000)
      };
    }
  },

  C2: {
    name: "C2_BEACONING",

    generate(deviceId) {
      return {
        device_id: deviceId,
        network_frequency: randomBetween(90, 140),
        failed_connections: randomBetween(5, 12),
        suspicious_requests: randomBetween(8, 15),

        dns_requests: randomBetween(40, 80),
        unique_destinations: randomBetween(2, 6),

        // Repeated connections simulate beacon-like behavior
        periodic_connections: randomBetween(15, 30),

        upload_bytes: randomBetween(200000, 800000),
        download_bytes: randomBetween(300000, 1000000)
      };
    }
  },

  SCANNING: {
    name: "NETWORK_SCANNING",

    generate(deviceId) {
      return {
        device_id: deviceId,
        network_frequency: randomBetween(120, 180),
        failed_connections: randomBetween(10, 25),
        suspicious_requests: randomBetween(10, 20),

        dns_requests: randomBetween(60, 120),

        // Many destinations simulate scanning behavior
        unique_destinations: randomBetween(30, 60),

        periodic_connections: randomBetween(5, 15),

        upload_bytes: randomBetween(100000, 500000),
        download_bytes: randomBetween(200000, 800000)
      };
    }
  },

  EXFILTRATION: {
    name: "DATA_EXFILTRATION",

    generate(deviceId) {
      return {
        device_id: deviceId,
        network_frequency: randomBetween(100, 160),
        failed_connections: randomBetween(5, 15),
        suspicious_requests: randomBetween(8, 18),

        dns_requests: randomBetween(30, 70),
        unique_destinations: randomBetween(10, 25),
        periodic_connections: randomBetween(5, 15),

        // Large outbound transfer
        upload_bytes: randomBetween(
          100000000,
          250000000
        ),

        download_bytes: randomBetween(
          1000000,
          15000000
        )
      };
    }
  },

  BOTNET: {
    name: "BOTNET_LEVEL_BEHAVIOR",

    generate(deviceId) {
      return {
        device_id: deviceId,

        network_frequency: randomBetween(160, 220),
        failed_connections: randomBetween(20, 40),
        suspicious_requests: randomBetween(15, 30),

        dns_requests: randomBetween(80, 150),
        unique_destinations: randomBetween(30, 70),
        periodic_connections: randomBetween(15, 35),

        upload_bytes: randomBetween(
          120000000,
          300000000
        ),

        download_bytes: randomBetween(
          10000000,
          50000000
        )
      };
    }
  }
};


/*
=========================================================
SEND TELEMETRY
=========================================================
*/

async function sendTelemetry(deviceId, scenario) {

  const telemetry = scenario.generate(deviceId);

  try {

    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(telemetry)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Telemetry request failed"
      );
    }

    console.log(
      `[DEVICE ${deviceId}] ` +
      `${scenario.name} | ` +
      `Risk: ${data.detection?.risk_score ?? data.risk_score} | ` +
      `Classification: ${data.detection?.classification ?? "UNKNOWN"} | ` +
      `Responses: ${data.response?.actions?.length ?? 0}`
    );

  } catch (error) {

    console.error(
      `[DEVICE ${deviceId}] Simulator error:`,
      error.message
    );
  }
}


/*
=========================================================
RUN ONE SCENARIO
=========================================================
*/

async function runScenario(name) {

  const scenario = scenarios[name];

  console.log("");
  console.log("==============================================");
  console.log(` SCENARIO: ${scenario.name}`);
  console.log("==============================================");

  for (const deviceId of devices) {

    await sendTelemetry(
      deviceId,
      scenario
    );

    await sleep(1000);
  }
}


/*
=========================================================
MAIN SIMULATION
=========================================================
*/

async function runSimulation() {

  console.clear();

  console.log("==============================================");
  console.log(" MOBILE BOTNET DETECTION");
  console.log(" CONTROLLED TELEMETRY SIMULATOR");
  console.log("==============================================");

  console.log("");
  console.log("Starting security scenario sequence...");

  while (true) {

    await runScenario("NORMAL");

    await sleep(3000);

    await runScenario("SUSPICIOUS");

    await sleep(3000);

    await runScenario("C2");

    await sleep(3000);

    await runScenario("SCANNING");

    await sleep(3000);

    await runScenario("EXFILTRATION");

    await sleep(3000);

    await runScenario("BOTNET");

    console.log("");
    console.log(
      ">>> Security scenario cycle completed."
    );

    console.log(
      ">>> Restarting controlled simulation..."
    );

    await sleep(5000);
  }
}

runSimulation();