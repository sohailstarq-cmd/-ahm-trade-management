"use client";

import { useRouter } from "next/navigation";

export function TopBar({ email, role }: { email: string; role: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    if (q) router.push(`/dashboard/search?q=${encodeURIComponent(String(q))}`);
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 gap-4">
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <input
          name="q"
          placeholder="Search confirmation no., buyer, BL, invoice…"
          className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy focus:bg-white"
        />
      </form>
      <div className="flex items-center gap-4">
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-slate-800">{email}</p>
          <p className="text-xs text-slate-400">{role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-brand-navy border border-brand-navy/30 rounded-md px-3 py-1.5 hover:bg-brand-navy hover:text-white transition-colors"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
