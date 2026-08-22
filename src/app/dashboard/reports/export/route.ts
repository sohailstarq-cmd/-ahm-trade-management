import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentSession } from "@/lib/current-user";

export async function GET(req: NextRequest) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const trades = await prisma.trade.findMany({
    where: {
      buyerId: searchParams.get("buyer") || undefined,
      sellerId: searchParams.get("seller") || undefined,
      productId: searchParams.get("product") || undefined,
      status: (searchParams.get("status") as any) || undefined,
    },
    include: { buyer: true, seller: true, product: true },
    orderBy: { createdAt: "desc" },
  });

  const canViewMargin = session.permissions.includes("view_margin");
  const headers = [
    "Confirmation No", "Buyer", "Seller", "Product", "Quantity", "Unit", "Incoterm",
    "Destination", "Status", "Created At",
    ...(canViewMargin ? ["Seller Price", "Buyer Price"] : []),
  ];

  const rows = trades.map((t) => [
    t.currentConfirmationNo ?? t.id,
    t.buyer.companyName,
    t.seller.legalCompanyName,
    t.product.name,
    t.quantity,
    t.quantityUnit,
    t.incoterm,
    t.destination ?? "",
    t.status,
    t.createdAt.toISOString().slice(0, 10),
    ...(canViewMargin ? [t.sellerPrice ?? "", t.buyerPrice ?? ""] : []),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="ahm-trade-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
