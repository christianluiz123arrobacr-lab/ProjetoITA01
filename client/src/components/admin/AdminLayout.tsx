import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

type AdminLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function AdminLayout({
  title,
  subtitle,
  children,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 dark:from-slate-900 via-slate-100 dark:via-slate-900 to-slate-50 dark:to-slate-900">
      <main className="container py-6 space-y-6">
        <AdminTopbar title={title} subtitle={subtitle} />

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <AdminSidebar />

          <section className="flex-1 w-full">
            <div className="space-y-6">{children}</div>
          </section>
        </div>
      </main>
    </div>
  );
}
