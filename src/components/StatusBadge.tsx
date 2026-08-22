const COLOR_MAP: Record<string, string> = {
  // Trade lifecycle
  DRAFT: "bg-slate-100 text-slate-600",
  CONFIRMATION_PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  SELLER_CONTRACT_RECEIVED: "bg-blue-100 text-blue-700",
  BUYER_PO_RECEIVED: "bg-blue-100 text-blue-700",
  SHIPMENT_PLANNING: "bg-indigo-100 text-indigo-700",
  BOOKED: "bg-indigo-100 text-indigo-700",
  LOADED: "bg-indigo-100 text-indigo-700",
  IN_TRANSIT: "bg-indigo-100 text-indigo-700",
  ARRIVED: "bg-indigo-100 text-indigo-700",
  DOCUMENTS_COMPLETED: "bg-teal-100 text-teal-700",
  PAYMENT_COMPLETED: "bg-teal-100 text-teal-700",
  BROKERAGE_COMPLETED: "bg-teal-100 text-teal-700",
  TRADE_COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  ON_HOLD: "bg-yellow-100 text-yellow-700",
  DISPUTED: "bg-red-100 text-red-700",
  // Generic
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  BLACKLISTED: "bg-red-100 text-red-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-700",
  PENDING: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700",
  OVERDUE: "bg-red-100 text-red-700",
  OPEN: "bg-amber-100 text-amber-700",
  CLOSED: "bg-slate-100 text-slate-600",
  SETTLED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  INVOICED: "bg-blue-100 text-blue-700",
};

export function StatusBadge({ status }: { status: string }) {
  const classes = COLOR_MAP[status] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
