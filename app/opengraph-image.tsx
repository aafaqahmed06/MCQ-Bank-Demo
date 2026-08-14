import { ImageResponse } from "next/og";

export const alt = "DiagKnow | MBBS Practice — MCQ practice for MBBS students";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(145deg, #0c151b 0%, #12232c 55%, #0c151b 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "48px 64px",
            border: "1px solid rgba(163, 190, 203, 0.24)",
            borderRadius: "24px",
            background: "rgba(19, 33, 42, 0.85)",
            boxShadow: "0 18px 48px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
            }}
          >
            <svg width="64" height="64" viewBox="0 0 32 32" fill="none">
              <circle
                cx="16"
                cy="16"
                r="12.5"
                stroke="#2fb8ab"
                strokeWidth="2.4"
              />
              <path
                d="M16 6.5v19M6.5 16h19"
                stroke="#2fb8ab"
                strokeWidth="3.6"
                strokeLinecap="round"
              />
              <circle cx="16" cy="16" r="3.4" fill="#2fb8ab" />
              <circle cx="16" cy="16" r="1.6" fill="#12232c" />
            </svg>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: "72px",
                  fontWeight: 700,
                  color: "#e6f0f4",
                  letterSpacing: "-1px",
                }}
              >
                DiagKnow
              </div>
              <div
                style={{
                  fontSize: "28px",
                  color: "#9bb0ba",
                  marginTop: "4px",
                }}
              >
                MBBS MCQ Practice
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: "36px",
              fontSize: "22px",
              color: "#6fe0d4",
            }}
          >
            Blocks · Modules · Exams · Leaderboard
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}