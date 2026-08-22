"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [code, setCode] = useState("");
  const [destinationMasked, setDestinationMasked] = useState("");
  const [method, setMethod] = useState<"EMAIL" | "SMS">("EMAIL");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }
      setDestinationMasked(data.destinationMasked);
      setMethod(data.method);
      setStep("otp");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-navy px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl p-8">
        <div className="flex flex-col items-center mb-6">
          <Image src="/logo.png" alt="AL HAMZA MERIDIAN" width={80} height={80} priority />
          <h1 className="mt-4 text-center text-lg font-semibold text-brand-navy">
            AL HAMZA MERIDIAN
          </h1>
          <p className="text-xs text-slate-500 tracking-wide">TRADE MANAGEMENT SYSTEM</p>
        </div>

        {step === "credentials" && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
                placeholder="you@alhamzameridian.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <a href="/forgot-password" className="text-brand-navy hover:underline">
                Forgot password?
              </a>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-brand-navy text-white py-2 text-sm font-medium hover:bg-brand-navyLight disabled:opacity-60"
            >
              {loading ? "Checking…" : "Login"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <p className="text-sm text-slate-600">
              We sent a 6-digit code via {method === "EMAIL" ? "email" : "SMS"} to{" "}
              <span className="font-medium">{destinationMasked}</span>.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-brand-navy"
                placeholder="000000"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-brand-navy text-white py-2 text-sm font-medium hover:bg-brand-navyLight disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Verify & Continue"}
            </button>
            <button
              type="button"
              onClick={() => setStep("credentials")}
              className="w-full text-xs text-slate-500 hover:underline"
            >
              Use a different account
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
