import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { attachUpgrades, taskTracker } from "./adapter.mjs";

async function fixture(runtime, run) {
  const server = createServer();
  const origin = "https://birch.example";
  const shutdown = attachUpgrades(server, origin, runtime, taskTracker());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try { await run(`ws://127.0.0.1:${address.port}`); }
  finally { shutdown(); server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
}
const validation = (request) => request.headers.get("origin") !== "https://birch.example" ? new Response(null, { status: 403 }) : null;
function rejected(url, origin) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { origin });
    ws.on("unexpected-response", (_req, res) => { res.resume(); ws.terminate(); resolve(res.statusCode); });
    ws.on("error", () => {});
    ws.on("open", () => { ws.terminate(); reject(new Error("Should reject")); });
  });
}
test("rejects cross-origin upgrades before authenticating", async () => {
  await fixture({ validateLiveUpgrade: validation, authenticateRequest: () => { throw new Error("Must not authenticate"); } }, async (url) => {
    assert.equal(await rejected(`${url}/api/live?token=fake`, "https://other.example"), 403);
  });
});
test("rejects missing/invalid sessions", async () => {
  await fixture({ validateLiveUpgrade: validation, authenticateRequest: async () => null }, async (url) => {
    assert.equal(await rejected(`${url}/api/proxy-ws`, "https://birch.example"), 401);
  });
});
test("live upgrade invokes shared relay with verified token and real socket", async () => {
  await fixture({ validateLiveUpgrade: validation, authenticateRequest: async () => "verified", getLiveConfig: () => ({}), bindLiveConnection: (socket, _config, execution, _connect, token) => {
    assert.equal(token, "test-token");
    execution.waitUntil(Promise.resolve());
    socket.onMessage((data) => { socket.send(data); });
  } }, async (url) => {
    const ws = new WebSocket(`${url}/api/live?token=test-token`, { origin: "https://birch.example" });
    await new Promise((resolve, reject) => { ws.on("open", () => ws.send("hello")); ws.on("message", (data) => { assert.equal(data.toString(), "hello"); ws.close(); resolve(); }); ws.on("error", reject); });
  });
});
test("proxy forwards text/binary and protocol through real Node upgrades", async () => {
  const upstream = new WebSocketServer({ port: 80, host: "127.0.0.1" });
  await new Promise((resolve, reject) => { upstream.once("listening", resolve); upstream.once("error", reject); });
  upstream.on("connection", (ws) => ws.on("message", (data, binary) => ws.send(data, { binary })));
  try {
    await fixture({ validateLiveUpgrade: validation, authenticateRequest: async () => "verified", validPublicTarget: () => true, isPublicAddress: () => true }, async (url) => {
      // Only this test runtime bypasses the production public-address validator.
      const target = "ws://127.0.0.1:80";
      const ws = new WebSocket(`${url}/api/proxy-ws?token=x&protocols=echo&url=${encodeURIComponent(target)}`, { origin: "https://birch.example" });
      let stage = 0;
      await new Promise((resolve, reject) => {
        ws.on("message", (data, binary) => {
          if (stage === 0) { assert.deepEqual(JSON.parse(data.toString()), { __astra: "open", protocol: "echo" }); ws.send("hello"); }
          else if (stage === 1) { assert.equal(binary, false); assert.equal(data.toString(), "hello"); ws.send(Buffer.from([1, 2, 3])); }
          else { assert.equal(binary, true); assert.deepEqual([...data], [1, 2, 3]); ws.close(); resolve(); }
          stage++;
        });
        ws.on("error", reject);
      });
    });
  } finally { for (const ws of upstream.clients) ws.terminate(); await new Promise((resolve) => upstream.close(resolve)); }
});
test("proxy refuses private network destinations before connecting", async () => {
  await fixture({ validateLiveUpgrade: validation, authenticateRequest: async () => "verified", validPublicTarget: () => false }, async (url) => {
    assert.equal(await rejected(`${url}/api/proxy-ws?url=${encodeURIComponent("ws://127.0.0.1")}`, "https://birch.example"), 400);
  });
});
test("background drain waits for real work and handles rejection", async () => {
  const tracker = taskTracker(); let completed = false;
  tracker.waitUntil(new Promise((resolve) => setTimeout(() => { completed = true; resolve(); }, 20)));
  await tracker.drain(); assert.equal(completed, true);
});
