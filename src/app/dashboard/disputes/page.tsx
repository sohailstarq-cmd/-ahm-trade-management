import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { requireSession } from "@/lib/margin";

export default async function DisputesPage() {
  await requireSession();
  const disputes = await prisma.dispute.findMany({
    include: { trade: { include: { buyer: true, seller: true, product: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-brand-navy">Disputes</h1>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Trade</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Claim</th>
              <th className="text-left px-4 py-2">Raised</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {disputes.map((d) => (
              <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/dashboard/trades/${d.tradeId}`} className="text-brand-navy hover:underline">
                    {d.trade.currentConfirmationNo ?? d.tradeId.slice(0, 8)}
                  </Link>{" "}
                  <span className="text-slate-400">— {d.trade.product.name}</span>
                </td>
                <td className="px-4 py-2">{d.disputeType}</td>
                <td className="px-4 py-2">{d.claimAmount != null ? `${d.trade.currency} ${d.claimAmount}` : "—"}</td>
                <td className="px-4 py-2">{d.dateRaised.toISOString().slice(0, 10)}</td>
                <td className="px-4 py-2"><StatusBadge status={d.status} /></td>
              </tr>
            ))}
            {disputes.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No disputes recorded. Good news.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
