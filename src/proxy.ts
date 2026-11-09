import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/admin/session";

/** Keeps the admin behind sign-in. Everything else passes straight through. */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (await verifySession(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  const login = new URL("/admin/login", request.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
