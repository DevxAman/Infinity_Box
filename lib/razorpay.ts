import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Minimal Razorpay client using their REST API directly (no SDK needed).
 * Docs: https://razorpay.com/docs/api/orders/
 */

const API = "https://api.razorpay.com/v1";

function authHeader() {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) throw new Error("Razorpay keys are not configured.");
  return `Basic ${Buffer.from(`${keyId}:${secret}`).toString("base64")}`;
}

async function razorpay<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { Authorization: authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Razorpay ${path} failed: ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export function createOrder(input: { amount: number; receipt: string; notes?: Record<string, string> }) {
  return razorpay<{ id: string; amount: number; currency: string }>("/orders", { ...input, currency: "INR" });
}

export function refundPayment(paymentId: string) {
  return razorpay<{ id: string }>(`/payments/${paymentId}/refund`, {});
}

/** Constant-time comparison so attackers can't guess a signature byte by byte. */
function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Checkout success callback: Razorpay signs "order_id|payment_id" with our
 * key secret. Only Razorpay (and we) can produce this signature.
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret = process.env.RAZORPAY_KEY_SECRET ?? "",
) {
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** Webhooks are signed over the raw request body with the webhook secret. */
export function verifyWebhookSignature(rawBody: string, signature: string, secret: string) {
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
