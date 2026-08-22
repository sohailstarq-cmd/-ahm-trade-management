export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-navy px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-8 text-center space-y-3">
        <h1 className="text-lg font-semibold text-brand-navy">Forgot your password?</h1>
        <p className="text-sm text-slate-600">
          Self-service reset isn&apos;t wired up yet — it needs the email-sending provider
          configured (see README). Until then, ask your Owner/Admin to reset your password
          from Users &amp; Permissions.
        </p>
        <a href="/login" className="inline-block text-sm text-brand-navy hover:underline">
          Back to login
        </a>
      </div>
    </main>
  );
}
