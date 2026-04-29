import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#f59e0b",
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#09090b",
          fontSize: 110,
          fontWeight: 700,
          fontFamily: "serif",
        }}
      >
        B
      </div>
    ),
    { ...size },
  );
}
