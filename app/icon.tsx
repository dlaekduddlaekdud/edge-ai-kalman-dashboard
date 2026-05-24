import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Next.js App Router 자동 favicon 생성 — /icon.png 로 서빙되고 <head>에 자동 삽입
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111827",
          borderRadius: 7,
          color: "white",
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: "-0.5px",
          fontFamily: "sans-serif",
        }}
      >
        K
      </div>
    ),
    { ...size },
  );
}
