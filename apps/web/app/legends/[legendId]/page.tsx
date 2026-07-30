import { auth } from "@clerk/nextjs/server";
import { getLegendById } from "@riftbound/legends";
import { notFound } from "next/navigation";
import { LegendAnalyticsClient } from "@/components/legend-analytics-client";

export default async function LegendPage({ params }: { params: Promise<{ legendId: string }> }) {
  const { isAuthenticated, redirectToSignIn } = await auth();
  if (!isAuthenticated) return redirectToSignIn();
  const { legendId } = await params;
  const legend = getLegendById(legendId);
  if (!legend) notFound();
  return <LegendAnalyticsClient playerLegend={legend} />;
}
