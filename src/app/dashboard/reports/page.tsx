import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { requireSession } from "@/lib/margin";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { buyer?: string; seller?: string; product?: string; status?: string };
}) {
  await requireSession();

  const [buyers, sellers, products] = await Promise.all([
    prisma.buyer.findMany({ orderBy: { companyName: "asc" } }),
    prisma.seller.findMany({ orderBy: { legalCompanyName: "asc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
  ]);

  const trades = await prisma.trade.findMany({
    where: {
      buyerId: searchParams.buyer || undefined,
      sellerId: searchParams.seller || undefined,
      productId: searchParams.product || undefined,
      status: (searchParams.status as any) || undefined,
    },
    include: { buyer: true, seller: true, product: true },
    orderBy: { createdAt: "desc" },
  });

  const qs = new URLSearchParams(searchParams as Record<string, string>).toString();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Trade Report</h1>
          <p className="text-sm text-slate-500">{trades.length} trades matching filters</p>
        </div>
        <a
          href={`/dashboard/reports/export?${qs}`}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm bg-white hover:bg-slate-50"
        >
          Export CSV
        </a>
      </div>

      <form className="bg-white rounded-lg border border-slate-200 p-4 grid grid-cols-4 gap-3">
        <select name="buyer" defaultValue={searchParams.buyer} className="text-sm border border-slate-300 rounded-md px-2 py-1.5">
          <option value="">All buyers</option>
          {buyers.map((b) => <option key={b.id} value={b.id}>{b.companyName}</option>)}
        </select>
        <select name="seller" defaultValue={searchParams.seller} className="text-sm border border-slate-300 rounded-md px-2 py-1.5">
          <option value="">All sellers</option>
          {sellers.map((s) => <option key={s.id} value={s.id}>{s.legalCompanyName}</option>)}
        </select>
        <select name="product" defaultValue={searchParams.product} className="text-sm border border-slate-300 rounded-md px-2 py-1.5">
          <option value="">All products</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select name="status" defaultValue={searchParams.status} className="text-sm border border-slate-300 rounded-md px-2 py-1.5">
          <option value="">All statuses</option>
          {["DRAFT","CONFIRMATION_PENDING","CONFIRMED","SELLER_CONTRACT_RECEIVED","BUYER_PO_RECEIVED","SHIPMENT_PLANNING","BOOKED","LOADED","IN_TRANSIT","ARRIVED","DOCUMENTS_COMPLETED","PAYMENT_COMPLETED","BROKERAGE_COMPLETED","TRADE_COMPLETED","CANCELLED","ON_HOLD","DISPUTED"].map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </select>
        <div className="col-span-4">
          <button className="text-sm rounded-md bg-brand-navy text-white px-4 py-1.5 hover:bg-brand-navyLight">Apply filters</button>
        </div>
      </form>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Confirmation</th>
              <th className="text-left px-4 py-2">Buyer</th>
              <th className="text-left px-4 py-2">Seller</th>
              <th className="text-left px-4 py-2">Product</th>
              <th className="text-left px-4 py-2">Quantity</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{t.currentConfirmationNo ?? t.id.slice(0, 8)}</td>
                <td className="px-4 py-2">{t.buyer.companyName}</td>
                <td className="px-4 py-2">{t.seller.legalCompanyName}</td>
                <td className="px-4 py-2">{t.product.name}</td>
                <td className="px-4 py-2">{t.quantity} {t.quantityUnit}</td>
                <td className="px-4 py-2"><StatusBadge status={t.status} /></td>
              </tr>
            ))}
            {trades.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No trades match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
