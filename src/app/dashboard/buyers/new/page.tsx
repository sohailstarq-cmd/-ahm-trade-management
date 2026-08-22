import { createBuyer } from "../actions";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";

export default function NewBuyerPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-brand-navy mb-1">Add New Buyer</h1>
      <p className="text-sm text-slate-500 mb-6">
        Fields marked with fields left blank simply save as empty — nothing here is required
        beyond company name and country, so you can enrich records over time.
      </p>

      <form action={createBuyer} className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        <section className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Company name *</label>
            <input required name="companyName" className={inputClass} />
          </div>
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
            <label className={labelClass}>City</label>
            <input name="city" className={inputClass} />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div>
            <label className={labelClass}>Contact person</label>
            <input name="contactPerson" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Designation</label>
            <input name="designation" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" name="email" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input name="phone" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>WhatsApp</label>
            <input name="whatsapp" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Website</label>
            <input name="website" className={inputClass} />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div>
            <label className={labelClass}>Tax / VAT number</label>
            <input name="taxVatNumber" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Registration number</label>
            <input name="registrationNumber" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Import licence</label>
            <input name="importLicence" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Import permit details</label>
            <input name="importPermitDetails" className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Bank details</label>
            <textarea name="bankDetails" rows={2} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Payment terms</label>
            <input name="paymentTerms" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Credit terms</label>
            <input name="creditTerms" className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Notes</label>
            <textarea name="notes" rows={3} className={inputClass} />
          </div>
        </section>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <a href="/dashboard/buyers" className="px-4 py-2 text-sm text-slate-600 hover:underline">
            Cancel
          </a>
          <button className="rounded-md bg-brand-navy text-white text-sm px-5 py-2 hover:bg-brand-navyLight">
            Save Buyer
          </button>
        </div>
      </form>
    </div>
  );
}
