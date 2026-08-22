"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { requirePermission, logActivity } from "@/lib/margin";

export async function createEmployee(formData: FormData) {
  const session = await requirePermission("manage_users");

  const email = String(formData.get("email"));
  const name = String(formData.get("name"));
  const roleName = String(formData.get("role"));
  const twoFactorMethod = String(formData.get("twoFactorMethod")) as "EMAIL" | "SMS";
  const phone = formData.get("phone") ? String(formData.get("phone")) : undefined;

  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName as any } });

  // Temporary password — shown once on the next page load and logged
  // server-side. There's no self-service invite email yet (needs a
  // configured email provider — see README), so relay this manually for now.
  const tempPassword = crypto.randomBytes(6).toString("base64url");
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, roleId: role.id, status: "ACTIVE", twoFactorMethod },
  });

  console.log(`[NEW USER] ${email} temporary password: ${tempPassword}`);

  await logActivity({
    userId: session.userId,
    entityType: "user",
    entityId: user.id,
    action: "created",
    detail: `Created ${roleName} account for ${email}`,
  });

  revalidatePath("/dashboard/users");
  redirect(`/dashboard/users?newEmail=${encodeURIComponent(email)}&newPassword=${encodeURIComponent(tempPassword)}`);
}

export async function setUserStatus(userId: string, status: string) {
  const session = await requirePermission("manage_users");
  await prisma.user.update({ where: { id: userId }, data: { status: status as any } });
  await logActivity({ userId: session.userId, entityType: "user", entityId: userId, action: "status_changed", detail: status });
  revalidatePath("/dashboard/users");
}

export async function setPermissionOverride(userId: string, permissionCode: string, granted: boolean | null) {
  const session = await requirePermission("manage_users");
  const permission = await prisma.permission.findUniqueOrThrow({ where: { code: permissionCode } });

  if (granted === null) {
    // null = "remove override, fall back to role default"
    await prisma.userPermission.deleteMany({ where: { userId, permissionId: permission.id } });
  } else {
    await prisma.userPermission.upsert({
      where: { userId_permissionId: { userId, permissionId: permission.id } },
      update: { granted },
      create: { userId, permissionId: permission.id, granted },
    });
  }

  await logActivity({
    userId: session.userId,
    entityType: "user",
    entityId: userId,
    action: "permission_override",
    detail: `${permissionCode} → ${granted === null ? "role default" : granted}`,
  });
  revalidatePath("/dashboard/users");
}
