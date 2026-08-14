"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ConfettiPiece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
};

function makePieces(): ConfettiPiece[] {
  const colors = ["#2fb8ab", "#6fe0d4", "#7fb4d6", "#28b8a8", "#4cc88a", "#e0a94f"];
  return Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));
}

function Confetti() {
  const [pieces] = useState<ConfettiPiece[]>(makePieces);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.left}%`,
            top: "-10px",
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
            opacity: 0.9,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confettiFall linear forwards;
        }
      `}</style>
    </div>
  );
}

export default function EasterEggPage() {
  const router = useRouter();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const flag = sessionStorage.getItem("diagnknow-easter-egg-shown");
    if (flag) {
      // Deliberate post-hydration sync: reading sessionStorage during render
      // would cause a client/server mismatch, so gate on mount instead.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(false);
      router.replace("/home");
    }
  }, [router]);

  if (!show) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] p-6">
      <Confetti />
      <div className="max-w-lg rounded-2xl border border-cyan-400/30 bg-[var(--bg-card)] p-8 shadow-2xl text-center space-y-6 relative">
        <button
          onClick={() => {
            sessionStorage.setItem("diagnknow-easter-egg-shown", "true");
            router.replace("/home");
          }}
          className="absolute top-2 left-2 size-8 flex items-center justify-center rounded-full text-[var(--text-muted-light)] hover:text-[var(--text-body)] hover:bg-cyan-400/10 active:bg-cyan-400/10 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
        <div className="text-5xl pt-4">🎉</div>
        <p className="text-[var(--text-body)] leading-relaxed whitespace-pre-line">
          Dear User,{"\n\n"}
          Thank you for using DiagKnow, the app that makes MBBS just a bit
          more bearable. If you find any problems, bugs, or faults in the MCQ
          Bank, please feel free to reach out at any time. The problems will
          be addressed immediately.{"\n\n"}
          Happy Usage!{"\n\n"}
          Yours Sincearly,{"\n"}
          Developer DiagKnow{"\n"}
          Aafaq Ahmed
        </p>
        <button
          onClick={() => {
            sessionStorage.setItem("diagnknow-easter-egg-shown", "true");
            router.replace("/home");
          }}
          className="hud-primary-btn rounded-lg px-6 py-2 text-sm font-semibold text-white"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}