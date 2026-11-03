import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "./auth";

const state = vi.hoisted(() => ({ failure: false, reject: false }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    get auth() {
      if (state.failure) throw new Error("private configuration details");
      return {
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getSession: () =>
          state.reject
            ? Promise.reject(new Error("private network details"))
            : Promise.resolve({ data: { session: null } }),
      };
    },
  },
}));
vi.mock("@/lib/astra/prefs", () => ({
  activatePreferenceAccount: () => Promise.resolve(),
  flushPreferences: () => Promise.resolve(),
}));
afterEach(() => {
  cleanup();
  state.failure = false;
  state.reject = false;
});
describe("auth startup recovery", () => {
  it("shows a safe recovery screen rather than crashing on missing configuration", async () => {
    state.failure = true;
    render(
      <AuthProvider>
        <div>app ready</div>
      </AuthProvider>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Account connection could not start",
    );
    expect(screen.queryByText("private configuration details")).toBeNull();
  });
  it("handles session request rejection without an unhandled error", async () => {
    state.reject = true;
    render(
      <AuthProvider>
        <div>app ready</div>
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
