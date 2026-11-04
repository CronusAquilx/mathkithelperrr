import { describe, expect, it } from "vitest";
import { deploymentHealth } from "./deployment-health";

describe("deployment liveness", () => {
  it("serves a noncached, credential-free full-stack health response", async () => {
    const response = deploymentHealth();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      status: "ok",
      app: "Birch OS",
      runtime: "full-stack",
    });
  });
});