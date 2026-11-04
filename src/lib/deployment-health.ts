/** Liveness only: never checks credentials or discloses deployment bindings. */
export function deploymentHealth(): Response {
  return Response.json(
    { status: "ok", app: "Birch OS", runtime: "full-stack" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
