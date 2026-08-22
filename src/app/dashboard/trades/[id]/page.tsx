import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { requireSession, withMarginVisibility } from "@/lib/margin";
import {
  updateTradeStatus,
  updateContractInfo,
  createShipment,
  updateShipmentStatus,
  addContainer,
  addDocument,
  TRADE_STATUS_ORDER,
  TRADE_STATUS_SIDE_STATES,
} from "../actions";
import { recordPayment } from "../../payments/actions"; import { computeOverallPaymentStatus } from "@/lib/payment-status";
import { upsertBrokerageTerms, generateBrokerageInvoice, markBrokerageInvoicePaid } from "../../brokerage/actions";
import { createDispute, updateDispute } from "../../disputes/actions";

const SHIPMENT_STATUSES = [
  "BOOKING_CONFIRMED", "CONTAINER_RELEASED", "GATE_IN", "LOADED", "VESSEL_DEPARTED",
  "TRANSHIPMENT", "VESSEL_ARRIVED", "DISCHARGED", "CUSTOMS", "DELIVERED",
];
const DOC_TYPES = [
  "TRADE_CONFIRMATION", "SELLER_CONTRACT", "BUYER_PO", "COMMERCIAL_INVOICE", "PACKING_LIST",
  "BILL_OF_LADING", "CERTIFICATE_OF_ORIGIN", "PHYTOSANITARY", "FUMIGATION", "HEALTH_CERTIFICATE",
  "QUALITY_CERTIFICATE", "WEIGHT_CERTIFICATE", "NON_GMO_CERTIFICATE", "INSURANCE", "IMPORT_PERMIT", "OTHER",
];
const DISPUTE_STATUSES = ["OPEN", "UNDER_REVIEW", "BUYER_RESPONSE_PENDING", "SELLER_RESPONSE_PENDING", "NEGOTIATION", "SETTLED", "REJECTED", "CLOSED"];

const inputClass = "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm";

