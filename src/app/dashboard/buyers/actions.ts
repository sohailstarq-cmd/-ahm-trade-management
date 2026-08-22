"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getNextPartyCode } from "@/lib/numbering";
import { requirePermission, logActivity } from "@/lib/margin";

export async function createBuyer(formData: FormData) {
  const session = await requirePermission("manage_buyers_sellers");

  const buyerCode = await getNextPartyCode("BYR");
  const buyer = await prisma.buyer.create({
    data: {
      buyerCode,
      companyName: String(formData.get("companyName") ?? ""),
      legalCompanyName: String(formData.get("legalCompanyName") ?? ""),
      address: str(formData, "address"),
      country: String(formData.get("country") ?? ""),
      city: str(formData, "city"),
      contactPerson: str(formData, "contactPerson"),
      designation: str(formData, "designation"),
      email: str(formData, "email"),
      phone: str(formData, "phone"),
      whatsapp: str(formData, "whatsapp"),
      website: str(formData, "website"),
      taxVatNumber: str(formData, "taxVatNumber"),
      registrationNumber: str(formData, "registrationNumber"),
      importLicence: str(formData, "importLicence"),
      importPermitDetails: str(formData, "importPermitDetails"),
      bankDetails: str(formData, "bankDetails"),
      paymentTerms: str(formData, "paymentTerms"),
      creditTerms: str(formData, "creditTerms"),
      notes: str(formData, "notes"),
      status: "ACTIVE",
      createdBy: session.userId,
    },
  });

  await logActivity({
    userId: session.userId,
    entityType: "buyer",
    entityId: buyer.id,
    action: "created",
    detail: `Created buyer ${buyer.buyerCode} — ${buyer.companyName}`,
  });

  revalidatePath("/dashboard/buyers");
  redirect(`/dashboard/buyers/${buyer.id}`);
}

export async function updateBuyerStatus(buyerId: string, status: string) {
  const session = await requirePermission("manage_buyers_sellers");
  await prisma.buyer.update({ where: { id: buyerId }, data: { status: status as any } });
  await logActivity({
    userId: session.userId,
    entityType: "buyer",
    entityId: buyerId,
    action: "status_changed",
    detail: `Status set to ${status}`,
  });
  revalidatePath(`/dashboard/buyers/${buyerId}`);
  revalidatePath("/dashboard/buyers");
}

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return v ? String(v) : undefined;
}
