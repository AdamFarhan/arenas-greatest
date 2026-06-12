export type PlayerSide = "player" | "opponent";
export type ScoreReason = "holding" | "conquering" | "ability";
export type ScoreEventType = ScoreReason | "manual_adjustment";
export type WinningPoint = 8 | 9 | 10;
export type GameEndReason = "points" | "concession";

export type ScoreEvent = {
  id: string;
  gameNumber: number;
  player: PlayerSide;
  type: ScoreEventType;
  pointsDelta: number;
  resultingScore: {
    player: number;
    opponent: number;
  };
  createdAt: string;
  previousScore?: number;
  adjustedScore?: number;
};

export type GameState = {
  gameNumber: number;
  startingPlayer: PlayerSide;
  winningPoint: WinningPoint;
  score: {
    player: number;
    opponent: number;
  };
  events: ScoreEvent[];
  winner?: PlayerSide;
  endReason?: GameEndReason;
};

export type MatchState = {
  id: string;
  games: GameState[];
  wins: {
    player: number;
    opponent: number;
  };
  winner?: PlayerSide;
};

export type HistoryRow = {
  id: string;
  label: string;
  player: PlayerSide;
  type: ScoreEventType;
  pointsDelta: number;
  score: string;
  createdAt: string;
};

const SCORING_REASONS = new Set<ScoreReason>(["holding", "conquering", "ability"]);

export function createMatch(id = cryptoRandomId()): MatchState {
  return {
    id,
    games: [],
    wins: {
      player: 0,
      opponent: 0
    }
  };
}

export function startGame(
  match: MatchState,
  startingPlayer: PlayerSide,
  winningPoint: WinningPoint
): MatchState {
  if (match.winner) {
    throw new Error("Cannot start a new game after the match is complete.");
  }

  if (match.games.at(-1)?.winner === undefined && match.games.length > 0) {
    throw new Error("Cannot start a new game before the active game is complete.");
  }

  return {
    ...match,
    games: [
      ...match.games,
      {
        gameNumber: match.games.length + 1,
        startingPlayer,
        winningPoint,
        score: {
          player: 0,
          opponent: 0
        },
        events: []
      }
    ]
  };
}

export function addScore(
  match: MatchState,
  player: PlayerSide,
  reason: ScoreReason,
  createdAt = new Date().toISOString()
): MatchState {
  if (!SCORING_REASONS.has(reason)) {
    throw new Error(`Invalid scoring reason: ${reason}`);
  }

  const game = getActiveGame(match);
  const nextScore = {
    ...game.score,
    [player]: game.score[player] + 1
  };

  return updateActiveGame(match, {
    ...game,
    score: nextScore,
    events: [
      ...game.events,
      {
        id: cryptoRandomId(),
        gameNumber: game.gameNumber,
        player,
        type: reason,
        pointsDelta: 1,
        resultingScore: nextScore,
        createdAt
      }
    ]
  });
}

export function manuallyAdjustScore(
  match: MatchState,
  player: PlayerSide,
  adjustedScore: number,
  createdAt = new Date().toISOString()
): MatchState {
  if (!Number.isInteger(adjustedScore) || adjustedScore < 0) {
    throw new Error("Adjusted score must be a non-negative integer.");
  }

  const game = getActiveGame(match);
  const previousScore = game.score[player];
  const nextScore = {
    ...game.score,
    [player]: adjustedScore
  };

  return updateActiveGame(match, {
    ...game,
    score: nextScore,
    events: [
      ...game.events,
      {
        id: cryptoRandomId(),
        gameNumber: game.gameNumber,
        player,
        type: "manual_adjustment",
        pointsDelta: adjustedScore - previousScore,
        previousScore,
        adjustedScore,
        resultingScore: nextScore,
        createdAt
      }
    ]
  });
}

export function endGameEarly(match: MatchState, winner: PlayerSide): MatchState {
  const game = getActiveGame(match);

  return updateActiveGame(match, {
    ...game,
    winner,
    endReason: "concession"
  });
}

export function getCurrentGameHistory(game: GameState): HistoryRow[] {
  return game.events.map((event) => ({
    id: event.id,
    label: getEventLabel(event),
    player: event.player,
    type: event.type,
    pointsDelta: event.pointsDelta,
    score: `${event.resultingScore.player}-${event.resultingScore.opponent}`,
    createdAt: event.createdAt
  }));
}

export function getActiveGame(match: MatchState): GameState {
  const game = match.games.at(-1);

  if (!game || game.winner) {
    throw new Error("There is no active game.");
  }

  return game;
}

function updateActiveGame(match: MatchState, updatedGame: GameState): MatchState {
  const resolvedGame = resolveGameWinner(updatedGame);
  const games = match.games.map((game) =>
    game.gameNumber === resolvedGame.gameNumber ? resolvedGame : game
  );

  const wins = games.reduce(
    (totals, game) => {
      if (game.winner) {
        totals[game.winner] += 1;
      }
      return totals;
    },
    { player: 0, opponent: 0 } satisfies MatchState["wins"]
  );

  const nextMatch: MatchState = {
    ...match,
    games,
    wins
  };

  if (wins.player === 2) {
    nextMatch.winner = "player";
  }

  if (wins.opponent === 2) {
    nextMatch.winner = "opponent";
  }

  return nextMatch;
}

function resolveGameWinner(game: GameState): GameState {
  if (game.winner) {
    return game;
  }

  if (game.score.player >= game.winningPoint) {
    return { ...game, winner: "player", endReason: "points" };
  }

  if (game.score.opponent >= game.winningPoint) {
    return { ...game, winner: "opponent", endReason: "points" };
  }

  return game;
}

function getEventLabel(event: ScoreEvent): string {
  if (event.type === "manual_adjustment") {
    return `Manual adjustment to ${event.adjustedScore}`;
  }

  return event.type.charAt(0).toUpperCase() + event.type.slice(1);
}

function cryptoRandomId(): string {
  const cryptoLike = globalThis.crypto;

  if (cryptoLike?.randomUUID) {
    return cryptoLike.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}
