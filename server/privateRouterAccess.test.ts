import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isAdminPath, normalizeLegacyAdminPath } from "../client/src/lib/privateRouteAccess";

const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
const adminGuard = readFileSync(new URL("../client/src/components/admin/AdminGuard.tsx", import.meta.url), "utf8");
const adminDashboard = readFileSync(new URL("../client/src/pages/AdminDashboardPage.tsx", import.meta.url), "utf8");
const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("separação de acesso administrativo e assinatura", () => {
  it("classifica somente rotas administrativas reais", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/questoes/123")).toBe(true);
    expect(isAdminPath("/plataforma/admin/usuarios")).toBe(true);
    expect(isAdminPath("/plataforma")).toBe(false);
    expect(isAdminPath("/banco-questoes")).toBe(false);
    expect(isAdminPath("/administrator")).toBe(false);
  });

  it("mantém o redirecionamento das rotas administrativas legadas", () => {
    expect(normalizeLegacyAdminPath("/plataforma/admin")).toBe("/admin");
    expect(normalizeLegacyAdminPath("/plataforma/admin/questoes")).toBe("/admin/questoes");
    expect(normalizeLegacyAdminPath("/plataforma")).toBeNull();
  });

  it("não monta SubscriptionGuard em admin e mantém o guard para alunos", () => {
    expect(app).toContain("return isAdminRoute ? pageContent : (");
    expect(app).toContain("<SubscriptionGuard>{pageContent}</SubscriptionGuard>");
    expect(app).toContain("{!isAdminRoute ? (");
  });

  it("protege admin por sessão e papel canônico, sem consultar assinatura", () => {
    expect(adminDashboard).toContain("<AdminGuard>");
    expect(adminGuard).toContain("trpc.auth.me.useQuery");
    expect(adminGuard).toContain('const DEFAULT_ALLOWED_ROLES: AdminRole[] = ["admin", "editor"]');
    expect(adminGuard).not.toContain("getAccessStatus");
    expect(adminGuard).not.toContain("localStorage");
    expect(adminGuard).not.toContain("email");
  });

  it("libera o papel administrativo antes de consultar perfil ou assinatura", () => {
    const start = router.indexOf("getAccessStatus: protectedProcedure");
    const procedure = router.slice(start, router.indexOf("logout: publicProcedure", start));
    const override = procedure.indexOf('ctx.user.role === "admin"');
    const profileQuery = procedure.indexOf('.from("profiles")');

    expect(override).toBeGreaterThan(-1);
    expect(profileQuery).toBeGreaterThan(override);
    expect(procedure.slice(override, profileQuery)).toContain('accessState: "allowed"');
    expect(procedure.slice(override, profileQuery)).toContain('subscriptionStatus: "admin_override"');
  });
});
