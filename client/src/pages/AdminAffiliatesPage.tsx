import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { AffiliateDashboard } from "./AffiliatePage";
export default function AdminAffiliatesPage() {
  return (
    <AdminGuard allowedRoles={["admin"]}>
      <AdminLayout
        title="Afiliados e cupons"
        subtitle="Comissões e registro de repasses externos"
      >
        <AffiliateDashboard admin />
      </AdminLayout>
    </AdminGuard>
  );
}
