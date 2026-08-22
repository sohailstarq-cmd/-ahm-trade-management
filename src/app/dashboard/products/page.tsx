import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/margin";

export default async function ProductsPage() {
  await requireSession();
  const products = await prisma.product.findMany({
    include: { specTemplates: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Products</h1>
          <p className="text-sm text-slate-500">Master commodity list, with reusable quality spec templates.</p>
        </div>
        <Link href="/dashboard/products/new" className="rounded-md bg-brand-navy text-white text-sm px-4 py-2 hover:bg-brand-navyLight">
          + Add New Product
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="font-medium text-brand-navy">{p.name}</p>
            <p className="text-xs text-slate-500">
              {p.commodityCategory} · unit: {p.unitOfMeasure}
              {p.originTypical ? ` · typical origin: ${p.originTypical}` : ""}
            </p>
            {p.specTemplates.length > 0 && (
              <table className="w-full text-xs mt-3">
                <tbody>
                  {p.specTemplates.map((s) => (
                    <tr key={s.id} className="border-t border-slate-100">
                      <td className="py-1 text-slate-500">{s.parameter}</td>
                      <td className="py-1 text-slate-800 text-right">
                        {s.minMax ? `${s.minMax} ` : ""}
                        {s.requirement} {s.unit ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-2 text-center text-slate-400 py-10 bg-white rounded-lg border border-slate-200">
            No products yet. Click "+ Add New Product" to create the first one.
          </div>
        )}
      </div>
    </div>
  );
}
