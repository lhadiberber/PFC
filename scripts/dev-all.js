import { spawn } from "node:child_process";
import process from "node:process";

const backendPort = process.env.BACKEND_PORT || process.env.PORT || "5000";
const frontendPort = process.env.FRONTEND_PORT || "5178";
const frontendUrl = `http://localhost:${frontendPort}`;
const frontendHealthUrl = `${frontendUrl}/api/health`;
const backendHealthUrl = `http://127.0.0.1:${backendPort}/api/health`;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const children = new Set();

let stopping = false;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function isHealthy(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch (_error) {
    return false;
  }
}

function stopAll(exitCode = 0) {
  if (stopping) {
    return;
  }

  stopping = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => process.exit(exitCode), 250).unref();
}

function runProcess(name, command, args, options = {}) {
  const child = spawn(command, args, {
    ...options,
    stdio: "inherit",
    shell: false,
  });

  children.add(child);

  child.on("exit", (code, signal) => {
    children.delete(child);

    if (stopping) {
      return;
    }

    const reason = signal || `code ${code ?? 0}`;
    console.error(`[${name}] arrete (${reason}).`);
    stopAll(code || 1);
  });

  return child;
}

async function waitForBackend() {
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    if (await isHealthy(backendHealthUrl)) {
      return;
    }

    await sleep(1000);
  }

  throw new Error(`Backend indisponible apres 30s: ${backendHealthUrl}`);
}

async function main() {
  const backendAlreadyRunning = await isHealthy(backendHealthUrl);

  if (backendAlreadyRunning) {
    console.log(`Backend deja disponible: ${backendHealthUrl}`);
  } else {
    console.log(`Demarrage backend sur le port ${backendPort}...`);
    runProcess("backend", "node", ["server.js"], {
      cwd: "backend",
      env: {
        ...process.env,
        PORT: backendPort,
        CLIENT_URL: process.env.CLIENT_URL || frontendUrl,
        FRONTEND_URL: process.env.FRONTEND_URL || frontendUrl,
      },
    });
    await waitForBackend();
    console.log(`Backend pret: ${backendHealthUrl}`);
  }

  if (await isHealthy(frontendHealthUrl)) {
    console.log(`Frontend deja disponible: ${frontendUrl}`);
    console.log("Projet pret.");
    return;
  }

  console.log(`Demarrage frontend sur ${frontendUrl}...`);
  runProcess("frontend", npmCommand, ["run", "dev:frontend"], {
    cwd: ".",
    env: {
      ...process.env,
      FRONTEND_PORT: frontendPort,
    },
  });
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));

main().catch((error) => {
  console.error(error.message);
  stopAll(1);
});
