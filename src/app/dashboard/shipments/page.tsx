import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { requireSession } from "@/lib/margin";

export default async function ShipmentsPage() {
  await requireSession();
  const shipments = await prisma.shipment.findMany({
    include: { trade: { include: { buyer: true, seller: true, product: true } }, containers: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-brand-navy">Shipments</h1>
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Trade</th>
              <th className="text-left px-4 py-2">Vessel</th>
              <th className="text-left px-4 py-2">BL No.</th>
              <th className="text-left px-4 py-2">Containers</th>
              <th className="text-left px-4 py-2">ETA</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s) => (
              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/dashboard/trades/${s.tradeId}`} className="text-brand-navy hover:underline">
                    {s.trade.currentConfirmationNo ?? s.tradeId.slice(0, 8)}
                  </Link>
                </td>
                <td className="px-4 py-2">{s.vesselName ?? "—"} {s.voyageNumber ? `(${s.voyageNumber})` : ""}</td>
                <td className="px-4 py-2">{s.blNumber ?? "—"}</td>
                <td className="px-4 py-2">{s.containers.length}</td>
                <td className="px-4 py-2">{s.eta?.toISOString().slice(0, 10) ?? "—"}</td>
                <td className="px-4 py-2"><StatusBadge status={s.status} /></td>
              </tr>
            ))}
            {shipments.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No shipments recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
