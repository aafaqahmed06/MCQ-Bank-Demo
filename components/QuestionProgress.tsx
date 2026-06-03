"use client";

type QuestionProgressProps = {
  current: number;
  total: number;
  score: number;
};

export default function QuestionProgress({
  current,
  total,
  score,
}: QuestionProgressProps) {
  return (
    <div className="hud-card rounded-xl p-4">
      <div className="flex items-center justify-between gap-4 text-sm text-[#9db1ce]">
        <p>
          Question {current} of {total}
        </p>
        <p>Score: {score}</p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-[#121d36]">
        <div
          className="h-2 rounded-full bg-cyan-300 transition-all duration-300 shadow-[0_0_14px_rgba(0,224,255,0.35)]"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
