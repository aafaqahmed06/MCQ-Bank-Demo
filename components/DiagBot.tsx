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

/* ── Sparkles (celebrating — restrained) ───────────────────────── */

function Sparkles() {
  return (
    <g fill={TEAL} opacity="0.7">
      <rect
        x="118"
        y="24"
        width="6"
        height="6"
        rx="1.5"
        transform="rotate(45 121 27)"
      />
      <rect
        x="34"
        y="32"
        width="5"
        height="5"
        rx="1"
        transform="rotate(45 36.5 34.5)"
      />
      <circle cx="130" cy="44" r="2.5" />
      <circle cx="28" cy="56" r="2" />
    </g>
  );
}

/* ── Arms ──────────────────────────────────────────────────────── */

function Arms({ mood }: { mood: DiagBotMood }) {
  switch (mood) {
    case "celebrating":
      return (
        <g>
          <line
            x1="46"
            y1="106"
            x2="28"
            y2="78"
            stroke={WHITE}
            strokeWidth="13"
            strokeLinecap="round"
          />
          <circle cx="25" cy="74" r="7" fill={TEAL} />
          <line
            x1="114"
            y1="106"
            x2="132"
            y2="78"
            stroke={WHITE}
            strokeWidth="13"
            strokeLinecap="round"
          />
          <circle cx="135" cy="74" r="7" fill={TEAL} />
        </g>
      );
    case "happy":
      return (
        <g>
          <line
            x1="46"
            y1="106"
            x2="32"
            y2="128"
            stroke={WHITE}
            strokeWidth="13"
            strokeLinecap="round"
          />
          <circle cx="30" cy="132" r="7" fill={TEAL} />
          <line
            x1="114"
            y1="106"
            x2="128"
            y2="132"
            stroke={WHITE}
            strokeWidth="13"
            strokeLinecap="round"
          />
          <circle cx="130" cy="136" r="7" fill={TEAL} />
        </g>
      );
    case "thinking":
      return (
        <g>
          <line
            x1="46"
            y1="106"
            x2="32"
            y2="132"
            stroke={WHITE}
            strokeWidth="13"
            strokeLinecap="round"
          />
          <circle cx="30" cy="136" r="7" fill={TEAL} />
          <line
            x1="114"
            y1="106"
            x2="122"
            y2="82"
            stroke={WHITE}
            strokeWidth="13"
            strokeLinecap="round"
          />
          <circle cx="124" cy="78" r="7" fill={TEAL} />
        </g>
      );
    case "concerned":
      return (
        <g>
          <line
            x1="46"
            y1="106"
            x2="38"
            y2="134"
            stroke={WHITE}
            strokeWidth="13"
            strokeLinecap="round"
          />
          <circle cx="36" cy="138" r="7" fill={TEAL} />
          <line
            x1="114"
            y1="106"
            x2="122"
            y2="134"
            stroke={WHITE}
            strokeWidth="13"
            strokeLinecap="round"
          />
          <circle cx="124" cy="138" r="7" fill={TEAL} />
        </g>
      );
    default:
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
}

/* ── Mood transforms ───────────────────────────────────────────── */

function moodTransform(mood: DiagBotMood) {
  switch (mood) {
    case "happy":
      return "translate(0 -1) rotate(2 80 70)";
    case "thinking":
      return "rotate(-2 80 70)";
    case "excited":
      return "translate(0 -2) rotate(1 80 70)";
    case "concerned":
      return "rotate(-1 80 70)";
    case "celebrating":
      return "translate(0 -2)";
    default:
      return undefined;
  }
}

/* ── Main component ────────────────────────────────────────────── */

export default function DiagBot({
  mood = "neutral",
  size = 80,
  animation = true,
  className,
}: DiagBotProps) {
  const mt = moodTransform(mood);

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

        {/* antenna — 2px offset right for subtle asymmetry */}
        <line
          x1="82"
          y1="20"
          x2="82"
          y2="10"
          stroke={OUTLINE}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="82" cy="7" r="5" fill={TEAL} />

        {/* ear modules */}
        <circle cx="14" cy="68" r="18" fill={TEAL} />
        <circle cx="146" cy="68" r="18" fill={TEAL} />

        {/* head — mood transform applies tilt/lift */}
        <g transform={mt}>
          <path
            d="M20 98 L20 60 Q20 18 80 18 Q140 18 140 60 L140 98 Z"
            fill={WHITE}
            stroke={OUTLINE}
            strokeWidth="2"
          />
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
        </g>

        {/* shoulder line — subtle transition from head to body */}
        <line
          x1="50"
          y1="98"
          x2="110"
          y2="98"
          stroke={OUTLINE}
          strokeWidth="1.2"
          opacity="0.5"
        />

        {/* body — same mood transform as head */}
        <g transform={mt}>
          <path
            d="M44 98 C44 94 48 92 56 92 L104 92 C112 92 116 94 116 98 C116 120 118 134 114 142 C110 152 96 156 80 156 C64 156 50 152 46 142 C42 134 44 120 44 98 Z"
            fill={WHITE}
            stroke={OUTLINE}
            strokeWidth="2"
          />

          {/* chest panel — recessed area for the badge */}
          <rect
            x="60"
            y="104"
            width="40"
            height="36"
            rx="10"
            fill={GRAY}
            stroke={OUTLINE}
            strokeWidth="1"
            opacity="0.7"
          />

          {/* teal badge — sits inside the chest panel */}
          <circle cx="80" cy="120" r="14" fill={TEAL} />
          <g transform="translate(68 108)" style={{ color: WHITE }}>
            <LogoMark className="size-6" />
          </g>

          <Arms mood={mood} />
        </g>

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

        {/* subtle shadow */}
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