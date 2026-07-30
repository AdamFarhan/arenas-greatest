import { describe, expect, it } from "vitest";
import {
  calculateMatchRecord,
  calculateOpponentPerformance,
  calculateScoringComparison,
  filterLegendMatches,
  type AnalyticsMatch,
} from "./analytics";

function match(overrides: Partial<AnalyticsMatch> = {}): AnalyticsMatch {
  return {
    id: "match-1",
    winner: "player",
    player_game_wins: 2,
    opponent_game_wins: 1,
    duration_seconds: 900,
    played_at: "2026-07-01T12:00:00.000Z",
    notes: null,
    playerLegendId: "leblanc",
    playerLegend: "LeBlanc",
    opponentLegendId: "vex",
    opponentLegend: "Vex",
    games: [],
    ...overrides,
  };
}

describe("legend analytics", () => {
  it("scopes matches to a player legend and optional opponent", () => {
    const matches = [
      match(),
      match({ id: "match-2", opponentLegendId: "ahri", opponentLegend: "Ahri" }),
      match({ id: "match-3", playerLegendId: "vex", playerLegend: "Vex" }),
    ];

    expect(filterLegendMatches(matches, "leblanc")).toHaveLength(2);
    expect(filterLegendMatches(matches, "leblanc", "vex")).toEqual([matches[0]]);
  });

  it("calculates wins, losses, ties, and decided-match win rate", () => {
    const record = calculateMatchRecord([
      match({ id: "win", winner: "player" }),
      match({ id: "loss", winner: "opponent" }),
      match({ id: "tie", winner: "tie" }),
    ]);

    expect(record).toEqual({ wins: 1, losses: 1, ties: 1, total: 3, winRate: 50 });
  });

  it("breaks down scoring sources separately for player and opponent", () => {
    const scoring = calculateScoringComparison([
      match({
        games: [{
          id: "game-1",
          game_number: 1,
          starting_player: "player",
          winning_point: 8,
          winner: "player",
          end_reason: "points",
          player_score: 8,
          opponent_score: 5,
          duration_seconds: 600,
          events: [
            { event_type: "holding", player_side: "player", points_delta: 3, resulting_player_score: 3, resulting_opponent_score: 0, created_at: "2026-07-01T12:00:00.000Z" },
            { event_type: "ability", player_side: "opponent", points_delta: 2, resulting_player_score: 3, resulting_opponent_score: 2, created_at: "2026-07-01T12:01:00.000Z" },
          ],
        }],
      }),
    ]);

    expect(scoring).toEqual([
      { name: "Holding", playerPoints: 3, opponentPoints: 0 },
      { name: "Conquering", playerPoints: 0, opponentPoints: 0 },
      { name: "Ability", playerPoints: 0, opponentPoints: 2 },
    ]);
  });

  it("creates a record for each opponent", () => {
    const opponents = calculateOpponentPerformance([
      match({ winner: "opponent" }),
      match({ id: "match-2", opponentLegendId: "ahri", opponentLegend: "Ahri" }),
    ]);

    expect(opponents).toEqual([
      expect.objectContaining({ legendId: "ahri", wins: 1, losses: 0, total: 1 }),
      expect.objectContaining({ legendId: "vex", wins: 0, losses: 1, total: 1 }),
    ]);
  });
});
