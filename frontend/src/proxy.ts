import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 Proxy Convention for route protection and access control.
 * Replaces deprecated middleware.ts.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("insight_session");

  const isProtectedPath =
    pathname.startsWith("/learn") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/admin");

  if (isProtectedPath && (!sessionCookie || !sessionCookie.value)) {
    // Safe returnTo parameter (prevent open redirect vulnerabilities)
    const returnTo =
      pathname.startsWith("/") && !pathname.startsWith("//")
        ? pathname
        : "/learn";

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/learn/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
