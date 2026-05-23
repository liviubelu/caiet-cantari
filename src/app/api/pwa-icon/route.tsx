import { ImageResponse } from "next/og"
import { type NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const size = Math.min(512, Math.max(16, parseInt(req.nextUrl.searchParams.get("size") ?? "192")))
  const r = Math.round(size * 0.22)

  // Cross dimensions
  const vW = Math.round(size * 0.1)   // vertical bar width
  const vH = Math.round(size * 0.64)  // vertical bar height
  const hW = Math.round(size * 0.44)  // horizontal bar width
  const hH = Math.round(size * 0.1)   // horizontal bar height

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: "linear-gradient(145deg, #4f46e5, #3730a3)",
          borderRadius: r,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Vertical bar */}
        <div
          style={{
            position: "absolute",
            width: vW,
            height: vH,
            background: "white",
            borderRadius: 999,
            top: Math.round(size * 0.18),
            left: Math.round((size - vW) / 2),
          }}
        />
        {/* Horizontal bar (upper third) */}
        <div
          style={{
            position: "absolute",
            width: hW,
            height: hH,
            background: "white",
            borderRadius: 999,
            top: Math.round(size * 0.32),
            left: Math.round((size - hW) / 2),
          }}
        />
      </div>
    ),
    { width: size, height: size }
  )
}
