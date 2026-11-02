import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createReferralTestDatabase } from "./referralDatabase.mjs";
const db = await createReferralTestDatabase();
let checks = 0;
async function one(sql, args = []) {
  return (await db.query(sql, args)).rows[0];
}
function ok(actual, expected, label) {
  assert.deepEqual(actual, expected, label);
  checks++;
  console.log(`PASS ${label}`);
}
async function user(email = randomUUID() + "@example.test", role = "student") {
  const id = randomUUID();
  await db.query("insert into auth.users values($1,$2)", [id, email]);
  await db.query(
    "insert into profiles(id,email,nome,role) values($1,$2,$3,$4)",
    [id, email, "Aluno de teste", role]
  );
  return id;
}
const admin = await user("admin@example.test", "admin");
const legalUser = await user("legal@example.test");
await db.query("select record_legal_acceptance($1,'2026-09-07','2026-09-07','existing_user_update')", [legalUser]);
await db.query("select record_legal_acceptance($1,'2026-09-07','2026-09-07','existing_user_update')", [legalUser]);
ok((await one("select count(*)::int as n from legal_document_acceptances where user_id=$1", [legalUser])).n, 1, "Aceite legal versionado é idempotente");
await db.query("select record_whatsapp_consent($1,'2026-09-07',true,'profile_settings')", [legalUser]);
await db.query("select record_whatsapp_consent($1,'2026-09-07',false,'profile_settings')", [legalUser]);
ok([(await one("select billing_whatsapp_opt_in as value from profiles where id=$1", [legalUser])).value, (await one("select count(*)::int as n from whatsapp_consent_events where user_id=$1", [legalUser])).n], [false, 2], "Consentimento de WhatsApp registra concessão e revogação");
await db.exec("set role authenticated");
await assert.rejects(db.query("select * from legal_document_acceptances"), /permission denied/);
await assert.rejects(db.query("select record_legal_acceptance($1,'x','x','existing_user_update')", [legalUser]), /permission denied/);
checks += 2;
await db.exec("reset role");
const plan = (
  await one(
    "insert into billing_plans(slug,name,price_cents,max_active_subscriptions) values('test','Plano teste',1000,10) returning id"
  )
).id;
async function sub(uid, status = "pending", end = null, reservation = null) {
  return (
    await one(
      "insert into billing_subscriptions(user_id,plan_id,status,gateway,current_period_end,reservation_expires_at) values($1,$2,$3,$4,$5,$6) returning id",
      [uid, plan, status, "mercadopago", end, reservation]
    )
  ).id;
}
async function payment(uid, subscription = null, months = 1) {
  subscription ??= await sub(uid);
  return (
    await one(
      "insert into billing_payments(user_id,subscription_id,original_subscription_id,plan_id,status,gateway,payment_method,amount_cents,access_duration_value,access_duration_unit,metadata) values($1,$2,$2,$3,'pending','mercadopago','mercadopago_card',$4,$5,'months','{\"prepaid_package\":true}') returning id",
      [uid, subscription, plan, 1000 * months, months]
    )
  ).id;
}
async function apply(id) {
  await db.query(
    "select * from apply_approved_prepaid_payment($1,$2,'approved',null,now(),30)",
    [id, "mp-" + id]
  );
  await db.query("select referral_reconcile_payment($1)", [id]);
}
const config = {
  enabled: true,
  title: "Teste",
  description: "Programa de teste",
  goal: 2,
  reward_days: 10,
  benefit: "percent",
  discount: 20,
  extra_days: 0,
  starts_at: null,
  ends_at: null,
  max_rewards: null,
  allow_stacking: false,
  whatsapp_label: "WhatsApp",
  whatsapp_message: "{link}",
};
async function campaign(patch = {}) {
  return (
    await one("select referral_save_campaign($1,$2) as id", [
      admin,
      JSON.stringify({ ...config, ...patch }),
    ])
  ).id;
}
try {
  for (let i = 0; i < 5; i++)
    await sub(await user(), "active", new Date(Date.now() + 86400000));
  let capacity = await one(
    "select * from billing_plan_capacity() where plan_id=$1",
    [plan]
  );
  ok(
    [Number(capacity.used_slots), Number(capacity.remaining_slots)],
    [5, 5],
    "Plano 5/10"
  );
  await sub(await user(), "pending", null, new Date(Date.now() - 86400000));
  await sub(await user(), "active", new Date(Date.now() - 86400000));
  capacity = await one(
    "select * from billing_plan_capacity() where plan_id=$1",
    [plan]
  );
  ok(
    Number(capacity.used_slots),
    5,
    "Pendentes e acessos expirados não ocupam vaga"
  );
  await sub(
    await user(),
    "manual_review",
    null,
    new Date(Date.now() + 86400000)
  );
  capacity = await one(
    "select * from billing_plan_capacity() where plan_id=$1",
    [plan]
  );
  ok(
    [Number(capacity.manual_review_count), Number(capacity.used_slots)],
    [1, 6],
    "Análise manual válida reserva vaga"
  );
  await sub(await user(), "pending", null, new Date(Date.now() + 86400000));
  capacity = await one(
    "select * from billing_plan_capacity() where plan_id=$1",
    [plan]
  );
  ok(Number(capacity.used_slots), 7, "Checkout pendente válido mantém reserva");
  const manualUser = await user();
  await db.query("select * from reserve_manual_billing_checkout($1,$2)", [
    manualUser,
    plan,
  ]);
  await db.query("select * from reserve_manual_billing_checkout($1,$2)", [
    manualUser,
    plan,
  ]);
  ok(
    (
      await one(
        "select count(*)::int as n from billing_subscriptions where user_id=$1",
        [manualUser]
      )
    ).n,
    1,
    "Reserva manual repetida não duplica"
  );
  await db.query(
    "update billing_plans set max_active_subscriptions=8 where id=$1",
    [plan]
  );
  await assert.rejects(
    db.query("select * from reserve_manual_billing_checkout($1,$2)", [
      await user(),
      plan,
    ]),
    /vagas/
  );
  checks++;
  await assert.rejects(
    db.query(
      "select * from reserve_mercadopago_checkout($1,'test@example.test',$2,'pix',now()+interval '30 minutes')",
      [await user(), plan]
    ),
    /vagas/
  );
  checks++;
  await db.query(
    "update billing_plans set max_active_subscriptions=1000 where id=$1",
    [plan]
  );
  const version = await campaign();
  const referrer = await user("person@example.test");
  const code = randomUUID().replaceAll("-", "");
  await db.query("insert into referral_codes values($1,$2,now())", [
    referrer,
    code,
  ]);
  await assert.rejects(
    db.query("select referral_attach($1,$2)", [referrer, code]),
    /Autoindicação/
  );
  checks++;
  const duplicate = await user(" PERSON@example.test ");
  await assert.rejects(
    db.query("select referral_attach($1,$2)", [duplicate, code]),
    /Autoindicação/
  );
  checks++;
  const referred = [];
  for (let i = 0; i < 4; i++) {
    const uid = await user();
    await db.query("select referral_attach($1,$2)", [uid, code]);
    referred.push(uid);
  }
  const p1 = await payment(referred[0]);
  await db.query("select referral_reconcile_payment($1)", [p1]);
  ok(
    (
      await one("select status from student_referrals where referee_id=$1", [
        referred[0],
      ])
    ).status,
    "pending",
    "Pix/cadastro pendente não confirma"
  );
  await db.query("update billing_payments set status='approved' where id=$1", [
    p1,
  ]);
  await db.query("select referral_reconcile_payment($1)", [p1]);
  ok(
    (
      await one("select status from student_referrals where referee_id=$1", [
        referred[0],
      ])
    ).status,
    "pending",
    "Aprovado sem acesso aplicado não confirma"
  );
  await db.query("update billing_payments set status='pending' where id=$1", [
    p1,
  ]);
  ok(
    (await one("select referral_price_payment($1) as cents", [p1])).cents,
    800,
    "Desconto calculado no servidor"
  );
  const secondPending = await payment(referred[0]);
  ok(
    (await one("select referral_price_payment($1) as cents", [secondPending]))
      .cents,
    1000,
    "Segundo checkout não reutiliza benefício"
  );
  await apply(p1);
  await apply(p1);
  ok(
    (
      await one(
        "select count(*)::int as n from student_referrals where status=$1",
        ["confirmed"]
      )
    ).n,
    1,
    "Webhook repetido não duplica confirmação"
  );
  const p2 = await payment(referred[1]);
  await apply(p2);
  let rewards = await one(
    "select count(*)::int as n from referral_rewards where user_id=$1",
    [referrer]
  );
  ok(rewards.n, 1, "Meta libera recompensa única");
  let access = await one(
    "select current_period_end, id from billing_subscriptions where user_id=$1 and status=$2",
    [referrer, "active"]
  );
  assert(access);
  checks++;
  ok(
    (
      await one(
        "select p.slug from billing_subscriptions s join billing_plans p on p.id=s.plan_id where s.id=$1",
        [access.id]
      )
    ).slug,
    "referral-promotional-access",
    "Benefício sem assinatura não ocupa vaga de plano pago"
  );
  const end = access.current_period_end;
  await apply(p2);
  await db.query("select rebuild_mercadopago_access_ledger($1,$2,now())", [
    access.id,
    referrer,
  ]);
  access = await one(
    "select current_period_end from billing_subscriptions where id=$1",
    [access.id]
  );
  ok(
    String(access.current_period_end),
    String(end),
    "Replay e recálculo não duplicam nem perdem dias"
  );
  for (const uid of referred.slice(2)) await apply(await payment(uid));
  ok(
    (
      await one(
        "select count(*)::int as n from referral_rewards where user_id=$1",
        [referrer]
      )
    ).n,
    2,
    "Duas metas concedem duas recompensas"
  );
  const old = await payment(await user());
  await db.query(
    "update billing_payments set status='refunded',refunded_at=now() where id=$1",
    [p2]
  );
  await db.query("select referral_reconcile_payment($1)", [p2]);
  ok(
    (
      await one("select status from student_referrals where referee_id=$1", [
        referred[1],
      ])
    ).status,
    "reversed",
    "Estorno remove confirmação"
  );
  ok(
    (
      await one(
        "select count(*)::int as n from referral_rewards where user_id=$1 and revoked_at is null",
        [referrer]
      )
    ).n,
    1,
    "Estorno revoga a meta que deixou de existir"
  );
  const replacement = await user();
  await db.query("select referral_attach($1,$2)", [replacement, code]);
  const replacementPayment = await payment(replacement);
  await apply(replacementPayment);
  await apply(replacementPayment);
  ok(
    (
      await one(
        "select count(*)::int as n from referral_rewards where user_id=$1",
        [referrer]
      )
    ).n,
    2,
    "Nova meta após estorno reabilita a mesma recompensa sem duplicar"
  );
  ok(
    (
      await one(
        "select count(*)::int as n from referral_rewards where user_id=$1 and revoked_at is null",
        [referrer]
      )
    ).n,
    2,
    "Confirmações válidas restauram a meta sem perder progresso"
  );
  const promoPurchase = await payment(referrer);
  await apply(promoPurchase);
  ok(
    (
      await one(
        "select plan_id from billing_subscriptions where user_id=$1 and status=$2",
        [referrer, "active"]
      )
    ).plan_id,
    plan,
    "Compra após recompensa converte apenas a raiz promocional para o plano pago"
  );
  const historical = await user();
  const monthlySub = await sub(historical);
  const monthly = await payment(historical, monthlySub);
  await apply(monthly);
  const prepaid = await payment(historical, null, 3);
  await apply(prepaid);
  const history = (
    await db.query(
      "select id,access_duration_value,access_duration_unit from billing_payments where user_id=$1 order by created_at,id",
      [historical]
    )
  ).rows;
  ok(
    history.map(p => p.access_duration_value),
    [1, 3],
    "Histórico inclui mensal antigo e pacote de três meses"
  );
  const waiting = await user();
  await db.query("select referral_attach($1,$2)", [waiting, code]);
  const waitingPayment = await payment(waiting);
  await campaign({ enabled: false });
  ok(
    (await one("select referral_price_payment($1) as cents", [waitingPayment]))
      .cents,
    1000,
    "Campanha desativada não concede desconto"
  );
  await apply(waitingPayment);
  ok(
    (
      await one("select status from student_referrals where referee_id=$1", [
        waiting,
      ])
    ).status,
    "pending",
    "Campanha desativada não confirma"
  );
  await campaign({ ends_at: new Date(Date.now() - 86400000).toISOString() });
  const expiredUser = await user();
  ok(
    (await one("select referral_attach($1,$2) as id", [expiredUser, code])).id,
    null,
    "Campanha expirada não atribui benefício"
  );
  await assert.rejects(campaign({ discount: 91 }), /check constraint/);
  checks++;
  await assert.rejects(campaign({ discount: 100 }), /check constraint/);
  checks++;
  await assert.rejects(campaign({ benefit: "fixed", discount: 1001 }), /menor/);
  checks++;
  await campaign({ benefit: "days", extra_days: 5, goal: 1 });
  const bonus = await user();
  await db.query("select referral_attach($1,$2)", [bonus, code]);
  const bonusPayment = await payment(bonus);
  await apply(bonusPayment);
  ok(
    (
      await one(
        "select count(*)::int as n from referral_rewards where user_id=$1 and kind='referee'",
        [bonus]
      )
    ).n,
    1,
    "Dias extras do indicado aplicados uma vez"
  );
  // Existing manual access must be extended exactly, never replaced by the bonus.
  const legacyReferrer = await user();
  const legacyCode = randomUUID().replaceAll("-", "");
  await db.query("insert into referral_codes values($1,$2,now())", [
    legacyReferrer,
    legacyCode,
  ]);
  const legacySub = await sub(
    legacyReferrer,
    "active",
    new Date(Date.now() + 20 * 86400000)
  );
  const legacyEnd = (
    await one(
      "select current_period_end from billing_subscriptions where id=$1",
      [legacySub]
    )
  ).current_period_end;
  const legacyFriend = await user();
  await db.query("select referral_attach($1,$2)", [legacyFriend, legacyCode]);
  await apply(await payment(legacyFriend));
  const extended = (
    await one(
      "select current_period_end from billing_subscriptions where id=$1",
      [legacySub]
    )
  ).current_period_end;
  ok(
    new Date(extended).getTime() - new Date(legacyEnd).getTime(),
    10 * 86400000,
    "Recompensa estende exatamente o vencimento legado"
  );
  const laterPurchase = await payment(legacyReferrer);
  await apply(laterPurchase);
  assert(
    new Date(
      (
        await one(
          "select current_period_end from billing_subscriptions where id=$1",
          [legacySub]
        )
      ).current_period_end
    ) > new Date(extended)
  );
  checks++;
  const row = await one("select referral_dashboard($1,false) as data", [
    legacyReferrer,
  ]);
  ok(
    row.data.referrals[0].name,
    "Novo aluno",
    "Painel não revela nome ou e-mail do indicado"
  );
  // Snapshot: changing the admin goal never alters old rewards or pending terms.
  ok(
    (
      await one(
        "select days from referral_rewards where user_id=$1 order by created_at limit 1",
        [referrer]
      )
    ).days,
    10,
    "Versão nova preserva recompensa anterior"
  );

  // Real checkout regression: R$ 11,00 must become R$ 9,35 for a newly
  // registered referee, while recurring card remains at full price.
  await campaign({ discount: 15, goal: 3, reward_days: 30 });
  const plan11 = (
    await one("insert into billing_plans(slug,name,price_cents,max_active_subscriptions,display_order) values('plano-11','Plano R$ 11',1100,100,99) returning id")
  ).id;
  const referrer11 = await user("referrer-11@example.test");
  const code11 = randomUUID().replaceAll("-", "");
  await db.query("insert into referral_codes values($1,$2,now())", [referrer11, code11]);
  const referee11 = await user("new-referee-11@example.test");
  ok(
    (await one("select referral_queue_attribution($1,$2) as result", [referee11, code11])).result.status,
    "queued",
    "Cadastro grava pendência confiável no backend"
  );
  ok(
    (await one("select referral_finalize_attribution($1) as result", [referee11])).result.status,
    "attached",
    "Login finaliza vínculo persistido de modo idempotente"
  );
  ok(
    (await one("select count(*)::int as n from student_referrals where referee_id=$1", [referee11])).n,
    1,
    "Conta nova possui vínculo em student_referrals"
  );
  const preview11 = (await one("select referral_pricing_preview($1) as result", [referee11])).result;
  const previewPlan11 = preview11.plans.find(item => item.planId === plan11);
  ok([preview11.linked, preview11.eligible, preview11.discountPercent, previewPlan11.pixCents], [true, true, 15, 935], "Prévia autenticada mostra R$ 9,35");

  const sub11 = await sub(referee11);
  const pix11 = (
    await one("insert into billing_payments(user_id,subscription_id,original_subscription_id,plan_id,status,gateway,payment_method,amount_cents,access_duration_value,access_duration_unit,metadata) values($1,$2,$2,$3,'pending','mercadopago','mercadopago_pix',1100,30,'days','{}') returning id", [referee11, sub11, plan11])
  ).id;
  ok((await one("select referral_price_payment($1) as cents", [pix11])).cents, 935, "Pix envia 935 centavos ao gateway");
  ok((await one("select amount_cents as cents from billing_payments where id=$1", [pix11])).cents, 935, "Pagamento local preserva os mesmos 935 centavos");

  const second11 = (
    await one("insert into billing_payments(user_id,subscription_id,original_subscription_id,plan_id,status,gateway,payment_method,amount_cents,access_duration_value,access_duration_unit,metadata) values($1,$2,$2,$3,'pending','mercadopago','mercadopago_pix',1100,30,'days','{}') returning id", [referee11, await sub(referee11), plan11])
  ).id;
  ok((await one("select referral_price_payment($1) as cents", [second11])).cents, 1100, "Segundo pagamento não reutiliza o desconto");

  const recurringUser = await user("recurring-referee@example.test");
  await db.query("select referral_attach($1,$2)", [recurringUser, code11]);
  const recurringPayment = (
    await one("insert into billing_payments(user_id,subscription_id,original_subscription_id,plan_id,status,gateway,payment_method,amount_cents,access_duration_value,access_duration_unit,metadata) values($1,$2,$2,$3,'pending','mercadopago','mercadopago_card',1100,1,'months','{}') returning id", [recurringUser, await sub(recurringUser), plan11])
  ).id;
  ok((await one("select referral_price_payment($1) as cents", [recurringPayment])).cents, 1100, "Cartão mensal recorrente permanece em R$ 11,00");

  const packageUser = await user("package-referee@example.test");
  await db.query("select referral_attach($1,$2)", [packageUser, code11]);
  const packagePayment = (
    await one("insert into billing_payments(user_id,subscription_id,original_subscription_id,plan_id,status,gateway,payment_method,amount_cents,access_duration_value,access_duration_unit,metadata) values($1,$2,$2,$3,'pending','mercadopago','mercadopago_card',3300,3,'months','{\"prepaid_package\":true}') returning id", [packageUser, await sub(packageUser), plan11])
  ).id;
  ok((await one("select referral_price_payment($1) as cents", [packagePayment])).cents, 2805, "Pacote pré-pago de três meses recebe 15%");

  const oldAccount = await user("old-account@example.test");
  await db.query("update auth.users set created_at=now()-interval '3 hours' where id=$1", [oldAccount]);
  ok((await one("select referral_queue_attribution($1,$2) as result", [oldAccount, code11])).result.reason, "account_not_new", "Conta antiga não pode aproveitar link aberto depois");
  ok((await one("select referral_queue_attribution($1,$2) as result", [await user(), "00000000000000000000000000000000"])).result.reason, "invalid_code", "Código inválido é rejeitado");

  await db.exec("set role authenticated");
  await assert.rejects(
    db.query("select referral_reconcile_payment($1)", [p1]),
    /permission denied/
  );
  checks++;
  await assert.rejects(
    db.exec("insert into referral_rewards(user_id) values(gen_random_uuid())"),
    /permission denied/
  );
  checks++;
  await db.exec("reset role");
  await db.exec(
    readFileSync("supabase/rollbacks/202609080001_referral_checkout_fix.sql", "utf8")
  );
  await db.exec(
    readFileSync("supabase/rollbacks/202609060002_referral_program.sql", "utf8")
  );
  await db.exec(
    readFileSync(
      "supabase/rollbacks/202609060001_billing_plan_capacity.sql",
      "utf8"
    )
  );
  checks++;
  console.log(
    `PASS rollback das duas migrations; ${checks} verificações concluídas`
  );
} finally {
  await db.close();
}
