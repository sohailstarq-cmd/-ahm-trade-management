import Image from "next/image";
import Link from "next/link";

// Full nav per the approved Phase 1 IA. Items beyond Dashboard route to
// Phase 2+ pages that don't exist yet — they're listed so the shell looks
// and feels like the real app, and become live links as each phase ships.
const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Trade Confirmations", href: "/dashboard/trade-confirmations" },
  { label: "Trades", href: "/dashboard/trades" },
  { label: "Buyers", href: "/dashboard/buyers" },
  { label: "Sellers", href: "/dashboard/sellers" },
  { label: "Products", href: "/dashboard/products" },
  { label: "Shipments", href: "/dashboard/shipments" },
  { label: "Documents", href: "/dashboard/documents" },
  { label: "Payments", href: "/dashboard/payments" },
  { label: "Brokerage", href: "/dashboard/brokerage" },
  { label: "Disputes", href: "/dashboard/disputes" },
  { label: "Contracts", href: "/dashboard/contracts" },
  { label: "Invoices", href: "/dashboard/invoices" },
  { label: "Email", href: "/dashboard/email" },
  { label: "Reports", href: "/dashboard/reports" },
];

const OWNER_ONLY_ITEMS = [
  { label: "Users & Permissions", href: "/dashboard/users" },
  { label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar({ role }: { role: string }) {
  return (
    <aside className="w-64 shrink-0 bg-brand-navy text-white min-h-screen flex flex-col">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <Image src="/logo.png" alt="AL HAMZA MERIDIAN" width={36} height={36} />
        <div>
          <p className="text-sm font-semibold leading-tight">AL HAMZA MERIDIAN</p>
          <p className="text-[10px] text-white/60 tracking-wide">TRADE MANAGEMENT SYSTEM</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block px-5 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white transition-colors"
          >
            {item.label}
          </Link>
        ))}
        {role === "OWNER" && (
          <>
            <div className="mt-3 mb-1 px-5 text-[10px] uppercase tracking-wide text-white/40">
              Administration
            </div>
            {OWNER_ONLY_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-5 py-2 text-sm text-white/85 hover:bg-white/10 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
