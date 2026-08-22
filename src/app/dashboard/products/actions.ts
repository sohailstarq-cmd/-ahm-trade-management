"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission, logActivity } from "@/lib/margin";

export async function createProduct(formData: FormData) {
  const session = await requirePermission("manage_buyers_sellers"); // reuse trader-level permission for master data

  const parameters = formData.getAll("spec_parameter") as string[];
  const requirements = formData.getAll("spec_requirement") as string[];
  const units = formData.getAll("spec_unit") as string[];
  const minMaxes = formData.getAll("spec_minmax") as string[];

  const product = await prisma.product.create({
    data: {
      name: String(formData.get("name") ?? ""),
      commodityCategory: String(formData.get("commodityCategory") ?? ""),
      originTypical: str(formData, "originTypical"),
      unitOfMeasure: str(formData, "unitOfMeasure") ?? "MT",
      notes: str(formData, "notes"),
      specTemplates: {
        create: parameters
          .map((p, i) => ({
            parameter: p,
            requirement: requirements[i] ?? "",
            unit: units[i] || undefined,
            minMax: minMaxes[i] || undefined,
            sortOrder: i,
          }))
          .filter((row) => row.parameter.trim() !== ""),
      },
    },
  });

  await logActivity({
    userId: session.userId,
    entityType: "product",
    entityId: product.id,
    action: "created",
    detail: `Created product ${product.name}`,
  });

  revalidatePath("/dashboard/products");
  redirect(`/dashboard/products`);
}

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return v ? String(v) : undefined;
}
