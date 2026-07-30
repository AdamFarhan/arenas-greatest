import { auth } from "@clerk/nextjs/server";
import { getLegendById } from "@riftbound/legends";
import { notFound } from "next/navigation";
import { LegendAnalyticsClient } from "@/components/legend-analytics-client";

export default async function MatchupPage({ params }: { params: Promise<{ legendId: string; opponentId: string }> }) {
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();
  const { legendId, opponentId } = await params;
  const playerLegend = getLegendById(legendId);
  const opponentLegend = getLegendById(opponentId);
  if (!playerLegend || !opponentLegend) notFound();
  return <LegendAnalyticsClient playerLegend={playerLegend} opponentLegend={opponentLegend} />;
}
