"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  ChartNoAxesCombined,
  Swords,
  Trophy,
  Timer,
  TrendingUp,
} from "lucide-react";
import { getBrowserSupabase, hasSupabaseConfig } from "@/lib/supabase";
import {
  calculateDashboardStats,
  filterAnalyticsMatches,
  loadAnalyticsMatches,
  type AnalyticsMatch,
  type DashboardFilters,
} from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { DashboardFiltersBar } from "./dashboard-filters";
import { MetricCard } from "./metric-card";
import { WinRateTrendChart } from "./win-rate-trend-chart";
import { MatchupDistributionChart } from "./matchup-distribution-chart";
import { ScoringPatternPanel } from "./scoring-pattern-panel";
import { RecentMatchesPanel } from "./recent-matches-panel";
import { BestLegendPanel } from "./best-legend-panel";
import { CloseGamesPanel } from "./close-games-panel";
import { PlayPatternPanel } from "./play-pattern-panel";
import { AnalyticsPanel } from "./analytics-panel";

export function DashboardShell() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [matches, setMatches] = useState<AnalyticsMatch[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>({
    range: "30d",
    legendId: "all",
  });
  const [filtersStorageReady, setFiltersStorageReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("riftbound-dashboard-filters");
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<DashboardFilters>;
        if (
          isDashboardRange(parsed.range) &&
          typeof parsed.legendId === "string"
        ) {
          setFilters({ range: parsed.range, legendId: parsed.legendId });
        }
      }
    } catch {
      // Ignore unavailable or malformed browser storage and use defaults.
    } finally {
      setFiltersStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (filtersStorageReady) {
      window.localStorage.setItem(
        "riftbound-dashboard-filters",
        JSON.stringify(filters),
      );
    }
  }, [filters, filtersStorageReady]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLoading(false);
      setStatus("Sign in to load your saved matches.");
      return;
    }
    if (!hasSupabaseConfig()) {
      setLoading(false);
      setStatus(
        "Add Supabase environment variables to load your saved matches.",
      );
      return;
    }
    const supabase = getBrowserSupabase(getToken);
    loadAnalyticsMatches(supabase).then((result) => {
      setMatches(result.data);
      setStatus(result.error?.message ?? "");
      setLoading(false);
    });
  }, [getToken, isLoaded, isSignedIn]);

  const filteredMatches = useMemo(
    () => filterAnalyticsMatches(matches, filters),
    [matches, filters],
  );
  const stats = useMemo(
    () => calculateDashboardStats(filteredMatches),
    [filteredMatches],
  );
  const hasData = matches.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <DashboardSidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-5">
          <DashboardHeader>
            <DashboardFiltersBar filters={filters} onChange={setFilters} />
          </DashboardHeader>
          {loading ? (
            <DashboardLoading />
          ) : status ? (
            <DashboardMessage message={status} />
          ) : !hasData ? (
            <DashboardEmpty />
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label="Matches"
                  value={stats.matches}
                  icon={<Swords />}
                />
                <MetricCard
                  label="Match Win Rate"
                  value={`${stats.matchWinRate.toFixed(1)}%`}
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
                  value={
                    stats.averageDurationSeconds === null
                      ? "—"
                      : formatMinutes(stats.averageDurationSeconds)
                  }
                  icon={<Timer />}
                />
              </section>
              <section
                id="insights"
                className="grid scroll-mt-6 gap-4 xl:grid-cols-[1.35fr_1fr]"
              >
                <WinRateTrendChart data={stats.trend} />
                <MatchupDistributionChart
                  data={stats.matchups}
                  total={stats.matches}
                />
              </section>
              <section
                id="recent-matches"
                className="grid scroll-mt-6 gap-4 md:grid-cols-2 xl:grid-cols-[0.8fr_0.9fr_1.15fr_1fr]"
              >
                <div className="grid gap-4">
                  <ScoringPatternPanel data={stats.scoring} />
                  <PlayPatternPanel data={stats.playPattern} />
                </div>
                <AnalyticsPanel title="Calendar">Calendar here</AnalyticsPanel>
                <RecentMatchesPanel matches={stats.recentMatches} />
                <div className="grid gap-4">
                  <BestLegendPanel data={stats.bestLegend} />
                  <CloseGamesPanel data={stats.closeGames} />
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardLoading() {
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
function DashboardEmpty() {
  return (
    <Card>
      <CardContent className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-full bg-accent p-3 text-primary">
          <ChartNoAxesCombined className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-semibold">
          Your performance picture starts here
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Record a few Riftbound matches on the table to unlock trends, matchup
          insights, and scoring patterns.
        </p>
      </CardContent>
    </Card>
  );
}
function DashboardMessage({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex min-h-48 items-center justify-center text-center text-sm text-muted-foreground">
        {message}
      </CardContent>
    </Card>
  );
}
function formatMinutes(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}

function isDashboardRange(value: unknown): value is DashboardFilters["range"] {
  return (
    value === "7d" || value === "30d" || value === "90d" || value === "all"
  );
}
