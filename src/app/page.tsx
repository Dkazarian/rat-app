import { DashboardPage } from "@/components/dashboard-page/dashboard-page";
import { dashboardFixtures } from "@/fixtures/dashboard-fixtures";

export default function Home() {
  return <DashboardPage fixture={dashboardFixtures.empty} />;
}
