import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { requireSession } from "@/lib/margin";
import { updateSellerStatus } from "../actions";

const STATUSES = ["ACTIVE", "INACTIVE", "BLACKLISTED", "UNDER_REVIEW"];

export default async function SellerDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const seller = await prisma.seller.findUnique({
    where: { id: params.id },
    include: { trades: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
  if (!seller) notFound();

  const canManage = session.permissions.includes("manage_buyers_sellers");

  async function setStatus(formData: FormData) {
    "use server";
    await updateSellerStatus(seller!.id, String(formData.get("status")));
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
          <p className="text-xs text-slate-400">{seller.sellerCode}</p>
          <h1 className="text-xl font-semibold text-brand-navy">{seller.legalCompanyName}</h1>
          <div className="mt-1">
            <StatusBadge status={seller.status} />
          </div>
        </div>
        {canManage && (
          <form action={setStatus} className="flex items-center gap-2">
            <select name="status" defaultValue={seller.status} className="text-sm border border-slate-300 rounded-md px-2 py-1.5">
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
        <Field label="Country" value={seller.country} />
        <Field label="Address" value={seller.address} />
        <Field label="Contact person" value={seller.contactPerson} />
        <Field label="Email" value={seller.email} />
        <Field label="Phone" value={seller.phone} />
        <Field label="Website" value={seller.website} />
        <Field label="Registration details" value={seller.registrationDetails} />
        <Field label="Tax details" value={seller.taxDetails} />
        <Field label="Products supplied" value={seller.productsSupplied} />
        <Field label="Payment terms" value={seller.paymentTerms} />
      </div>

      {seller.notes && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-xs text-slate-400 mb-1">Notes</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{seller.notes}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <p className="text-sm font-medium text-slate-700 mb-3">Recent trades ({seller.trades.length})</p>
        {seller.trades.length === 0 ? (
          <p className="text-sm text-slate-400">No trades yet for this seller.</p>
        ) : (
          <ul className="text-sm space-y-1">
            {seller.trades.map((t) => (
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
