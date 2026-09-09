import { describe, expect, it, vi, beforeEach } from "vitest";
const mocks = vi.hoisted(() => ({ from: vi.fn(), query: {} as any }));
vi.mock("../_core/supabaseAdmin.js", () => ({
  supabaseAdmin: { from: mocks.from },
}));
import { getPaymentHistory } from "./paymentHistory.js";
import {
  referralCampaignSchema,
  defaultReferralCampaign,
  referralShareMessage,
} from "../../shared/referralProgram.js";
beforeEach(() => {
  mocks.query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
  };
  for (const key of ["select", "eq", "order"])
    mocks.query[key].mockReturnValue(mocks.query);
  mocks.from.mockReturnValue(mocks.query);
});
describe("histórico financeiro por usuário", () => {
  it("retorna mensal antigo e pré-pago de três meses de assinaturas diferentes", async () => {
    const items = [
      { id: "old", access_duration_value: 1, access_duration_unit: "months" },
      { id: "new", access_duration_value: 3, access_duration_unit: "months" },
    ];
    mocks.query.range.mockResolvedValue({ data: items, count: 2, error: null });
    expect((await getPaymentHistory("student")).items).toEqual(items);
    expect(mocks.from).toHaveBeenCalledWith("billing_payments");
    expect(mocks.query.eq).toHaveBeenCalledTimes(1);
    expect(mocks.query.eq).toHaveBeenCalledWith("user_id", "student");
    expect(mocks.query.select).toHaveBeenCalledWith(
      expect.stringContaining("billing_plans(name)"),
      { count: "exact" }
    );
  });
  it("pagina além dos oito ou cinquenta primeiros pagamentos", async () => {
    mocks.query.range.mockResolvedValue({ data: [], count: 65, error: null });
    expect(await getPaymentHistory("student", 3)).toMatchObject({
      total: 65,
      page: 3,
      pageSize: 20,
    });
    expect(mocks.query.range).toHaveBeenCalledWith(60, 79);
  });
  it("não inventa pagamentos para acesso legado e não esconde erros", async () => {
    mocks.query.range
      .mockResolvedValueOnce({ data: [], count: 0, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "db error" } });
    expect((await getPaymentHistory("legacy")).items).toEqual([]);
    await expect(getPaymentHistory("legacy")).rejects.toThrow(
      "Não foi possível carregar"
    );
  });
});
describe("configuração de indicação no backend", () => {
  it.each([-1, 91, 100, 101])("recusa percentual %i", discount =>
    expect(
      referralCampaignSchema.safeParse({
        ...defaultReferralCampaign,
        benefit: "percent",
        discount,
      }).success
    ).toBe(false)
  );
  it.each([0, 90])("aceita percentual %i", discount =>
    expect(
      referralCampaignSchema.safeParse({
        ...defaultReferralCampaign,
        benefit: "percent",
        discount,
      }).success
    ).toBe(true)
  );
  it("valida metas e validade", () => {
    expect(
      referralCampaignSchema.safeParse({ ...defaultReferralCampaign, goal: 0 })
        .success
    ).toBe(false);
    expect(
      referralCampaignSchema.safeParse({
        ...defaultReferralCampaign,
        starts_at: "2026-02-01T00:00:00Z",
        ends_at: "2026-01-01T00:00:00Z",
      }).success
    ).toBe(false);
  });
  it("substitui placeholders como texto, sem executar templates", () => {
    expect(
      referralCampaignSchema.safeParse({
        ...defaultReferralCampaign,
        whatsapp_message: "{senha}",
      }).success
    ).toBe(false);
    expect(
      referralShareMessage(
        { ...defaultReferralCampaign, whatsapp_message: "{nome}: {link}" },
        "{link}",
        "https://example.test/cadastro?ref=abc"
      )
    ).toBe("{link}: https://example.test/cadastro?ref=abc");
  });
  it("separa o link da pontuação para que o código não seja perdido no compartilhamento", () => {
    expect(
      referralShareMessage(
        { ...defaultReferralCampaign, whatsapp_message: "Acesse {link}. Depois aproveite." },
        "Aluno",
        "https://example.test/cadastro?ref=abc"
      )
    ).toBe("Acesse https://example.test/cadastro?ref=abc Depois aproveite.");
  });
});
