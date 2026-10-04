"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelHold, verifyPayment } from "@/lib/booking/actions";
import { HOLD_MINUTES } from "@/lib/booking/config";
import { formatINR } from "@/lib/utils";

// Minimal typing for Razorpay's checkout.js (loaded from their CDN).
type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open(): void; on(event: "payment.failed", cb: (res: { error: { description?: string } }) => void): void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface Props {
  bookingId: string;
  orderId: string;
  amount: number;
  holdExpiresAt: string;
  showId: string;
  description: string;
  customer: { name: string; email: string };
}

export default function CheckoutPanel({ bookingId, orderId, amount, holdExpiresAt, showId, description, customer }: Props) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "paying" | "verifying">("idle");
  const [cancelling, startCancel] = useTransition();

  // Arriving via the seat picker's redirect keeps the old scroll position.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // Countdown until the seat hold expires.
  useEffect(() => {
    const tick = () => setSecondsLeft(Math.max(0, Math.round((new Date(holdExpiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [holdExpiresAt]);

  const expired = secondsLeft === 0;

  const pay = async () => {
    setStatus("paying");
    if (!(await loadRazorpay()) || !window.Razorpay) {
      toast.error("Couldn't load the payment window. Check your connection and try again.");
      setStatus("idle");
      return;
    }

    const razorpay = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      order_id: orderId,
      amount,
      currency: "INR",
      name: "InfinityBox",
      description,
      prefill: customer,
      theme: { color: "#f43f5e" },
      modal: { ondismiss: () => setStatus("idle") },
      handler: async (response: RazorpayResponse) => {
        setStatus("verifying");
        const result = await verifyPayment({ bookingId, ...response });
        if (result.error) {
          toast.error(result.error);
          setStatus("idle");
          return;
        }
        router.push(`/bookings/${bookingId}?new=1`);
      },
    });
    razorpay.on("payment.failed", (res) => toast.error(res.error.description ?? "Payment failed. Please try again."));
    razorpay.open();
  };

  if (expired) {
    return (
      <div className="card space-y-4 p-6 text-center">
        <p className="text-4xl">⏰</p>
        <h2 className="text-xl font-bold text-white">Your seats were released</h2>
        <p className="text-sm text-muted">Seats are held for {HOLD_MINUTES} minutes. Pick them again; it only takes a moment.</p>
        <Link href={`/book/show/${showId}`} className="btn btn-primary w-full">
          Choose seats again
        </Link>
      </div>
    );
  }

  const minutes = Math.floor((secondsLeft ?? 0) / 60);
  const seconds = (secondsLeft ?? 0) % 60;
  const progress = secondsLeft === null ? 1 : secondsLeft / (HOLD_MINUTES * 60);
  const urgent = secondsLeft !== null && secondsLeft < 120;

  return (
    <div className="card space-y-6 p-6">
      {/* Countdown ring */}
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 flex-none">
          <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90" aria-hidden>
            <circle cx="18" cy="18" r="16" fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke={urgent ? "#ef4444" : "url(#ring)"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${progress * 100.5} 100.5`}
              className="transition-[stroke-dasharray] duration-1000 ease-linear"
            />
            <defs>
              <linearGradient id="ring">
                <stop offset="0" stopColor="#f43f5e" />
                <stop offset="1" stopColor="#fb923c" />
              </linearGradient>
            </defs>
          </svg>
          <span className={`absolute inset-0 grid place-items-center font-mono text-sm font-bold ${urgent ? "text-red-400" : "text-white"}`}>
            {secondsLeft === null ? "--:--" : `${minutes}:${String(seconds).padStart(2, "0")}`}
          </span>
        </div>
        <div>
          <p className="font-semibold text-white">Seats held for you</p>
          <p className="text-sm text-muted">Complete payment before the timer runs out.</p>
        </div>
      </div>

      <button type="button" onClick={pay} disabled={status !== "idle" || cancelling} className="btn btn-primary w-full py-4 text-base">
        {status === "idle" && <>🔒 Pay {formatINR(amount)}</>}
        {status === "paying" && "Opening secure payment…"}
        {status === "verifying" && "Confirming your booking…"}
      </button>

      <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs leading-relaxed text-amber-200/90">
        <p className="mb-1 font-semibold text-amber-300">🧪 Test mode: no real money is charged</p>
        Choose <b>UPI</b> and enter <code className="rounded bg-black/40 px-1">success@razorpay</code>, or use any card from{" "}
        <a
          href="https://razorpay.com/docs/payments/payments/test-card-details/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Razorpay&apos;s test cards
        </a>
        .
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>🔐 Secured by Razorpay</span>
        <button
          type="button"
          disabled={status !== "idle" || cancelling}
          onClick={() => startCancel(() => cancelHold(bookingId))}
          className="underline-offset-4 hover:text-white hover:underline disabled:opacity-50"
        >
          {cancelling ? "Releasing…" : "Cancel & release seats"}
        </button>
      </div>
    </div>
  );
}
