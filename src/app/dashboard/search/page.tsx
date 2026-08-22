import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/margin";
import { StatusBadge } from "@/components/StatusBadge";

/**
 * Global search across every identifier listed in §29: confirmation number,
 * buyer, seller, product, contract number, PO number, BL number, container
 * number, invoice number, dispute type. An exact confirmation-number match
 * jumps straight to the trade record; everything else lists candidates.
 */
export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireSession();
  const q = (searchParams.q ?? "").trim();

  if (!q) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold text-brand-navy mb-2">Search</h1>
        <SearchBox q="" />
      </div>
    );
  }

  // Exact confirmation number → straight to the trade.
  const exactConfirmation = await prisma.tradeConfirmation.findFirst({
    where: { confirmationNo: q },
    select: { tradeId: true, id: true },
  });
  if (exactConfirmation?.tradeId) {
    redirect(`/dashboard/trades/${exactConfirmation.tradeId}`);
  }
  if (exactConfirmation) {
    redirect(`/dashboard/trade-confirmations/${exactConfirmation.id}`);
  }

  const [trades, buyers, sellers, products, invoices, disputes, shipments] = await Promise.all([
    prisma.trade.findMany({
      where: {
        OR: [
          { currentConfirmationNo: { contains: q } },
          { sellerContractNo: { contains: q } },
          { buyerPoNo: { contains: q } },
        ],
      },
      include: { buyer: true, seller: true, product: true },
      take: 10,
    }),
    prisma.buyer.findMany({ where: { OR: [{ companyName: { contains: q } }, { buyerCode: { contains: q } }] }, take: 10 }),
    prisma.seller.findMany({ where: { OR: [{ legalCompanyName: { contains: q } }, { sellerCode: { contains: q } }] }, take: 10 }),
    prisma.product.findMany({ where: { name: { contains: q } }, take: 10 }),
    prisma.brokerageInvoice.findMany({ where: { invoiceNo: { contains: q } }, include: { brokerage: { include: { trade: true } } }, take: 10 }),
    prisma.dispute.findMany({ where: { disputeType: { contains: q } }, include: { trade: true }, take: 10 }),
    prisma.shipment.findMany({
      where: { OR: [{ blNumber: { contains: q } }, { containers: { some: { containerNo: { contains: q } } } }] },
      include: { trade: true },
      take: 10,
    }),
  ]);

  const totalResults = trades.length + buyers.length + sellers.length + products.length + invoices.length + disputes.length + shipments.length;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-navy mb-2">Search results for "{q}"</h1>
        <SearchBox q={q} />
      </div>

      {totalResults === 0 && (
        <p className="text-sm text-slate-400">
          No matches in trades, buyers, sellers, products, invoices, disputes, or shipments.
        </p>
      )}

      {trades.length > 0 && (
        <ResultSection title="Trades / Contracts / POs">
          {trades.map((t) => (
            <Link key={t.id} href={`/dashboard/trades/${t.id}`} className="block px-4 py-2 hover:bg-slate-50 border-t border-slate-100 first:border-t-0">
              <span className="text-brand-navy font-medium">{t.currentConfirmationNo ?? t.id.slice(0, 8)}</span>{" "}
              <span className="text-slate-500">— {t.buyer.companyName} ← {t.seller.legalCompanyName} — {t.product.name}</span>{" "}
              <StatusBadge status={t.status} />
            </Link>
          ))}
        </ResultSection>
      )}

      {buyers.length > 0 && (
        <ResultSection title="Buyers">
          {buyers.map((b) => (
            <Link key={b.id} href={`/dashboard/buyers/${b.id}`} className="block px-4 py-2 hover:bg-slate-50 border-t border-slate-100 first:border-t-0">
              <span className="text-brand-navy font-medium">{b.buyerCode}</span> — {b.companyName}
            </Link>
          ))}
        </ResultSection>
      )}

      {sellers.length > 0 && (
        <ResultSection title="Sellers">
          {sellers.map((s) => (
            <Link key={s.id} href={`/dashboard/sellers/${s.id}`} className="block px-4 py-2 hover:bg-slate-50 border-t border-slate-100 first:border-t-0">
              <span className="text-brand-navy font-medium">{s.sellerCode}</span> — {s.legalCompanyName}
            </Link>
          ))}
        </ResultSection>
      )}

      {products.length > 0 && (
        <ResultSection title="Products">
          {products.map((p) => (
            <Link key={p.id} href="/dashboard/products" className="block px-4 py-2 hover:bg-slate-50 border-t border-slate-100 first:border-t-0">
              {p.name}
            </Link>
          ))}
        </ResultSection>
      )}

      {invoices.length > 0 && (
        <ResultSection title="Brokerage Invoices">
          {invoices.map((inv) => (
            <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`} className="block px-4 py-2 hover:bg-slate-50 border-t border-slate-100 first:border-t-0">
              <span className="text-brand-navy font-medium">{inv.invoiceNo}</span> — {inv.brokerage.trade.currentConfirmationNo ?? inv.brokerage.tradeId.slice(0, 8)}
            </Link>
          ))}
        </ResultSection>
      )}

      {disputes.length > 0 && (
        <ResultSection title="Disputes">
          {disputes.map((d) => (
            <Link key={d.id} href={`/dashboard/trades/${d.tradeId}`} className="block px-4 py-2 hover:bg-slate-50 border-t border-slate-100 first:border-t-0">
              {d.disputeType} — {d.trade.currentConfirmationNo ?? d.tradeId.slice(0, 8)} <StatusBadge status={d.status} />
            </Link>
          ))}
        </ResultSection>
      )}

      {shipments.length > 0 && (
        <ResultSection title="Shipments (BL / Container)">
          {shipments.map((s) => (
            <Link key={s.id} href={`/dashboard/trades/${s.tradeId}`} className="block px-4 py-2 hover:bg-slate-50 border-t border-slate-100 first:border-t-0">
              BL {s.blNumber ?? "—"} — {s.trade.currentConfirmationNo ?? s.tradeId.slice(0, 8)}
            </Link>
          ))}
        </ResultSection>
      )}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <p className="text-xs font-medium text-slate-500 uppercase px-4 py-2 bg-slate-50">{title}</p>
      {children}
    </div>
  );
}

function SearchBox({ q }: { q: string }) {
  return (
    <form action="/dashboard/search" className="flex gap-2">
      <input
        name="q"
        defaultValue={q}
        placeholder="Search confirmation no., buyer, seller, product, contract, PO, BL, container, invoice, dispute…"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        autoFocus
      />
      <button className="rounded-md bg-brand-navy text-white text-sm px-4 py-2 hover:bg-brand-navyLight">Search</button>
    </form>
  );
}
