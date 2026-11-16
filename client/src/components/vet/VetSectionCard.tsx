import type { LucideIcon } from "lucide-react";

type VetSectionCardProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
};

export function VetSectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
}: VetSectionCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-3 mb-5">
        {Icon ? (
          <div className="h-11 w-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 dark:bg-emerald-950 dark:text-emerald-200">
            <Icon className="w-5 h-5" />
          </div>
        ) : null}

        <div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          {subtitle ? (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {children}
    </div>
  );
}
