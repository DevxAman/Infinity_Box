"use client";

import { motion } from "motion/react";

/**
 * Subtle fade on every page navigation. Opacity only: a transform here would
 * break `position: fixed` elements (like the seat picker's checkout bar).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}
