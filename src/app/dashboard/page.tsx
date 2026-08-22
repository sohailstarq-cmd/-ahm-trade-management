import { getCurrentSession } from "@/lib/current-user";
import { KpiCard } from "@/components/KpiCard";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  const canViewMargin = session?.permissions.includes("view_margin");

  const [
    activeUserCount,
    activeTrades,
    awaitingConfirmation,
    inShipment,
    completed,
    pendingPayments,
    outstandingBrokerage,
    openDisputes,
    upcomingShipments,
    documentsPending,
  ] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.trade.count({ where: { status: { notIn: ["TRADE_COMPLETED", "CANCELLED"] } } }),
    prisma.tradeConfirmation.count({ where: { status: "DRAFT" } }),
    prisma.trade.count({ where: { status: { in: ["SHIPMENT_PLANNING", "BOOKED", "LOADED", "IN_TRANSIT"] } } }),
    prisma.trade.count({ where: { status: "TRADE_COMPLETED" } }),
    prisma.payment.count({ where: { received: false } }),
    prisma.brokerage.count({ where: { status: { not: "PAID" } } }),
    prisma.dispute.count({ where: { status: { notIn: ["SETTLED", "CLOSED", "REJECTED"] } } }),
    prisma.shipment.count({ where: { eta: { gte: new Date() } } }),
    prisma.document.count({ where: { status: "PENDING" } }),
  ]);

  let ownerStats: { totalMt: number; totalTradeValue: number; totalBrokerage: number } | null = null;
  if (canViewMargin) {
    const trades = await prisma.trade.findMany({ select: { quantity: true, buyerPrice: true } });
    const brokerages = await prisma.brokerage.findMany({ select: { calculatedAmount: true } });
    ownerStats = {
      totalMt: trades.reduce((s, t) => s + t.quantity, 0),
      totalTradeValue: trades.reduce((s, t) => s + (t.buyerPrice ?? 0) * t.quantity, 0),
      totalBrokerage: brokerages.reduce((s, b) => s + (b.calculatedAmount ?? 0), 0),
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-navy">Dashboard</h1>
        <p className="text-sm text-slate-500">All phases are live — figures below are real counts from the database.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Active Trades" value={activeTrades} />
        <KpiCard label="Awaiting Confirmation" value={awaitingConfirmation} />
        <KpiCard label="In Shipment" value={inShipment} />
        <KpiCard label="Trades Completed" value={completed} />
        <KpiCard label="Pending Payments" value={pendingPayments} />
        <KpiCard label="Outstanding Brokerage" value={outstandingBrokerage} />
        <KpiCard label="Open Disputes" value={openDisputes} />
        <KpiCard label="Upcoming Shipments" value={upcomingShipments} />
        <KpiCard label="Documents Pending" value={documentsPending} />
        <KpiCard label="Active Users" value={activeUserCount} />
      </div>

      {ownerStats && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <p className="text-xs font-medium text-brand-gold uppercase tracking-wide">
            Owner-only — Commercial Confidentiality
          </p>
          <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">Total traded MT</p>
              <p className="text-lg font-semibold text-brand-navy">{ownerStats.totalMt.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Total trade value (buyer side)</p>
              <p className="text-lg font-semibold text-brand-navy">{ownerStats.totalTradeValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Total brokerage</p>
              <p className="text-lg font-semibold text-brand-navy">{ownerStats.totalBrokerage.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Mixes multiple currencies without conversion in this build — fine while you're
            mostly trading in USD, but worth a proper FX-aware rollup before that's no longer true.
          </p>
        </div>
      )}
    </div>
  );
}
