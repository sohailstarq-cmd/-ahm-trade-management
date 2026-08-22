import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { requireSession } from "@/lib/margin";

export default async function DocumentsPage() {
  await requireSession();
  const documents = await prisma.document.findMany({
    include: { trade: { include: { buyer: true, seller: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const pending = documents.filter((d) => d.status === "PENDING").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-navy">Documents</h1>
        <p className="text-sm text-slate-500">{pending} pending across all trades</p>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Trade</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/dashboard/trades/${d.tradeId}`} className="text-brand-navy hover:underline">
                    {d.trade.currentConfirmationNo ?? d.tradeId.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-2">{d.docType.replaceAll("_", " ")}</td>
                <td className="px-4 py-2"><StatusBadge status={d.status} /></td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No documents recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
