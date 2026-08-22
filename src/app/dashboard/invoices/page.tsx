import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { requireSession } from "@/lib/margin";

export default async function InvoicesPage() {
  await requireSession();
  const invoices = await prisma.brokerageInvoice.findMany({
    include: { brokerage: { include: { trade: { include: { buyer: true, seller: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-brand-navy">Brokerage Invoices</h1>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Invoice No.</th>
              <th className="text-left px-4 py-2">Trade</th>
              <th className="text-left px-4 py-2">Amount</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/dashboard/invoices/${inv.id}`} className="text-brand-navy hover:underline font-medium">{inv.invoiceNo}</Link>
                </td>
                <td className="px-4 py-2">
                  {inv.brokerage.trade.buyer.companyName} ← {inv.brokerage.trade.seller.legalCompanyName}
                </td>
                <td className="px-4 py-2">{inv.brokerage.currency} {inv.amount}</td>
                <td className="px-4 py-2"><StatusBadge status={inv.paymentStatus} /></td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No brokerage invoices generated yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
