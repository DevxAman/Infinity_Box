"use client";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-glass">
      🖨️ Print / Save PDF
    </button>
  );
}
