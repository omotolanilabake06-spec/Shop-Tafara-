// The one Supabase client. It uses the secret key, so it only ever runs on the server:
// importing this file from a client component fails the build.
import "server-only";
import { type PostgrestError, type SupabaseClient, createClient } from "@supabase/supabase-js";

const state = globalThis as unknown as { __tafaraSupabase?: SupabaseClient };

export function db() {
  if (!state.__tafaraSupabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Supabase is not set up. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.");
    }
    state.__tafaraSupabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: fetchWithRetry },
    });
  }
  return state.__tafaraSupabase;
}

/**
 * Reads retry twice when the network drops (not when the database answers with an error).
 * Writes never retry: a write that timed out may still have landed, and repeating it could double it.
 */
async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  const tries = method === "GET" || method === "HEAD" ? 3 : 1;
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(input, init);
    } catch (e) {
      if (attempt >= tries) throw e;
      await new Promise((r) => setTimeout(r, 250 * attempt));
    }
  }
}

/** Unwraps a query result, turning a database error into a thrown error with context. */
export function must<T>(result: { data: T | null; error: PostgrestError | null }, what: string): T {
  if (result.error) throw new Error(`Database error while ${what}: ${result.error.message}`);
  return result.data as T;
}

/** Postgres "unique violation", e.g. two products saved with the same link at once. */
export const isDuplicate = (error: PostgrestError | null) => error?.code === "23505";

export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
