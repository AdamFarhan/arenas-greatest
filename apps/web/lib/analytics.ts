import { getLegendById } from "@riftbound/legends";
import type { Database } from "@riftbound/db";
import type { SupabaseClient } from "@riftbound/db";

type MatchRow = Database["public"]["Tables"]["matches"]["Row"];
type GameRow = Database["public"]["Tables"]["games"]["Row"];
type EventRow = Database["public"]["Tables"]["score_events"]["Row"];

export type AnalyticsEvent = Pick<
  EventRow,
  | "event_type"
  | "player_side"
  | "points_delta"
  | "resulting_player_score"
  | "resulting_opponent_score"
  | "created_at"
>;
export type AnalyticsGame = Pick<
  GameRow,
  | "id"
  | "game_number"
  | "starting_player"
  | "winning_point"
  | "winner"
  | "end_reason"
  | "player_score"
  | "opponent_score"
  | "duration_seconds"
> & { events: AnalyticsEvent[] };
export type AnalyticsMatch = Pick<
  MatchRow,
  | "id"
  | "winner"
  | "player_game_wins"
  | "opponent_game_wins"
  | "duration_seconds"
  | "played_at"
  | "notes"
> & {
  playerLegendId: string;
  playerLegend: string;
  opponentLegendId: string;
  opponentLegend: string;
  games: AnalyticsGame[];
};

export type DashboardFilters = {
  range: "7d" | "30d" | "90d" | "all";
  legendId: string;
};

export type DashboardStats = {
  matches: number;
  matchWinRate: number;
  gameWinRate: number;
  averageDurationSeconds: number | null;
  trend: Array<{ label: string; winRate: number }>;
  matchups: Array<{ name: string; value: number; color: string }>;
  scoring: Array<{ name: string; value: number; color: string }>;
  recentMatches: AnalyticsMatch[];
  bestLegend: {
    legendId: string;
    name: string;
    winRate: number;
    wins: number;
    losses: number;
  } | null;
  closeGames: { wins: number; losses: number; total: number };
  playPattern: { earlyLead: number; lateRecovery: number } | null;
  activity: Array<{ date: string; count: number }>;
};

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-5)",
  "var(--chart-4)",
  "var(--chart-3)",
];

