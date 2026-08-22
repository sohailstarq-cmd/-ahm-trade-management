"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getNextPartyCode } from "@/lib/numbering";
import { requirePermission, logActivity } from "@/lib/margin";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return v ? String(v) : undefined;
}

export async function createSeller(formData: FormData) {
  const session = await requirePermission("manage_buyers_sellers");

  const sellerCode = await getNextPartyCode("SEL");
  const seller = await prisma.seller.create({
    data: {
      sellerCode,
      legalCompanyName: String(formData.get("legalCompanyName") ?? ""),
      address: str(formData, "address"),
      country: String(formData.get("country") ?? ""),
      contactPerson: str(formData, "contactPerson"),
      email: str(formData, "email"),
      phone: str(formData, "phone"),
      website: str(formData, "website"),
      registrationDetails: str(formData, "registrationDetails"),
      taxDetails: str(formData, "taxDetails"),
      bankDetails: str(formData, "bankDetails"),
      productsSupplied: str(formData, "productsSupplied"),
      paymentTerms: str(formData, "paymentTerms"),
      notes: str(formData, "notes"),
      status: "ACTIVE",
      createdBy: session.userId,
    },
  });

  await logActivity({
    userId: session.userId,
    entityType: "seller",
    entityId: seller.id,
    action: "created",
    detail: `Created seller ${seller.sellerCode} — ${seller.legalCompanyName}`,
  });

  revalidatePath("/dashboard/sellers");
  redirect(`/dashboard/sellers/${seller.id}`);
}

export async function updateSellerStatus(sellerId: string, status: string) {
  const session = await requirePermission("manage_buyers_sellers");
  await prisma.seller.update({ where: { id: sellerId }, data: { status: status as any } });
  await logActivity({
    userId: session.userId,
    entityType: "seller",
    entityId: sellerId,
    action: "status_changed",
    detail: `Status set to ${status}`,
  });
  revalidatePath(`/dashboard/sellers/${sellerId}`);
  revalidatePath("/dashboard/sellers");
}
