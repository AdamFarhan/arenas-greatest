import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

type PlayerSide = "player" | "opponent";
type MatchResult = PlayerSide | "tie";
type ScoreEventType = "holding" | "conquering" | "ability" | "manual_adjustment";
type WinningPoint = 8 | 9 | 10;

type MatchStateLike = {
  id: string;
  games: Array<{
    gameNumber: number;
    startingPlayer: PlayerSide;
    winningPoint: WinningPoint;
    score: {
      player: number;
      opponent: number;
    };
    events: Array<{
      id: string;
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
    }>;
    winner?: PlayerSide;
  }>;
  wins: {
    player: number;
    opponent: number;
  };
  winner?: PlayerSide;
};

export type CompletedMatchMetadata = {
  userId: string;
  playerLegendId: string;
  opponentLegendId: string;
  notes?: string | null;
  winner: MatchResult;
  playedAt: string;
  durationSeconds?: number | null;
};

export type CompletedMatchPayload = {
  match: Database["public"]["Tables"]["matches"]["Insert"];
  games: Array<{
    game: Database["public"]["Tables"]["games"]["Insert"];
    events: Database["public"]["Tables"]["score_events"]["Insert"][];
  }>;
};

export type SavedMatchSummary = Database["public"]["Tables"]["matches"]["Row"];

export type SavedMatchDetail = SavedMatchSummary & {
  games: Array<Database["public"]["Tables"]["games"]["Row"] & {
    events: Database["public"]["Tables"]["score_events"]["Row"][];
  }>;
};

export function createSupabaseClient(url: string, anonKey: string) {
  if (!url || !anonKey) {
    throw new Error("Supabase URL and anon key are required.");
  }

  return createClient<Database>(url, anonKey);
}

export function buildCompletedMatchPayload(
  matchState: MatchStateLike,
  metadata: CompletedMatchMetadata
): CompletedMatchPayload {
  const completedGames = matchState.games.filter((game) => game.winner);
  const matchInsert: Database["public"]["Tables"]["matches"]["Insert"] = {
    user_id: metadata.userId,
    player_legend_id: metadata.playerLegendId,
    opponent_legend_id: metadata.opponentLegendId,
    notes: metadata.notes?.trim() ? metadata.notes.trim() : null,
    winner: metadata.winner,
    player_game_wins: matchState.wins.player,
    opponent_game_wins: matchState.wins.opponent,
    duration_seconds: metadata.durationSeconds ?? null,
    played_at: metadata.playedAt
  };

  if (isUuid(matchState.id)) {
    matchInsert.id = matchState.id;
  }

  return {
    match: matchInsert,
    games: completedGames.map((game) => ({
      game: {
        match_id: isUuid(matchState.id) ? matchState.id : "",
        game_number: game.gameNumber,
        starting_player: game.startingPlayer,
        winning_point: game.winningPoint,
        winner: game.winner!,
        player_score: game.score.player,
        opponent_score: game.score.opponent
      },
      events: game.events.map((event) => ({
        ...buildScoreEventInsert(event)
      }))
    }))
  };
}

export async function saveCompletedMatch(
  supabase: SupabaseClient,
  payload: CompletedMatchPayload
) {
  const matchMutation = payload.match.id
    ? supabase.from("matches").upsert(payload.match, { onConflict: "id" })
    : supabase.from("matches").insert(payload.match);

  const { data: insertedMatch, error: matchError } = await matchMutation.select("id").single();

  if (matchError || !insertedMatch) {
    return { data: null, error: matchError ?? new Error("Could not create match.") };
  }

  for (const gamePayload of payload.games) {
    const gameInsert = {
      ...gamePayload.game,
      match_id: insertedMatch.id
    };
    const { data: insertedGame, error: gameError } = await supabase
      .from("games")
      .upsert(gameInsert, { onConflict: "match_id,game_number" })
      .select("id")
      .single();

    if (gameError || !insertedGame) {
      return { data: null, error: gameError ?? new Error("Could not create game.") };
    }

    if (gamePayload.events.length) {
      const eventRows = gamePayload.events.map((event) => ({
        ...event,
        game_id: insertedGame.id
      }));
      const eventsMutation = eventRows.every((event) => event.id)
        ? supabase.from("score_events").upsert(eventRows, { onConflict: "id" })
        : supabase.from("score_events").insert(eventRows);
      const { error: eventsError } = await eventsMutation;

      if (eventsError) {
        return { data: null, error: eventsError };
      }
    }
  }

  return { data: { id: insertedMatch.id }, error: null };
}

export async function listSavedMatches(supabase: SupabaseClient) {
  return supabase
    .from("matches")
    .select("*")
    .order("played_at", { ascending: false });
}

export async function getSavedMatch(supabase: SupabaseClient, id: string) {
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .single();

  if (matchError || !match) {
    return { data: null, error: matchError ?? new Error("Match not found.") };
  }

  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("*")
    .eq("match_id", id)
    .order("game_number");

  if (gamesError) {
    return { data: null, error: gamesError };
  }

  const gamesWithEvents: SavedMatchDetail["games"] = [];

  for (const game of games ?? []) {
    const { data: events, error: eventsError } = await supabase
      .from("score_events")
      .select("*")
      .eq("game_id", game.id)
      .order("created_at");

    if (eventsError) {
      return { data: null, error: eventsError };
    }

    gamesWithEvents.push({
      ...game,
      events: events ?? []
    });
  }

  return {
    data: {
      ...match,
      games: gamesWithEvents
    } satisfies SavedMatchDetail,
    error: null
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function buildScoreEventInsert(
  event: MatchStateLike["games"][number]["events"][number]
): Database["public"]["Tables"]["score_events"]["Insert"] {
  const insert: Database["public"]["Tables"]["score_events"]["Insert"] = {
    game_id: "",
    player_side: event.player,
    event_type: event.type,
    points_delta: event.pointsDelta,
    resulting_player_score: event.resultingScore.player,
    resulting_opponent_score: event.resultingScore.opponent,
    previous_score: event.previousScore ?? null,
    adjusted_score: event.adjustedScore ?? null,
    created_at: event.createdAt
  };

  if (isUuid(event.id)) {
    insert.id = event.id;
  }

  return insert;
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
export type { Database };
