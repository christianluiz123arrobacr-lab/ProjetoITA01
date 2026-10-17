import { Card } from "@/components/ui/card";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminGuard from "@/components/admin/AdminGuard";

export default function AdminUploadsPage() {
  return (
    <AdminGuard>
      <AdminLayout
        title="Uploads ADM"
        subtitle="Área de gerenciamento de imagens e arquivos."
      >
        <Card className="p-8">
          <p className="text-slate-600 dark:text-slate-300">
            Aqui vamos construir o módulo de uploads.
          </p>
        </Card>
      </AdminLayout>
    </AdminGuard>
  );
}
