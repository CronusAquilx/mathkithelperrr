import ipaddr from "ipaddr.js";

export function isPublicAddress(value: string): boolean {
  try {
    const address = ipaddr.process(value.replace(/^\[|\]$/g, ""));
    return address.range() === "unicast";
  } catch {
    return false;
  }
}

export function validPublicTarget(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return (
    ["http:", "https:"].includes(url.protocol) &&
    !url.username &&
    !url.password &&
    !["localhost", "metadata.google.internal"].includes(host) &&
    ![".localhost", ".internal", ".local", ".home", ".test", ".invalid"].some((suffix) =>
      host.endsWith(suffix),
    ) &&
    (!url.port || url.port === "80" || url.port === "443") &&
    (ipaddr.isValid(host.replace(/^\[|\]$/g, "")) ? isPublicAddress(host) : host.includes("."))
  );
}
