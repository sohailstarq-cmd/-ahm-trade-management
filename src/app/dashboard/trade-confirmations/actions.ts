"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/numbering";
import { requirePermission, logActivity } from "@/lib/margin";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return v ? String(v) : undefined;
}
function num(formData: FormData, key: string): number | undefined {
  const v = formData.get(key);
  return v ? Number(v) : undefined;
}

/**
 * Creates a Trade Confirmation and, per §13, automatically creates the
 * linked Trade record in the same transaction. `issue` controls whether
 * this is saved as DRAFT (no number consumed) or ISSUED (consumes the next
 * AMT-TC-YYYY-##### number and cannot silently be edited afterward — an
 * edit after issue should create a new revision, not mutate history).
 */
export async function createTradeConfirmation(formData: FormData, issue: boolean) {
  const session = await requirePermission("create_trade_confirmation");

  const buyerId = String(formData.get("buyerId"));
  const sellerId = String(formData.get("sellerId"));
  const productId = String(formData.get("productId"));

  const parameters = formData.getAll("spec_parameter") as string[];
  const requirements = formData.getAll("spec_requirement") as string[];
  const units = formData.getAll("spec_unit") as string[];
  const minMaxes = formData.getAll("spec_minmax") as string[];
  const notesArr = formData.getAll("spec_notes") as string[];

  const qualitySpecsData = parameters
    .map((p, i) => ({
      parameter: p,
      requirement: requirements[i] ?? "",
      unit: units[i] || undefined,
      minMax: minMaxes[i] || undefined,
      notes: notesArr[i] || undefined,
      sortOrder: i,
    }))
    .filter((row) => row.parameter.trim() !== "");

  const confirmationNo = issue ? await getNextNumber("AMT-TC") : `DRAFT-${Date.now()}`;

  const result = await prisma.$transaction(async (tx) => {
    const confirmation = await tx.tradeConfirmation.create({
      data: {
        confirmationNo,
        buyerId,
        sellerId,
        productId,
        crop: str(formData, "crop"),
        origin: str(formData, "origin"),
        shipmentPeriod: str(formData, "shipmentPeriod"),
        packing: str(formData, "packing"),
        destination: str(formData, "destination"),
        incoterm: String(formData.get("incoterm") ?? ""),
        price: num(formData, "price") ?? 0,
        currency: str(formData, "currency") ?? "USD",
        priceBasis: str(formData, "priceBasis"),
        quantity: num(formData, "quantity") ?? 0,
        quantityUnit: str(formData, "quantityUnit") ?? "MT",
        quantityTolerance: str(formData, "quantityTolerance"),
        paymentTerms: String(formData.get("paymentTerms") ?? ""),
        documentsRequired: str(formData, "documentsRequired"),
        brokerName: str(formData, "brokerName"),
        brokerageTerms: str(formData, "brokerageTerms"),
        arbitration: str(formData, "arbitration"),
        remarks: str(formData, "remarks"),
        specialClauses: str(formData, "specialClauses"),
        qualityFreeText: str(formData, "qualityFreeText"),
        status: issue ? "ISSUED" : "DRAFT",
        createdBy: session.userId,
        qualitySpecs: { create: qualitySpecsData },
      },
    });

    let tradeId: string | undefined;
    if (issue) {
      // Auto-create the Trade record — confirmation and trade are distinct
      // entities linked 1:1 at issue time, per the corrected hierarchy.
      const trade = await tx.trade.create({
        data: {
          buyerId,
          sellerId,
          productId,
          incoterm: String(formData.get("incoterm") ?? ""),
          currency: str(formData, "currency") ?? "USD",
          destination: str(formData, "destination"),
          quantity: num(formData, "quantity") ?? 0,
          quantityUnit: str(formData, "quantityUnit") ?? "MT",
          sellerPrice: num(formData, "sellerPrice"),
          buyerPrice: num(formData, "price"),
          status: "CONFIRMED",
          currentConfirmationNo: confirmationNo,
          createdBy: session.userId,
        },
      });
      await tx.tradeConfirmation.update({ where: { id: confirmation.id }, data: { tradeId: trade.id } });
      tradeId = trade.id;
    }

    return { confirmation, tradeId };
  });

  await logActivity({
    userId: session.userId,
    entityType: "trade_confirmation",
    entityId: result.confirmation.id,
    action: issue ? "issued" : "saved_draft",
    detail: `${confirmationNo}${issue ? " issued and trade record created" : " saved as draft"}`,
  });

  revalidatePath("/dashboard/trade-confirmations");
  if (result.tradeId) revalidatePath("/dashboard/trades");

  redirect(`/dashboard/trade-confirmations/${result.confirmation.id}`);
}

