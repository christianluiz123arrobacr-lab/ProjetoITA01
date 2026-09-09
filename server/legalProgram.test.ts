import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultReferralCampaign } from "../shared/referralProgram.js";
import { LEGAL_DOCUMENT_VERSIONS, LEGAL_ROUTES } from "../shared/legalDocuments.js";

const migration = readFileSync(new URL("../supabase/migrations/202609070001_legal_acceptance_and_whatsapp_consent.sql", import.meta.url), "utf8");
const registration = readFileSync(new URL("../client/src/pages/RegisterPage.tsx", import.meta.url), "utf8");
const guard = readFileSync(new URL("../client/src/components/legal/LegalAcceptanceGuard.tsx", import.meta.url), "utf8");
const router = readFileSync(new URL("./routers.ts", import.meta.url), "utf8");

describe("documentos legais e consentimentos", () => {
  it("mantém versões explícitas e quatro rotas públicas", () => {
    expect(LEGAL_DOCUMENT_VERSIONS.terms).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(LEGAL_DOCUMENT_VERSIONS.privacy).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(LEGAL_ROUTES).toHaveLength(4);
  });

  it("exige aceite no cadastro e grava pelo backend", () => {
    expect(registration).toContain("Li e concordo com os");
    expect(registration).toContain("legalAccepted: true");
    expect(router).toContain("legalAccepted: z.literal(true)");
    expect(router).toContain('recordLegalAcceptance(data.user.id, "registration")');
  });

  it("bloqueia a área privada até o aceite e permite sair", () => {
    expect(guard).toContain("acceptanceStatus");
    expect(guard).toContain("accessBootstrap.isSuccess");
    expect(guard).toContain("!isAdmin && !sessionAccepted");
    expect(guard).toContain("setSessionAccepted(true)");
    expect(guard).not.toContain("setTimeout");
    expect(guard).toContain("Atualizamos nossos termos");
    expect(guard).toContain("void signOut()");
  });

  it("fecha as tabelas de auditoria para o navegador", () => {
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("revoke all on public.legal_document_acceptances from anon, authenticated");
    expect(migration).toContain("grant execute on function public.record_legal_acceptance");
    expect(migration).toContain("whatsapp_consent_events");
  });

  it("usa a regra aprovada como padrão da indicação", () => {
    expect(defaultReferralCampaign).toMatchObject({ goal: 3, reward_days: 30, benefit: "percent", discount: 15 });
  });
});
