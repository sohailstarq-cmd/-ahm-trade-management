import { prisma } from "./db";

/**
 * Resolves the final permission set for a user: role defaults, with any
 * per-user UserPermission rows overriding (granting or revoking) individual
 * codes. This is the ONLY function that should decide what a user can do —
 * never check `role === "OWNER"` directly in route handlers or components.
 */
export async function resolveUserPermissions(userId: string): Promise<string[]> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      role: { include: { defaults: { include: { permission: true } } } },
      permissionOverrides: { include: { permission: true } },
    },
  });

  const resolved = new Map<string, boolean>();
  for (const rp of user.role.defaults) {
    resolved.set(rp.permission.code, rp.granted);
  }
  for (const up of user.permissionOverrides) {
    resolved.set(up.permission.code, up.granted); // override wins
  }

  return Array.from(resolved.entries())
    .filter(([, granted]) => granted)
    .map(([code]) => code);
}

export function hasPermission(permissions: string[], code: string): boolean {
  return permissions.includes(code);
}
