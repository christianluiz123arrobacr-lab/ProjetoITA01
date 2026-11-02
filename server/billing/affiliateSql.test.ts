import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

it("applies coupons, immutable commissions, reversals and idempotent payouts in local SQL (not native MVCC)", async () => {
  const db = new PGlite();
  const one = async (sql: string, args: any[] = []) =>
    (await db.query<any>(sql, args)).rows[0];
  try {
    await db.exec(
      readFileSync("server/billing/tests/referralBootstrap.sql", "utf8")
    );
    for (const file of readdirSync("supabase/migrations")
      .sort()
      .filter(f =>
        /^(20260718|20260728|202608280001|20260906|20260907|20260908)/.test(f)
      ))
      await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    await db.exec(
      "alter table billing_plans add column if not exists requires_legacy_founder_eligibility boolean not null default false; create table billing_user_entitlements(id uuid default gen_random_uuid(),user_id uuid,entitlement_key text);"
    );
    for (const file of [
      "202610280001_billing_plan_duration_configuration.sql",
      "202610280002_prepaid_checkout_recovery.sql",
      "202610290001_affiliate_program.sql",
    ])
      await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    await db.exec(
      readFileSync(
        "supabase/rollbacks/202610290001_affiliate_program.rollback.sql",
        "utf8"
      )
    );
    await db.exec(
      readFileSync(
        "supabase/migrations/202610290001_affiliate_program.sql",
        "utf8"
      )
    );
    const user = async (role = "student") => {
      const id = randomUUID();
      await db.query("insert into auth.users(id,email) values($1,$2)", [
        id,
        `${id}@example.test`,
      ]);
      await db.query(
        "insert into profiles(id,email,nome,role) values($1,$2,'Synthetic',$3)",
        [id, `${id}@example.test`, role]
      );
      return id;
    };
    const admin = await user("admin"),
      editor = await user("editor"),
      aff = await user(),
      other = await user(),
      buyer = await user();
    const write = async (kind: string, payload: any, actor = admin) =>
      (
        await one("select affiliate_admin_write($1,$2,$3::jsonb) v", [
          actor,
          kind,
          JSON.stringify(payload),
        ])
      ).v;
    const f = await write("profile", {
      userId: aff,
      label: "Affiliate",
      active: true,
    });
    const second = await write("profile", {
      userId: other,
      label: "Other",
      active: true,
    });
    await expect(write("settings", { payoutDay: 15 }, editor)).rejects.toThrow(
      "Administrator"
    );
    await expect(
      write("profile", { userId: buyer, label: "No", active: true }, buyer)
    ).rejects.toThrow();
    const plan = (
      await one(
        "insert into billing_plans(slug,name,price_cents) values('affiliate-test','Test',10000) returning id"
      )
    ).id;
    await db.query(
      "insert into billing_plan_durations(plan_id,months,enabled,discount_bps) values($1,1,true,500),($1,6,true,500)",
      [plan]
    );
    const couponInput = {
      affiliateId: f.id,
      code: "TEST",
      active: true,
      discountBps: 500,
      commissionBps: 1000,
      startsAt: null,
      expiresAt: null,
      maxUses: 1,
      planIds: [plan],
    };
    const c = await write("coupon", couponInput);
    const quote = (code = "TEST", uid = buyer, months = 1) =>
      one("select affiliate_coupon_quote($1,'affiliate-test',$2,$3,true) v", [
        uid,
        months,
        code,
      ]);
    await expect(quote()).rejects.toThrow("disabled");
    await expect(
      one(
        "select prepare_affiliate_prepaid_checkout($1,$2,'affiliate-test',1,'pix',$3,'TEST',true)",
        [buyer, randomUUID(), `${buyer}@example.test`]
      )
    ).rejects.toThrow("disabled");
    await db.exec(
      "update affiliate_settings set commercial_enabled=true where id=1"
    ); // Local test ONLY.
    await expect(
      one(
        "select prepare_affiliate_prepaid_checkout($1,$2,'affiliate-test',1,'pix',$3,'TEST',false)",
        [buyer, randomUUID(), `${buyer}@example.test`]
      )
    ).rejects.toThrow("disabled");
    expect((await quote()).v.totalCents).toBe(9025);
    await expect(quote("UNKNOWN")).rejects.toThrow("Invalid");
    await write("coupon", { ...couponInput, id: c.id, active: false });
    await expect(quote()).rejects.toThrow("Invalid");
    await write("coupon", {
      ...couponInput,
      id: c.id,
      expiresAt: "2000-01-01T00:00:00Z",
    });
    await expect(quote()).rejects.toThrow("Invalid");
    await write("coupon", {
      ...couponInput,
      id: c.id,
      startsAt: "2100-01-01T00:00:00Z",
    });
    await expect(quote()).rejects.toThrow("Invalid");
    const otherPlan = (
      await one(
        "insert into billing_plans(slug,name,price_cents) values('other-affiliate-test','Other',10000) returning id"
      )
    ).id;
    await write("coupon", { ...couponInput, id: c.id, planIds: [otherPlan] });
    await expect(quote()).rejects.toThrow("eligible");
    await write("coupon", { ...couponInput, id: c.id });
    await db.query(
      "update billing_plans set requires_legacy_founder_eligibility=true where id=$1",
      [plan]
    );
    await expect(quote()).rejects.toThrow("Founder");
    await db.query(
      "insert into billing_user_entitlements(user_id,entitlement_key) values($1,'legacy_founder_eligible')",
      [buyer]
    );
    expect((await quote()).v.totalCents).toBe(9025);
    await db.query(
      "update billing_plans set requires_legacy_founder_eligibility=false where id=$1",
      [plan]
    );
    const key = randomUUID();
    const prepare = (k = key, uid = buyer, months = 1) =>
      one(
        "select prepare_affiliate_prepaid_checkout($1,$2,'affiliate-test',$3,'pix',$4,'TEST',true) v",
        [uid, k, months, `${uid}@example.test`]
      );
    const a = (await prepare()).v;
    expect(a.snapshot.total_cents).toBe(9025);
    expect(a.snapshot.affiliate.commission_bps).toBe(1000);
    expect((await prepare()).v.id).toBe(a.id);
    expect((await prepare(randomUUID())).v.id).toBe(a.id);
    await db.query("select claim_prepaid_submission($1,$2)", [buyer, a.id]);
    await db.query(
      "select complete_prepaid_submission($1,$2,$3::jsonb,'synthetic-mp')",
      [
        buyer,
        a.id,
        JSON.stringify({
          paymentId: a.payment_id,
          checkoutUrl: "https://www.mercadopago.com.br/synthetic",
        }),
      ]
    );
    const customer2 = await user();
    await expect(prepare(randomUUID(), customer2)).rejects.toThrow("limit");
    await write("coupon", {
      ...couponInput,
      id: c.id,
      discountBps: 9000,
      commissionBps: 9000,
      active: false,
    });
    expect((await prepare()).v.snapshot.total_cents).toBe(9025);
    const reconcile = (refund = 0) =>
      db.query("select affiliate_reconcile_payment($1,$2)", [
        a.payment_id,
        refund,
      ]);
    await reconcile();
    expect(
      (
        await one(
          "select commission_cents from affiliate_sales where payment_id=$1",
          [a.payment_id]
        )
      ).commission_cents
    ).toBe(0);
    await db.query(
      "select * from apply_approved_prepaid_payment($1,'synthetic-mp','approved',null,now(),30)",
      [a.payment_id]
    );
    await Promise.all([reconcile(), reconcile()]); // PGlite serializes: NOT native concurrency evidence.
    expect(
      (
        await one(
          "select commission_cents from affiliate_sales where payment_id=$1",
          [a.payment_id]
        )
      ).commission_cents
    ).toBe(903);
    await expect(
      db.query("select affiliate_reconcile_payment($1,null)", [a.payment_id])
    ).rejects.toThrow("Invalid official amount");
    expect(
      (await one("select count(*)::int n from affiliate_commission_entries")).n
    ).toBe(1);
    const payoutInput = {
      affiliateId: f.id,
      requestKey: randomUUID(),
      amountCents: 903,
      paidOn: "2026-10-29",
      reference: "external-test-transfer",
    };
    await expect(write("payout", payoutInput)).rejects.toThrow("Insufficient");
    await write("release", { paymentId: a.payment_id });
    const [p1, p2] = await Promise.all([
      write("payout", payoutInput),
      write("payout", payoutInput),
    ]);
    expect(p1.id).toBe(p2.id);
    expect(
      (await write("payout", { ...payoutInput, requestKey: randomUUID() })).id
    ).toBe(p1.id);
    await expect(
      write("payout", { ...payoutInput, amountCents: 902 })
    ).rejects.toThrow("conflict");
    await reconcile(1000);
    expect(
      (
        await one(
          "select commission_cents from affiliate_sales where payment_id=$1",
          [a.payment_id]
        )
      ).commission_cents
    ).toBe(803);
    await reconcile(0);
    expect(
      (
        await one(
          "select commission_cents from affiliate_sales where payment_id=$1",
          [a.payment_id]
        )
      ).commission_cents
    ).toBe(803);
    const dash = (actor: string, subject: string | null = null, page = 0) =>
      one("select affiliate_dashboard($1,$2,'2026-01-01','2027-01-01',$3) v", [
        actor,
        subject,
        page,
      ]);
    expect((await dash(aff)).v.paidCents).toBe(903);
    expect((await dash(aff)).v.releasedCents).toBe(803);
    await expect(dash(aff, other)).rejects.toThrow("Forbidden");
    await expect(dash(editor, aff)).rejects.toThrow("Forbidden");
    expect((await dash(editor)).v.affiliate).toBeNull();
    await expect(dash(buyer)).rejects.toThrow("Affiliate required");
    expect(JSON.stringify((await dash(aff)).v)).not.toContain(
      `${buyer}@example.test`
    );
    expect(JSON.stringify((await dash(aff)).v)).not.toContain(buyer);
    expect((await dash(admin, aff)).v.affiliate.id).toBe(f.id);
    // Read-side fixture for historical payouts after refunds: no customer data.
    await db.query(
      "insert into affiliate_payouts(affiliate_id,request_key,amount_cents,paid_on,reference,actor_id) select $1,gen_random_uuid(),1,current_date,'Page transfer '||n,$2 from generate_series(1,25) n",
      [second.id, admin]
    );
    expect((await dash(other)).v.payoutCount).toBe(25);
    expect((await dash(other)).v.payouts).toHaveLength(20);
    expect((await dash(other, null, 1)).v.payouts).toHaveLength(5);
    expect(JSON.stringify((await dash(aff)).v)).not.toContain("Page transfer");
    await db.query(
      "update billing_payments set status='refunded' where id=$1",
      [a.payment_id]
    );
    await reconcile();
    await reconcile();
    expect((await dash(aff)).v.releasedCents).toBe(0);
    expect((await dash(aff)).v.paidCents).toBe(903);
    await expect(
      write("payout", {
        ...payoutInput,
        reference: "different-transfer",
        requestKey: randomUUID(),
        amountCents: 1,
      })
    ).rejects.toThrow("Insufficient");
    expect(
      (
        await one(
          "select sum(delta_cents)::int n from affiliate_commission_entries"
        )
      ).n
    ).toBe(0);
    await write("coupon", { ...couponInput, id: c.id, maxUses: null });
    const multi = (await prepare(randomUUID(), customer2, 6)).v;
    expect(multi.snapshot.total_cents).toBe(54150);
    await db.query(
      "select * from apply_approved_prepaid_payment($1,'synthetic-six','approved',null,now(),30)",
      [multi.payment_id]
    );
    await db.query("select affiliate_reconcile_payment($1,0)", [
      multi.payment_id,
    ]);
    await db.query("select affiliate_reconcile_payment($1,0)", [
      multi.payment_id,
    ]);
    expect(
      (
        await one(
          "select commission_cents from affiliate_sales where payment_id=$1",
          [multi.payment_id]
        )
      ).commission_cents
    ).toBe(5415);
    await db.query(
      "update billing_payments set status='chargeback' where id=$1",
      [multi.payment_id]
    );
    await db.query("select affiliate_reconcile_payment($1,0)", [
      multi.payment_id,
    ]);
    await db.query(
      "update billing_payments set status='approved' where id=$1",
      [multi.payment_id]
    );
    await db.query("select affiliate_reconcile_payment($1,0)", [
      multi.payment_id,
    ]);
    expect(
      (
        await one(
          "select commission_cents from affiliate_sales where payment_id=$1",
          [multi.payment_id]
        )
      ).commission_cents
    ).toBe(0);
    const referred = await user(),
      version = randomUUID();
    await db.query(
      "insert into referral_campaign_versions(id,enabled,title,description,goal,reward_days,benefit,discount,whatsapp_label,whatsapp_message) values($1,true,'Test','Test',1,10,'percent',10,'Test','Test')",
      [version]
    );
    await db.query(
      "insert into student_referrals(referrer_id,referee_id,version_id) values($1,$2,$3)",
      [aff, referred, version]
    );
    await expect(quote("TEST", referred)).rejects.toThrow("cannot combine");
    await write("profile", { userId: aff, label: "Affiliate", active: false });
    await expect(quote("TEST", await user())).rejects.toThrow("Invalid");
    expect((await prepare()).v.snapshot.total_cents).toBe(9025); // Recovery survives deactivation.
    await expect(
      db.exec(
        readFileSync(
          "supabase/rollbacks/202610290001_affiliate_program.rollback.sql",
          "utf8"
        )
      )
    ).rejects.toThrow("Rollback blocked");
    await db.exec("rollback");
    await db.exec(
      readFileSync(
        "supabase/diagnostics/202610290001_affiliate_program.sql",
        "utf8"
      )
    );
    await db.exec("set role authenticated");
    await expect(db.query("select * from affiliate_sales")).rejects.toThrow();
    await expect(write("settings", { payoutDay: 10 })).rejects.toThrow();
    await db.exec("reset role");
    expect(second.id).not.toBe(f.id);
  } catch (e) {
    console.error((e as any).where);
    throw e;
  } finally {
    await db.close();
  }
}, 60000);