export async function saveDraftAction(formData: FormData) {
  await createTradeConfirmation(formData, false);
}
export async function issueAction(formData: FormData) {
  await createTradeConfirmation(formData, true);
}

/** Duplicate an existing confirmation into a fresh, editable draft. */
export async function duplicateConfirmation(confirmationId: string) {
  const session = await requirePermission("create_trade_confirmation");
  const original = await prisma.tradeConfirmation.findUniqueOrThrow({
    where: { id: confirmationId },
    include: { qualitySpecs: true },
  });

  const copy = await prisma.tradeConfirmation.create({
    data: {
      confirmationNo: `DRAFT-${Date.now()}`,
      buyerId: original.buyerId,
      sellerId: original.sellerId,
      productId: original.productId,
      crop: original.crop,
      origin: original.origin,
      shipmentPeriod: original.shipmentPeriod,
      packing: original.packing,
      destination: original.destination,
      incoterm: original.incoterm,
      price: original.price,
      currency: original.currency,
      priceBasis: original.priceBasis,
      quantity: original.quantity,
      quantityUnit: original.quantityUnit,
      quantityTolerance: original.quantityTolerance,
      paymentTerms: original.paymentTerms,
      documentsRequired: original.documentsRequired,
      brokerName: original.brokerName,
      brokerageTerms: original.brokerageTerms,
      arbitration: original.arbitration,
      remarks: original.remarks,
      specialClauses: original.specialClauses,
      qualityFreeText: original.qualityFreeText,
      status: "DRAFT",
      createdBy: session.userId,
      qualitySpecs: {
        create: original.qualitySpecs.map((s) => ({
          parameter: s.parameter,
          requirement: s.requirement,
          unit: s.unit,
          minMax: s.minMax,
          notes: s.notes,
          sortOrder: s.sortOrder,
        })),
      },
    },
  });

  await logActivity({
    userId: session.userId,
    entityType: "trade_confirmation",
    entityId: copy.id,
    action: "duplicated",
    detail: `Duplicated from ${original.confirmationNo}`,
  });

  redirect(`/dashboard/trade-confirmations/${copy.id}`);
}

/** Records that a confirmation PDF was "sent" via email — logs to the Email
 * history and activity log. Does not actually deliver email — see
 * src/lib/notify.ts and README "Wiring real email & SMS". */
export async function sendConfirmationEmail(confirmationId: string, formData: FormData) {
  const session = await requirePermission("create_trade_confirmation");
  const confirmation = await prisma.tradeConfirmation.findUniqueOrThrow({
    where: { id: confirmationId },
    include: { buyer: true, seller: true, product: true },
  });

  const recipient = String(formData.get("recipient") ?? confirmation.buyer.email ?? "");
  const subject = `${confirmation.confirmationNo} | Trade Confirmation | ${confirmation.product.name}`;
  const body = String(formData.get("body") ?? "");

  await prisma.email.create({
    data: {
      tradeId: confirmation.tradeId ?? undefined,
      sender: session.email,
      recipient,
      cc: str(formData, "cc"),
      subject,
      body,
      sentByUserId: session.userId,
    },
  });

  await logActivity({
    userId: session.userId,
    entityType: "trade_confirmation",
    entityId: confirmationId,
    action: "email_logged",
    detail: `Logged email to ${recipient} — actual delivery requires a configured email provider (see README).`,
  });

  revalidatePath(`/dashboard/trade-confirmations/${confirmationId}`);
}
