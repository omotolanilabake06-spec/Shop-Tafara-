import "server-only";
import { db, must } from "./supabase";

export type Subscriber = { email: string; firstName: string; source: string; createdAt: string };
type Row = { email: string; first_name: string | null; source: string; created_at: string };

/** Adds a sign-up. Signing up twice keeps the original record. */
export async function addSubscriber(email: string, firstName: string, source: string) {
  must(
    await db()
      .from("newsletter_subscribers")
      .upsert({ email, first_name: firstName || null, source }, { onConflict: "email", ignoreDuplicates: true }),
    "saving a newsletter sign-up",
  );
}

export async function listSubscribers(): Promise<Subscriber[]> {
  const rows = must<Row[]>(
    await db().from("newsletter_subscribers").select("*").order("created_at", { ascending: false }),
    "loading newsletter sign-ups",
  );
  return rows.map((r) => ({ email: r.email, firstName: r.first_name ?? "", source: r.source, createdAt: r.created_at }));
}
