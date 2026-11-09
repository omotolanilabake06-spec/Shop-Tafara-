import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/admin/session";
import { listSubscribers } from "@/lib/db/newsletter";

const cell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Every newsletter sign-up as a spreadsheet, ready to import into an email tool. */
export async function GET() {
  if (!(await verifySession((await cookies()).get(SESSION_COOKIE)?.value))) return new Response("Please sign in.", { status: 401 });
  const rows = (await listSubscribers()).map((s) => [s.email, s.firstName, s.createdAt].map(cell).join(","));
  const day = new Date().toISOString().slice(0, 10);
  return new Response(["Email,First name,Signed up", ...rows].join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="shop-tafara-newsletter-${day}.csv"` },
  });
}
