import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PDFpro — All Your PDF Tools in One Place";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0b0b13 0%, #1a1030 55%, #2a0f2e 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "linear-gradient(135deg,#6366f1,#a855f7,#ec4899)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 52,
            }}
          >
            📄
          </div>
          <div style={{ fontSize: 44, fontWeight: 700 }}>PDFpro</div>
        </div>
        <div style={{ fontSize: 78, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
          All your PDF tools in one place.
        </div>
        <div style={{ fontSize: 34, color: "#c4b5fd", marginTop: 28, maxWidth: 860 }}>
          50+ tools that run entirely in your browser. 100% private — no uploads.
        </div>
      </div>
    ),
    { ...size }
  );
}
