import HomeDashboard from "@/components/HomeDashboard";
import LayoutWrapper from "@/components/LayoutWrapper";
import RequireProfile from "@/components/RequireProfile";

export default function HomePage() {
  return (
    <LayoutWrapper>
      <RequireProfile>
        <HomeDashboard />
      </RequireProfile>
    </LayoutWrapper>
  );
}