export async function loadAnalyticsMatches(
  supabase: SupabaseClient,
): Promise<{ data: AnalyticsMatch[]; error: Error | null }> {
  const { data: matches, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .order("played_at", { ascending: false });
  if (matchError) return { data: [], error: new Error(matchError.message) };
  if (!matches?.length) return { data: [], error: null };

  const matchIds = matches.map((match) => match.id);
  const { data: games, error: gameError } = await supabase
    .from("games")
    .select("*")
    .in("match_id", matchIds)
    .order("game_number");
  if (gameError) return { data: [], error: new Error(gameError.message) };

  const gamesByMatch = groupBy(games ?? [], (game) => game.match_id);
  const eventsByGame = new Map<string, EventRow[]>();

  // Keep the per-game lookup used by the detail view before the shared query
  // was introduced. It also keeps each score-event request scoped to one game.
  const eventResults = await Promise.all(
    (games ?? []).map(async (game) => {
      const { data, error } = await supabase
        .from("score_events")
        .select("*")
        .eq("game_id", game.id)
        .order("created_at");

      return { gameId: game.id, data: data ?? [], error };
    }),
  );

  const eventError = eventResults.find((result) => result.error)?.error;
  if (eventError) return { data: [], error: new Error(eventError.message) };

  for (const result of eventResults) {
    eventsByGame.set(result.gameId, result.data);
  }

  return {
    data: matches.map((match) => ({
      ...match,
      playerLegendId: match.player_legend_id,
      playerLegend:
        getLegendById(match.player_legend_id)?.name ?? match.player_legend_id,
      opponentLegendId: match.opponent_legend_id,
      opponentLegend:
        getLegendById(match.opponent_legend_id)?.name ??
        match.opponent_legend_id,
      games: (gamesByMatch.get(match.id) ?? []).map((game) => ({
        ...game,
        events: eventsByGame.get(game.id) ?? [],
      })),
    })),
    error: null,
  };
}

export function filterAnalyticsMatches(
  matches: AnalyticsMatch[],
  filters: DashboardFilters,
) {
  const cutoff =
    filters.range === "all"
      ? null
      : Date.now() - Number(filters.range.replace("d", "")) * 86400000;
  return matches.filter(
    (match) =>
      (!cutoff || new Date(match.played_at).getTime() >= cutoff) &&
      (filters.legendId === "all" || match.playerLegendId === filters.legendId),
  );
}

export function calculateDashboardStats(
  matches: AnalyticsMatch[],
): DashboardStats {
  const decidedMatches = matches.filter((match) => match.winner !== "tie");
  const totalGames = matches.reduce(
    (total, match) => total + match.player_game_wins + match.opponent_game_wins,
    0,
  );
  const playerWins = matches.filter(
    (match) => match.winner === "player",
  ).length;
  const durations = matches
    .map((match) => match.duration_seconds)
    .filter((duration): duration is number => duration !== null);
  const opponentCounts = countBy(matches, (match) => match.opponentLegend);
  const sortedMatchups = [...opponentCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  );
  const displayedMatchups = sortedMatchups.filter(
    ([, value]) => matches.length > 0 && value / matches.length > 0.05,
  );
  const otherMatchCount = sortedMatchups
    .filter(
      ([, value]) => matches.length === 0 || value / matches.length <= 0.05,
    )
    .reduce((total, [, value]) => total + value, 0);
  const matchupData = displayedMatchups.map(([name, value], index) => ({
    name,
    value,
    color: colorAt(index),
  }));
  if (otherMatchCount > 0)
    matchupData.push({
      name: "Other",
      value: otherMatchCount,
      color: "var(--chart-5)",
    });
  const scoringCounts = new Map<string, number>();
  matches
    .flatMap((match) => match.games.flatMap((game) => game.events))
    .forEach((event) =>
      scoringCounts.set(
        event.event_type,
        (scoringCounts.get(event.event_type) ?? 0) +
          Math.max(0, event.points_delta),
      ),
    );
  const closeGames = matches
    .flatMap((match) => match.games)
    .filter((game) => Math.abs(game.player_score - game.opponent_score) <= 3);
  let cumulativeDecided = 0;
  let cumulativeWins = 0;
  const trend = [
    ...groupBy([...matches].reverse(), (match) =>
      localDateKey(match.played_at),
    ),
  ].map(([, dayMatches]) => {
    dayMatches.forEach((match) => {
      if (match.winner === "tie") return;
      cumulativeDecided += 1;
      if (match.winner === "player") cumulativeWins += 1;
    });

    const firstMatch = dayMatches[0];
    return {
      label: firstMatch ? formatDate(firstMatch.played_at) : "",
      winRate: cumulativeDecided
        ? (cumulativeWins / cumulativeDecided) * 100
        : 0,
    };
  });

  const legendStats = new Map<string, { legendId: string; wins: number; losses: number }>();
  matches.forEach((match) => {
    const stats = legendStats.get(match.playerLegend) ?? {
      legendId: match.playerLegendId,
      wins: 0,
      losses: 0,
    };
    match.winner === "player"
      ? stats.wins++
      : match.winner === "opponent"
        ? stats.losses++
        : null;
    legendStats.set(match.playerLegend, stats);
  });
  const bestLegendEntry = [...legendStats.entries()]
    .filter(([, value]) => value.wins + value.losses >= 2)
    .sort(
      (a, b) =>
        b[1].wins / (b[1].wins + b[1].losses) -
        a[1].wins / (a[1].wins + a[1].losses),
    )[0];

  return {
    matches: matches.length,
    matchWinRate: decidedMatches.length
      ? (playerWins / decidedMatches.length) * 100
      : 0,
    gameWinRate: totalGames
      ? (matches.reduce((total, match) => total + match.player_game_wins, 0) /
          totalGames) *
        100
      : 0,
    averageDurationSeconds: durations.length
      ? durations.reduce((total, duration) => total + duration, 0) /
        durations.length
      : null,
    trend,
    matchups: matchupData,
    scoring: [...scoringCounts.entries()]
      .filter(([name]) => name !== "manual_adjustment")
      .map(([name, value], index) => ({
        name: formatLabel(name),
        value,
        color: colorAt(index),
      })),
    recentMatches: matches.slice(0, 5),
    bestLegend: bestLegendEntry
      ? {
          name: bestLegendEntry[0],
          ...bestLegendEntry[1],
          winRate:
            (bestLegendEntry[1].wins /
              (bestLegendEntry[1].wins + bestLegendEntry[1].losses)) *
            100,
        }
      : null,
    closeGames: {
      wins: closeGames.filter((game) => game.winner === "player").length,
      losses: closeGames.filter((game) => game.winner === "opponent").length,
      total: closeGames.length,
    },
    playPattern: buildPlayPattern(matches),
    activity: calculateActivity(matches),
  };
}

export function calculateActivity(matches: AnalyticsMatch[], days = 365) {
  const counts = countBy(matches, (match) => localDateKey(match.played_at));
  const end = startOfDay(new Date());
  const start = addDays(end, -(days - 1));
  const gridStart = startOfWeek(start);
  const gridEnd = endOfWeek(end);
  const activity: Array<{ date: string; count: number }> = [];

  for (
    let date = gridStart;
    date <= gridEnd;
    date = addDays(date, 1)
  ) {
    const key = localDateKey(date.toISOString());
    activity.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return activity;
}

function buildPlayPattern(matches: AnalyticsMatch[]) {
  const games = matches
    .flatMap((match) => match.games)
    .filter((game) => game.events.length >= 2);
  if (!games.length) return null;
  const earlyLead = games.filter((game) => {
    const event = game.events[Math.min(1, game.events.length - 1)];
    return event
      ? event.resulting_player_score > event.resulting_opponent_score
      : false;
  }).length;
  const lateRecovery = games.filter((game) => {
    const event = game.events[0];
    return event
      ? event.resulting_player_score < event.resulting_opponent_score &&
          game.winner === "player"
      : false;
  }).length;
  return {
    earlyLead: (earlyLead / games.length) * 100,
    lateRecovery: (lateRecovery / games.length) * 100,
  };
}

function groupBy<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, T[]>();
  items.forEach((item) => {
    const value = key(item);
    map.set(value, [...(map.get(value) ?? []), item]);
  });
  return map;
}
function countBy<T>(items: T[], key: (item: T) => string) {
  return new Map(
    [...groupBy(items, key)].map(([name, values]) => [name, values.length]),
  );
}
function colorAt(index: number) {
  return (
    chartColors[index % chartColors.length] ??
    chartColors[0] ??
    "var(--chart-1)"
  );
}
function localDateKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}
function startOfWeek(date: Date) {
  return addDays(startOfDay(date), -startOfDay(date).getDay());
}
function endOfWeek(date: Date) {
  return addDays(startOfWeek(date), 6);
}
function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}
function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
function formatLabel(value: string) {
  return value
    .replace("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
export function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;
}
