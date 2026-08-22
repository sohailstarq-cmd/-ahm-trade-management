/**
 * Seeds roles, the base permission list, role-default permission grants,
 * company branding settings, and one OWNER account so you can log in the
 * first time.
 *
 * Run with: npm run prisma:seed
 *
 * Change OWNER_EMAIL / OWNER_PASSWORD via environment variables before
 * seeding a real deployment — do not ship the placeholder password.
 */
import { PrismaClient, RoleName, TwoFactorMethod } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSIONS: { code: string; description: string }[] = [
  { code: "view_margin", description: "View buyer/seller price, spread, and net margin on trades" },
  { code: "manage_buyers_sellers", description: "Create and edit buyer/seller records" },
  { code: "create_trade_confirmation", description: "Create trade confirmations" },
  { code: "update_trade_status", description: "Advance/change a trade's status" },
  { code: "manage_shipment", description: "Enter vessel, container, BL, and shipment status data" },
  { code: "upload_documents", description: "Upload documents to a trade" },
  { code: "record_payment", description: "Record buyer/seller payments" },
  { code: "manage_brokerage", description: "View and generate brokerage invoices" },
  { code: "manage_disputes", description: "Create and update disputes" },
  { code: "view_all_reports", description: "View company-wide reports, not just own trades" },
  { code: "manage_users", description: "Create/edit users, roles, and permissions" },
  { code: "manage_settings", description: "Edit company settings and branding" },
];

// Role → default permission codes. This is DATA, editable later from
// Users & Permissions — it's seeded here only to give the app a sane
// starting point, per the role matrix in the Phase 1 architecture doc.
const ROLE_DEFAULTS: Record<RoleName, string[]> = {
  OWNER: PERMISSIONS.map((p) => p.code), // full access
  TRADER: [
    "manage_buyers_sellers",
    "create_trade_confirmation",
    "update_trade_status",
    "upload_documents",
    "manage_disputes",
  ],
  OPERATIONS: ["update_trade_status", "manage_shipment", "upload_documents"],
  FINANCE: ["record_payment", "manage_brokerage", "view_all_reports"],
  EMPLOYEE: [], // starts with nothing; Owner grants case-by-case
};

