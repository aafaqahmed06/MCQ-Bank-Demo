import HomeDashboard from "@/components/HomeDashboard";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import TutorialOverlay from "@/components/TutorialOverlay";

export default function HomePage() {
  return (
    <LayoutWrapper>
      <RequireProfile>
        <TutorialOverlay>
          <HomeDashboard />
        </TutorialOverlay>
      </RequireProfile>
    </LayoutWrapper>
  );
}
