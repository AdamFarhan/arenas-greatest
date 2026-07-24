export type WebScoreEvent = {
  event_type: string;
  player_side: string;
  points_delta: number;
  resulting_player_score: number;
  resulting_opponent_score: number;
  created_at?: string;
};

export type WebGame = {
  game_number: number;
  starting_player: string;
  winning_point: number;
  winner: string;
  end_reason?: string;
  player_score: number;
  opponent_score: number;
  duration_seconds?: number | null;
  events: WebScoreEvent[];
};

export type WebMatch = {
  id: string;
  played_at: string;
  winner: string;
  player_game_wins: number;
  opponent_game_wins: number;
  player_legend: string;
  player_legend_id: string;
  opponent_legend: string;
  opponent_legend_id: string;
  duration_seconds?: number | null;
  notes: string;
  games: WebGame[];
};

export const demoMatches: WebMatch[] = [
  {
    id: "demo-1",
    played_at: "2026-06-06T14:30:00.000Z",
    winner: "player",
    player_game_wins: 2,
    opponent_game_wins: 1,
    player_legend: "Ahri",
    player_legend_id: "ahri-nine-tailed-fox",
    opponent_legend: "Darius",
    opponent_legend_id: "darius-hand-of-noxus",
    duration_seconds: 2340,
    notes: "Game 2 slipped after an early ability point. Holding triggers carried game 3.",
    games: [
      {
        game_number: 1,
        starting_player: "player",
        winning_point: 8,
        winner: "player",
        end_reason: "points",
        player_score: 8,
        opponent_score: 5,
        duration_seconds: 720,
        events: [
          { event_type: "holding", player_side: "player", points_delta: 1, resulting_player_score: 1, resulting_opponent_score: 0, created_at: "2026-06-06T14:34:00.000Z" },
          { event_type: "ability", player_side: "opponent", points_delta: 1, resulting_player_score: 1, resulting_opponent_score: 1, created_at: "2026-06-06T14:38:00.000Z" }
        ]
      },
      {
        game_number: 2,
        starting_player: "opponent",
        winning_point: 9,
        winner: "opponent",
        end_reason: "points",
        player_score: 7,
        opponent_score: 9,
        duration_seconds: 840,
        events: []
      },
      {
        game_number: 3,
        starting_player: "player",
        winning_point: 8,
        winner: "player",
        end_reason: "points",
        player_score: 8,
        opponent_score: 6,
        duration_seconds: 780,
        events: []
      }
    ]
  }
] as const;
