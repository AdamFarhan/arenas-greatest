import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnalyticsPanel } from "./analytics-panel";
import type { AnalyticsMatch } from "@/lib/analytics";
import { formatDuration } from "@/lib/analytics";

export function RecentMatchesPanel({ matches }: { matches: AnalyticsMatch[] }) { return <AnalyticsPanel title="Recent Matches" description="Your latest recorded games"><div className="divide-y">{matches.length ? matches.map((match) => <Link key={match.id} href={`/matches/${match.id}`} className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1 hover:text-primary"><div className="min-w-0"><p className="truncate text-sm font-medium">vs {match.opponentLegend}</p><p className="text-xs text-muted-foreground">{new Date(match.played_at).toLocaleDateString()} · {formatDuration(match.duration_seconds)}</p></div><Badge className={match.winner === "player" ? "border-primary/30 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"}>{match.winner === "player" ? "Win" : match.winner === "opponent" ? "Loss" : "Tie"}</Badge><ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" /></Link>) : <p className="text-sm text-muted-foreground">No matches in this range.</p>}</div></AnalyticsPanel>; }
