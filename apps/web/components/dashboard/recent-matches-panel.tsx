import Link from "next/link";
import { AnalyticsPanel } from "./analytics-panel";
import type { AnalyticsMatch } from "@/lib/analytics";
import { formatDuration } from "@/lib/analytics";
import { LegendMatchup } from "@/components/legend-matchup";

export function RecentMatchesPanel({ matches }: { matches: AnalyticsMatch[] }) {
  return (
    <AnalyticsPanel
      title="Recent Matches"
      description="Your latest recorded games"
    >
      <div className="divide-y">
        {matches.length ? (
          matches.map((match) => (
            <Link
              key={match.id}
              href={`/matches/${match.id}`}
              className="flex items-center justify-between gap-3 py-3 first:pt-1 last:pb-1 hover:text-primary"
            >
              <div className="flex min-w-0 items-center gap-3">
                <LegendMatchup
                  playerLegendId={match.playerLegendId}
                  playerName={match.playerLegend}
                  opponentLegendId={match.opponentLegendId}
                  opponentName={match.opponentLegend}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    vs {match.opponentLegend}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(match.played_at).toLocaleDateString()} ·{" "}
                    {new Date(match.played_at).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    · {formatDuration(match.duration_seconds)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold leading-none">
                    {match.player_game_wins}-{match.opponent_game_wins}
                  </p>
                  <p className="text-xs text-muted-foreground font-black uppercase">
                    {match.winner === "player" ? (
                      <span className="text-primary">Victory</span>
                    ) : match.winner === "opponent" ? (
                      <span className="text-red-400">Defeat</span>
                    ) : (
                      "Tie"
                    )}
                  </p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No matches in this range.
          </p>
        )}
      </div>
    </AnalyticsPanel>
  );
}
