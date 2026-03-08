/**
 * Start Next.js dev server and expose it on LAN via Windows portproxy (WSL → Windows).
 * Run via: npm run dev:lan
 */
import { spawn, execSync } from "child_process";

const LISTEN_PORT = 3000;
const CONNECT_PORT = 3000;

function setupPortProxy(listenPort: number, connectPort: number): string {
  try {
    const wslIP = execSync("hostname -I", { encoding: "utf8" }).trim().split(" ")[0];
    console.log(`WSL IP detected: ${wslIP}`);

    execSync(
      `Start-Process powershell.exe -Verb RunAs -ArgumentList "-Command", "netsh interface portproxy add v4tov4 listenport=${listenPort} listenaddress=0.0.0.0 connectport=${connectPort} connectaddress=${wslIP}" -Wait`,
      { stdio: "inherit", shell: "powershell.exe", windowsHide: true }
    );

    console.log(
      `Portproxy added: 0.0.0.0:${listenPort} → ${wslIP}:${connectPort}`
    );
    return wslIP;
  } catch (err) {
    console.error("Error setting up portproxy:", err);
    process.exit(1);
  }
}

function removePortProxy(listenPort: number) {
  try {
    execSync(
      `Start-Process powershell.exe -Verb RunAs -ArgumentList "-Command", "netsh interface portproxy delete v4tov4 listenport=${listenPort} listenaddress=0.0.0" -Wait`,
      { stdio: "inherit", shell: "powershell.exe" }
    );
    console.log(`Portproxy removed for port ${listenPort}`);
  } catch (err) {
    console.error("Error removing portproxy:", err);
  }
}

function startServer() {
  setupPortProxy(LISTEN_PORT, CONNECT_PORT);

  const nextProcess = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    shell: true,
    cwd: process.cwd(),
  });

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    console.log("\nCleaning up...");
    removePortProxy(LISTEN_PORT);
    nextProcess.kill("SIGTERM");
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  nextProcess.on("exit", () => {
    cleanup();
  });
}

startServer();
