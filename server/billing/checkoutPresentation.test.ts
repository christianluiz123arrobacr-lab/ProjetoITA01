import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
const state=vi.hoisted(()=>({authenticated:true,loading:false,rows:[] as any[],error:null as any}));
vi.mock("@/hooks/useSupabaseAuth",()=>({useSupabaseAuth:()=>({isAuthenticated:state.authenticated,loading:state.loading})}));
vi.mock("@/lib/trpc",()=>({trpc:{billing:{prepaidOffers:{useQuery:()=>({data:state.rows,error:state.error,isLoading:false})},recoverPrepaidCheckout:{useMutation:()=>({isPending:false})}},affiliates:{preview:{useMutation:()=>({isPending:false})}}}}));
import PrepaidOptions from "../../client/src/components/billing/PrepaidOptions";
beforeEach(()=>{
  vi.stubGlobal("window",{location:{search:"?cupom=TESTE"}});
  state.authenticated=true;state.loading=false;state.error=null;
  state.rows=[{months:1,subtotalCents:1190,discountCents:0,referralDiscountCents:119,finalCents:1071}];
});
const render=(disabled=false)=>renderToStaticMarkup(React.createElement(PrepaidOptions,{planSlug:"basic",disabled,onBuy:vi.fn()}));
it("requires account without showing an invented offer",()=>{state.authenticated=false;const html=render();expect(html).toContain("Criar conta");expect(html).toContain("returnTo=");expect(html).not.toContain("Total a pagar");});
it("renders server totals and referral benefit without recomputing price",()=>{const html=render();expect(html).toContain("10,71");expect(html).toContain("Benefício de indicação");expect(html).toContain("sem renovação automática");});
it("keeps recovery available when offers disappear",()=>{state.rows=[];const html=render(true);expect(html).toContain("Recuperar compra anterior</button>");expect(html).toContain("Nenhum período disponível");});
it("renders session loading instead of registration",()=>{state.loading=true;expect(render()).toContain("Verificando sua sessão");expect(render()).not.toContain("Criar conta");});
it("renders offer failure and recovery together",()=>{state.error=new Error("offline");const html=render();expect(html).toContain('role="alert"');expect(html).toContain("Recuperar compra anterior");});
it("does not treat a coupon from URL as validated",()=>{const html=render();expect(html).not.toContain("Cupom aplicado à prévia");expect(html).toMatch(/disabled=""[^>]*>Pagar via Pix/);});

it("never shows cached total or purchase buttons alongside an offer query error",()=>{
 state.error=new Error("timeout");const html=render();
 expect(html).not.toContain("Total a pagar agora");
 expect(html).not.toContain("Pagar via Pix");
 expect(html).toContain("Recuperar compra anterior");
});
