import { z } from "zod";
import { storageInput, relativeKey, type StorageResult, type StorageFile } from "./schema";

type FluxEnv = { base?: string | undefined; token?: string | undefined };
export function missingFluxNames(env: FluxEnv): string[] {
  return [
    ...(!env.base?.trim() ? ["FLUX_API_BASE"] : []),
    ...(!env.token?.trim() ? ["FLUX_INTEGRATION_TOKEN"] : []),
  ];
}

const safeUrl = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === "https:");
const record = z.record(z.unknown());

function safeConnectionFailure(error: unknown): string {
  // Inspect only to select fixed, credential-free messages; never return or log exceptions.
  const name =
    error != null && typeof error === "object" && "name" in error && typeof error.name === "string"
      ? error.name
      : "";
  const message =
    error != null &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
      ? error.message
      : "";
  if (name === "TimeoutError" || name === "AbortError")
    return "Storage connection timed out while reaching Flux. Check the Flux service availability.";
  if (/redirect/i.test(message))
    return "Flux redirected the integration request. FLUX_API_BASE must be the final published HTTPS origin without redirects.";
  return "Storage could not reach Flux. Check the Flux published origin, network availability and FLUX_API_BASE configuration.";
}

export async function executeStorage(
  userId: string | undefined,
  raw: unknown,
  env: FluxEnv,
  request: typeof fetch = fetch,
): Promise<StorageResult> {
  // This identity comes only from the verified Birch session, never request data.
  if (!userId || !z.string().uuid().safeParse(userId).success)
    return { ok: false, status: 401, error: "Sign in to use Storage." };
  const parsed = storageInput.safeParse(raw);
  if (!parsed.success)
    return { ok: false, status: 400, error: "Invalid file path or upload metadata." };
  const missing = missingFluxNames(env);
  if (missing.length)
    return {
      ok: false,
      status: 503,
      error: `Missing server environment variables: ${missing.join(", ")}`,
    };
  let base: URL;
  try {
    base = new URL(env.base ?? "");
    if (
      base.protocol !== "https:" ||
      base.username ||
      base.password ||
      base.pathname !== "/" ||
      base.search ||
      base.hash
    )
      throw new Error();
  } catch {
    return { ok: false, status: 503, error: "Invalid server environment variable: FLUX_API_BASE" };
  }
  const input = parsed.data;
  const endpoint =
    input.operation === "list"
      ? "objects"
      : input.operation === "upload"
        ? "upload-url"
        : input.operation === "confirm"
          ? "confirm-upload"
          : input.operation === "download"
            ? "download-url"
            : "share-link";
  const url = new URL(`/api/public/integrations/${endpoint}`, base);
  const payload = {
    externalUserId: userId,
    ...(input.operation === "list" ? {} : { key: input.key }),
    ...("size" in input ? { size: input.size } : {}),
    ...(input.operation === "upload" ? { contentType: input.contentType } : {}),
  };
  if (input.operation === "list") {
    url.searchParams.set("externalUserId", userId);
    if (input.folder) url.searchParams.set("prefix", `${input.folder}/`);
  }
  let received = false;
  try {
    const response = await request(url, {
      method: input.operation === "list" ? "GET" : "POST",
      headers: { Authorization: `Bearer ${env.token}`, "Content-Type": "application/json" },
      ...(input.operation === "list" ? {} : { body: JSON.stringify(payload) }),
      signal: AbortSignal.timeout(25000),
      redirect: "error",
    });
    if (!response.ok) {
      const messages: Record<number, string> = {
        400: "Flux rejected this file request. Check its path and file details.",
        401: "Storage connection authorization failed. Check the Flux integration configuration.",
        403: "Flux denied access to this file. Check the integration’s access permissions.",
        429: "Storage is busy. Wait a moment and retry.",
      };
      return {
        ok: false,
        status: response.status,
        error: messages[response.status] ?? "Storage service is unavailable. Please retry.",
      };
    }
    received = true;
    if (input.operation === "confirm") return { ok: true, operation: "confirm" };
    const body: unknown = await response.json();
    if (input.operation === "list") {
      const obj = record.safeParse(body);
      const rows = Array.isArray(body)
        ? body
        : obj.success
          ? (obj.data["objects"] ?? obj.data["files"] ?? obj.data["items"])
          : undefined;
      if (!Array.isArray(rows)) throw new Error();
      const files: StorageFile[] = rows.map((row: unknown) => {
        const item = record.parse(row);
        const source = z.string().parse(item["key"] ?? item["Key"]);
        const ownPrefix = `birchos/${userId}/`;
        const key = relativeKey.parse(
          source.startsWith(ownPrefix) ? source.slice(ownPrefix.length) : source,
        );
        if (key.startsWith("birchos/") || (input.folder && !key.startsWith(`${input.folder}/`)))
          throw new Error();
        return {
          key,
          size: z
            .number()
            .nonnegative()
            .parse(item["size"] ?? item["Size"] ?? 0),
          lastModified: z
            .string()
            .nullable()
            .parse(item["lastModified"] ?? item["LastModified"] ?? null),
          contentType: z
            .string()
            .nullable()
            .parse(item["contentType"] ?? null),
        };
      });
      return { ok: true, operation: "list", files };
    }
    const obj = record.parse(body);
    let sharePathUrl: string | undefined;
    if (input.operation === "share" && typeof obj["path"] === "string") {
      const path = obj["path"];
      if (
        !path.startsWith("/") ||
        path.startsWith("//") ||
        path.includes("\\") ||
        /[\r\n]/.test(path)
      )
        throw new Error();
      const resolved = new URL(path, base);
      if (resolved.origin !== base.origin) throw new Error();
      sharePathUrl = resolved.href;
    }
    const resultUrl = safeUrl.parse(
      obj["url"] ?? (input.operation === "share" ? (obj["shareUrl"] ?? sharePathUrl) : undefined),
    );
    // Never echo arbitrary provider fields, error bodies, configuration or headers.
    if (input.operation === "upload") {
      const returnedKey = obj["key"];
      if (
        (returnedKey !== input.key && returnedKey !== `birchos/${userId}/${input.key}`) ||
        obj["contentType"] !== input.contentType
      )
        throw new Error();
      return {
        ok: true,
        operation: "upload",
        url: resultUrl,
        key: input.key,
        contentType: input.contentType,
        expiresInSeconds: z.number().positive().max(600).parse(obj["expiresInSeconds"]),
      };
    }
    return { ok: true, operation: input.operation, url: resultUrl };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: received
        ? `Flux returned an incompatible ${input.operation} response. Please check the integration API contract.`
        : safeConnectionFailure(error),
    };
  }
}
