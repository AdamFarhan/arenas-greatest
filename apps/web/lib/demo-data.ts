export type WebScoreEvent = {
  event_type: string;
  player_side: string;
  points_delta: number;
  resulting_player_score: number;
  resulting_opponent_score: number;
};

export type WebGame = {
  game_number: number;
  starting_player: string;
  winning_point: number;
  winner: string;
  player_score: number;
  opponent_score: number;
  events: WebScoreEvent[];
};

export type WebMatch = {
  id: string;
  played_at: string;
  winner: string;
  player_game_wins: number;
  opponent_game_wins: number;
  player_legend: string;
  opponent_legend: string;
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
    opponent_legend: "Darius",
    notes: "Game 2 slipped after an early ability point. Holding triggers carried game 3.",
    games: [
      {
        game_number: 1,
        starting_player: "player",
        winning_point: 8,
        winner: "player",
        player_score: 8,
        opponent_score: 5,
        events: [
          { event_type: "holding", player_side: "player", points_delta: 1, resulting_player_score: 1, resulting_opponent_score: 0 },
          { event_type: "ability", player_side: "opponent", points_delta: 1, resulting_player_score: 1, resulting_opponent_score: 1 }
        ]
      },
      {
        game_number: 2,
        starting_player: "opponent",
        winning_point: 9,
        winner: "opponent",
        player_score: 7,
        opponent_score: 9,
        events: []
      },
      {
        game_number: 3,
        starting_player: "player",
        winning_point: 8,
        winner: "player",
        player_score: 8,
        opponent_score: 6,
        events: []
      }
    ]
  }
] as const;
