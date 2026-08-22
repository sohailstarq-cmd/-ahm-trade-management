import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/margin";

export default async function ContractsPage() {
  await requireSession();
  const trades = await prisma.trade.findMany({
    include: { buyer: true, seller: true, product: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-brand-navy">Trade Contract Generator</h1>
        <p className="text-sm text-slate-500">
          Generates a formatted contract PDF from the trade's confirmed terms — pick a trade below.
        </p>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Trade</th>
              <th className="text-left px-4 py-2">Buyer</th>
              <th className="text-left px-4 py-2">Seller</th>
              <th className="text-left px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">{t.currentConfirmationNo ?? t.id.slice(0, 8)}</td>
                <td className="px-4 py-2">{t.buyer.companyName}</td>
                <td className="px-4 py-2">{t.seller.legalCompanyName}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/dashboard/contracts/${t.id}`} className="text-brand-navy hover:underline text-sm">
                    Generate Contract →
                  </Link>
                </td>
              </tr>
            ))}
            {trades.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No trades yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
