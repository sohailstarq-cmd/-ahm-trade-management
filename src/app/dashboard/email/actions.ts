"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission, logActivity } from "@/lib/margin";

export async function updateEmailTemplate(templateId: string, formData: FormData) {
  const session = await requirePermission("manage_settings");
  await prisma.emailTemplate.update({
    where: { id: templateId },
    data: {
      subjectTemplate: String(formData.get("subjectTemplate")),
      bodyTemplate: String(formData.get("bodyTemplate")),
    },
  });
  await logActivity({ userId: session.userId, entityType: "email_template", entityId: templateId, action: "updated" });
  revalidatePath("/dashboard/email");
}
