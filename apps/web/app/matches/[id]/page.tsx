import { MatchDetailClient } from "@/components/match-detail-client";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <MatchDetailClient id={id} />;
}
