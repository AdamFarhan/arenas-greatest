"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { hasSupabaseConfig } from "@/lib/supabase";
import {
  formatDuration,
  type AnalyticsMatch,
} from "@/lib/analytics";
import { fetchAnalyticsMatches, matchQueryKeys } from "@/lib/queries";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { LegendAvatar } from "@/components/legend-avatar";
import { LegendMatchup } from "@/components/legend-matchup";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LegendMatchGroup = {
  legendId: string;
  legendName: string;
  latestPlayedAt: number;
  matches: AnalyticsMatch[];
};

type TimeMatchGroup = {
  key: string;
  label: string;
  latestPlayedAt: number;
  legends: LegendMatchGroup[];
};

export function MatchHistoryClient() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const canQuery = isLoaded && Boolean(isSignedIn) && hasSupabaseConfig();
  const matchesQuery = useQuery({
    queryKey: matchQueryKeys.all(userId),
    queryFn: () => fetchAnalyticsMatches(getToken),
    enabled: canQuery,
  });
  const matches = matchesQuery.data ?? [];
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
  const hasQueryData = matchesQuery.data !== undefined;
  const groupedMatches = useMemo(() => groupMatches(matches), [matches]);

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <DashboardSidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl space-y-7 p-4 sm:p-6 lg:p-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-black tracking-normal sm:text-4xl">
              Matches
            </h1>
            <p className="text-sm text-muted-foreground">
              A broad look at your latest battles.
            </p>
          </header>

          {status && hasQueryData ? (
            <p className="text-sm text-muted-foreground">
              {status}
              {matchesQuery.isFetching ? " Refreshing..." : ""}
            </p>
          ) : null}
          {loading ? <MatchHistorySkeleton /> : null}
          {!loading && status && !hasQueryData ? (
            <MatchHistoryMessage message={status} />
          ) : null}
          {!loading && !status && groupedMatches.length === 0 ? (
            <MatchHistoryMessage message="No matches saved yet." />
          ) : null}
          {!loading && !status ? (
            <div className="space-y-8">
              {groupedMatches.map((timeGroup) => (
                <section key={timeGroup.key} className="space-y-4">
                  <h2 className="text-2xl font-black tracking-normal">
                    {timeGroup.label}
                  </h2>
                  <div className="space-y-5">
                    {timeGroup.legends.map((legendGroup) => (
                      <div
                        key={`${timeGroup.key}-${legendGroup.legendId}`}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <LegendAvatar
                            legendId={legendGroup.legendId}
                            name={legendGroup.legendName}
                            size="md"
                          />
                          <div className="min-w-0">
                            <h3 className="truncate text-xl font-black tracking-normal">
                              {shortLegendName(legendGroup.legendName)}
                            </h3>
                            <p className="text-xs font-bold uppercase text-muted-foreground">
                              {legendGroup.matches.length}{" "}
                              {legendGroup.matches.length === 1
                                ? "match"
                                : "matches"}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3">
                          {legendGroup.matches.map((match) => (
                            <MatchHistoryCard key={match.id} match={match} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function MatchHistoryCard({ match }: { match: AnalyticsMatch }) {
  const result = getMatchResult(match);

  return (
    <Link
      href={`/matches/${match.id}`}
      aria-label={`Open ${match.playerLegend} versus ${match.opponentLegend}`}
      className="grid min-h-28 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent/30"
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
          {shortLegendName(match.opponentLegend)}
        </p>
        <p className="text-sm font-semibold text-muted-foreground">
          {formatTime(match.played_at)}
          {match.duration_seconds !== null
            ? ` · ${formatDuration(match.duration_seconds)}`
            : ""}
        </p>
      </div>
      <div className="min-w-20 text-right">
        <p className="text-4xl font-black leading-none tracking-normal">
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
    </Link>
  );
}

function MatchHistorySkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-44 animate-pulse rounded-md bg-muted" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-28 animate-pulse rounded-lg border bg-card"
        />
      ))}
    </div>
  );
}

function MatchHistoryMessage({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex min-h-48 items-center justify-center text-center text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}

function groupMatches(matches: AnalyticsMatch[]): TimeMatchGroup[] {
  const timeGroups = new Map<string, TimeMatchGroup>();

  for (const match of matches) {
    const playedAt = new Date(match.played_at);
    const timeKey = getDateKey(playedAt);
    const latestPlayedAt = playedAt.getTime();
    const timeGroup =
      timeGroups.get(timeKey) ??
      ({
        key: timeKey,
        label: getDateLabel(playedAt),
        latestPlayedAt,
        legends: [],
      } satisfies TimeMatchGroup);

    timeGroup.latestPlayedAt = Math.max(
      timeGroup.latestPlayedAt,
      latestPlayedAt,
    );

    let legendGroup = timeGroup.legends.find(
      (group) => group.legendId === match.playerLegendId,
    );
    if (!legendGroup) {
      legendGroup = {
        legendId: match.playerLegendId,
        legendName: match.playerLegend,
        latestPlayedAt,
        matches: [],
      };
      timeGroup.legends.push(legendGroup);
    }

    legendGroup.latestPlayedAt = Math.max(
      legendGroup.latestPlayedAt,
      latestPlayedAt,
    );
    legendGroup.matches.push(match);
    timeGroups.set(timeKey, timeGroup);
  }

  return [...timeGroups.values()]
    .sort((left, right) => right.latestPlayedAt - left.latestPlayedAt)
    .map((timeGroup) => ({
      ...timeGroup,
      legends: timeGroup.legends
        .sort((left, right) => right.latestPlayedAt - left.latestPlayedAt)
        .map((legendGroup) => ({
          ...legendGroup,
          matches: legendGroup.matches.sort(
            (left, right) =>
              new Date(right.played_at).getTime() -
              new Date(left.played_at).getTime(),
          ),
        })),
    }));
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function getDateLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (getDateKey(date) === getDateKey(today)) return "Today";
  if (getDateKey(date) === getDateKey(yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function getMatchResult(match: AnalyticsMatch) {
  if (match.winner === "player") return { kind: "win", label: "Victory" };
  if (match.winner === "opponent") return { kind: "loss", label: "Defeat" };
  return { kind: "tie", label: "Tie" };
}

function shortLegendName(name: string) {
  return name.split(",")[0] ?? name;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
