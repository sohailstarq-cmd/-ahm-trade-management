import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/margin";
import { createEmployee, setUserStatus, setPermissionOverride } from "./actions";

const ROLES = ["OWNER", "TRADER", "OPERATIONS", "FINANCE", "EMPLOYEE"];

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { newEmail?: string; newPassword?: string };
}) {
  await requirePermission("manage_users");

  const [users, permissions] = await Promise.all([
    prisma.user.findMany({
      include: { role: true, permissionOverrides: { include: { permission: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.permission.findMany({ orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-semibold text-brand-navy">Users & Permissions</h1>
        <p className="text-sm text-slate-500">
          Create employees and fine-tune access beyond their role's defaults.
        </p>
      </div>

      {searchParams.newEmail && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm">
          <p className="font-medium text-amber-800">Account created for {searchParams.newEmail}</p>
          <p className="text-amber-700">
            Temporary password: <code className="bg-white px-1.5 py-0.5 rounded">{searchParams.newPassword}</code> —
            relay this to them securely. It's shown here once and was also logged to the server console.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <p className="text-sm font-semibold text-brand-navy mb-3">Add employee</p>
        <form action={createEmployee} className="grid grid-cols-5 gap-3 items-end text-sm">
          <input name="name" placeholder="Full name" required className="rounded-md border border-slate-300 px-2.5 py-1.5" />
          <input name="email" type="email" placeholder="Company email" required className="rounded-md border border-slate-300 px-2.5 py-1.5" />
          <select name="role" className="rounded-md border border-slate-300 px-2.5 py-1.5">
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select name="twoFactorMethod" className="rounded-md border border-slate-300 px-2.5 py-1.5">
            <option value="EMAIL">2FA via Email</option>
            <option value="SMS">2FA via SMS</option>
          </select>
          <input name="phone" placeholder="Phone (required for SMS 2FA)" className="rounded-md border border-slate-300 px-2.5 py-1.5" />
          <button className="col-span-5 justify-self-start rounded-md bg-brand-navy text-white px-4 py-2 hover:bg-brand-navyLight">
            Create account
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Role</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Permission overrides</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 align-top">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.role.name}</td>
                <td className="px-4 py-2">
                  <form action={async (fd) => { "use server"; await setUserStatus(u.id, String(fd.get("status"))); }}>
                    <select name="status" defaultValue={u.status} className="text-xs border border-slate-300 rounded-md px-1.5 py-1">
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="INVITED">Invited</option>
                    </select>
                  </form>
                </td>
                <td className="px-4 py-2">
                  <details>
                    <summary className="text-xs text-brand-navy cursor-pointer">
                      {u.permissionOverrides.length} override(s)
                    </summary>
                    <div className="mt-2 space-y-1">
                      {permissions.map((p) => {
                        const override = u.permissionOverrides.find((o) => o.permissionId === p.id);
                        return (
                          <form
                            key={p.id}
                            action={async (fd) => {
                              "use server";
                              const val = String(fd.get("granted"));
                              await setPermissionOverride(u.id, p.code, val === "default" ? null : val === "true");
                            }}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span className="w-40 text-slate-500">{p.code}</span>
                            <select name="granted" defaultValue={override ? String(override.granted) : "default"} className="border border-slate-300 rounded px-1 py-0.5">
                              <option value="default">Role default</option>
                              <option value="true">Grant</option>
                              <option value="false">Revoke</option>
                            </select>
                            <button className="text-brand-navy hover:underline">Save</button>
                          </form>
                        );
                      })}
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
