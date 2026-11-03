import { describe, expect, it, vi } from "vitest";

const capture = vi.hoisted(() => ({
  middleware: [] as unknown[],
  validator: undefined as undefined | ((input: unknown) => unknown),
  handler: undefined as
    | undefined
    | ((input: {
        data: unknown;
        context: { userId: string; supabase: { auth: { getUser: () => Promise<unknown> } } };
      }) => Promise<unknown>),
}));
vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      middleware: (items: unknown[]) => {
        capture.middleware = items;
        return builder;
      },
      inputValidator: (validator: (input: unknown) => unknown) => {
        capture.validator = validator;
        return builder;
      },
      handler: (handler: typeof capture.handler) => {
        capture.handler = handler;
        return handler;
      },
    };
    return builder;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({
  requireSupabaseAuth: "verified-bearer-middleware",
}));
vi.mock("./flux.server", () => ({
  executeStorage: vi.fn().mockResolvedValue({ ok: true, operation: "list", files: [] }),
}));
import "./storage.functions";
import { executeStorage } from "./flux.server";

describe("Storage server session enforcement", () => {
  it("registers Birch bearer authentication and rejects identity override at validation", () => {
    expect(capture.middleware).toEqual(["verified-bearer-middleware"]);
    expect(() => capture.validator?.({ operation: "list", externalUserId: "other" })).toThrow();
  });
  it.each([
    { error: {}, data: { user: null } },
    { error: null, data: { user: { id: "different" } } },
  ])("rejects missing or mismatched verified Auth users", async (session) => {
    vi.mocked(executeStorage).mockClear();
    const result = await capture.handler?.({
      data: { operation: "list" },
      context: { userId: "owner", supabase: { auth: { getUser: async () => session } } },
    });
    expect(result).toEqual({ ok: false, status: 401, error: "Sign in to use Storage." });
    expect(executeStorage).not.toHaveBeenCalled();
  });
  it("derives the stable ID from reverified Auth user", async () => {
    vi.mocked(executeStorage).mockClear();
    await capture.handler?.({
      data: { operation: "list" },
      context: {
        userId: "owner",
        supabase: {
          auth: { getUser: async () => ({ error: null, data: { user: { id: "owner" } } }) },
        },
      },
    });
    expect(vi.mocked(executeStorage).mock.calls[0]?.[0]).toBe("owner");
  });
});
