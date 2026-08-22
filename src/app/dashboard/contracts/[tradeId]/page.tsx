import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/margin";
import { PrintButton } from "@/components/PrintButton";

export default async function TradeContractPage({ params }: { params: { tradeId: string } }) {
  await requireSession();
  const trade = await prisma.trade.findUnique({
    where: { id: params.tradeId },
    include: {
      buyer: true,
      seller: true,
      product: true,
      confirmations: { orderBy: { revisionNo: "desc" }, take: 1, include: { qualitySpecs: true } },
    },
  });
  if (!trade) notFound();
  const c = trade.confirmations[0];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="no-print mb-4 flex justify-end">
        <PrintButton />
      </div>
      <div className="bg-white border border-slate-200 print:border-0 p-10 text-sm text-slate-800">
        <div className="flex items-center justify-between border-b-2 pb-4 mb-6" style={{ borderColor: "#03224F" }}>
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="logo" width={56} height={56} />
            <div>
              <p className="font-semibold text-base" style={{ color: "#03224F" }}>AL HAMZA MERIDIAN TRADING – FZCO</p>
              <p className="text-xs text-slate-500">Trade Contract</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Contract Ref.</p>
            <p className="font-semibold" style={{ color: "#03224F" }}>
              {trade.sellerContractNo ?? trade.currentConfirmationNo ?? trade.id}
            </p>
          </div>
        </div>

        <Row label="Buyer" value={trade.buyer.companyName} />
        <Row label="Seller" value={trade.seller.legalCompanyName} />
        <Row label="Commodity" value={trade.product.name} />
        {c?.qualityFreeText && <Row label="Quality" value={c.qualityFreeText} />}
        {c?.origin && <Row label="Origin" value={c.origin} />}
        {c?.shipmentPeriod && <Row label="Shipment" value={c.shipmentPeriod} />}
        <Row label="Incoterm" value={trade.incoterm} />
        <Row label="Destination" value={trade.destination} />
        <Row label="Quantity" value={`${trade.quantity} ${trade.quantityUnit}`} />
        {c?.paymentTerms && <Row label="Payment" value={c.paymentTerms} />}
        {c?.documentsRequired && <Row label="Documents" value={c.documentsRequired} />}
        {c?.arbitration && <Row label="Arbitration" value={c.arbitration} />}
        {c?.specialClauses && <Row label="Special Clauses" value={c.specialClauses} />}

        <div className="grid grid-cols-2 gap-8 mt-10 pt-6 border-t border-slate-200">
          <div>
            <p className="text-xs text-slate-400 mb-8">For and on behalf of the Seller</p>
            <div className="border-t border-slate-300 pt-1 text-xs text-slate-500">Signature / Date</div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-8">For and on behalf of the Buyer</p>
            <div className="border-t border-slate-300 pt-1 text-xs text-slate-500">Signature / Date</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="py-2 border-b border-slate-100 grid grid-cols-4 gap-4">
      <p className="text-xs text-slate-400 col-span-1">{label}</p>
      <p className="text-sm col-span-3 whitespace-pre-wrap">{value}</p>
    </div>
  );
}
