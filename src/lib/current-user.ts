import { cookies } from "next/headers";
import { verifySessionToken, sessionCookieName, SessionPayload } from "./session";

// Reads and verifies the session cookie in a Server Component. Middleware
// already blocks unauthenticated requests to /dashboard/*, so in practice
// this should never return null there — but pages still check, rather than
// trusting middleware alone, in case this component is ever reused elsewhere.
export async function getCurrentSession(): Promise<SessionPayload | null> {
  const token = cookies().get(sessionCookieName)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
