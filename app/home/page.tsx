import HomeDashboard from "@/components/HomeDashboard";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";
import TutorialOverlay from "@/components/TutorialOverlay";
import { getAllModulesWithProgress } from "@/lib/curriculum";

export default async function HomePage() {
  const subjects = await getAllModulesWithProgress();

  return (
    <LayoutWrapper>
      <RequireProfile>
        <TutorialOverlay>
          <HomeDashboard subjects={subjects} />
        </TutorialOverlay>
      </RequireProfile>
    </LayoutWrapper>
  );
}
