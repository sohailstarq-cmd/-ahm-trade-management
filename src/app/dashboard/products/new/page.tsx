import { createProduct } from "../actions";
import { SpecRowsBuilder } from "@/components/SpecRowsBuilder";

const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";

export default function NewProductPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-brand-navy mb-1">Add New Product</h1>
      <p className="text-sm text-slate-500 mb-6">
        The spec rows below become the reusable template — traders can start from these when
        building a Trade Confirmation and adjust per-shipment.
      </p>

      <form action={createProduct} className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        <section className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Product name *</label>
            <input required name="name" className={inputClass} placeholder="e.g. Non-GMO Canola Seeds" />
          </div>
          <div>
            <label className={labelClass}>Commodity category *</label>
            <input required name="commodityCategory" className={inputClass} placeholder="e.g. Oilseeds" />
          </div>
          <div>
            <label className={labelClass}>Typical origin</label>
            <input name="originTypical" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Unit of measurement</label>
            <input name="unitOfMeasure" defaultValue="MT" className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Notes</label>
            <textarea name="notes" rows={2} className={inputClass} />
          </div>
        </section>

        <section className="border-t border-slate-100 pt-4">
          <label className={labelClass}>Quality specification template</label>
          <SpecRowsBuilder />
        </section>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <a href="/dashboard/products" className="px-4 py-2 text-sm text-slate-600 hover:underline">
            Cancel
          </a>
          <button className="rounded-md bg-brand-navy text-white text-sm px-5 py-2 hover:bg-brand-navyLight">
            Save Product
          </button>
        </div>
      </form>
    </div>
  );
}
