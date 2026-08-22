import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { requireSession } from "@/lib/margin";
import { duplicateConfirmation, sendConfirmationEmail } from "../actions";

export default async function TradeConfirmationDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const confirmation = await prisma.tradeConfirmation.findUnique({
    where: { id: params.id },
    include: { buyer: true, seller: true, product: true, qualitySpecs: { orderBy: { sortOrder: "asc" } }, trade: true },
  });
  if (!confirmation) notFound();

  async function duplicateAction() {
    "use server";
    await duplicateConfirmation(confirmation!.id);
  }
  async function emailAction(formData: FormData) {
    "use server";
    await sendConfirmationEmail(confirmation!.id, formData);
  }

  const emails = confirmation.tradeId
    ? await prisma.email.findMany({ where: { tradeId: confirmation.tradeId }, orderBy: { sentAt: "desc" } })
    : [];

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">Trade Confirmation</p>
          <h1 className="text-xl font-semibold text-brand-navy">
            {confirmation.status === "DRAFT" ? "Draft" : confirmation.confirmationNo}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={confirmation.status} />
            {confirmation.trade && (
              <a href={`/dashboard/trades/${confirmation.trade.id}`} className="text-xs text-brand-navy hover:underline">
                View linked trade →
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <a
            href={`/dashboard/trade-confirmations/${confirmation.id}/pdf`}
            target="_blank"
            className="text-sm rounded-md border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50"
          >
            Download PDF
          </a>
          <form action={duplicateAction}>
            <button className="text-sm rounded-md border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50">
              Duplicate Trade
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 grid grid-cols-3 gap-4 text-sm">
        <Field label="Seller" value={confirmation.seller.legalCompanyName} />
        <Field label="Buyer" value={confirmation.buyer.companyName} />
        <Field label="Commodity" value={confirmation.product.name} />
        <Field label="Quality" value={confirmation.qualityFreeText} />
        <Field label="Crop" value={confirmation.crop} />
        <Field label="Origin" value={confirmation.origin} />
        <Field label="Shipment" value={confirmation.shipmentPeriod} />
        <Field label="Packing" value={confirmation.packing} />
        <Field label="Destination" value={confirmation.destination} />
        <Field label="Price" value={`${confirmation.currency} ${confirmation.price} ${confirmation.priceBasis ?? ""}`} />
        <Field label="Quantity" value={`${confirmation.quantity} ${confirmation.quantityUnit} ${confirmation.quantityTolerance ?? ""}`} />
        <Field label="Incoterm" value={confirmation.incoterm} />
        <Field label="Payment terms" value={confirmation.paymentTerms} />
        <Field label="Documents" value={confirmation.documentsRequired} />
        <Field label="Broker" value={confirmation.brokerName} />
        <Field label="Brokerage" value={confirmation.brokerageTerms} />
        <Field label="Arbitration" value={confirmation.arbitration} />
      </div>

      {confirmation.qualitySpecs.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm font-medium text-slate-700 mb-3">Quality Specification</p>
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-400">
              <tr>
                <th className="text-left py-1">Parameter</th>
                <th className="text-left py-1">Requirement</th>
                <th className="text-left py-1">Notes</th>
              </tr>
            </thead>
            <tbody>
              {confirmation.qualitySpecs.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-1.5">{s.parameter}</td>
                  <td className="py-1.5">
                    {s.minMax ? `${s.minMax} ` : ""}
                    {s.requirement} {s.unit ?? ""}
                  </td>
                  <td className="py-1.5 text-slate-500">{s.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(confirmation.remarks || confirmation.specialClauses) && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-3">
          {confirmation.remarks && (
            <div>
              <p className="text-xs text-slate-400">Remarks</p>
              <p className="text-sm whitespace-pre-wrap">{confirmation.remarks}</p>
            </div>
          )}
          {confirmation.specialClauses && (
            <div>
              <p className="text-xs text-slate-400">Special contractual clauses</p>
              <p className="text-sm whitespace-pre-wrap">{confirmation.specialClauses}</p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <p className="text-sm font-medium text-slate-700 mb-3">Email this confirmation</p>
        <p className="text-xs text-slate-400 mb-3">
          Logs the email in the trade's history. Actual delivery needs an email provider
          configured — see README.
        </p>
        <form action={emailAction} className="space-y-2">
          <input
            name="recipient"
            defaultValue={confirmation.buyer.email ?? ""}
            placeholder="Recipient email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input name="cc" placeholder="CC (optional)" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <textarea
            name="body"
            rows={3}
            placeholder="Message"
            defaultValue={`Please find attached trade confirmation ${confirmation.confirmationNo} for ${confirmation.product.name}.`}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button className="rounded-md bg-brand-navy text-white text-sm px-4 py-2 hover:bg-brand-navyLight">
            Send Email
          </button>
        </form>

        {emails.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Email history</p>
            <ul className="text-sm space-y-2">
              {emails.map((e) => (
                <li key={e.id} className="text-slate-600">
                  <span className="text-slate-400">{e.sentAt.toISOString().slice(0, 16).replace("T", " ")}</span> — {e.subject} → {e.recipient}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm text-slate-800">{value || "—"}</p>
    </div>
  );
}
