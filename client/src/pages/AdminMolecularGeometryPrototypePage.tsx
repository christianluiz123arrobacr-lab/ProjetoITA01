import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { MolecularGeometrySimulator } from "@/components/simulators/MolecularGeometrySimulator";

export default function AdminMolecularGeometryPrototypePage() {
  return (
    <AdminGuard allowedRoles={["admin"]}>
      <AdminLayout
        title="Protótipo: Geometria molecular"
        subtitle="Visualização interna para testar moléculas 3D, ângulos, pares livres e explicações didáticas."
      >
        <MolecularGeometrySimulator />
      </AdminLayout>
    </AdminGuard>
  );
}
