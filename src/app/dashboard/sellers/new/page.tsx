import { createSeller } from "../actions";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";

export default function NewSellerPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-brand-navy mb-1">Add New Seller</h1>
      <p className="text-sm text-slate-500 mb-6">Only legal name and country are required.</p>

      <form action={createSeller} className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        <section className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Legal company name *</label>
            <input required name="legalCompanyName" className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Address</label>
            <input name="address" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Country *</label>
            <input required name="country" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Contact person</label>
            <input name="contactPerson" className={inputClass} />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" name="email" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input name="phone" className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Website</label>
            <input name="website" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Registration details</label>
            <input name="registrationDetails" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Tax details</label>
            <input name="taxDetails" className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Bank details</label>
            <textarea name="bankDetails" rows={2} className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Products supplied</label>
            <input name="productsSupplied" className={inputClass} placeholder="e.g. Canola, Soybeans, Pulses" />
          </div>
          <div>
            <label className={labelClass}>Payment terms</label>
            <input name="paymentTerms" className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Notes</label>
            <textarea name="notes" rows={3} className={inputClass} />
          </div>
        </section>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <a href="/dashboard/sellers" className="px-4 py-2 text-sm text-slate-600 hover:underline">
            Cancel
          </a>
          <button className="rounded-md bg-brand-navy text-white text-sm px-5 py-2 hover:bg-brand-navyLight">
            Save Seller
          </button>
        </div>
      </form>
    </div>
  );
}
