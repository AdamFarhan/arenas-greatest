import { auth } from "@clerk/nextjs/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function HomePage() {
  const { isAuthenticated, redirectToSignIn } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn();
  }

  return <DashboardShell />;
}
