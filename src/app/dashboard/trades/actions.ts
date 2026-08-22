"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission, logActivity } from "@/lib/margin";

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return v ? String(v) : undefined;
}
function dateOrUndef(formData: FormData, key: string): Date | undefined {
  const v = formData.get(key);
  return v ? new Date(String(v)) : undefined;
}

export const TRADE_STATUS_ORDER = [
  "DRAFT",
  "CONFIRMATION_PENDING",
  "CONFIRMED",
  "SELLER_CONTRACT_RECEIVED",
  "BUYER_PO_RECEIVED",
  "SHIPMENT_PLANNING",
  "BOOKED",
  "LOADED",
  "IN_TRANSIT",
  "ARRIVED",
  "DOCUMENTS_COMPLETED",
  "PAYMENT_COMPLETED",
  "BROKERAGE_COMPLETED",
  "TRADE_COMPLETED",
] as const;
export const TRADE_STATUS_SIDE_STATES = ["CANCELLED", "ON_HOLD", "DISPUTED"] as const;

export async function updateTradeStatus(tradeId: string, formData: FormData) {
  const session = await requirePermission("update_trade_status");
  const status = String(formData.get("status"));
  await prisma.trade.update({ where: { id: tradeId }, data: { status: status as any } });
  await logActivity({
    userId: session.userId,
    entityType: "trade",
    entityId: tradeId,
    action: "status_changed",
    detail: `Status changed to ${status}`,
  });
  revalidatePath(`/dashboard/trades/${tradeId}`);
  revalidatePath("/dashboard/trades");
}

export async function updateContractInfo(tradeId: string, formData: FormData) {
  const session = await requirePermission("update_trade_status");
  await prisma.trade.update({
    where: { id: tradeId },
    data: {
      sellerContractNo: str(formData, "sellerContractNo"),
      sellerContractDate: dateOrUndef(formData, "sellerContractDate"),
      buyerPoNo: str(formData, "buyerPoNo"), // optional, per spec
      buyerPoDate: dateOrUndef(formData, "buyerPoDate"),
    },
  });
  await logActivity({
    userId: session.userId,
    entityType: "trade",
    entityId: tradeId,
    action: "contract_info_updated",
  });
  revalidatePath(`/dashboard/trades/${tradeId}`);
}

export async function createShipment(tradeId: string, formData: FormData) {
  const session = await requirePermission("manage_shipment");
  const shipment = await prisma.shipment.create({
    data: {
      tradeId,
      shippingLine: str(formData, "shippingLine"),
      vesselName: str(formData, "vesselName"),
      voyageNumber: str(formData, "voyageNumber"),
      bookingNumber: str(formData, "bookingNumber"),
      blNumber: str(formData, "blNumber"),
      blDate: dateOrUndef(formData, "blDate"),
      portOfLoading: str(formData, "portOfLoading"),
      transhipmentPort: str(formData, "transhipmentPort"),
      portOfDischarge: str(formData, "portOfDischarge"),
      etd: dateOrUndef(formData, "etd"),
      eta: dateOrUndef(formData, "eta"),
    },
  });
  await logActivity({
    userId: session.userId,
    entityType: "shipment",
    entityId: shipment.id,
    action: "created",
    detail: `Shipment created for trade ${tradeId}`,
  });
  revalidatePath(`/dashboard/trades/${tradeId}`);
}

export async function updateShipmentStatus(shipmentId: string, tradeId: string, formData: FormData) {
  const session = await requirePermission("manage_shipment");
  const status = String(formData.get("status"));
  await prisma.shipment.update({ where: { id: shipmentId }, data: { status: status as any } });
  await logActivity({
    userId: session.userId,
    entityType: "shipment",
    entityId: shipmentId,
    action: "status_changed",
    detail: `Shipment status → ${status}. (Manual update — no live carrier API is connected; see README "Shipment tracking".)`,
  });
  revalidatePath(`/dashboard/trades/${tradeId}`);
}

export async function addContainer(shipmentId: string, tradeId: string, formData: FormData) {
  const session = await requirePermission("manage_shipment");
  await prisma.container.create({
    data: {
      shipmentId,
      containerNo: String(formData.get("containerNo")),
      size: str(formData, "size"),
      sealNo: str(formData, "sealNo"),
    },
  });
  await logActivity({ userId: session.userId, entityType: "shipment", entityId: shipmentId, action: "container_added" });
  revalidatePath(`/dashboard/trades/${tradeId}`);
}

export async function addDocument(tradeId: string, formData: FormData) {
  const session = await requirePermission("upload_documents");
  await prisma.document.create({
    data: {
      tradeId,
      docType: String(formData.get("docType")) as any,
      fileUrl: str(formData, "fileUrl"),
      fileName: str(formData, "fileName"),
      status: str(formData, "fileUrl") ? "UPLOADED" : "PENDING",
      uploadedBy: str(formData, "fileUrl") ? session.userId : undefined,
      uploadedAt: str(formData, "fileUrl") ? new Date() : undefined,
    },
  });
  await logActivity({
    userId: session.userId,
    entityType: "document",
    entityId: tradeId,
    action: "document_added",
    detail: String(formData.get("docType")),
  });
  revalidatePath(`/dashboard/trades/${tradeId}`);
}
