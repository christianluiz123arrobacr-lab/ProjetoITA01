# Mercado Pago test payer

The Mercado Pago test-account checkout can require the payer address assigned to
the test buyer instead of the application account address. Configure this only
in the **backend** environment used for sandbox testing:

```dotenv
MERCADO_PAGO_TEST_MODE=true
MERCADO_PAGO_TEST_PAYER_EMAIL=buyer-test-address@example.com
```

When test mode is exactly `true`, the configured address is sent as the payer of
card preapprovals and Pix payments. The application account email remains the
owner of the local billing records. A missing or invalid test payer causes the
backend to reject checkout before calling Mercado Pago.

In production, omit `MERCADO_PAGO_TEST_MODE` or set it to `false`. The backend
then sends the validated email from the authenticated user's account, exactly as
before. These variables are private server configuration: never add a `VITE_`
prefix and never expose their values to browser code or logs.
