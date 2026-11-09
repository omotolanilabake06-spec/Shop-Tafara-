import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "./session";

/**
 * Server Actions can be called by POST from anywhere, so every admin action checks the
 * session itself rather than relying on the proxy alone.
 */
export async function requireAdmin() {
  if (!(await verifySession((await cookies()).get(SESSION_COOKIE)?.value))) redirect("/admin/login");
  // One owner account for now; Supabase Auth will supply the signed-in staff member's name.
  return { name: "Studio" };
}
