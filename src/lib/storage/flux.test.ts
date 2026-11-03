import { describe, expect, it, vi } from "vitest";
import { executeStorage, missingFluxNames } from "./flux.server";
import { MAX_UPLOAD_BYTES, storageInput } from "./schema";

const user = "12345678-1234-4234-8234-123456789012";
// Synthetic fixture configuration, never project credentials.
const env = { base: "https://flux.example", token: "fixture-only" };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
describe("Flux storage account boundaries", () => {
  it("resolves Flux share paths only against the configured origin", async () => {
    const result = await executeStorage(
      user,
      { operation: "share", key: "a.txt" },
      env,
      vi
        .fn()
        .mockResolvedValue(
          response({ slug: "test", kind: "file", path: "/s/test", expiresAt: null }),
        ),
    );
    expect(result).toEqual({ ok: true, operation: "share", url: "https://flux.example/s/test" });
  });
  it.each(["//evil.example/s/test", "/\\evil.example/s/test", "https://evil.example/s/test"])(
    "rejects unsafe share path %s",
    async (path) => {
      expect(
        await executeStorage(
          user,
          { operation: "share", key: "a.txt" },
          env,
          vi.fn().mockResolvedValue(response({ path })),
        ),
      ).toMatchObject({ ok: false, status: 502 });
    },
  );
  it("rejects unauthenticated access before any provider request", async () => {
    const fetcher = vi.fn();
    expect(await executeStorage(undefined, { operation: "list" }, env, fetcher)).toMatchObject({
      ok: false,
      status: 401,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(["externalUserId", "bucketId", "prefix"])(
    "rejects browser %s overrides",
    async (field) => {
      const fetcher = vi.fn();
      expect(
        await executeStorage(user, { operation: "list", [field]: "other-user" }, env, fetcher),
      ).toMatchObject({ ok: false, status: 400 });
      expect(fetcher).not.toHaveBeenCalled();
    },
  );
  it.each([
    "../secret",
    "a/../b",
    "/root",
    "a\\b",
    "%2e%2e/file",
    "a//b",
    "a/./b",
    "a\u0000b",
    "https://other/file",
  ])("rejects traversal/invalid key %s", async (key) => {
    const fetcher = vi.fn();
    expect(await executeStorage(user, { operation: "download", key }, env, fetcher)).toMatchObject({
      ok: false,
      status: 400,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("enforces the 500 MiB maximum", () => {
    expect(MAX_UPLOAD_BYTES).toBe(524288000);
    expect(
      storageInput.safeParse({
        operation: "upload",
        key: "file",
        size: 524288000,
        contentType: "text/plain",
      }).success,
    ).toBe(true);
    expect(
      storageInput.safeParse({
        operation: "upload",
        key: "file",
        size: 524288001,
        contentType: "text/plain",
      }).success,
    ).toBe(false);
  });
  it("rejects malformed MIME metadata", () => {
    expect(
      storageInput.safeParse({
        operation: "upload",
        key: "file",
        size: 1,
        contentType: "text/plain\r\nAuthorization: x",
      }).success,
    ).toBe(false);
  });
  it("reports missing names only", async () => {
    expect(missingFluxNames({})).toEqual(["FLUX_API_BASE", "FLUX_INTEGRATION_TOKEN"]);
    expect(await executeStorage(user, { operation: "list" }, {})).toEqual({
      ok: false,
      status: 503,
      error: "Missing server environment variables: FLUX_API_BASE, FLUX_INTEGRATION_TOKEN",
    });
  });
  it.each([401, 403, 429])("safely maps Flux %s without echoing provider data", async (status) => {
    const result = await executeStorage(
      user,
      { operation: "list" },
      env,
      vi.fn().mockResolvedValue(response({ error: "sensitive-provider-detail" }, status)),
    );
    expect(result).toMatchObject({ ok: false, status });
    expect(JSON.stringify(result)).not.toContain("sensitive-provider-detail");
  });
  it("scopes list requests and projects safe metadata", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      response({
        objects: [{ key: `birchos/${user}/photos/a.jpg`, size: 5, internal: "private" }],
      }),
    );
    const result = await executeStorage(
      user,
      { operation: "list", folder: "photos" },
      env,
      fetcher,
    );
    const [url, init] = fetcher.mock.calls[0] ?? [];
    expect(url.searchParams.get("externalUserId")).toBe(user);
    expect(url.searchParams.get("prefix")).toBe("photos/");
    expect(init.method).toBe("GET");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers.Authorization).toBe("Bearer fixture-only");
    expect(result).toEqual({
      ok: true,
      operation: "list",
      files: [{ key: "photos/a.jpg", size: 5, lastModified: null, contentType: null }],
    });
  });
  it("rejects foreign full-prefix rows", async () => {
    expect(
      await executeStorage(
        user,
        { operation: "list" },
        env,
        vi.fn().mockResolvedValue(response([{ key: "birchos/another-user/a", size: 1 }])),
      ),
    ).toMatchObject({ ok: false, status: 502 });
  });
  it("requests upload then confirmation without proxying file bytes", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          url: "https://s3.example/signed",
          key: "docs/a.txt",
          contentType: "text/plain",
          expiresInSeconds: 600,
        }),
      )
      .mockResolvedValueOnce(response({ ok: true }));
    const upload = await executeStorage(
      user,
      { operation: "upload", key: "docs/a.txt", size: 10, contentType: "text/plain" },
      env,
      fetcher,
    );
    expect(upload).toMatchObject({ ok: true, operation: "upload", expiresInSeconds: 600 });
    expect(
      await executeStorage(
        user,
        { operation: "confirm", key: "docs/a.txt", size: 10 },
        env,
        fetcher,
      ),
    ).toEqual({ ok: true, operation: "confirm" });
    expect(fetcher.mock.calls.map(([url]) => url.pathname)).toEqual([
      "/api/public/integrations/upload-url",
      "/api/public/integrations/confirm-upload",
    ]);
    expect(JSON.parse(fetcher.mock.calls[0]?.[1].body)).toEqual({
      externalUserId: user,
      key: "docs/a.txt",
      size: 10,
      contentType: "text/plain",
    });
    expect(JSON.parse(fetcher.mock.calls[1]?.[1].body)).toEqual({
      externalUserId: user,
      key: "docs/a.txt",
      size: 10,
    });
  });
  it("normalizes Flux's isolated full upload key without exposing it to the browser", async () => {
    const result = await executeStorage(
      user,
      { operation: "upload", key: "a.txt", size: 1, contentType: "text/plain" },
      env,
      vi.fn().mockResolvedValue(
        response({
          key: `birchos/${user}/a.txt`,
          url: "https://s3.example/signed",
          contentType: "text/plain",
          expiresInSeconds: 600,
        }),
      ),
    );
    expect(result).toMatchObject({ ok: true, operation: "upload", key: "a.txt" });
  });
  it.each(["download", "share"] as const)(
    "scopes %s requests and returns only a safe URL",
    async (operation) => {
      const fetcher = vi
        .fn()
        .mockResolvedValue(
          response({ url: "https://files.example/link", secretInternalField: "private" }),
        );
      expect(await executeStorage(user, { operation, key: "docs/a.txt" }, env, fetcher)).toEqual({
        ok: true,
        operation,
        url: "https://files.example/link",
      });
      expect(JSON.parse(fetcher.mock.calls[0]?.[1].body)).toEqual({
        externalUserId: user,
        key: "docs/a.txt",
      });
      expect(fetcher.mock.calls[0]?.[0].pathname).toBe(
        `/api/public/integrations/${operation === "share" ? "share-link" : "download-url"}`,
      );
    },
  );
});
