import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/margin";
import { PrintButton } from "@/components/PrintButton";
import { StatusBadge } from "@/components/StatusBadge";

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  await requireSession();
  const invoice = await prisma.brokerageInvoice.findUnique({
    where: { id: params.id },
    include: { brokerage: { include: { trade: { include: { buyer: true, seller: true, product: true } } } } },
  });
  if (!invoice) notFound();
  const trade = invoice.brokerage.trade;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="no-print mb-4 flex justify-between items-center">
        <StatusBadge status={invoice.paymentStatus} />
        <PrintButton />
      </div>
      <div className="bg-white border border-slate-200 print:border-0 p-10 text-sm text-slate-800">
        <div className="flex items-center justify-between border-b-2 pb-4 mb-6" style={{ borderColor: "#03224F" }}>
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="logo" width={56} height={56} />
            <div>
              <p className="font-semibold text-base" style={{ color: "#03224F" }}>AL HAMZA MERIDIAN TRADING – FZCO</p>
              <p className="text-xs text-slate-500">Brokerage Invoice</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Invoice No.</p>
            <p className="font-semibold" style={{ color: "#03224F" }}>{invoice.invoiceNo}</p>
            <p className="text-xs text-slate-400 mt-1">Date: {invoice.invoiceDate.toISOString().slice(0, 10)}</p>
          </div>
        </div>

        <Row label="Trade" value={`${trade.currentConfirmationNo ?? trade.id}`} />
        <Row label="Buyer" value={trade.buyer.companyName} />
        <Row label="Seller" value={trade.seller.legalCompanyName} />
        <Row label="Commodity" value={trade.product.name} />
        <Row label="Quantity" value={`${trade.quantity} ${trade.quantityUnit}`} />
        <Row label="Broker" value={invoice.brokerage.brokerName} />
        <Row label="Brokerage structure" value={`${invoice.brokerage.brokerageType.replaceAll("_", " ")} @ ${invoice.brokerage.rate}`} />

        <div className="mt-6 flex justify-end">
          <div className="text-right">
            <p className="text-xs text-slate-400">Amount due</p>
            <p className="text-2xl font-semibold" style={{ color: "#03224F" }}>
              {invoice.brokerage.currency} {invoice.amount.toLocaleString()}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-8">
          This brokerage amount is treated as commercially confidential and should only be shared
          with the broker named above.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="py-2 border-b border-slate-100 grid grid-cols-4 gap-4">
      <p className="text-xs text-slate-400 col-span-1">{label}</p>
      <p className="text-sm col-span-3">{value}</p>
    </div>
  );
}
