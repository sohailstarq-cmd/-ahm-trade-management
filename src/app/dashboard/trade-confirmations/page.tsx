import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { requireSession } from "@/lib/margin";

export default async function TradeConfirmationsPage() {
  await requireSession();
  const confirmations = await prisma.tradeConfirmation.findMany({
    include: { buyer: true, seller: true, product: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Trade Confirmations</h1>
          <p className="text-sm text-slate-500">{confirmations.length} shown</p>
        </div>
        <Link href="/dashboard/trade-confirmations/new" className="rounded-md bg-brand-navy text-white text-sm px-4 py-2 hover:bg-brand-navyLight">
          + New Trade Confirmation
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Confirmation No.</th>
              <th className="text-left px-4 py-2">Buyer</th>
              <th className="text-left px-4 py-2">Seller</th>
              <th className="text-left px-4 py-2">Product</th>
              <th className="text-left px-4 py-2">Qty</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {confirmations.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/dashboard/trade-confirmations/${c.id}`} className="text-brand-navy hover:underline font-medium">
                    {c.status === "DRAFT" ? "Draft" : c.confirmationNo}
                  </Link>
                </td>
                <td className="px-4 py-2">{c.buyer.companyName}</td>
                <td className="px-4 py-2">{c.seller.legalCompanyName}</td>
                <td className="px-4 py-2">{c.product.name}</td>
                <td className="px-4 py-2">{c.quantity} {c.quantityUnit}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
            {confirmations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No trade confirmations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
