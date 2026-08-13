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
            "linear-gradient(135deg, #0b0f1a 0%, #0f1424 50%, #0b0f1a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "48px 64px",
            border: "2px solid rgba(0, 224, 255, 0.35)",
            borderRadius: "24px",
            background: "rgba(14, 21, 38, 0.72)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="#67e8f9"
            >
              <path d="M11.584 2.376a.75.75 0 0 1 .832 0l9 6a.75.75 0 1 1-.832 1.248L12 3.901 3.416 9.624a.75.75 0 0 1-.832-1.248l9-6Z" />
              <path
                fillRule="evenodd"
                d="M20.25 10.332v9.918H21a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1 0-1.5h.75v-9.918a.75.75 0 0 1 .634-.74A49.109 49.109 0 0 1 12 9c2.59 0 5.134.202 7.616.592a.75.75 0 0 1 .634.74Zm-7.5 2.418a.75.75 0 0 0-1.5 0v6.75a.75.75 0 0 0 1.5 0v-6.75Zm3-.75a.75.75 0 0 1 .75.75v6.75a.75.75 0 0 1-1.5 0v-6.75a.75.75 0 0 1 .75-.75ZM9 12.75a.75.75 0 0 0-1.5 0v6.75a.75.75 0 0 0 1.5 0v-6.75Z"
                clipRule="evenodd"
              />
              <path d="M12 7.875a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" />
            </svg>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontSize: "72px",
                  fontWeight: 700,
                  color: "#f2f8ff",
                  letterSpacing: "-1px",
                }}
              >
                DiagKnow
              </div>
              <div
                style={{
                  fontSize: "28px",
                  color: "#8ca3c5",
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
              color: "#a5f3fc",
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
