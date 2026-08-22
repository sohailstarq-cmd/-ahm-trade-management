import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { requireSession } from "@/lib/margin";

export default async function TradesPage() {
  const session = await requireSession();
  const canViewMargin = session.permissions.includes("view_margin");

  const trades = await prisma.trade.findMany({
    include: { buyer: true, seller: true, product: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Trades</h1>
          <p className="text-sm text-slate-500">{trades.length} shown</p>
        </div>
        <Link href="/dashboard/trade-confirmations/new" className="rounded-md bg-brand-navy text-white text-sm px-4 py-2 hover:bg-brand-navyLight">
          + New Trade Confirmation
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Confirmation</th>
              <th className="text-left px-4 py-2">Buyer</th>
              <th className="text-left px-4 py-2">Seller</th>
              <th className="text-left px-4 py-2">Product</th>
              <th className="text-left px-4 py-2">Qty</th>
              {canViewMargin && <th className="text-left px-4 py-2">Margin</th>}
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => {
              const margin =
                canViewMargin && t.sellerPrice != null && t.buyerPrice != null
                  ? (t.buyerPrice - t.sellerPrice).toFixed(2)
                  : null;
              return (
                <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/dashboard/trades/${t.id}`} className="text-brand-navy hover:underline font-medium">
                      {t.currentConfirmationNo ?? t.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{t.buyer.companyName}</td>
                  <td className="px-4 py-2">{t.seller.legalCompanyName}</td>
                  <td className="px-4 py-2">{t.product.name}</td>
                  <td className="px-4 py-2">{t.quantity} {t.quantityUnit}</td>
                  {canViewMargin && (
                    <td className="px-4 py-2 font-medium text-brand-gold">{margin != null ? `${t.currency} ${margin}/MT` : "—"}</td>
                  )}
                  <td className="px-4 py-2">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              );
            })}
            {trades.length === 0 && (
              <tr>
                <td colSpan={canViewMargin ? 7 : 6} className="px-4 py-8 text-center text-slate-400">
                  No trades yet. Issue a Trade Confirmation to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
