import type { Legend } from "@riftbound/legends";
import type { AnalyticsMatch } from "@/lib/analytics";

export type MatrixDateRange = "30d" | "60d" | "90d" | "all";

export type WinrateRecord = {
  wins: number;
  losses: number;
  ties: number;
  total: number;
  winRate: number | null;
};

export type WinrateMatrixColumn = {
  legend: Legend;
  totalMatches: number;
};

export type WinrateMatrixRow = {
  legend: Legend;
  summary: WinrateRecord;
  cells: Map<string, WinrateRecord>;
};

export type WinrateMatrix = {
  columns: WinrateMatrixColumn[];
  rows: WinrateMatrixRow[];
};

type MutableRecord = Omit<WinrateRecord, "total" | "winRate">;

export function filterMatrixMatches(
  matches: AnalyticsMatch[],
  range: MatrixDateRange,
  now = Date.now(),
) {
  if (range === "all") return matches;

  const cutoff = now - Number(range.replace("d", "")) * 86400000;
  return matches.filter((match) => new Date(match.played_at).getTime() >= cutoff);
}

export function buildWinrateMatrix(
  matches: AnalyticsMatch[],
  legends: Legend[],
): WinrateMatrix {
  const playerRecords = new Map<string, MutableRecord>();
  const opponentCounts = new Map<string, number>();
  const matchupRecords = new Map<string, Map<string, MutableRecord>>();

  for (const match of matches) {
    const playerRecord = getMutableRecord(playerRecords, match.playerLegendId);
    const matchupRecord = getMutableRecord(
      getMatchupRecords(matchupRecords, match.playerLegendId),
      match.opponentLegendId,
    );

    addMatchResult(playerRecord, match.winner);
    addMatchResult(matchupRecord, match.winner);
    opponentCounts.set(
      match.opponentLegendId,
      (opponentCounts.get(match.opponentLegendId) ?? 0) + 1,
    );
  }

  const rows = legends
    .map((legend) => ({
      legend,
      summary: toWinrateRecord(playerRecords.get(legend.id)),
      cells: new Map(
        [...(matchupRecords.get(legend.id) ?? new Map()).entries()].map(
          ([opponentId, record]) => [opponentId, toWinrateRecord(record)],
        ),
      ),
    }))
    .sort((left, right) => compareLegends(left.summary.total, left.legend, right.summary.total, right.legend));

  const columns = legends
    .map((legend) => ({
      legend,
      totalMatches: opponentCounts.get(legend.id) ?? 0,
    }))
    .sort((left, right) => compareLegends(left.totalMatches, left.legend, right.totalMatches, right.legend));

  return { rows, columns };
}

export function emptyWinrateRecord(): WinrateRecord {
  return { wins: 0, losses: 0, ties: 0, total: 0, winRate: null };
}

function getMatchupRecords(
  records: Map<string, Map<string, MutableRecord>>,
  playerLegendId: string,
) {
  const existing = records.get(playerLegendId);
  if (existing) return existing;

  const next = new Map<string, MutableRecord>();
  records.set(playerLegendId, next);
  return next;
}

function getMutableRecord(records: Map<string, MutableRecord>, legendId: string) {
  const existing = records.get(legendId);
  if (existing) return existing;

  const next = { wins: 0, losses: 0, ties: 0 };
  records.set(legendId, next);
  return next;
}

function addMatchResult(record: MutableRecord, winner: AnalyticsMatch["winner"]) {
  if (winner === "player") record.wins += 1;
  else if (winner === "opponent") record.losses += 1;
  else record.ties += 1;
}

function toWinrateRecord(record: MutableRecord | undefined): WinrateRecord {
  if (!record) return emptyWinrateRecord();

  const total = record.wins + record.losses + record.ties;
  const decidedMatches = record.wins + record.losses;
  return {
    ...record,
    total,
    winRate: decidedMatches ? record.wins / decidedMatches : null,
  };
}

function compareLegends(
  leftCount: number,
  leftLegend: Legend,
  rightCount: number,
  rightLegend: Legend,
) {
  return rightCount - leftCount || leftLegend.name.localeCompare(rightLegend.name);
}
