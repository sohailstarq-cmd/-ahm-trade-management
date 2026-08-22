import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/margin";
import { updateEmailTemplate } from "./actions";

export default async function EmailPage() {
  const session = await requireSession();
  const canManage = session.permissions.includes("manage_settings");

  const [templates, recentEmails] = await Promise.all([
    prisma.emailTemplate.findMany({ orderBy: { name: "asc" } }),
    prisma.email.findMany({
      include: { trade: { include: { buyer: true } } },
      orderBy: { sentAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-brand-navy">Email</h1>
        <p className="text-sm text-slate-500">
          Templates auto-insert placeholders like <code className="bg-slate-100 px-1 rounded">{"{confirmationNo}"}</code> when
          used from a trade. Actual sending isn't wired to a live provider yet — see README
          "Wiring real email & SMS". Every email is still logged in the trade's history below.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
        {templates.map((t) => (
          <details key={t.id} className="p-4">
            <summary className="text-sm font-medium text-slate-800 cursor-pointer">{t.name}</summary>
            {canManage ? (
              <form action={async (fd) => { "use server"; await updateEmailTemplate(t.id, fd); }} className="mt-3 space-y-2">
                <input name="subjectTemplate" defaultValue={t.subjectTemplate} className="w-full text-sm border border-slate-300 rounded-md px-2 py-1.5" />
                <textarea name="bodyTemplate" defaultValue={t.bodyTemplate} rows={5} className="w-full text-sm border border-slate-300 rounded-md px-2 py-1.5" />
                <button className="text-xs rounded-md border border-slate-300 px-3 py-1.5 bg-white hover:bg-slate-50">Save template</button>
              </form>
            ) : (
              <div className="mt-2 text-sm text-slate-600">
                <p className="font-mono text-xs text-slate-400 mb-1">{t.subjectTemplate}</p>
                <p className="whitespace-pre-wrap">{t.bodyTemplate}</p>
              </div>
            )}
          </details>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <p className="text-sm font-semibold text-brand-navy mb-3">Recent email history</p>
        <ul className="text-sm space-y-1.5">
          {recentEmails.map((e) => (
            <li key={e.id} className="text-slate-600">
              <span className="text-slate-400">{e.sentAt.toISOString().slice(0, 16).replace("T", " ")}</span> — {e.subject} → {e.recipient}
            </li>
          ))}
          {recentEmails.length === 0 && <li className="text-slate-400">No emails logged yet.</li>}
        </ul>
      </div>
    </div>
  );
}
