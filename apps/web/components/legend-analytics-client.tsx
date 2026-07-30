"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock3, Swords, Trophy, TrendingUp } from "lucide-react";
import { LEGENDS, type Legend } from "@riftbound/legends";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  calculateDashboardStats,
  calculateMatchRecord,
  calculateOpponentPerformance,
  calculateScoringComparison,
  filterLegendMatches,
  formatDuration,
} from "@/lib/analytics";
import { fetchAnalyticsMatches, matchQueryKeys } from "@/lib/queries";
import { hasSupabaseConfig } from "@/lib/supabase";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { MetricCard } from "@/components/dashboard/metric-card";
import { WinRateTrendChart } from "@/components/dashboard/win-rate-trend-chart";
import { CloseGamesPanel } from "@/components/dashboard/close-games-panel";
import { PlayPatternPanel } from "@/components/dashboard/play-pattern-panel";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";
import { Card, CardContent } from "@/components/ui/card";
import { LegendMatchup } from "@/components/legend-matchup";
import { LegendAvatar } from "@/components/legend-avatar";
import { LegendScoringComparison } from "@/components/legend-scoring-comparison";
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
  const opponents = useMemo(
    () => calculateOpponentPerformance(matches),
    [matches],
  );
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
                  {/* <p className="mt-2 text-sm text-muted-foreground">
                    {isMatchup
                      ? "Every recorded game in this matchup."
                      : "Every recorded match with this legend."}
                  </p> */}
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
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <CloseGamesPanel data={stats.closeGames} />
                <PlayPatternPanel data={stats.playPattern} />
                {!isMatchup ? (
                  <OpponentPerformancePanel
                    playerLegend={playerLegend}
                    opponents={opponents}
                  />
                ) : null}
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

function OpponentPerformancePanel({
  playerLegend,
  opponents,
}: {
  playerLegend: Legend;
  opponents: ReturnType<typeof calculateOpponentPerformance>;
}) {
  return (
    <AnalyticsPanel
      title="Opponent performance"
      description="Open a matchup for its full analysis"
      className="md:col-span-2 xl:col-span-1"
    >
      <div className="max-h-72 space-y-2 overflow-auto pr-1">
        {opponents.map((opponent) => (
          <Link
            key={opponent.legendId}
            href={`/legends/${playerLegend.id}/${opponent.legendId}`}
            className="flex items-center justify-between gap-3 rounded-md p-2 transition-colors hover:bg-accent"
          >
            <span className="min-w-0 truncate text-sm font-semibold">
              {shortName(opponent.name)}
            </span>
            <span className="shrink-0 text-right text-xs">
              <strong className="text-primary">
                {opponent.winRate === null
                  ? "—"
                  : `${opponent.winRate.toFixed(0)}%`}
              </strong>
              <span className="ml-2 text-muted-foreground">
                {opponent.wins}W–{opponent.losses}L · {opponent.total}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </AnalyticsPanel>
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
        <p className="text-sm text-muted-foreground">Newest matches first.</p>
      </div>
      <div className="grid gap-3">
        {matches.map((match) => (
          <Link
            key={match.id}
            href={`/matches/${match.id}`}
            className="grid min-h-24 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/30"
          >
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
                {match.winner === "player"
                  ? "Victory"
                  : match.winner === "opponent"
                    ? "Defeat"
                    : "Tie"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
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
