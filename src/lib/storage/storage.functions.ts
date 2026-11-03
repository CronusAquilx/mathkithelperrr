import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { storageInput, type StorageResult } from "./schema";
import { executeStorage } from "./flux.server";

export const storageOperation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => storageInput.parse(input))
  .handler(async ({ data, context }): Promise<StorageResult> => {
    const session = await context.supabase.auth.getUser();
    if (session.error || !session.data.user || session.data.user.id !== context.userId) {
      return { ok: false, status: 401, error: "Sign in to use Storage." };
    }
    return executeStorage(session.data.user.id, data, {
      base: process.env["FLUX_API_BASE"],
      token: process.env["FLUX_INTEGRATION_TOKEN"],
    });
  });
