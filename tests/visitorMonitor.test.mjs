import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const load = async (path, replacements) => {
  let source = await readFile(new URL(path, import.meta.url), "utf8");
  for (const [from, to] of replacements) {
    assert.ok(source.includes(from), `Missing test replacement: ${from}`);
    source = source.replace(from, to);
  }
  const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
};

test("frontend flag enables only the exact explicit value", async () => {
  for (const value of [undefined, "", "false", "TRUE", " true ", "1", "true"]) {
    const config = await load("../src/lib/visitorMonitorConfig.ts", [["import.meta.env.VITE_VISITOR_MONITOR_ENABLED", JSON.stringify(value) ?? "undefined"]]);
    assert.equal(config.visitorMonitorEnabled, value === "true");
  }
});

for (const enabled of [false, true]) {
  test(`visitor telemetry and authenticated requests with frontend gate ${enabled ? "on" : "off"}`, async () => {
    const reads = []; const writes = []; const calls = []; const listeners = []; const intervals = [];
    const values = new Map([["accessToken", "fixture-token"]]);
    globalThis.localStorage = {
      getItem(key) { reads.push(key); return values.get(key) ?? null; },
      setItem(key, value) { writes.push(key); values.set(key, value); },
    };
    Object.defineProperty(globalThis, "crypto", { configurable: true, value: { randomUUID: () => "12345678-1234-1234-1234-123456789abc" } });
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { userAgent: "fixture", languages: [], maxTouchPoints: 0 } });
    globalThis.history = { pushState() {}, replaceState() {} };
    globalThis.location = { pathname: "/fixture" };
    globalThis.addEventListener = (name) => listeners.push(name);
    globalThis.removeEventListener = () => {};
    globalThis.document = { addEventListener: (name) => listeners.push(name), removeEventListener() {}, createElement: () => ({ getContext: () => null }) };
    globalThis.window = { setInterval(fn) { intervals.push(fn); return 1; } };
    globalThis.matchMedia = () => ({ matches: false });
    globalThis.screen = { width: 1000, height: 800, colorDepth: 24 };
    globalThis.devicePixelRatio = 1; globalThis.innerWidth = 800; globalThis.innerHeight = 600; globalThis.isSecureContext = true;
    const api = {
      interceptors: { request: { use(fn) { api.requestInterceptor = fn; } }, response: { use() {} } },
      post(path, body) { calls.push({ path, body }); return Promise.resolve({}); },
    };
    globalThis.__visitorTestAxios = { create: () => api };
    const flagImport = 'import { visitorMonitorEnabled } from "../lib/visitorMonitorConfig";';
    await load("../src/api/axios.ts", [
      ['import axios from "axios";', "const axios = globalThis.__visitorTestAxios;"],
      [flagImport, `const visitorMonitorEnabled = ${enabled};`],
      ['import {\n  ACCESS_TOKEN_KEY,\n  SESSION_EXPIRED_EVENT,\n  clearAccessToken,\n} from "../auth/session";', 'const ACCESS_TOKEN_KEY = "accessToken"; const SESSION_EXPIRED_EVENT = "expired"; const clearAccessToken = () => {};'],
      ['import.meta.env.VITE_API_BASE_URL', '"http://127.0.0.1:9"'],
    ]);
    globalThis.__visitorTestApi = api;
    const telemetry = await load("../src/lib/visitorTelemetry.ts", [
      ['import api from "../api/axios";', "const api = globalThis.__visitorTestApi;"],
      ['import { visitorMonitorEnabled } from "./visitorMonitorConfig";', `const visitorMonitorEnabled = ${enabled};`],
    ]);
    const originalPush = history.pushState;
    const cleanup = telemetry.installVisitorTelemetry();
    await telemetry.sendTelemetry("TEST");
    const request = api.requestInterceptor({ headers: {} });
    assert.equal(request.headers.Authorization, "Bearer fixture-token");
    if (!enabled) {
      assert.deepEqual(reads, ["accessToken"]);
      assert.deepEqual(writes, []);
      assert.deepEqual(listeners, []);
      assert.deepEqual(intervals, []);
      assert.deepEqual(calls, []);
      assert.equal(request.headers["X-Visitor-Id"], undefined);
      assert.equal(history.pushState, originalPush);
    } else {
      assert.equal(writes.length, 1);
      assert.equal(request.headers["X-Visitor-Id"], "12345678123412341234123456789abc");
      assert.equal(calls[0].path, "/v1/visitor-monitor/events");
      assert.equal(calls[0].body.visitorId, request.headers["X-Visitor-Id"]);
      assert.equal(calls[0].body.type, "VISIT");
      assert.ok(listeners.includes("popstate"));
      assert.ok(listeners.includes("visibilitychange"));
      assert.equal(intervals.length, 1);
      assert.notEqual(history.pushState, originalPush);
    }
    cleanup();
    assert.equal(history.pushState, originalPush);
  });
}
