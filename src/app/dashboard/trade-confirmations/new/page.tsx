import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/margin";
import { SpecRowsBuilder } from "@/components/SpecRowsBuilder";
import { saveDraftAction, issueAction } from "../actions";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";

export default async function NewTradeConfirmationPage() {
  const session = await requirePermission("create_trade_confirmation");
  const canViewMargin = session.permissions.includes("view_margin");

  const [buyers, sellers, products] = await Promise.all([
    prisma.buyer.findMany({ where: { status: "ACTIVE" }, orderBy: { companyName: "asc" } }),
    prisma.seller.findMany({ where: { status: "ACTIVE" }, orderBy: { legalCompanyName: "asc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-brand-navy">New Trade Confirmation</h1>
        <p className="text-sm text-slate-500">
          Save as a draft to keep editing, or Generate to issue it — issuing consumes the next
          AMT-TC number and automatically creates the linked Trade record.
        </p>
      </div>

      <form className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        <section className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Seller *</label>
            <select required name="sellerId" className={inputClass}>
              <option value="">Select existing seller…</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sellerCode} — {s.legalCompanyName}
                </option>
              ))}
            </select>
            <a href="/dashboard/sellers/new" target="_blank" className="text-xs text-brand-navy hover:underline">
              + Add New Seller (opens in new tab)
            </a>
          </div>
          <div>
            <label className={labelClass}>Buyer *</label>
            <select required name="buyerId" className={inputClass}>
              <option value="">Select existing buyer…</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.buyerCode} — {b.companyName}
                </option>
              ))}
            </select>
            <a href="/dashboard/buyers/new" target="_blank" className="text-xs text-brand-navy hover:underline">
              + Add New Buyer (opens in new tab)
            </a>
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Commodity / Product *</label>
            <select required name="productId" className={inputClass}>
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
          <div>
            <label className={labelClass}>Crop</label>
            <input name="crop" placeholder="e.g. 2025 Crop" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Origin</label>
            <input name="origin" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Shipment period</label>
            <input name="shipmentPeriod" placeholder="e.g. July 2026" className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Packing</label>
            <input name="packing" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Destination *</label>
            <input required name="destination" className={inputClass} />
          </div>
        </section>

        <section className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
          <div>
            <label className={labelClass}>Incoterm *</label>
            <input required name="incoterm" placeholder="e.g. CFR" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Price (buyer) *</label>
            <input required type="number" step="0.01" name="price" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <input name="currency" defaultValue="USD" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Price basis</label>
            <input name="priceBasis" placeholder="e.g. per MT CFR" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Quantity *</label>
            <input required type="number" step="0.01" name="quantity" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Quantity unit</label>
            <input name="quantityUnit" defaultValue="MT" className={inputClass} />
          </div>
          <div className="col-span-3">
            <label className={labelClass}>Quantity tolerance</label>
            <input name="quantityTolerance" placeholder="e.g. No tolerance" className={inputClass} />
          </div>
          {canViewMargin && (
            <div className="col-span-3 bg-amber-50 border border-amber-200 rounded-md p-3">
              <label className={labelClass}>
                Seller price (confidential — only visible to accounts with margin visibility)
              </label>
              <input type="number" step="0.01" name="sellerPrice" className={inputClass} />
            </div>
          )}
        </section>

        <section className="border-t border-slate-100 pt-4">
          <label className={labelClass}>Quality specification builder</label>
          <SpecRowsBuilder />
          <div className="mt-3">
            <label className={labelClass}>Special quality clause (free text)</label>
            <textarea name="qualityFreeText" rows={2} className={inputClass} placeholder="e.g. Free from weed contamination, particularly Galium Aparine and other quarantine weeds." />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div className="col-span-2">
            <label className={labelClass}>Payment terms *</label>
            <textarea required name="paymentTerms" rows={2} className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Documents required</label>
            <textarea name="documentsRequired" rows={2} className={inputClass} placeholder="Commercial Invoice, Ocean B/L, Certificate of Origin, ..." />
          </div>
          <div>
            <label className={labelClass}>Broker</label>
            <input name="brokerName" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Brokerage terms</label>
            <input name="brokerageTerms" placeholder="e.g. CFRC1% paid to PI GLOBAL, INDIA" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Arbitration</label>
            <input name="arbitration" placeholder="e.g. Seller's Option" className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Remarks</label>
            <textarea name="remarks" rows={2} className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Special contractual clauses</label>
            <textarea name="specialClauses" rows={2} className={inputClass} />
          </div>
        </section>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <a href="/dashboard/trade-confirmations" className="px-4 py-2 text-sm text-slate-600 hover:underline">
            Cancel
          </a>
          <button formAction={saveDraftAction} className="rounded-md border border-brand-navy text-brand-navy text-sm px-5 py-2 hover:bg-slate-50">
            Save Draft
          </button>
          <button formAction={issueAction} className="rounded-md bg-brand-navy text-white text-sm px-5 py-2 hover:bg-brand-navyLight">
            Generate Trade Confirmation
          </button>
        </div>
      </form>
    </div>
  );
}
