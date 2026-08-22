import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, sessionCookieName } from "@/lib/session";

// Everything under /dashboard requires a valid, non-expired session cookie.
// jose's jwtVerify already enforces the expiration set at sign time, so an
// expired token fails verification here and the user is bounced to /login —
// this is what gives us "automatic logout" per §30.
export async function middleware(req: NextRequest) {
  const token = req.cookies.get(sessionCookieName)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
