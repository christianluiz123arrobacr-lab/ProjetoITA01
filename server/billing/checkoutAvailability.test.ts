import {expect,it} from "vitest";
import {showPlanForCheckout,selectCurrentOffer} from "../../client/src/lib/checkoutPresentation";
const founder={requiresLegacyFounderEligibility:true,legacyFounderEligible:false,hasValidInvite:false};
it("never displays founder before authenticated canonical eligibility is resolved",()=>{
 expect(showPlanForCheckout({...founder,legacyFounderEligible:true},false,false)).toBe(false);
 expect(showPlanForCheckout({...founder,legacyFounderEligible:true},true,true)).toBe(false);
 expect(showPlanForCheckout(founder,true,false)).toBe(false);
});
it("accepts canonical entitlement or invitation without extending eligibility",()=>{
 expect(showPlanForCheckout({...founder,legacyFounderEligible:true},true,false)).toBe(true);
 expect(showPlanForCheckout({...founder,hasValidInvite:true},true,false)).toBe(true);
 expect(showPlanForCheckout({...founder,requiresLegacyFounderEligibility:false},false,true)).toBe(true);
});
it("hides cached prices on failure and never switches a removed selected period",()=>{
 const rows=[{months:1,total:1190},{months:3,total:3570}];
 expect(selectCurrentOffer(rows,3,true)).toBeUndefined();
 expect(selectCurrentOffer(rows,6,false)).toBeUndefined();
 expect(selectCurrentOffer(rows,null,false)).toEqual(rows[0]);
 expect(selectCurrentOffer(rows,3,false)).toEqual(rows[1]);
});
