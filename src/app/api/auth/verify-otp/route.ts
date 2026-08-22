import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyOtpCode } from "@/lib/otp";
import { resolveUserPermissions } from "@/lib/permissions";
import {
  verifyPendingAuthToken,
  createSessionToken,
  sessionCookieName,
  sessionMaxAgeSeconds,
  pendingCookieName,
} from "@/lib/session";

const MAX_OTP_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const pendingToken = req.cookies.get(pendingCookieName)?.value;
  if (!pendingToken) {
    return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
  }

  const pending = await verifyPendingAuthToken(pendingToken);
  if (!pending) {
    return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
  }

  const otp = await prisma.otpCode.findUnique({ where: { id: pending.otpId } });
  if (!otp || otp.userId !== pending.userId || otp.consumedAt) {
    return NextResponse.json({ error: "Invalid or already-used code." }, { status: 401 });
  }
  if (otp.expiresAt < new Date()) {
    return NextResponse.json({ error: "Code expired. Please log in again to get a new one." }, { status: 401 });
  }
  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    return NextResponse.json({ error: "Too many incorrect attempts. Please log in again." }, { status: 429 });
  }

  const ok = await verifyOtpCode(code, otp.codeHash);
  if (!ok) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return NextResponse.json({ error: "Incorrect code." }, { status: 401 });
  }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: pending.userId },
    include: { role: true },
  });
  const permissions = await resolveUserPermissions(user.id);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
    prisma.loginHistory.create({
      data: { userId: user.id, emailTried: user.email, success: true },
    }),
    prisma.activityLog.create({
      data: { userId: user.id, entityType: "user", entityId: user.id, action: "login" },
    }),
  ]);

  const sessionToken = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role.name,
    permissions,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: sessionMaxAgeSeconds,
    path: "/",
  });
  res.cookies.delete(pendingCookieName);
  return res;
}
