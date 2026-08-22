"use client";

import { useState } from "react";

export type SpecRow = { parameter: string; requirement: string; unit: string; minMax: string; notes: string };

const EMPTY_ROW: SpecRow = { parameter: "", requirement: "", unit: "", minMax: "", notes: "" };

/**
 * The structured quality-specification builder used by both the Product
 * template form and the Trade Confirmation form (§9 — "do not make quality
 * specifications one giant text box"). Field names are prefixed with
 * `spec_` so the receiving Server Action can read them with
 * `formData.getAll("spec_parameter")` etc. — row order is preserved.
 */
export function SpecRowsBuilder({ initialRows }: { initialRows?: SpecRow[] }) {
  const [rows, setRows] = useState<SpecRow[]>(initialRows?.length ? initialRows : [EMPTY_ROW]);

  function updateRow(index: number, field: keyof SpecRow, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }
  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }
  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-slate-500 px-1">
        <div className="col-span-3">Parameter</div>
        <div className="col-span-2">Min / Max</div>
        <div className="col-span-3">Requirement</div>
        <div className="col-span-2">Unit</div>
        <div className="col-span-1">Notes</div>
        <div className="col-span-1"></div>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-12 gap-2">
          <input
            className="col-span-3 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            placeholder="e.g. Moisture"
            name="spec_parameter"
            value={row.parameter}
            onChange={(e) => updateRow(i, "parameter", e.target.value)}
          />
          <select
            className="col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            name="spec_minmax"
            value={row.minMax}
            onChange={(e) => updateRow(i, "minMax", e.target.value)}
          >
            <option value="">—</option>
            <option value="Min">Min</option>
            <option value="Max">Max</option>
            <option value="Base">Base</option>
          </select>
          <input
            className="col-span-3 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            placeholder="e.g. 8%"
            name="spec_requirement"
            value={row.requirement}
            onChange={(e) => updateRow(i, "requirement", e.target.value)}
          />
          <input
            className="col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            placeholder="e.g. KG/HL"
            name="spec_unit"
            value={row.unit}
            onChange={(e) => updateRow(i, "unit", e.target.value)}
          />
          <input
            className="col-span-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            name="spec_notes"
            value={row.notes}
            onChange={(e) => updateRow(i, "notes", e.target.value)}
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="col-span-1 text-slate-400 hover:text-red-600 text-sm"
            title="Remove row"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="text-sm text-brand-navy hover:underline mt-1"
      >
        + Add Specification
      </button>
    </div>
  );
}
