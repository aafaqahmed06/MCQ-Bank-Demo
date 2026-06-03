import LayoutWrapper from "@/components/LayoutWrapper";

export default function ExamPage() {
  return (
    <LayoutWrapper>
      <div className="space-y-6">
        <div className="hud-card fade-in rounded-xl p-8 text-center">
          <h1 className="text-3xl font-bold text-[#f2f8ff]">Exam Simulation</h1>
          <p className="mt-3 text-[#8ca3c5]">
            Timed exam mode will be available here in a future release.
          </p>
        </div>
      </div>
    </LayoutWrapper>
  );
}
