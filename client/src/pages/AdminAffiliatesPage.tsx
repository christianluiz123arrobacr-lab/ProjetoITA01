import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminAffiliateDashboard from "@/components/affiliates/AdminAffiliateDashboard";
export default function AdminAffiliatesPage() {
  return (
    <AdminGuard allowedRoles={["admin"]}>
      <AdminLayout
        title="Afiliados e cupons"
        subtitle="Comissões e registro de repasses externos"
      >
        <AdminAffiliateDashboard />
      </AdminLayout>
    </AdminGuard>
  );
}
