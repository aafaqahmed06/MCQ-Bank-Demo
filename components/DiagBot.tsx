import LogoMark from "@/components/LogoMark";

/**
 * DiagBot — the DiagKnow study-mascot.
 *
 * A compact white medical robot in the DiagKnow visual language: teal
 * (eyes, antenna, ears, chest badge) on a white shell with a dark navy
 * face display. Presentational and stateless — all motion is CSS so it is
 * server-renderable and stays performant.
 *
 * Sizes scale coherently from a fixed viewBox; tuned targets are 40/80/140/220.
 * Idle animation (gentle float + blink) is disabled when `animation` is false
 * and under prefers-reduced-motion (see globals.css).
 */

export type DiagBotMood =
  | "neutral"
  | "happy"
  | "thinking"
  | "excited"
  | "concerned"
  | "celebrating";

export type DiagBotProps = {
  mood?: DiagBotMood;
  size?: number;
  animation?: boolean;
  className?: string;
};

const TEAL = "#2fb8ab";
const NAVY = "#0e1a23";
const WHITE = "#ffffff";
const GRAY = "#eef3f5";
const OUTLINE = "#dbe6ea";

/* ── Eyes ──────────────────────────────────────────────────────── */

function Eyes({ mood }: { mood: DiagBotMood }) {
  const stroke = {
    fill: "none",
    stroke: TEAL,
    strokeWidth: 3.8,
    strokeLinecap: "round" as const,
  };

  switch (mood) {
    case "happy":
    case "celebrating":
      return (
        <g {...stroke}>
          <path d="M58 62 Q64 52 70 62" />
          <path d="M90 62 Q96 52 102 62" />
        </g>
      );
    case "thinking":
      return (
        <g fill={TEAL}>
          <circle cx="65" cy="58" r="4.8" />
          <circle cx="97" cy="64" r="4.8" />
        </g>
      );
    case "excited":
      return (
        <g>
          <circle cx="65" cy="62" r="8" fill={TEAL} />
          <circle cx="97" cy="62" r="8" fill={TEAL} />
          <circle cx="68.5" cy="58" r="2.8" fill={WHITE} />
          <circle cx="100.5" cy="58" r="2.8" fill={WHITE} />
        </g>
      );
    case "concerned":
      return (
        <g {...stroke}>
          <path d="M58 58 Q64 65 70 58" />
          <path d="M90 58 Q96 65 102 58" />
        </g>
      );
    default:
      return (
        <g fill={TEAL}>
          <circle cx="65" cy="62" r="5.5" />
          <circle cx="97" cy="62" r="5.5" />
        </g>
      );
  }
}

/* ── Sparkles (celebrating only) ───────────────────────────────── */

function Sparkles() {
  return (
    <g fill={TEAL} opacity="0.8">
      <rect
        x="118"
        y="24"
        width="7"
        height="7"
        rx="1.5"
        transform="rotate(45 121.5 27.5)"
      />
      <rect
        x="32"
        y="30"
        width="6"
        height="6"
        rx="1.2"
        transform="rotate(45 35 33)"
      />
      <rect
        x="128"
        y="56"
        width="5"
        height="5"
        rx="1"
        transform="rotate(45 130.5 58.5)"
      />
      <circle cx="26" cy="68" r="3" />
      <circle cx="136" cy="36" r="2.5" />
    </g>
  );
}

/* ── Arms ──────────────────────────────────────────────────────── */

function Arms({ mood }: { mood: DiagBotMood }) {
  if (mood === "celebrating") {
    return (
      <g>
        <line
          x1="46"
          y1="106"
          x2="28"
          y2="76"
          stroke={WHITE}
          strokeWidth="13"
          strokeLinecap="round"
        />
        <circle cx="25" cy="72" r="7" fill={TEAL} />
        <line
          x1="114"
          y1="106"
          x2="132"
          y2="76"
          stroke={WHITE}
          strokeWidth="13"
          strokeLinecap="round"
        />
        <circle cx="135" cy="72" r="7" fill={TEAL} />
      </g>
    );
  }
  return (
    <g>
      <line
        x1="46"
        y1="106"
        x2="32"
        y2="136"
        stroke={WHITE}
        strokeWidth="13"
        strokeLinecap="round"
      />
      <circle cx="30" cy="140" r="7" fill={TEAL} />
      <line
        x1="114"
        y1="106"
        x2="128"
        y2="136"
        stroke={WHITE}
        strokeWidth="13"
        strokeLinecap="round"
      />
      <circle cx="130" cy="140" r="7" fill={TEAL} />
    </g>
  );
}

/* ── Main component ────────────────────────────────────────────── */

export default function DiagBot({
  mood = "neutral",
  size = 80,
  animation = true,
  className,
}: DiagBotProps) {
  return (
    <svg
      viewBox="0 0 160 180"
      width={size}
      height={Math.round(size * 1.125)}
      aria-hidden="true"
      className={className}
    >
      <g className={animation ? "digibot-idle" : undefined}>
        {mood === "celebrating" && <Sparkles />}

        {/* antenna */}
        <line
          x1="80"
          y1="20"
          x2="80"
          y2="10"
          stroke={OUTLINE}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="80" cy="7" r="5" fill={TEAL} />

        {/* ear modules — large, prominent teal domes */}
        <circle cx="14" cy="68" r="18" fill={TEAL} />
        <circle cx="146" cy="68" r="18" fill={TEAL} />

        {/* head shell — large dome shape */}
        <path
          d="M20 98 L20 60 Q20 18 80 18 Q140 18 140 60 L140 98 Z"
          fill={WHITE}
          stroke={OUTLINE}
          strokeWidth="2"
        />

        {/* face display — very large, dark, rounded */}
        <rect
          x="30"
          y="30"
          width="100"
          height="62"
          rx="16"
          fill={NAVY}
        />

        <g className={animation ? "digibot-eyes" : undefined}>
          <Eyes mood={mood} />
        </g>

        {/* body — small egg shape, tucked under the large head */}
        <path
          d="M44 98 C44 94 48 92 56 92 L104 92 C112 92 116 94 116 98 C116 120 118 134 114 142 C110 152 96 156 80 156 C64 156 50 152 46 142 C42 134 44 120 44 98 Z"
          fill={WHITE}
          stroke={OUTLINE}
          strokeWidth="2"
        />
        <ellipse
          cx="80"
          cy="124"
          rx="24"
          ry="13"
          fill={GRAY}
          opacity="0.6"
        />

        {/* chest badge — DiagKnow symbol, prominent on the small body */}
        <circle cx="80" cy="120" r="20" fill={TEAL} />
        <g transform="translate(64 104)" style={{ color: WHITE }}>
          <LogoMark className="size-8" />
        </g>

        <Arms mood={mood} />

        {/* legs */}
        <line
          x1="66"
          y1="152"
          x2="64"
          y2="162"
          stroke={WHITE}
          strokeWidth="12"
          strokeLinecap="round"
        />
        <line
          x1="94"
          y1="152"
          x2="96"
          y2="162"
          stroke={WHITE}
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* feet */}
        <rect
          x="52"
          y="160"
          width="24"
          height="8"
          rx="4"
          fill={GRAY}
          stroke={OUTLINE}
          strokeWidth="1.5"
        />
        <rect
          x="84"
          y="160"
          width="24"
          height="8"
          rx="4"
          fill={GRAY}
          stroke={OUTLINE}
          strokeWidth="1.5"
        />

        {/* subtle shadow under body */}
        <ellipse
          cx="80"
          cy="172"
          rx="30"
          ry="3"
          fill={NAVY}
          opacity="0.06"
        />
      </g>
    </svg>
  );
}