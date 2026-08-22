import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { requireSession } from "@/lib/margin";

export default async function BrokeragePage() {
  const session = await requireSession();
  const canManage = session.permissions.includes("manage_brokerage");

  const brokerages = await prisma.brokerage.findMany({
    include: { trade: { include: { buyer: true, seller: true, product: true } }, invoices: true },
    orderBy: { createdAt: "desc" },
  });

  const outstanding = brokerages.filter((b) => b.status !== "PAID");
  const totalOutstanding = outstanding.reduce((sum, b) => sum + (b.calculatedAmount ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Brokerage</h1>
          <p className="text-sm text-slate-500">
            {brokerages.length} trades with brokerage terms set
            {canManage && ` · ~${totalOutstanding.toLocaleString()} outstanding across currencies`}
          </p>
        </div>
        <Link href="/dashboard/invoices" className="text-sm text-brand-navy hover:underline">
          View all invoices →
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Trade</th>
              <th className="text-left px-4 py-2">Broker</th>
              <th className="text-left px-4 py-2">Structure</th>
              <th className="text-left px-4 py-2">Amount</th>
              <th className="text-left px-4 py-2">Invoices</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {brokerages.map((b) => (
              <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/dashboard/trades/${b.tradeId}`} className="text-brand-navy hover:underline">
                    {b.trade.currentConfirmationNo ?? b.tradeId.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-2">{b.brokerName}</td>
                <td className="px-4 py-2">{b.brokerageType.replaceAll("_", " ")} @ {b.rate}</td>
                <td className="px-4 py-2">{b.calculatedAmount != null ? `${b.currency} ${b.calculatedAmount}` : "—"}</td>
                <td className="px-4 py-2">
                  {b.invoices.length === 0
                    ? "—"
                    : b.invoices.map((inv) => (
                        <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`} className="text-brand-navy hover:underline mr-2">
                          {inv.invoiceNo}
                        </Link>
                      ))}
                </td>
                <td className="px-4 py-2"><StatusBadge status={b.status} /></td>
              </tr>
            ))}
            {brokerages.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No brokerage terms set on any trade yet — set them from a trade's detail page.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
