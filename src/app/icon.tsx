import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#f59e0b",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#09090b",
          fontSize: 20,
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
