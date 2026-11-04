import { createServer } from "node:http";
import { middleware } from "../.output/server/index.mjs";
import * as runtime from "../.render/runtime.mjs";
import { attachUpgrades, taskTracker } from "./adapter.mjs";

const publicUrl = new URL(process.env.BIRCH_PUBLIC_ORIGIN ?? "");
if (publicUrl.protocol !== "https:" || publicUrl.pathname !== "/" || publicUrl.search || publicUrl.hash || publicUrl.username || publicUrl.password) {
  throw new Error("BIRCH_PUBLIC_ORIGIN must be the exact HTTPS Render origin");
}
const execution = taskTracker();
const server = createServer((request, response) => {
  const path = request.url?.split("?", 1)[0];
  if (path === "/api/live" || path === "/api/proxy-ws") {
    response.writeHead(426, { "content-type": "text/plain", "cache-control": "no-store" });
    response.end("WebSocket required");
    return;
  }
  // Nitro serves assets, SSR and APIs through the original Start/CSRF/auth pipeline.
  middleware(request, response);
});
const closeSockets = attachUpgrades(server, publicUrl.origin, runtime, execution);
server.listen(Number(process.env.PORT ?? 10000), "0.0.0.0");
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  closeSockets();
  server.close();
  await execution.drain(10000);
  server.closeAllConnections();
  process.exit(0);
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
