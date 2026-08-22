"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md bg-brand-navy text-white text-sm px-4 py-2 hover:bg-brand-navyLight"
    >
      Print / Save as PDF
    </button>
  );
}
