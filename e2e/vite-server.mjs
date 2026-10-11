import { createServer } from "vite";

const port = 4178;
const server = await createServer({
  configFile: new URL("../vite.config.ts", import.meta.url).pathname,
  mode: "e2e",
  server: { host: "127.0.0.1", port, strictPort: true },
});

let closed = false;
const close = async () => {
  if (closed) return;
  closed = true;
  await server.close();
};
process.once("SIGINT", () => void close().finally(() => process.exit(0)));
process.once("SIGTERM", () => void close().finally(() => process.exit(0)));
process.once("exit", () => { void close(); });
await server.listen();
