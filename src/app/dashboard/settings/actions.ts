"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission, logActivity } from "@/lib/margin";

export async function updateCompanySettings(formData: FormData) {
  const session = await requirePermission("manage_settings");

  const keys = [
    "company_legal_name",
    "company_display_name",
    "brand_color_primary",
    "brand_color_accent_gold",
    "brand_color_accent_green",
    "confirmation_number_reset",
    "brokerage_invoice_number_reset",
  ];

  for (const key of keys) {
    const value = formData.get(key);
    if (value != null) {
      await prisma.companySetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
  }

  await logActivity({ userId: session.userId, entityType: "company_settings", action: "updated" });
  revalidatePath("/dashboard/settings");
}