export default async function TradeDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const canViewMargin = session.permissions.includes("view_margin");

  const trade = await prisma.trade.findUnique({
    where: { id: params.id },
    include: {
      buyer: true,
      seller: true,
      product: true,
      shipments: { include: { containers: true } },
      documents: true,
      payments: true,
      brokerage: { include: { invoices: true } },
      disputes: true,
      confirmations: { orderBy: { revisionNo: "desc" } },
    },
  });
  if (!trade) notFound();

  const activityLog = await prisma.activityLog.findMany({
    where: { OR: [{ entityId: trade.id }, ...trade.shipments.map((s) => ({ entityId: s.id })), ...trade.disputes.map((d) => ({ entityId: d.id }))] },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const displayTrade = withMarginVisibility(trade, canViewMargin);
  const overallPaymentStatus = computeOverallPaymentStatus(trade.payments);
  const canUpdateStatus = session.permissions.includes("update_trade_status");
  const canManageShipment = session.permissions.includes("manage_shipment");
  const canUploadDocs = session.permissions.includes("upload_documents");
  const canRecordPayment = session.permissions.includes("record_payment");
  const canManageBrokerage = session.permissions.includes("manage_brokerage");
  const canManageDisputes = session.permissions.includes("manage_disputes");

  // --- bound server actions ---
  async function statusAction(formData: FormData) { "use server"; await updateTradeStatus(trade!.id, formData); }
  async function contractAction(formData: FormData) { "use server"; await updateContractInfo(trade!.id, formData); }
  async function shipmentAction(formData: FormData) { "use server"; await createShipment(trade!.id, formData); }
  async function docAction(formData: FormData) { "use server"; await addDocument(trade!.id, formData); }
  async function paymentAction(formData: FormData) { "use server"; await recordPayment(trade!.id, formData); }
  async function brokerageAction(formData: FormData) { "use server"; await upsertBrokerageTerms(trade!.id, formData); }
  async function invoiceAction() { "use server"; await generateBrokerageInvoice(trade!.id); }
  async function disputeAction(formData: FormData) { "use server"; await createDispute(trade!.id, formData); }

  return (
    <div className="max-w-5xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">{trade.currentConfirmationNo ?? trade.id}</p>
          <h1 className="text-xl font-semibold text-brand-navy">
            {trade.buyer.companyName} ← {trade.seller.legalCompanyName}
          </h1>
          <p className="text-sm text-slate-500">{trade.product.name} · {trade.quantity} {trade.quantityUnit} · {trade.incoterm} {trade.destination}</p>
          <div className="mt-1"><StatusBadge status={trade.status} /></div>
        </div>
        {canUpdateStatus && (
          <form action={statusAction} className="flex items-center gap-2">
            <select name="status" defaultValue={trade.status} className={inputClass}>
              <optgroup label="Lifecycle">
                {TRADE_STATUS_ORDER.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
              </optgroup>
              <optgroup label="Other">
                {TRADE_STATUS_SIDE_STATES.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
              </optgroup>
            </select>
            <button className="text-sm rounded-md border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50">Update</button>
          </form>
        )}
      </div>

      {/* Overview / Margin */}
      {canViewMargin && (
        <Section title="Commercial Terms — Owner Only">
          <div className="grid grid-cols-4 gap-4 text-sm">
            <Field label="Seller price" value={displayTrade.sellerPrice != null ? `${trade.currency} ${displayTrade.sellerPrice}` : "—"} />
            <Field label="Buyer price" value={displayTrade.buyerPrice != null ? `${trade.currency} ${displayTrade.buyerPrice}` : "—"} />
            <Field label="Gross spread" value={displayTrade.grossSpread != null ? `${trade.currency} ${displayTrade.grossSpread}/MT` : "—"} />
            <Field label="Net margin (after brokerage)" value={
              displayTrade.grossSpread != null && trade.brokerage?.calculatedAmount != null
                ? `${trade.currency} ${(displayTrade.grossSpread * trade.quantity - trade.brokerage.calculatedAmount).toFixed(2)} total`
                : "—"
            } />
          </div>
        </Section>
      )}

      {/* Contract & PO */}
      <Section title="Contract & PO">
        <form action={contractAction} className="grid grid-cols-4 gap-4 items-end text-sm">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Seller contract no.</label>
            <input name="sellerContractNo" defaultValue={trade.sellerContractNo ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Seller contract date</label>
            <input type="date" name="sellerContractDate" defaultValue={trade.sellerContractDate?.toISOString().slice(0, 10)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Buyer PO no. (optional)</label>
            <input name="buyerPoNo" defaultValue={trade.buyerPoNo ?? ""} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Buyer PO date</label>
            <input type="date" name="buyerPoDate" defaultValue={trade.buyerPoDate?.toISOString().slice(0, 10)} className={inputClass} />
          </div>
          <div className="col-span-4">
            <button disabled={!canUpdateStatus} className="text-sm rounded-md border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50">Save</button>
          </div>
        </form>
        {trade.confirmations.length > 0 && (
          <p className="text-xs text-slate-400 mt-3">
            Confirmation revisions: {trade.confirmations.map((c) => c.confirmationNo).join(", ")}
          </p>
        )}
      </Section>

      {/* Shipment */}
      <Section title="Shipment">
        {trade.shipments.map((s) => (
          <div key={s.id} className="border border-slate-100 rounded-md p-3 mb-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">{s.vesselName ?? "Vessel TBD"} {s.voyageNumber ? `— Voy. ${s.voyageNumber}` : ""}</p>
              <StatusBadge status={s.status} />
            </div>
            <div className="grid grid-cols-4 gap-3 text-xs text-slate-600">
              <p>Line: {s.shippingLine ?? "—"}</p>
              <p>Booking: {s.bookingNumber ?? "—"}</p>
              <p>BL: {s.blNumber ?? "—"}</p>
              <p>POL → POD: {s.portOfLoading ?? "—"} → {s.portOfDischarge ?? "—"}</p>
              <p>ETD: {s.etd?.toISOString().slice(0, 10) ?? "—"}</p>
              <p>ETA: {s.eta?.toISOString().slice(0, 10) ?? "—"}</p>
            </div>
            {s.containers.length > 0 && (
              <div className="mt-2 text-xs text-slate-500">
                Containers: {s.containers.map((c) => `${c.containerNo} (${c.size ?? "?"})`).join(", ")}
              </div>
            )}
            {canManageShipment && (
              <div className="mt-3 flex gap-3">
                <form action={async (fd) => { "use server"; await updateShipmentStatus(s.id, trade!.id, fd); }} className="flex gap-2">
                  <select name="status" defaultValue={s.status} className="text-xs border border-slate-300 rounded-md px-2 py-1">
                    {SHIPMENT_STATUSES.map((st) => <option key={st} value={st}>{st.replaceAll("_", " ")}</option>)}
                  </select>
                  <button className="text-xs rounded-md border border-slate-300 px-2 py-1 bg-white hover:bg-slate-50">Update status</button>
                </form>
                <form action={async (fd) => { "use server"; await addContainer(s.id, trade!.id, fd); }} className="flex gap-2">
                  <input name="containerNo" placeholder="Container no." className="text-xs border border-slate-300 rounded-md px-2 py-1 w-28" />
                  <select name="size" className="text-xs border border-slate-300 rounded-md px-2 py-1">
                    <option value="20ft">20ft</option>
                    <option value="40ft">40ft</option>
                  </select>
                  <input name="sealNo" placeholder="Seal no." className="text-xs border border-slate-300 rounded-md px-2 py-1 w-24" />
                  <button className="text-xs rounded-md border border-slate-300 px-2 py-1 bg-white hover:bg-slate-50">+ Container</button>
                </form>
              </div>
            )}
          </div>
        ))}
        {canManageShipment && (
          <details className="mt-2">
            <summary className="text-sm text-brand-navy cursor-pointer">+ Add shipment</summary>
            <form action={shipmentAction} className="grid grid-cols-3 gap-3 mt-3 text-sm">
              <input name="shippingLine" placeholder="Shipping line" className={inputClass} />
              <input name="vesselName" placeholder="Vessel name" className={inputClass} />
              <input name="voyageNumber" placeholder="Voyage no." className={inputClass} />
              <input name="bookingNumber" placeholder="Booking no." className={inputClass} />
              <input name="blNumber" placeholder="BL number" className={inputClass} />
              <input type="date" name="blDate" className={inputClass} />
              <input name="portOfLoading" placeholder="Port of loading" className={inputClass} />
              <input name="transhipmentPort" placeholder="Transhipment port" className={inputClass} />
              <input name="portOfDischarge" placeholder="Port of discharge" className={inputClass} />
              <input type="date" name="etd" placeholder="ETD" className={inputClass} />
              <input type="date" name="eta" placeholder="ETA" className={inputClass} />
              <div className="col-span-3">
                <button className="text-sm rounded-md bg-brand-navy text-white px-4 py-1.5 hover:bg-brand-navyLight">Save shipment</button>
              </div>
            </form>
          </details>
        )}
        <p className="text-xs text-slate-400 mt-3">
          Manual status updates only — no live shipping-line tracking API is connected. See README
          "Shipment tracking" for what integrating one would require.
        </p>
      </Section>

      {/* Documents */}
      <Section title="Documents">
        <table className="w-full text-sm mb-3">
          <thead className="text-xs text-slate-400">
            <tr><th className="text-left py-1">Type</th><th className="text-left py-1">File</th><th className="text-left py-1">Status</th></tr>
          </thead>
          <tbody>
            {trade.documents.map((d) => (
              <tr key={d.id} className="border-t border-slate-100">
                <td className="py-1.5">{d.docType.replaceAll("_", " ")}</td>
                <td className="py-1.5">{d.fileUrl ? <a href={d.fileUrl} target="_blank" className="text-brand-navy hover:underline">{d.fileName ?? "link"}</a> : "—"}</td>
                <td className="py-1.5"><StatusBadge status={d.status} /></td>
              </tr>
            ))}
            {trade.documents.length === 0 && <tr><td colSpan={3} className="py-3 text-slate-400">No documents recorded yet.</td></tr>}
          </tbody>
        </table>
        {canUploadDocs && (
          <form action={docAction} className="flex gap-2 items-center flex-wrap">
            <select name="docType" className={inputClass + " w-56"}>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replaceAll("_", " ")}</option>)}
            </select>
            <input name="fileName" placeholder="File name" className={inputClass + " w-40"} />
            <input name="fileUrl" placeholder="File URL (external storage)" className={inputClass + " w-64"} />
            <button className="text-sm rounded-md border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50">+ Add document</button>
          </form>
        )}
        <p className="text-xs text-slate-400 mt-2">
          File bytes aren't stored by this app — paste a link from your file storage (once wired
          in) or leave blank to just track the document as "Pending". See README "File storage".
        </p>
      </Section>

      {/* Payments */}
      <Section title="Payments">
        <p className="text-sm mb-2">Overall status: <StatusBadge status={overallPaymentStatus} /></p>
        <table className="w-full text-sm mb-3">
          <thead className="text-xs text-slate-400">
            <tr><th className="text-left py-1">Party</th><th className="text-left py-1">Type</th><th className="text-left py-1">Amount</th><th className="text-left py-1">Due</th><th className="text-left py-1">Received</th></tr>
          </thead>
          <tbody>
            {trade.payments.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="py-1.5">{p.party}</td>
                <td className="py-1.5">{p.paymentType}{p.percentage ? ` (${p.percentage}%)` : ""}</td>
                <td className="py-1.5">{trade.currency} {p.amount}</td>
                <td className="py-1.5">{p.dueDate?.toISOString().slice(0, 10) ?? "—"}</td>
                <td className="py-1.5">{p.received ? `Yes — ${p.receivedDate?.toISOString().slice(0, 10) ?? ""}` : "No"}</td>
              </tr>
            ))}
            {trade.payments.length === 0 && <tr><td colSpan={5} className="py-3 text-slate-400">No payments recorded yet.</td></tr>}
          </tbody>
        </table>
        {canRecordPayment && (
          <form action={paymentAction} className="grid grid-cols-6 gap-2 items-end text-sm">
            <select name="party" className={inputClass}><option value="BUYER">Buyer</option><option value="SELLER">Seller</option></select>
            <select name="paymentType" className={inputClass}><option value="ADVANCE">Advance</option><option value="BALANCE">Balance</option><option value="OTHER">Other</option></select>
            <input name="percentage" type="number" placeholder="%" className={inputClass} />
            <input name="amount" type="number" step="0.01" placeholder="Amount" required className={inputClass} />
            <input name="dueDate" type="date" className={inputClass} />
            <input name="reference" placeholder="Reference" className={inputClass} />
            <label className="col-span-2 flex items-center gap-2 text-xs"><input type="checkbox" name="received" /> Received</label>
            <input name="receivedDate" type="date" className={inputClass + " col-span-2"} />
            <button className="col-span-2 text-sm rounded-md bg-brand-navy text-white px-3 py-1.5 hover:bg-brand-navyLight">Record payment</button>
          </form>
        )}
      </Section>

      {/* Brokerage */}
      <Section title="Brokerage">
        {trade.brokerage ? (
          <div className="text-sm mb-3 space-y-1">
            <p>{trade.brokerage.brokerName} — {trade.brokerage.brokerageType.replaceAll("_", " ")} @ {trade.brokerage.rate}</p>
            <p>Calculated amount: {trade.brokerage.calculatedAmount != null ? `${trade.brokerage.currency} ${trade.brokerage.calculatedAmount}` : "Not yet generated"}</p>
            <p>Status: <StatusBadge status={trade.brokerage.status} /></p>
            {trade.brokerage.invoices.map((inv) => (
              <p key={inv.id} className="text-xs text-slate-500">
                Invoice <a href={`/dashboard/invoices/${inv.id}`} className="text-brand-navy hover:underline">{inv.invoiceNo}</a> — {inv.paymentStatus}
                {canManageBrokerage && inv.paymentStatus !== "PAID" && (
                  <form action={async () => { "use server"; await markBrokerageInvoicePaid(inv.id, trade!.id); }} className="inline ml-2">
                    <button className="text-xs text-brand-navy hover:underline">Mark paid</button>
                  </form>
                )}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 mb-3">No brokerage terms set yet.</p>
        )}
        {canManageBrokerage && (
          <div className="space-y-3">
            <form action={brokerageAction} className="grid grid-cols-5 gap-2 items-end text-sm">
              <input name="brokerName" defaultValue={trade.brokerage?.brokerName ?? ""} placeholder="Broker name" required className={inputClass} />
              <select name="brokerageType" defaultValue={trade.brokerage?.brokerageType ?? "PER_MT"} className={inputClass}>
                <option value="PER_MT">USD/MT</option>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed amount</option>
              </select>
              <input name="rate" type="number" step="0.0001" defaultValue={trade.brokerage?.rate ?? ""} placeholder="Rate" required className={inputClass} />
              <input name="currency" defaultValue={trade.brokerage?.currency ?? "USD"} className={inputClass} />
              <button className="text-sm rounded-md border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50">Save terms</button>
            </form>
            {trade.brokerage && (
              <form action={invoiceAction}>
                <button className="text-sm rounded-md bg-brand-navy text-white px-4 py-1.5 hover:bg-brand-navyLight">
                  Generate Brokerage Invoice
                </button>
              </form>
            )}
          </div>
        )}
      </Section>

      {/* Disputes */}
      <Section title="Disputes">
        {trade.disputes.map((d) => (
          <div key={d.id} className="border border-slate-100 rounded-md p-3 mb-3 text-sm">
            <div className="flex justify-between items-center mb-1">
              <p className="font-medium">{d.disputeType}</p>
              <StatusBadge status={d.status} />
            </div>
            <p className="text-slate-600 mb-2">{d.description}</p>
            {d.claimAmount != null && <p className="text-xs text-slate-500">Claim: {trade.currency} {d.claimAmount}</p>}
            {d.resolution && <p className="text-xs text-green-700">Resolution: {d.resolution}</p>}
            {canManageDisputes && (
              <details className="mt-2">
                <summary className="text-xs text-brand-navy cursor-pointer">Update dispute</summary>
                <form action={async (fd) => { "use server"; await updateDispute(d.id, trade!.id, fd); }} className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <select name="status" defaultValue={d.status} className={inputClass}>
                    {DISPUTE_STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
                  </select>
                  <input name="settlementAmount" type="number" placeholder="Settlement amount" className={inputClass} />
                  <textarea name="sellerResponse" placeholder="Seller response" className={inputClass + " col-span-2"} />
                  <textarea name="buyerResponse" placeholder="Buyer response" className={inputClass + " col-span-2"} />
                  <textarea name="resolution" placeholder="Final resolution" className={inputClass + " col-span-2"} />
                  <button className="col-span-2 text-xs rounded-md border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50">Save</button>
                </form>
              </details>
            )}
          </div>
        ))}
        {canManageDisputes && (
          <details>
            <summary className="text-sm text-brand-navy cursor-pointer">+ Raise a dispute</summary>
            <form action={disputeAction} className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <input name="disputeType" placeholder="Dispute type (e.g. Quality)" required className={inputClass} />
              <input name="claimAmount" type="number" placeholder="Claim amount" className={inputClass} />
              <textarea name="description" placeholder="Description" required className={inputClass + " col-span-2"} />
              <button className="col-span-2 text-sm rounded-md bg-brand-navy text-white px-4 py-1.5 hover:bg-brand-navyLight">Raise dispute</button>
            </form>
          </details>
        )}
      </Section>

      {/* Activity log */}
      <Section title="Activity Log">
        <ul className="text-sm space-y-1.5">
          {activityLog.map((a) => (
            <li key={a.id} className="text-slate-600">
              <span className="text-slate-400">{a.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span> — {a.action.replaceAll("_", " ")}
              {a.detail ? `: ${a.detail}` : ""}
            </li>
          ))}
          {activityLog.length === 0 && <li className="text-slate-400">No activity recorded yet.</li>}
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <p className="text-sm font-semibold text-brand-navy mb-3">{title}</p>
      {children}
    </div>
  );
}
function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}
