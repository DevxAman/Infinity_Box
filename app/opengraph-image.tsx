import { ImageResponse } from "next/og";

export const alt = "InfinityBox: Stream trailers. Book theater seats.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social preview card shown when the site link is shared. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "radial-gradient(circle at 80% 20%, #4c0519 0%, #07070a 55%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 88, fontWeight: 900, letterSpacing: -3 }}>
          Infinity<span style={{ color: "#fb7185" }}>Box</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 40, color: "#d4d4d8" }}>Stream trailers. Book theater seats.</div>
        <div style={{ marginTop: 48, display: "flex", gap: 16, fontSize: 26, color: "#fda4af" }}>
          🎬 Trailers · 🎟️ Live seat maps · 🔒 Razorpay · 📱 QR tickets
        </div>
      </div>
    ),
    size,
  );
}
