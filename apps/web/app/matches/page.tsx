import { auth } from "@clerk/nextjs/server";
import { MatchHistoryClient } from "@/components/match-history-client";

export default async function MatchesPage() {
  const { isAuthenticated, redirectToSignIn } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn();
  }

  return <MatchHistoryClient />;
}
