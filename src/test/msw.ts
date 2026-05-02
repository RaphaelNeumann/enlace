import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

export const handlers = {
  resendOk: http.post("https://api.resend.com/emails", () =>
    HttpResponse.json({ id: "re_test_id" }),
  ),
  resendError: http.post("https://api.resend.com/emails", () =>
    HttpResponse.json({ message: "Invalid" }, { status: 422 }),
  ),
  mercadoPagoCreatePreference: http.post(
    "https://api.mercadopago.com/checkout/preferences",
    () =>
      HttpResponse.json({
        id: "pref_test",
        init_point: "https://www.mercadopago.com.br/checkout/test",
        sandbox_init_point: "https://sandbox.mercadopago.com.br/checkout/test",
      }),
  ),
};

export const mswServer = setupServer();
