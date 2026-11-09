import { connection } from "next/server";
import type { Settings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "./seed";
import { db, must } from "./supabase";

/** Uncached read, for lib/catalog.ts and for emails sent from server actions. */
export async function fetchSettings(): Promise<Settings> {
  const row = must<{ data: Settings } | null>(await db().from("settings").select("data").maybeSingle(), "loading settings");
  // Merge over the defaults so a setting added in a later release has a value before it's first saved.
  return row ? { ...DEFAULT_SETTINGS, ...row.data } : DEFAULT_SETTINGS;
}

/** Fresh settings for the admin. The shop uses the cached getSettings() in lib/catalog.ts. */
export async function getAdminSettings() {
  await connection();
  return fetchSettings();
}

export async function saveSettings(settings: Settings) {
  must(await db().from("settings").upsert({ id: true, data: settings }), "saving settings");
}
