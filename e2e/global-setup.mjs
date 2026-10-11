import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { createServer as createHttpServer } from "node:http";

export default async function globalSetup() {
  process.env.VITE_API_BASE_URL = "http://127.0.0.1:9";
  const vite = await createServer({
    configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)),
    mode: "e2e",
    // The isolated harness owns only its dynamically bound HTTP server. HMR
    // would otherwise open Vite's fixed default WebSocket port (24678).
    server: { middlewareMode: true, hmr: false },
    appType: "spa",
  });
  if (vite.config.server.hmr !== false) {
    await vite.close();
    throw new Error("E2E Vite server unexpectedly enabled HMR");
  }
  const server = createHttpServer((request, response) => vite.middlewares(request, response, () => {
    response.statusCode = 404; response.end();
  }));
  try {
    await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  } catch (error) { await vite.close(); throw error; }
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("E2E Vite server did not expose a loopback port");
  process.env.STHN_E2E_ORIGIN = `http://127.0.0.1:${address.port}`;
  console.log(`STHN_E2E_ORIGIN=${process.env.STHN_E2E_ORIGIN}`);
  return async () => { await new Promise(resolve => server.close(resolve)); await vite.close(); };
}
