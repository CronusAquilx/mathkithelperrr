import ipaddr from "ipaddr.js";
import { isPublicAddress, validPublicTarget } from "./public-address";

const cache = new Map<string, number>();
export async function publicTarget(url: URL): Promise<boolean> {
  if (!validPublicTarget(url)) return false;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (ipaddr.isValid(host)) return isPublicAddress(host);
  if ((cache.get(host) ?? 0) > Date.now()) return true;
  try {
    const answers = await Promise.all(["A", "AAAA"].map(async type => {
      const endpoint = new URL("https://dns.google/resolve");
      endpoint.searchParams.set("name", host); endpoint.searchParams.set("type", type);
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(5000), redirect: "error" });
      if (!response.ok) throw new Error();
      const body = await response.json() as { Status?: number; Answer?: { type: number; data: string }[] };
      if (body.Status !== 0) throw new Error();
      return (body.Answer ?? []).filter(answer => answer.type === 1 || answer.type === 28).map(answer => answer.data);
    }));
    const addresses = answers.flat();
    if (!addresses.length || !addresses.every(isPublicAddress)) return false;
    if (cache.size > 500) cache.clear();
    cache.set(host, Date.now() + 60000);
    return true;
  } catch { return false; }
}