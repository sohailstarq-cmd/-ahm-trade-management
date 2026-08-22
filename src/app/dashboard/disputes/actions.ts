"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission, logActivity } from "@/lib/margin";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return v ? String(v) : undefined;
}

export async function createDispute(tradeId: string, formData: FormData) {
  const session = await requirePermission("manage_disputes");

  const dispute = await prisma.dispute.create({
    data: {
      tradeId,
      disputeType: String(formData.get("disputeType")),
      description: String(formData.get("description")),
      claimAmount: formData.get("claimAmount") ? Number(formData.get("claimAmount")) : undefined,
      responsibleUserId: session.userId,
      createdBy: session.userId,
      status: "OPEN",
    },
  });

  await prisma.trade.update({ where: { id: tradeId }, data: { status: "DISPUTED" } });

  await logActivity({
    userId: session.userId,
    entityType: "dispute",
    entityId: dispute.id,
    action: "opened",
    detail: dispute.disputeType,
  });

  revalidatePath(`/dashboard/trades/${tradeId}`);
  revalidatePath("/dashboard/disputes");
}

export async function updateDispute(disputeId: string, tradeId: string, formData: FormData) {
  const session = await requirePermission("manage_disputes");

  await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: String(formData.get("status")) as any,
      sellerResponse: str(formData, "sellerResponse"),
      buyerResponse: str(formData, "buyerResponse"),
      settlementAmount: formData.get("settlementAmount") ? Number(formData.get("settlementAmount")) : undefined,
      settlementPct: formData.get("settlementPct") ? Number(formData.get("settlementPct")) : undefined,
      resolution: str(formData, "resolution"),
    },
  });

  await logActivity({
    userId: session.userId,
    entityType: "dispute",
    entityId: disputeId,
    action: "updated",
    detail: `Status: ${formData.get("status")}`,
  });

  revalidatePath(`/dashboard/trades/${tradeId}`);
  revalidatePath("/dashboard/disputes");
}
