import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyPaymentSignature, verifyWebhookSignature } from "./razorpay";

const SECRET = "test_secret";
const sign = (data: string, secret = SECRET) => createHmac("sha256", secret).update(data).digest("hex");

describe("verifyPaymentSignature", () => {
  it("accepts a signature made with our secret over order_id|payment_id", () => {
    expect(verifyPaymentSignature("order_1", "pay_1", sign("order_1|pay_1"), SECRET)).toBe(true);
  });

  it("rejects a signature for a different payment (replay with swapped id)", () => {
    expect(verifyPaymentSignature("order_1", "pay_2", sign("order_1|pay_1"), SECRET)).toBe(false);
  });

  it("rejects a signature made with someone else's secret", () => {
    expect(verifyPaymentSignature("order_1", "pay_1", sign("order_1|pay_1", "attacker"), SECRET)).toBe(false);
  });

  it("rejects garbage and empty secrets", () => {
    expect(verifyPaymentSignature("order_1", "pay_1", "not-a-signature", SECRET)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", sign("order_1|pay_1"), "")).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ event: "payment.captured" });

  it("accepts the exact signed body", () => {
    expect(verifyWebhookSignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(verifyWebhookSignature(body.replace("captured", "failed"), sign(body), SECRET)).toBe(false);
  });
});