async function main() {
  // --- Roles ---
  const roleRecords: Record<RoleName, { id: string }> = {} as any;
  for (const name of Object.values(RoleName)) {
    roleRecords[name] = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // --- Permissions ---
  const permRecords: Record<string, { id: string }> = {};
  for (const p of PERMISSIONS) {
    permRecords[p.code] = await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description },
      create: p,
    });
  }

  // --- Role default grants ---
  for (const roleName of Object.values(RoleName)) {
    const codes = ROLE_DEFAULTS[roleName];
    for (const code of codes) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleRecords[roleName].id,
            permissionId: permRecords[code].id,
          },
        },
        update: { granted: true },
        create: {
          roleId: roleRecords[roleName].id,
          permissionId: permRecords[code].id,
          granted: true,
        },
      });
    }
  }

  // --- Company branding & settings ---
  // Colors sampled directly from the official logo you supplied:
  // navy #03224F, gold #C0902F, green #156428.
  const settings: Record<string, string> = {
    company_legal_name: "ALHAMZA MERIDIAN TRADING – FZCO",
    company_display_name: "AL HAMZA MERIDIAN",
    brand_color_primary: "#03224F", // navy
    brand_color_accent_gold: "#C0902F",
    brand_color_accent_green: "#156428",
    logo_path: "/logo.png",
    confirmation_number_reset: "yearly", // AMT-TC-2026-00001, resets 2027-00001, ...
    brokerage_invoice_number_reset: "yearly",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.companySetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  // --- Owner account ---
  const ownerEmail = process.env.OWNER_EMAIL || "owner@alhamzameridian.com";
  const ownerPassword = process.env.OWNER_PASSWORD || "ChangeMe!12345";
  const passwordHash = await bcrypt.hash(ownerPassword, 12);

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      name: "Owner",
      email: ownerEmail,
      passwordHash,
      roleId: roleRecords.OWNER.id,
      status: "ACTIVE",
      twoFactorMethod: TwoFactorMethod.EMAIL,
    },
  });

  // --- Email templates (§25) — placeholders are plain {tokens}, filled in
  // by whatever sends the email; nothing here is wired to live delivery. ---
  const templates: { name: string; subjectTemplate: string; bodyTemplate: string }[] = [
    {
      name: "Trade Confirmation",
      subjectTemplate: "{confirmationNo} | Trade Confirmation | {product}",
      bodyTemplate:
        "Dear {buyerContact},\n\nPlease find attached trade confirmation {confirmationNo} for {quantity} {product}, {origin} origin, shipment {shipmentPeriod}.\n\nKindly review and revert with any queries.\n\nBest regards,\n{employeeName}\nAL HAMZA MERIDIAN TRADING – FZCO",
    },
    {
      name: "Contract Reminder",
      subjectTemplate: "{confirmationNo} | Contract Reminder | {product}",
      bodyTemplate:
        "Dear {contactName},\n\nThis is a reminder that the signed contract for {confirmationNo} ({product}, {quantity}) is still outstanding. Please send the countersigned copy at your earliest convenience.\n\nBest regards,\n{employeeName}",
    },
    {
      name: "Shipment Update",
      subjectTemplate: "{confirmationNo} | Shipment Update | {product}",
      bodyTemplate:
        "Dear {contactName},\n\nShipment update for {confirmationNo}: status is now {shipmentStatus}. Vessel: {vesselName}, ETA: {eta}.\n\nBest regards,\n{employeeName}",
    },
    {
      name: "Document Reminder",
      subjectTemplate: "{confirmationNo} | Document Reminder | {product}",
      bodyTemplate:
        "Dear {contactName},\n\nThe following documents are still pending for {confirmationNo}: {pendingDocuments}. Kindly arrange at the earliest.\n\nBest regards,\n{employeeName}",
    },
    {
      name: "Payment Reminder",
      subjectTemplate: "{confirmationNo} | Payment Reminder | {product}",
      bodyTemplate:
        "Dear {contactName},\n\nThis is a reminder that a payment of {amount} {currency} for {confirmationNo} was due on {dueDate} and remains outstanding.\n\nBest regards,\n{employeeName}",
    },
    {
      name: "Brokerage Invoice",
      subjectTemplate: "{invoiceNo} | Brokerage Invoice | {confirmationNo}",
      bodyTemplate:
        "Dear {brokerName},\n\nPlease find attached brokerage invoice {invoiceNo} relating to trade {confirmationNo}.\n\nBest regards,\n{employeeName}",
    },
    {
      name: "Dispute Notice",
      subjectTemplate: "{confirmationNo} | Dispute Notice | {disputeType}",
      bodyTemplate:
        "Dear {contactName},\n\nWe are writing to formally notify a dispute on trade {confirmationNo}, relating to {disputeType}. Details: {description}.\n\nBest regards,\n{employeeName}",
    },
    {
      name: "Shipment Arrival",
      subjectTemplate: "{confirmationNo} | Shipment Arrived | {product}",
      bodyTemplate:
        "Dear {contactName},\n\nThe shipment for {confirmationNo} has arrived at {portOfDischarge} on {actualArrival}.\n\nBest regards,\n{employeeName}",
    },
    {
      name: "Trade Completion",
      subjectTemplate: "{confirmationNo} | Trade Completed | {product}",
      bodyTemplate:
        "Dear {contactName},\n\nTrade {confirmationNo} has been marked complete — all documents, payments, and brokerage are settled. Thank you for the smooth transaction.\n\nBest regards,\n{employeeName}",
    },
  ];
  for (const t of templates) {
    await prisma.emailTemplate.upsert({ where: { name: t.name }, update: t, create: t });
  }

  console.log("Seed complete.");
  console.log(`Owner login: ${ownerEmail} / ${ownerPassword}`);
  console.log("CHANGE THIS PASSWORD immediately after first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
