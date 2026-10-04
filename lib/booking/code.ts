import { randomInt } from "node:crypto";

// No 0/O or 1/I/L, so codes are easy to read out at the counter.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Human-friendly ticket code, e.g. "IBX-7K3P9Q". */
export function generateBookingCode() {
  let code = "";
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `IBX-${code}`;
}
