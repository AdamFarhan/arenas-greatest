"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { Grid2X2 } from "lucide-react";
import { LEGENDS } from "@riftbound/legends";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { fetchAnalyticsMatches, matchQueryKeys } from "@/lib/queries";
import { hasSupabaseConfig } from "@/lib/supabase";
import {
  buildWinrateMatrix,
  filterMatrixMatches,
  type MatrixDateRange,
} from "@/lib/winrate-matrix";
import { MatrixDateFilter } from "./matrix-date-filter";
import { WinrateMatrixTable } from "./winrate-matrix-table";

const storageKey = "riftbound-winrate-matrix-range";

export function WinrateMatrixClient() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const [range, setRange] = useState<MatrixDateRange>("30d");
  const [storageReady, setStorageReady] = useState(false);
  const canQuery = isLoaded && Boolean(isSignedIn) && hasSupabaseConfig();
  const matchesQuery = useQuery({
    queryKey: matchQueryKeys.all(userId),
    queryFn: () => fetchAnalyticsMatches(getToken),
    enabled: canQuery,
  });

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (isMatrixDateRange(stored)) setRange(stored);
    } catch {
      // Continue with the default range when storage is unavailable.
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (storageReady) window.localStorage.setItem(storageKey, range);
  }, [range, storageReady]);

  const matches = matchesQuery.data ?? [];
  const filteredMatches = useMemo(() => filterMatrixMatches(matches, range), [matches, range]);
  const matrix = useMemo(() => buildWinrateMatrix(filteredMatches, LEGENDS), [filteredMatches]);
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

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <DashboardSidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1800px] space-y-6 p-4 sm:p-6 lg:p-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-normal sm:text-4xl">Winrate Matrix</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Matchup performance across every legend.
              </p>
            </div>
            <MatrixDateFilter value={range} onChange={setRange} />
          </header>

          {status && hasQueryData ? (
            <p className="text-sm text-muted-foreground">
              {status}{matchesQuery.isFetching ? " Refreshing..." : ""}
            </p>
          ) : null}
          {loading ? <MatrixSkeleton /> : null}
          {!loading && status && !hasQueryData ? <MatrixMessage message={status} /> : null}
          {!loading && !status && matches.length === 0 ? (
            <MatrixMessage message="Record matches to build your winrate matrix." />
          ) : null}
          {!loading && !status && matches.length > 0 ? (
            <>
              {filteredMatches.length === 0 ? (
                <MatrixMessage message="No matches fall within this date range." />
              ) : null}
              <WinrateMatrixTable matrix={matrix} />
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function MatrixSkeleton() {
  return <div className="h-[620px] animate-pulse rounded-lg border bg-card" />;
}

function MatrixMessage({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-full bg-accent p-3 text-primary"><Grid2X2 className="h-6 w-6" /></div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

function isMatrixDateRange(value: string | null): value is MatrixDateRange {
  return value === "30d" || value === "60d" || value === "90d" || value === "all";
}
