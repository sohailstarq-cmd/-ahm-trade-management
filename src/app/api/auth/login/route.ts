import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { generateOtpCode, hashOtpCode, maskEmail, maskPhone } from "@/lib/otp";
import { sendEmailOtp, sendSmsOtp } from "@/lib/notify";
import {
  createPendingAuthToken,
  pendingCookieName,
  pendingMaxAgeSeconds,
} from "@/lib/session";

const MAX_FAILED_ATTEMPTS_WINDOW_MIN = 15;
const MAX_FAILED_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const ipAddress = req.headers.get("x-forwarded-for") ?? undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  // Basic brute-force guard: too many recent failed attempts for this email
  // locks out further tries, regardless of whether the account exists.
  const since = new Date(Date.now() - MAX_FAILED_ATTEMPTS_WINDOW_MIN * 60 * 1000);
  const recentFailures = await prisma.loginHistory.count({
    where: { emailTried: email, success: false, createdAt: { gte: since } },
  });
  if (recentFailures >= MAX_FAILED_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again later or reset your password." },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });

  const fail = async (reason: string) => {
    await prisma.loginHistory.create({
      data: { userId: user?.id, emailTried: email, success: false, reason, ipAddress, userAgent },
    });
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  };

  if (!user) return fail("no_such_user");
  if (user.status !== "ACTIVE") return fail("account_not_active");

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) return fail("bad_password");

  // Password correct — issue OTP for step 2, do NOT create a full session yet.
  const code = generateOtpCode();
  const codeHash = await hashOtpCode(code);
  const destination = user.twoFactorMethod === "EMAIL" ? user.email : user.phone;

  if (user.twoFactorMethod === "SMS" && !user.phone) {
    return NextResponse.json(
      { error: "SMS verification is selected for this account but no phone number is on file. Contact your administrator." },
      { status: 400 }
    );
  }

  const otp = await prisma.otpCode.create({
    data: {
      userId: user.id,
      codeHash,
      method: user.twoFactorMethod,
      destination: destination!,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    },
  });

  if (user.twoFactorMethod === "EMAIL") {
    await sendEmailOtp(user.email, code);
  } else {
    await sendSmsOtp(user.phone!, code);
  }

  const pendingToken = await createPendingAuthToken({ userId: user.id, otpId: otp.id });

  const res = NextResponse.json({
    step: "otp_required",
    method: user.twoFactorMethod,
    destinationMasked:
      user.twoFactorMethod === "EMAIL" ? maskEmail(user.email) : maskPhone(user.phone!),
  });
  res.cookies.set(pendingCookieName, pendingToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: pendingMaxAgeSeconds,
    path: "/",
  });
  return res;
}
