import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/current-user";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login"); // belt-and-suspenders alongside middleware.ts

  return (
    <div className="flex min-h-screen">
      <div className="no-print contents">
        <Sidebar role={session.role} />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="no-print">
          <TopBar email={session.email} role={session.role} />
        </div>
        <main className="flex-1 bg-slate-50 print-page p-6">{children}</main>
      </div>
    </div>
  );
}
