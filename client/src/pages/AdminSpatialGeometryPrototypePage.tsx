import AdminGuard from "@/components/admin/AdminGuard";
import AdminLayout from "@/components/admin/AdminLayout";
import { SpatialGeometrySimulator } from "@/components/simulators/SpatialGeometrySimulator";

export default function AdminSpatialGeometryPrototypePage() {
  return (
    <AdminGuard allowedRoles={["admin"]}>
      <AdminLayout
        title="Simulador de Geometria Espacial"
        subtitle="Laboratório 3D para sólidos, volumes, áreas, cortes e relações de inscrição."
      >
        <SpatialGeometrySimulator />
      </AdminLayout>
    </AdminGuard>
  );
}
