import { describe, expect, it } from "vitest";
import { isPublicAddress, validPublicTarget } from "./public-address";

describe("proxy public network boundary", () => {
  it.each(["127.0.0.1", "10.0.0.1", "169.254.169.254", "172.16.0.1", "192.168.0.1", "100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1"])("rejects non-public address %s", value => expect(isPublicAddress(value)).toBe(false));
  it("permits global addresses", () => { expect(isPublicAddress("8.8.8.8")).toBe(true); expect(isPublicAddress("2606:4700:4700::1111")).toBe(true); });
  it.each(["http://localhost", "https://service.internal", "https://user:pass@example.com", "http://example.com:3000", "file:///etc/passwd"])("rejects unsafe target %s", value => expect(validPublicTarget(new URL(value))).toBe(false));
});