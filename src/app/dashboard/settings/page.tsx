import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/margin";
import { updateCompanySettings } from "./actions";

export default async function SettingsPage() {
  await requirePermission("manage_settings");
  const settingsRows = await prisma.companySetting.findMany();
  const settings = Object.fromEntries(settingsRows.map((s) => [s.key, s.value]));

  const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-navy">Settings</h1>
        <p className="text-sm text-slate-500">
          Company branding and numbering behavior — nothing here is hard-coded elsewhere in the app.
        </p>
      </div>

      <form action={updateCompanySettings} className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
        <div>
          <label className={labelClass}>Legal company name</label>
          <input name="company_legal_name" defaultValue={settings.company_legal_name} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Display name</label>
          <input name="company_display_name" defaultValue={settings.company_display_name} className={inputClass} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Primary (navy)</label>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded border border-slate-200" style={{ background: settings.brand_color_primary }} />
              <input name="brand_color_primary" defaultValue={settings.brand_color_primary} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Accent (gold)</label>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded border border-slate-200" style={{ background: settings.brand_color_accent_gold }} />
              <input name="brand_color_accent_gold" defaultValue={settings.brand_color_accent_gold} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Accent (green)</label>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded border border-slate-200" style={{ background: settings.brand_color_accent_green }} />
              <input name="brand_color_accent_green" defaultValue={settings.brand_color_accent_green} className={inputClass} />
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Note (Phase 1 limitation): these values are stored and available to future
          server-rendered pages, but the Tailwind color tokens used across the current UI are
          compiled from <code className="bg-slate-100 px-1 rounded">tailwind.config.ts</code>, not
          read live from this table yet. Wiring the compiled UI to read from here dynamically is a
          reasonable follow-up if you'll want to change brand colors without a redeploy.
        </p>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <div>
            <label className={labelClass}>Confirmation number reset</label>
            <select name="confirmation_number_reset" defaultValue={settings.confirmation_number_reset} className={inputClass}>
              <option value="yearly">Resets yearly</option>
              <option value="never">Never resets (continuous)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Brokerage invoice number reset</label>
            <select name="brokerage_invoice_number_reset" defaultValue={settings.brokerage_invoice_number_reset} className={inputClass}>
              <option value="yearly">Resets yearly</option>
              <option value="never">Never resets (continuous)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button className="rounded-md bg-brand-navy text-white text-sm px-5 py-2 hover:bg-brand-navyLight">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
