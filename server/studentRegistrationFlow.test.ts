import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");
const registerPage = readFileSync(
  new URL("../client/src/pages/RegisterPage.tsx", import.meta.url),
  "utf8"
);

function sliceBetween(source: string, start: string, end: string) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThan(-1);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}

describe("cadastro automático do aluno", () => {
  const registrationProcedure = sliceBetween(
    router,
    "registerStudent: publicProcedure",
    "updateMyProfile: protectedProcedure"
  );

  it("cria o usuário confirmado para permitir a primeira sessão", () => {
    expect(registrationProcedure).toContain("supabaseAdmin.auth.admin.createUser");
    expect(registrationProcedure).toContain("email_confirm: true");
    expect(registrationProcedure).not.toContain("email_confirm: false");
  });

  it("preserva limites, papel student e rollback do perfil", () => {
    expect(registrationProcedure).toContain('"auth:register:ip"');
    expect(registrationProcedure).toContain("auth:register:email:");
    expect(registrationProcedure).toContain('role: "student"');
    expect(registrationProcedure).toContain("supabaseAdmin.auth.admin.deleteUser(data.user.id)");
  });

  it("entra com a conta recém-criada antes de abrir os planos", () => {
    const mutation = registerPage.indexOf("registerMutation.mutateAsync");
    const signIn = registerPage.indexOf("supabase.auth.signInWithPassword", mutation);
    const plans = registerPage.indexOf('navigate("/planos")', signIn);

    expect(mutation).toBeGreaterThan(-1);
    expect(signIn).toBeGreaterThan(mutation);
    expect(plans).toBeGreaterThan(signIn);
  });

  it("não cria assinatura nem libera acesso durante o cadastro", () => {
    expect(registrationProcedure).not.toContain("billing_subscriptions");
    expect(registrationProcedure).not.toContain("user_has_active_subscription");
    expect(registrationProcedure).not.toContain("accessState");
  });
});
