import { SignJWT, jwtVerify } from "jose";

// SESSION_SECRET must be set in the environment (see .env.example) — the app
// throws on startup rather than silently running with a guessable default.
const secretValue = process.env.SESSION_SECRET;
if (!secretValue || secretValue.length < 32) {
  throw new Error(
    "SESSION_SECRET is missing or too short. Set a random 32+ character value in your environment before starting the app."
  );
}
const secret = new TextEncoder().encode(secretValue);

export type SessionPayload = {
  userId: string;
  email: string;
  role: string;
  permissions: string[]; // resolved list: role defaults merged with per-user overrides
};

const SESSION_COOKIE = "ahm_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours — reasonable default for an internal finance app

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const sessionCookieName = SESSION_COOKIE;
export const sessionMaxAgeSeconds = SESSION_TTL_SECONDS;

// A separate, short-lived, narrower-purpose token for the gap between
// "password verified" and "OTP verified" — deliberately cannot be used to
// access protected routes (verified separately from the real session cookie).
export type PendingAuthPayload = { userId: string; otpId: string };
const PENDING_TTL_SECONDS = 60 * 10; // 10 minutes to enter the code

export async function createPendingAuthToken(payload: PendingAuthPayload): Promise<string> {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${PENDING_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifyPendingAuthToken(token: string): Promise<PendingAuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as PendingAuthPayload;
  } catch {
    return null;
  }
}

export const pendingCookieName = "ahm_pending_auth";
export const pendingMaxAgeSeconds = PENDING_TTL_SECONDS;
