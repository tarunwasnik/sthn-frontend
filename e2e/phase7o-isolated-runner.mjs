import assert from "node:assert/strict";
import { createServer } from "node:net";
import { spawn, execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { assertNoUnresolvedAttempt, defaultEvidencePath } from "./phase7o-evidence.mjs";

const frontendDirectory = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(frontendDirectory, "..");
const repositoryRoot = resolve(frontendRoot, "..");
const backendRoot = resolve(repositoryRoot, "backend");
const mongoSystemBinary = resolve(backendRoot, "node_modules", ".cache", "mongodb-memory-server", "mongod-x64-win32-8.2.6.exe");

const freeLoopbackPort = async () => new Promise((resolvePort, reject) => {
  const server = createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    if (!address || typeof address === "string") return reject(new Error("Could not allocate a loopback port."));
    server.close((error) => error ? reject(error) : resolvePort(address.port));
  });
});

const waitFor = (child, phrase, label) => new Promise((resolveReady, rejectReady) => {
  let output = "";
  const timer = setTimeout(() => rejectReady(new Error(`${label} did not become ready within 45 seconds.\n${output}`)), 45_000);
  const append = (chunk) => {
    output += chunk.toString();
    if (output.includes(phrase)) { clearTimeout(timer); resolveReady(output); }
  };
  child.stdout.on("data", append);
  child.stderr.on("data", append);
  child.once("exit", (code) => { clearTimeout(timer); rejectReady(new Error(`${label} exited before readiness (${code}).\n${output}`)); });
});

const stop = async (child) => {
  if (!child || child.exitCode !== null) return;
  try {
    execFileSync("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", timeout: 5_000 });
  } catch {
    // The process can already be gone when Playwright finishes normally.
  }
  child.stdout?.destroy();
  child.stderr?.destroy();
  child.unref();
};

assert.equal(process.env.STHN_PHASE7O_E2E, "true", "Set STHN_PHASE7O_E2E=true to run this isolated harness.");
assert.equal(process.env.NODE_ENV, "test", "Phase 7O runner requires NODE_ENV=test.");

const evidencePath = process.env.STHN_PHASE7O_EVIDENCE_PATH ?? defaultEvidencePath;
await assertNoUnresolvedAttempt(evidencePath);
assert.ok(existsSync(mongoSystemBinary), `Phase 7O requires the project-owned MongoDB 8.2.6 binary at ${mongoSystemBinary}.`);

const [apiPort, frontendPort] = await Promise.all([freeLoopbackPort(), freeLoopbackPort()]);
const apiOrigin = `http://127.0.0.1:${apiPort}`;
const frontendOrigin = `http://127.0.0.1:${frontendPort}`;
const environment = {
  ...process.env,
  NODE_ENV: "test",
  STHN_PHASE7O_E2E: "true",
  PORT: String(apiPort),
  PHASE7O_FRONTEND_ORIGIN: frontendOrigin,
  STHN_PHASE7O_API_ORIGIN: apiOrigin,
  STHN_PHASE7O_FRONTEND_ORIGIN: frontendOrigin,
  STHN_PHASE7O_CUSTOMER_EMAIL: "phase7o.customer@test.local",
  STHN_PHASE7O_CUSTOMER_PASSWORD: "Phase7O-Synthetic-Only",
  STHN_PHASE7O_CREATOR_EMAIL: "phase7o.creator@test.local",
  STHN_PHASE7O_CREATOR_PASSWORD: "Phase7O-Synthetic-Only",
  STHN_PHASE7O_EVIDENCE_PATH: evidencePath,
  // This is intentionally opt-in and never inferred from an old run. A future
  // payment execution needs a fresh explicit authorization after reconciliation.
  STHN_PHASE7O_PAYMENT_SUBMISSION_APPROVED: process.env.STHN_PHASE7O_PAYMENT_SUBMISSION_APPROVED ?? "false",
  // Use the already verified project-owned binary. This avoids a fallback download
  // and never touches the protected user-profile MongoDB cache.
  MONGOMS_VERSION: "8.2.6",
  MONGOMS_SYSTEM_BINARY: mongoSystemBinary,
  VITE_API_BASE_URL: apiOrigin,
  VITE_ENABLE_RAZORPAY_SANDBOX_CHECKOUT: "true",
};

let backend;
let frontend;
try {
  backend = spawn(process.execPath, ["-r", "dotenv/config", "-r", "ts-node/register", "src/scripts/phase7oStartIsolatedE2e.ts"], { cwd: backendRoot, env: environment, stdio: ["ignore", "pipe", "pipe"] });
  const mongoOutput = await waitFor(backend, '"phase7o":"mongodb-ready"', "isolated MongoDB replica-set startup");
  assert.match(mongoOutput, /"source":"project-owned-system-binary"/, "Phase 7O did not use the project-owned MongoDB binary.");
  const backendOutput = await waitFor(backend, '"phase7o":"ready"', "isolated backend");
  assert.match(backendOutput, /"database":"isolated-memory-replset"/, "Backend did not attest to its isolated database.");

  frontend = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(frontendPort), "--strictPort"], { cwd: frontendRoot, env: environment, stdio: ["ignore", "pipe", "pipe"] });
  await waitFor(frontend, frontendOrigin, "isolated frontend");

  const playwright = spawn(process.execPath, ["node_modules/@playwright/test/cli.js", "test", "--config", "playwright.phase7o.config.ts"], { cwd: frontendRoot, env: environment, stdio: "inherit" });
  const code = await new Promise((resolveCode) => playwright.once("exit", (exitCode) => resolveCode(exitCode ?? 1)));
  process.exitCode = code;
} finally {
  await stop(frontend);
  await stop(backend);
}
