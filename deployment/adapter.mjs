import { WebSocket, WebSocketServer } from "ws";
import { lookup } from "node:dns";

export function taskTracker() {
  const tasks = new Set();
  return {
    waitUntil(task) {
      const tracked = Promise.resolve(task).catch(() => {
        console.error("Background execution failed");
      }).finally(() => tasks.delete(tracked));
      tasks.add(tracked);
    },
    async drain(timeout = 10000) {
      let timer;
      await Promise.race([
        Promise.allSettled([...tasks]),
        new Promise((resolve) => { timer = setTimeout(resolve, timeout); }),
      ]);
      clearTimeout(timer);
    },
  };
}

export function liveSocket(socket) {
  return {
    get readyState() { return socket.readyState; },
    send(data) {
      if (socket.bufferedAmount > 256 * 1024) throw new Error("Slow connection");
      socket.send(data);
    },
    close(code = 1000, reason) {
      if (socket.readyState !== WebSocket.OPEN) return socket.terminate();
      socket.close(code, reason);
      const timer = setTimeout(() => socket.terminate(), 1000);
      timer.unref();
      socket.once("close", () => clearTimeout(timer));
    },
    onMessage(handler) { socket.on("message", (data, binary) => handler(binary ? data : data.toString())); },
    onClose(handler) { socket.on("close", handler); },
    onError(handler) { socket.on("error", handler); },
  };
}

export function connectGateway(address, headers, signal) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const url = new URL(address);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const upstream = new WebSocket(url, {
      headers, followRedirects: false, handshakeTimeout: 10000,
      maxPayload: 5 * 1024 * 1024, perMessageDeflate: false,
    });
    const abort = () => { upstream.terminate(); reject(new Error("Voice cancelled")); };
    signal.addEventListener("abort", abort, { once: true });
    upstream.once("close", () => signal.removeEventListener("abort", abort));
    upstream.on("error", () => reject(new Error("Voice upstream unavailable")));
    upstream.once("unexpected-response", (_req, res) => {
      res.resume(); upstream.terminate(); reject(new Error("Voice upstream rejected"));
    });
    upstream.once("open", () => signal.aborted ? abort() : resolve(liveSocket(upstream)));
  });
}

function reject(socket, status) {
  socket.end(`HTTP/1.1 ${status} Rejected\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
}

export function attachUpgrades(server, origin, runtime, execution) {
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 5 * 1024 * 1024, perMessageDeflate: false });
  server.on("upgrade", (incoming, socket, head) => {
    void (async () => {
      let upstream;
      try {
        const url = new URL(incoming.url ?? "/", origin);
        if (url.origin !== origin || !["/api/live", "/api/proxy-ws"].includes(url.pathname)) return reject(socket, 404);
        // Use configured public origin behind Render TLS termination, not untrusted forwarded headers.
        const request = new Request(url, { method: incoming.method, headers: incoming.headers });
        const rejected = runtime.validateLiveUpgrade(request);
        if (rejected) return reject(socket, rejected.status);
        const token = url.searchParams.get("token") ?? "";
        const user = await runtime.authenticateRequest(new Request(origin, { headers: { authorization: `Bearer ${token}` } }));
        if (!user) return reject(socket, 401);
        if (url.pathname === "/api/live") {
          const config = runtime.getLiveConfig();
          sockets.handleUpgrade(incoming, socket, head, (browser) => {
            runtime.bindLiveConnection(liveSocket(browser), config, execution, connectGateway, token);
          });
          return;
        }
        const target = new URL(url.searchParams.get("url") ?? "");
        if (!["ws:", "wss:"].includes(target.protocol) || target.username || target.password ||
            (target.port && !["80", "443"].includes(target.port))) return reject(socket, 400);
        const httpTarget = new URL(target);
        httpTarget.protocol = target.protocol === "wss:" ? "https:" : "http:";
        if (!runtime.validPublicTarget(httpTarget)) return reject(socket, 400);
        const publicLookup = (hostname, options, callback) => {
          lookup(hostname, { ...options, all: true }, (error, addresses) => {
            if (error || !addresses.length || !addresses.every(({ address }) => runtime.isPublicAddress(address))) {
              callback(new Error("Public upstream required")); return;
            }
            if (options.all) callback(null, addresses);
            else callback(null, addresses[0].address, addresses[0].family);
          });
        };
        const protocols = (url.searchParams.get("protocols") ?? "").split(",").filter(Boolean);
        upstream = new WebSocket(target, protocols, {
          headers: { origin: url.searchParams.get("origin") ?? target.origin.replace(/^ws/, "http"), "user-agent": "Mozilla/5.0" },
          lookup: publicLookup, followRedirects: false, handshakeTimeout: 10000,
          maxPayload: 5 * 1024 * 1024, perMessageDeflate: false,
        });
        upstream.on("error", () => { if (!socket.destroyed) reject(socket, 502); });
        upstream.once("unexpected-response", (_req, res) => { res.resume(); upstream.terminate(); reject(socket, 502); });
        await new Promise((resolve, fail) => { upstream.once("open", resolve); upstream.once("error", fail); upstream.once("unexpected-response", () => fail(new Error("Rejected"))); });
        if (socket.destroyed) { upstream.terminate(); return; }
        sockets.handleUpgrade(incoming, socket, head, (browser) => {
          browser.send(JSON.stringify({ __astra: "open", protocol: upstream.protocol }));
          const forward = (to, data, binary) => {
            if (to.readyState !== WebSocket.OPEN) return;
            if (to.bufferedAmount > 5 * 1024 * 1024) { browser.close(1013); upstream.close(1013); return; }
            to.send(data, { binary });
          };
          browser.on("message", (data, binary) => forward(upstream, data, binary));
          upstream.on("message", (data, binary) => forward(browser, data, binary));
          const end = (to, code, reason) => {
            const safe = code >= 1000 && code < 5000 && ![1004, 1005, 1006, 1015].includes(code) ? code : 1000;
            liveSocket(to).close(safe, reason.toString());
          };
          browser.on("close", (code, reason) => end(upstream, code, reason));
          upstream.on("close", (code, reason) => end(browser, code, reason));
          browser.on("error", () => upstream.terminate());
          upstream.removeAllListeners("error");
          upstream.on("error", () => browser.close(1011));
        });
      } catch {
        upstream?.terminate();
        if (!socket.destroyed) reject(socket, 502);
      }
    })();
  });
  return () => { for (const socket of sockets.clients) socket.close(1001, "Service restarting"); };
}
