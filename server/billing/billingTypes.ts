export type BillingGateway = "manual" | "mercadopago";
export type BillingPaymentMethod = "manual_pix" | "mercadopago_pix" | "mercadopago_card";
export type BillingSubscriptionStatus = "pending" | "active" | "overdue" | "canceled" | "expired" | "refunded" | "failed" | "manual_review" | "trialing";
export type BillingPaymentStatus = "pending" | "approved" | "rejected" | "expired" | "refunded" | "chargeback" | "failed";

export type BillingCapabilities = {
  mode: "mercadopago" | "manual";
  mercadoPagoEnabled: boolean;
  manualPixFallbackEnabled: boolean;
};

export type BillingCheckoutResult = {
  subscriptionId: string;
  status: BillingSubscriptionStatus;
  checkoutUrl: string | null;
  paymentUrl: string | null;
  gateway: BillingGateway;
  paymentMethod: BillingPaymentMethod;
};

export type BillingPixResult = {
  subscriptionId: string;
  paymentId: string;
  status: BillingPaymentStatus;
  amountCents: number;
  currency: string;
  qrCode: string | null;
  qrCodeBase64: string | null;
  expiresAt: string | null;
  paymentUrl: string | null;
};

export type MercadoPagoWebhookPayload = {
  id?: string | number;
  type?: string;
  action?: string;
  data?: { id?: string | number };
  topic?: string;
  resource?: string;
};
