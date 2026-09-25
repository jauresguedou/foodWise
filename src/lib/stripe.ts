import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey?.startsWith("sk_test_")) {
    throw new Error("Stripe test-mode is not configured.");
  }
  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

export function getAppUrl(): URL {
  const rawUrl = process.env.APP_URL;
  if (!rawUrl) throw new Error("APP_URL is not configured.");
  const appUrl = new URL(rawUrl);
  if (appUrl.protocol !== "https:" && appUrl.hostname !== "localhost") {
    throw new Error("APP_URL must use HTTPS outside localhost.");
  }
  return appUrl;
}