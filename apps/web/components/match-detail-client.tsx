"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, StickyNote, Trophy } from "lucide-react";
import { demoMatches, type WebMatch } from "@/lib/demo-data";
import { hasSupabaseConfig } from "@/lib/supabase";
import { formatDuration } from "@/lib/analytics";
import {
  fetchAnalyticsMatches,
  findAnalyticsMatch,
  matchQueryKeys,
} from "@/lib/queries";
import type { AnalyticsMatch } from "@/lib/analytics";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LegendMatchup } from "@/components/legend-matchup";
import { GameBreakdown } from "@/components/game-breakdown";
import { cn } from "@/lib/utils";

export function MatchDetailClient({ id }: { id: string }) {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const canQuery = isLoaded && Boolean(isSignedIn) && hasSupabaseConfig();
  const matchesQuery = useQuery({
    queryKey: matchQueryKeys.all(userId),
    queryFn: () => fetchAnalyticsMatches(getToken),
    enabled: canQuery,
  });
  const cloudMatch = toWebMatch(findAnalyticsMatch(matchesQuery.data, id));
  const match = cloudMatch ?? demoMatches.find((item) => item.id === id);
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

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <DashboardSidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
          <Link
            href="/matches"
            className="inline-flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Matches
          </Link>

          {loading ? (
            <MatchDetailSkeleton />
          ) : !match ? (
            <Card>
              <CardHeader>
                <CardTitle>Match not found</CardTitle>
                <CardDescription>
                  {status || "No match exists with this id."}
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <MatchHero match={match} />
              {status || matchesQuery.isFetching ? (
                <p className="text-sm text-muted-foreground">
                  {status || "Refreshing..."}
                </p>
              ) : null}

              <section className="grid gap-4 md:grid-cols-3">
                <MetricCard
                  label="Result"
                  value={`${getMatchResultLabel(match.winner)} ${match.player_game_wins}-${match.opponent_game_wins}`}
                  icon={<Trophy className="h-5 w-5" />}
                  tone={match.winner}
                />
                <MetricCard
                  label="Match Time"
                  value={new Date(match.played_at).toLocaleTimeString(
                    undefined,
                    {
                      hour: "numeric",
                      minute: "2-digit",
                    },
                  )}
                  description={new Date(match.played_at).toLocaleDateString()}
                  icon={<Clock className="h-5 w-5" />}
                />
                <MetricCard
                  label="Duration"
                  value={formatDuration(match.duration_seconds ?? null)}
                  description={`${match.games.length} ${match.games.length === 1 ? "game" : "games"}`}
                  icon={<Clock className="h-5 w-5" />}
                />
              </section>

              <Card>
                <CardHeader className="gap-2">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Notes</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-muted-foreground">
                  {match.notes || "No notes saved for this match."}
                </CardContent>
              </Card>

              <section className="grid gap-4">
                <div>
                  <h2 className="text-xl font-black tracking-normal">
                    Game History
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Scoring history, starting player, win condition, and game
                    time.
                  </p>
                </div>
                {match.games.length ? (
                  match.games.map((game) => (
                    <GameBreakdown key={game.game_number} game={game} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-6 text-sm text-muted-foreground">
                      No games saved for this match.
                    </CardContent>
                  </Card>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function MatchDetailSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="h-36 animate-pulse rounded-lg border bg-card" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-lg border bg-card"
          />
        ))}
      </div>
      <div className="h-32 animate-pulse rounded-lg border bg-card" />
      <div className="h-72 animate-pulse rounded-lg border bg-card" />
    </div>
  );
}

function toWebMatch(match: AnalyticsMatch | undefined): WebMatch | undefined {
  if (!match) return undefined;

  return {
    id: match.id,
    played_at: match.played_at,
    winner: match.winner,
    player_game_wins: match.player_game_wins,
    opponent_game_wins: match.opponent_game_wins,
    duration_seconds: match.duration_seconds,
    player_legend: match.playerLegend,
    player_legend_id: match.playerLegendId,
    opponent_legend: match.opponentLegend,
    opponent_legend_id: match.opponentLegendId,
    notes: match.notes ?? "",
    games: match.games.map((game) => ({
      game_number: game.game_number,
      starting_player: game.starting_player,
      winning_point: game.winning_point,
      winner: game.winner,
      end_reason: game.end_reason,
      player_score: game.player_score,
      opponent_score: game.opponent_score,
      duration_seconds: game.duration_seconds,
      events: game.events.map((event) => ({
        event_type: event.event_type,
        player_side: event.player_side,
        points_delta: event.points_delta,
        resulting_player_score: event.resulting_player_score,
        resulting_opponent_score: event.resulting_opponent_score,
        created_at: event.created_at,
      })),
    })),
  };
}

function MatchHero({ match }: { match: WebMatch }) {
  const result = getMatchResult(match.winner);

  return (
    <header className="rounded-lg border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <LegendMatchup
            playerLegendId={match.player_legend_id}
            playerName={match.player_legend}
            opponentLegendId={match.opponent_legend_id}
            opponentName={match.opponent_legend}
            size="lg"
          />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black tracking-normal sm:text-3xl">
              {shortLegendName(match.player_legend)} vs{" "}
              {shortLegendName(match.opponent_legend)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date(match.played_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-5xl font-black leading-none tracking-normal">
            {match.player_game_wins}-{match.opponent_game_wins}
          </p>
          <p
            className={cn(
              "mt-2 text-sm font-black uppercase",
              result.kind === "win" && "text-primary",
              result.kind === "loss" && "text-red-400",
              result.kind === "tie" && "text-muted-foreground",
            )}
          >
            {result.label}
          </p>
        </div>
      </div>
    </header>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon,
  tone,
}: {
  label: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  tone?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle
            className={cn(
              "mt-2",
              tone === "player" && "text-primary",
              tone === "opponent" && "text-red-400",
            )}
          >
            {value}
          </CardTitle>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <div className="rounded-md bg-accent p-2 text-primary">{icon}</div>
      </CardHeader>
    </Card>
  );
}

function getMatchResultLabel(winner: string) {
  if (winner === "player") return "Win";
  if (winner === "opponent") return "Loss";
  return "Tie";
}

function getMatchResult(winner: string) {
  if (winner === "player") return { kind: "win", label: "Victory" };
  if (winner === "opponent") return { kind: "loss", label: "Defeat" };
  return { kind: "tie", label: "Tie" };
}

function shortLegendName(name: string) {
  return name.split(",")[0] ?? name;
}
