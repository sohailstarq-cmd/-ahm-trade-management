import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/margin";

export default async function PaymentsPage() {
  await requireSession();
  const payments = await prisma.payment.findMany({
    include: { trade: { include: { buyer: true, seller: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const outstanding = payments.filter((p) => !p.received);
  const totalOutstanding = outstanding.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-navy">Payments</h1>
        <div className="text-sm text-slate-500">
          {outstanding.length} outstanding · ~{totalOutstanding.toLocaleString()} across currencies
        </div>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Trade</th>
              <th className="text-left px-4 py-2">Party</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Amount</th>
              <th className="text-left px-4 py-2">Due</th>
              <th className="text-left px-4 py-2">Received</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/dashboard/trades/${p.tradeId}`} className="text-brand-navy hover:underline">
                    {p.trade.currentConfirmationNo ?? p.tradeId.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-2">{p.party}</td>
                <td className="px-4 py-2">{p.paymentType}</td>
                <td className="px-4 py-2">{p.trade.currency} {p.amount}</td>
                <td className="px-4 py-2">{p.dueDate?.toISOString().slice(0, 10) ?? "—"}</td>
                <td className="px-4 py-2">{p.received ? "Yes" : "No"}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No payments recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
