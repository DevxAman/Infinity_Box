"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

/** Confetti burst + toast, shown once right after a successful payment. */
export default function Celebrate() {
  useEffect(() => {
    // Drop "?new=1" so refreshing the ticket page doesn't celebrate again.
    window.history.replaceState(null, "", window.location.pathname);
    toast.success("Booking confirmed! Enjoy the show 🍿");
    const colors = ["#f43f5e", "#fb923c", "#fde68a", "#ffffff"];
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.3 }, colors });
    const timer = setTimeout(() => {
      confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0 }, colors });
      confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1 }, colors });
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
