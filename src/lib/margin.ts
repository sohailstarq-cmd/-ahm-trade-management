import { redirect } from "next/navigation";
import { getCurrentSession } from "./current-user";
import { prisma } from "./db";
import { resolveUserPermissions } from "./permissions";

/**
 * Use at the top of any Server Component page or Server Action that must be
 * restricted. Redirects to /dashboard with no data touched if the session is
 * missing or lacks the permission — callers should not render or act on
 * anything before calling this.
 */
export async function requirePermission(code: string) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (!session.permissions.includes(code)) {
    redirect("/dashboard?denied=" + encodeURIComponent(code));
  }
  return session;
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * The Commercial Confidentiality layer from the spec: strips seller/buyer
 * price and derived margin fields from a trade object unless the caller
 * holds `view_margin`. Always call this before sending a trade to a client
 * component or rendering it — never branch on role name directly.
 */
export function withMarginVisibility<T extends { sellerPrice?: number | null; buyerPrice?: number | null }>(
  trade: T,
  canViewMargin: boolean
): T & { grossSpread: number | null; canViewMargin: boolean } {
  const grossSpread =
    trade.sellerPrice != null && trade.buyerPrice != null
      ? Number((trade.buyerPrice - trade.sellerPrice).toFixed(4))
      : null;

  if (canViewMargin) {
    return { ...trade, grossSpread, canViewMargin: true };
  }
  return {
    ...trade,
    sellerPrice: null,
    buyerPrice: null,
    grossSpread: null,
    canViewMargin: false,
  };
}

/** Re-resolves permissions fresh from the DB — use in Server Actions, where the
 * JWT session's cached permission list could be stale if Owner just changed it. */
export async function freshPermissions(userId: string): Promise<string[]> {
  return resolveUserPermissions(userId);
}

export async function logActivity(params: {
  userId: string;
  entityType: string;
  entityId?: string;
  action: string;
  detail?: string;
}) {
  await prisma.activityLog.create({ data: params });
}
