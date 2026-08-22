import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { requireSession } from "@/lib/margin";

export default async function BuyersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await requireSession();
  const q = searchParams.q?.trim();

  const buyers = await prisma.buyer.findMany({
    where: q
      ? {
          OR: [
            { companyName: { contains: q } },
            { buyerCode: { contains: q } },
            { country: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Buyers</h1>
          <p className="text-sm text-slate-500">{buyers.length} shown</p>
        </div>
        <Link
          href="/dashboard/buyers/new"
          className="rounded-md bg-brand-navy text-white text-sm px-4 py-2 hover:bg-brand-navyLight"
        >
          + Add New Buyer
        </Link>
      </div>

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search company, buyer code, or country…"
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button className="rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">Search</button>
      </form>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Buyer Code</th>
              <th className="text-left px-4 py-2">Company</th>
              <th className="text-left px-4 py-2">Country</th>
              <th className="text-left px-4 py-2">Contact</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {buyers.map((b) => (
              <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/dashboard/buyers/${b.id}`} className="text-brand-navy hover:underline font-medium">
                    {b.buyerCode}
                  </Link>
                </td>
                <td className="px-4 py-2">{b.companyName}</td>
                <td className="px-4 py-2">{b.country}</td>
                <td className="px-4 py-2">{b.contactPerson ?? "—"}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={b.status} />
                </td>
              </tr>
            ))}
            {buyers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No buyers yet. Click "+ Add New Buyer" to create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
