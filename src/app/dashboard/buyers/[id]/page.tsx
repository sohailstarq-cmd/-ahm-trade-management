import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { requireSession } from "@/lib/margin";
import { updateBuyerStatus } from "../actions";

const STATUSES = ["ACTIVE", "INACTIVE", "BLACKLISTED", "UNDER_REVIEW"];

export default async function BuyerDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const buyer = await prisma.buyer.findUnique({
    where: { id: params.id },
    include: { trades: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
  if (!buyer) notFound();

  const canManage = session.permissions.includes("manage_buyers_sellers");

  async function setStatus(formData: FormData) {
    "use server";
    await updateBuyerStatus(buyer!.id, String(formData.get("status")));
  }

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm text-slate-800">{value || "—"}</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">{buyer.buyerCode}</p>
          <h1 className="text-xl font-semibold text-brand-navy">{buyer.companyName}</h1>
          <div className="mt-1">
            <StatusBadge status={buyer.status} />
          </div>
        </div>
        {canManage && (
          <form action={setStatus} className="flex items-center gap-2">
            <select name="status" defaultValue={buyer.status} className="text-sm border border-slate-300 rounded-md px-2 py-1.5">
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <button className="text-sm rounded-md border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50">
              Update status
            </button>
          </form>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 grid grid-cols-3 gap-4">
        <Field label="Legal company name" value={buyer.legalCompanyName} />
        <Field label="Country" value={buyer.country} />
        <Field label="City" value={buyer.city} />
        <Field label="Address" value={buyer.address} />
        <Field label="Contact person" value={buyer.contactPerson} />
        <Field label="Designation" value={buyer.designation} />
        <Field label="Email" value={buyer.email} />
        <Field label="Phone" value={buyer.phone} />
        <Field label="WhatsApp" value={buyer.whatsapp} />
        <Field label="Website" value={buyer.website} />
        <Field label="Tax / VAT number" value={buyer.taxVatNumber} />
        <Field label="Registration number" value={buyer.registrationNumber} />
        <Field label="Import licence" value={buyer.importLicence} />
        <Field label="Payment terms" value={buyer.paymentTerms} />
        <Field label="Credit terms" value={buyer.creditTerms} />
      </div>

      {buyer.notes && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-xs text-slate-400 mb-1">Notes</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{buyer.notes}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <p className="text-sm font-medium text-slate-700 mb-3">Recent trades ({buyer.trades.length})</p>
        {buyer.trades.length === 0 ? (
          <p className="text-sm text-slate-400">No trades yet for this buyer.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {buyer.trades.map((t) => (
              <li key={t.id}>
                <a href={`/dashboard/trades/${t.id}`} className="text-brand-navy hover:underline">
                  {t.currentConfirmationNo ?? t.id}
                </a>{" "}
                — {t.quantity} {t.quantityUnit} — <StatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
