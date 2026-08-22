import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { requireSession } from "@/lib/margin";

export default async function SellersPage({ searchParams }: { searchParams: { q?: string } }) {
  await requireSession();
  const q = searchParams.q?.trim();

  const sellers = await prisma.seller.findMany({
    where: q
      ? { OR: [{ legalCompanyName: { contains: q } }, { sellerCode: { contains: q } }, { country: { contains: q } }] }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Sellers</h1>
          <p className="text-sm text-slate-500">{sellers.length} shown</p>
        </div>
        <Link href="/dashboard/sellers/new" className="rounded-md bg-brand-navy text-white text-sm px-4 py-2 hover:bg-brand-navyLight">
          + Add New Seller
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search company, seller code, or country…"
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">Search</button>
      </form>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Seller Code</th>
              <th className="text-left px-4 py-2">Legal Name</th>
              <th className="text-left px-4 py-2">Country</th>
              <th className="text-left px-4 py-2">Contact</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => (
              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/dashboard/sellers/${s.id}`} className="text-brand-navy hover:underline font-medium">
                    {s.sellerCode}
                  </Link>
                </td>
                <td className="px-4 py-2">{s.legalCompanyName}</td>
                <td className="px-4 py-2">{s.country}</td>
                <td className="px-4 py-2">{s.contactPerson ?? "—"}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
            {sellers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No sellers yet. Click "+ Add New Seller" to create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
