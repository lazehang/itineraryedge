import { getBillingWorkerBaseUrl } from "./env";

export type CheckoutSessionResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; code?: string; message: string };

/**
 * Starts Stripe Checkout via Worker B (itineraryedge-billing).
 * Contract: POST {base}/api/checkout/session
 */
export async function createPremiumCheckoutSession(input: {
  itineraryId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
  destinationCountry?: string | null;
}): Promise<CheckoutSessionResult> {
  const base = getBillingWorkerBaseUrl();
  if (!base) {
    return {
      ok: false,
      code: "BILLING_NOT_CONFIGURED",
      message:
        "Paid checkout is not configured. Set NEXT_PUBLIC_BILLING_WORKER_URL or use mock unlock in staging.",
    };
  }

  let response: Response;
  try {
    response = await fetch(`${base}/api/checkout/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itineraryId: input.itineraryId,
        email: input.email,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        destinationCountry: input.destinationCountry ?? null,
      }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, code: "NETWORK", message: "Could not reach billing service." };
  }

  let body: { checkoutUrl?: string; url?: string; error?: string; code?: string };
  try {
    body = (await response.json()) as typeof body;
  } catch {
    return { ok: false, message: "Unexpected response from billing service." };
  }

  if (!response.ok) {
    return {
      ok: false,
      code: body.code,
      message: body.error ?? "Could not start checkout.",
    };
  }

  const checkoutUrl = body.checkoutUrl ?? body.url;
  if (!checkoutUrl) {
    return { ok: false, message: "Billing service did not return a checkout URL." };
  }

  return { ok: true, checkoutUrl };
}
