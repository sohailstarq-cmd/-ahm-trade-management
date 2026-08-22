/**
 * Email and SMS delivery for OTP codes (and later, trade emails/reminders).
 *
 * IMPORTANT — per the project's own instruction not to claim an integration
 * works when it hasn't actually been configured and tested:
 *
 * Neither function below calls a real provider yet. In development (or
 * whenever EMAIL_PROVIDER / SMS_PROVIDER env vars are unset) they log the
 * message to the server console instead, so you can develop and test the
 * 2FA flow end-to-end without a live provider. Wire in a real provider
 * (e.g. SendGrid/SES for email, Twilio for SMS) before relying on this in
 * production — see README "Wiring real email & SMS".
 */

export async function sendEmailOtp(toEmail: string, code: string): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER;
  if (!provider) {
    console.log(`[DEV EMAIL — not actually sent] OTP for ${toEmail}: ${code}`);
    return;
  }
  throw new Error(
    `EMAIL_PROVIDER=${provider} is set but no provider integration has been implemented yet. ` +
      `Add the provider's SDK call here before enabling this in production.`
  );
}

export async function sendSmsOtp(toPhone: string, code: string): Promise<void> {
  const provider = process.env.SMS_PROVIDER;
  if (!provider) {
    console.log(`[DEV SMS — not actually sent] OTP for ${toPhone}: ${code}`);
    return;
  }
  throw new Error(
    `SMS_PROVIDER=${provider} is set but no provider integration has been implemented yet. ` +
      `Add the provider's SDK call here (e.g. Twilio) before enabling this in production.`
  );
}
