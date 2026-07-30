"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Clock3,
  ExternalLink,
  Swords,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { LEGENDS, type Legend } from "@riftbound/legends";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  calculateDashboardStats,
  calculateMatchRecord,
  calculateScoringComparison,
  filterLegendMatches,
  formatDuration,
} from "@/lib/analytics";
import { fetchAnalyticsMatches, matchQueryKeys } from "@/lib/queries";
import { hasSupabaseConfig } from "@/lib/supabase";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MetricCard } from "@/components/dashboard/metric-card";
import { WinRateTrendChart } from "@/components/dashboard/win-rate-trend-chart";
import { Card, CardContent } from "@/components/ui/card";
import { LegendMatchup } from "@/components/legend-matchup";
import { LegendAvatar } from "@/components/legend-avatar";
import { LegendScoringComparison } from "@/components/legend-scoring-comparison";
import { GameBreakdown } from "@/components/game-breakdown";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LegendAnalyticsClient({
  playerLegend,
  opponentLegend,
}: {
  playerLegend: Legend;
  opponentLegend?: Legend | undefined;
}) {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const canQuery = isLoaded && Boolean(isSignedIn) && hasSupabaseConfig();
  const matchesQuery = useQuery({
    queryKey: matchQueryKeys.all(userId),
    queryFn: () => fetchAnalyticsMatches(getToken),
    enabled: canQuery,
  });
  const allMatches = matchesQuery.data ?? [];
  const matches = useMemo(
    () => filterLegendMatches(allMatches, playerLegend.id, opponentLegend?.id),
    [allMatches, opponentLegend?.id, playerLegend.id],
  );
  const record = useMemo(() => calculateMatchRecord(matches), [matches]);
  const stats = useMemo(() => calculateDashboardStats(matches), [matches]);
  const scoring = useMemo(() => calculateScoringComparison(matches), [matches]);
  const loading = !isLoaded || (canQuery && matchesQuery.isPending);
  const status = !isLoaded
    ? ""
    : !isSignedIn
      ? "Sign in to load your saved matches."
      : !hasSupabaseConfig()
        ? "Add Supabase environment variables to load your saved matches."
        : matchesQuery.error instanceof Error
          ? matchesQuery.error.message
          : "";
  const isMatchup = Boolean(opponentLegend);

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <DashboardSidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
          <header className="rounded-xl border bg-card p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {opponentLegend ? (
                  <LegendMatchup
                    playerLegendId={playerLegend.id}
                    playerName={playerLegend.name}
                    opponentLegendId={opponentLegend.id}
                    opponentName={opponentLegend.name}
                    size="lg"
                  />
                ) : (
                  <LegendAvatar
                    legendId={playerLegend.id}
                    name={playerLegend.name}
                    size="lg"
                  />
                )}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    All-time analysis
                  </p>
                  <h1 className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-3xl font-black tracking-normal sm:text-5xl">
                    <span>{shortName(playerLegend.name)}</span>
                    <span>vs</span>
                    <MatchupSelector
                      playerLegend={playerLegend}
                      opponentLegend={opponentLegend}
                      onChange={(opponentId) =>
                        router.push(
                          opponentId === "all"
                            ? `/legends/${playerLegend.id}`
                            : `/legends/${playerLegend.id}/${opponentId}`,
                        )
                      }
                    />
                  </h1>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl font-black text-primary">
                  {record.winRate === null
                    ? "—"
                    : `${record.winRate.toFixed(1)}%`}
                </p>
                <p className="text-sm text-muted-foreground">
                  match win rate · {record.wins}W–{record.losses}L–{record.ties}
                  T
                </p>
              </div>
            </div>
          </header>

          {loading ? <Loading /> : null}
          {!loading && status ? <Message message={status} /> : null}
          {!loading && !status && matches.length === 0 ? (
            <Message message="No matches recorded for this selection yet." />
          ) : null}
          {!loading && !status && matches.length > 0 ? (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Matches"
                  value={record.total}
                  icon={<Swords />}
                />
                <MetricCard
                  label="Match Win Rate"
                  value={`${record.winRate?.toFixed(1) ?? "—"}%`}
                  icon={<Trophy />}
                  tone="positive"
                />
                <MetricCard
                  label="Game Win Rate"
                  value={`${stats.gameWinRate.toFixed(1)}%`}
                  icon={<TrendingUp />}
                  tone="positive"
                />
                <MetricCard
                  label="Avg. Match Time"
                  value={formatDuration(stats.averageDurationSeconds)}
                  icon={<Clock3 />}
                />
              </section>
              <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
                <WinRateTrendChart data={stats.trend} />
                <LegendScoringComparison data={scoring} />
              </section>
              <MatchHistory matches={matches} />
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function MatchupSelector({
  playerLegend,
  opponentLegend,
  onChange,
}: {
  playerLegend: Legend;
  opponentLegend?: Legend | undefined;
  onChange: (opponentId: string) => void;
}) {
  return (
    <Select value={opponentLegend?.id ?? "all"} onValueChange={onChange}>
      <SelectTrigger
        aria-label="Opponent legend"
        className="h-auto w-auto rounded-none border-0 bg-transparent px-0 text-3xl font-black text-primary underline decoration-2 decoration-primary decoration-wavy underline-offset-4 shadow-none hover:bg-transparent focus:ring-0 [&>svg]:hidden sm:text-5xl italic"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        <SelectItem value="all">All</SelectItem>
        {LEGENDS.filter((legend) => legend.id !== playerLegend.id).map(
          (legend) => (
            <SelectItem key={legend.id} value={legend.id}>
              {shortName(legend.name)}
            </SelectItem>
          ),
        )}
      </SelectContent>
    </Select>
  );
}

function MatchHistory({
  matches,
}: {
  matches: ReturnType<typeof filterLegendMatches>;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-2xl font-black tracking-normal">Match history</h2>
      </div>
      <div className="grid gap-3">
        {matches.map((match) => (
          <MatchHistoryAccordion key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}

function MatchHistoryAccordion({
  match,
}: {
  match: ReturnType<typeof filterLegendMatches>[number];
}) {
  const result =
    match.winner === "player"
      ? "Victory"
      : match.winner === "opponent"
        ? "Defeat"
        : "Tie";

  return (
    <details className="group overflow-hidden rounded-lg border bg-card transition-colors open:border-primary/50 open:bg-secondary">
      <summary className="grid min-h-24 cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-4 p-4 transition-colors hover:bg-accent/30 [&::-webkit-details-marker]:hidden">
        <LegendMatchup
          playerLegendId={match.playerLegendId}
          playerName={match.playerLegend}
          opponentLegendId={match.opponentLegendId}
          opponentName={match.opponentLegend}
          size="lg"
        />
        <div className="min-w-0">
          <p className="truncate text-lg font-black tracking-normal">
            vs {shortName(match.opponentLegend)}
          </p>
          <p className="text-sm font-semibold text-muted-foreground">
            {new Date(match.played_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {match.duration_seconds !== null
              ? ` · ${formatDuration(match.duration_seconds)}`
              : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black leading-none">
            {match.player_game_wins}-{match.opponent_game_wins}
          </p>
          <p
            className={cn(
              "mt-1 text-xs font-bold uppercase",
              match.winner === "player" && "text-primary",
              match.winner === "opponent" && "text-red-400",
              match.winner === "tie" && "text-muted-foreground",
            )}
          >
            {result}
          </p>
        </div>
        <ChevronDown
          className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-5 border-t bg-secondary p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold">Match details</p>
            <p className="text-sm text-muted-foreground">
              {match.games.length} {match.games.length === 1 ? "game" : "games"}{" "}
              · played{" "}
              {new Date(match.played_at).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          <Link
            href={`/matches/${match.id}`}
            className="inline-flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Open full match page <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
        {match.notes && (
          <div className="rounded-md border bg-card p-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Notes: </span>
            {match.notes || "No notes saved for this match."}
          </div>
        )}

        <div className="space-y-3">
          {match.games.length ? (
            match.games.map((game) => (
              <GameBreakdown key={game.id} game={game} className="bg-card" />
            ))
          ) : (
            <p className="rounded-md border bg-card p-3 text-sm text-muted-foreground">
              No games saved for this match.
            </p>
          )}
        </div>
      </div>
    </details>
  );
}

function Loading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="h-36 animate-pulse rounded-lg border bg-card"
        />
      ))}
    </div>
  );
}
function Message({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex min-h-48 items-center justify-center text-center text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}
function shortName(name: string) {
  return name.split(",")[0] ?? name;
}
