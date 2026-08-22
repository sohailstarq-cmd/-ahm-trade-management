"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getNextNumber } from "@/lib/numbering";
import { requirePermission, logActivity } from "@/lib/margin";

/**
 * Brokerage structure is set per-trade by whoever has manage_brokerage —
 * never hard-coded, per §35. `rate` means different things depending on
 * type: USD/MT for PER_MT, a percentage for PERCENTAGE, or a flat total for
 * FIXED — the calculation in generateBrokerageInvoice() below branches on it.
 */
export async function upsertBrokerageTerms(tradeId: string, formData: FormData) {
  const session = await requirePermission("manage_brokerage");

  const brokerName = String(formData.get("brokerName"));
  const brokerageType = String(formData.get("brokerageType")) as any;
  const rate = Number(formData.get("rate"));
  const currency = String(formData.get("currency") ?? "USD");

  await prisma.brokerage.upsert({
    where: { tradeId },
    update: { brokerName, brokerageType, rate, currency },
    create: { tradeId, brokerName, brokerageType, rate, currency },
  });

  await logActivity({
    userId: session.userId,
    entityType: "brokerage",
    entityId: tradeId,
    action: "terms_set",
    detail: `${brokerName} — ${brokerageType} @ ${rate}`,
  });

  revalidatePath(`/dashboard/trades/${tradeId}`);
}

export async function generateBrokerageInvoice(tradeId: string) {
  const session = await requirePermission("manage_brokerage");

  const trade = await prisma.trade.findUniqueOrThrow({
    where: { id: tradeId },
    include: { brokerage: true },
  });
  if (!trade.brokerage) throw new Error("Set brokerage terms before generating an invoice.");

  const b = trade.brokerage;
  let calculatedAmount: number;
  if (b.brokerageType === "PER_MT") {
    calculatedAmount = b.rate * trade.quantity;
  } else if (b.brokerageType === "PERCENTAGE") {
    // Percentage brokerage is applied to the buyer-side contract value —
    // the standard brokerage convention — computed here server-side so
    // roles without view_margin still get a correct invoice without ever
    // having buyerPrice rendered to them elsewhere.
    const contractValue = (trade.buyerPrice ?? 0) * trade.quantity;
    calculatedAmount = (b.rate / 100) * contractValue;
  } else {
    calculatedAmount = b.rate; // FIXED
  }
  calculatedAmount = Number(calculatedAmount.toFixed(2));

  const invoiceNo = await getNextNumber("AMT-BI");

  const invoice = await prisma.$transaction(async (tx) => {
    await tx.brokerage.update({
      where: { id: b.id },
      data: { calculatedAmount, status: "INVOICED" },
    });
    return tx.brokerageInvoice.create({
      data: {
        brokerageId: b.id,
        invoiceNo,
        amount: calculatedAmount,
        paymentStatus: "INVOICED",
        createdBy: session.userId,
      },
    });
  });

  await logActivity({
    userId: session.userId,
    entityType: "brokerage_invoice",
    entityId: invoice.id,
    action: "generated",
    detail: `${invoiceNo} — ${trade.currency} ${calculatedAmount}`,
  });

  revalidatePath(`/dashboard/trades/${tradeId}`);
  revalidatePath("/dashboard/invoices");
  redirect(`/dashboard/invoices/${invoice.id}`);
}

export async function markBrokerageInvoicePaid(invoiceId: string, tradeId: string) {
  const session = await requirePermission("manage_brokerage");
  await prisma.brokerageInvoice.update({
    where: { id: invoiceId },
    data: { paymentStatus: "PAID", paymentReceivedDate: new Date() },
  });
  await logActivity({ userId: session.userId, entityType: "brokerage_invoice", entityId: invoiceId, action: "marked_paid" });
  revalidatePath(`/dashboard/trades/${tradeId}`);
  revalidatePath("/dashboard/invoices");
}
