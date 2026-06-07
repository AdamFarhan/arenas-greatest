"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLegendById } from "@riftbound/legends";
import { demoMatches, type WebGame, type WebMatch } from "@/lib/demo-data";
import { getBrowserSupabase, hasSupabaseConfig } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function MatchDetailClient({ id }: { id: string }) {
  const [cloudMatch, setCloudMatch] = useState<WebMatch | undefined>();
  const [status, setStatus] = useState("");
  const match = cloudMatch ?? demoMatches.find((item) => item.id === id);

  useEffect(() => {
    if (!hasSupabaseConfig()) return;

    const supabase = getBrowserSupabase();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setStatus("Sign in to load this cloud match.");
        return;
      }

      const { data: matchRow, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .eq("id", id)
        .single();

      if (matchError || !matchRow) {
        setStatus(matchError?.message ?? "Match not found.");
        return;
      }

      const { data: gameRows, error: gamesError } = await supabase
        .from("games")
        .select("*")
        .eq("match_id", id)
        .order("game_number");

      if (gamesError) {
        setStatus(gamesError.message);
        return;
      }

      const games: WebGame[] = [];

      for (const game of gameRows ?? []) {
        const { data: eventRows } = await supabase
          .from("score_events")
          .select("*")
          .eq("game_id", game.id)
          .order("created_at");

        games.push({
          game_number: game.game_number,
          starting_player: game.starting_player,
          winning_point: game.winning_point,
          winner: game.winner,
          player_score: game.player_score,
          opponent_score: game.opponent_score,
          events: (eventRows ?? []).map((event) => ({
            event_type: event.event_type,
            player_side: event.player_side,
            points_delta: event.points_delta,
            resulting_player_score: event.resulting_player_score,
            resulting_opponent_score: event.resulting_opponent_score
          }))
        });
      }

      setCloudMatch({
        id: matchRow.id,
        played_at: matchRow.played_at,
        winner: matchRow.winner,
        player_game_wins: matchRow.player_game_wins,
        opponent_game_wins: matchRow.opponent_game_wins,
        player_legend: getLegendById(matchRow.player_legend_id)?.name ?? matchRow.player_legend_id,
        opponent_legend: getLegendById(matchRow.opponent_legend_id)?.name ?? matchRow.opponent_legend_id,
        notes: matchRow.notes ?? "",
        games
      });
      setStatus("");
    });
  }, [id]);

  if (!match) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <Button variant="outline" size="sm">
          <Link href="/dashboard">Back</Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Match not found</CardTitle>
            <CardDescription>{status || "No match exists with this id."}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            {match.player_legend} vs {match.opponent_legend}
          </h1>
          <p className="text-sm text-muted-foreground">{new Date(match.played_at).toLocaleString()}</p>
        </div>
        <Button variant="outline" size="sm">
          <Link href="/dashboard">Back</Link>
        </Button>
      </header>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Result</CardDescription>
            <CardTitle>{getMatchResultLabel(match.winner)} {match.player_game_wins}-{match.opponent_game_wins}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Your Legend</CardDescription>
            <CardTitle>{match.player_legend}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Opponent Legend</CardDescription>
            <CardTitle>{match.opponent_legend}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{match.notes}</CardContent>
      </Card>

      <div className="grid gap-4">
        {match.games.map((game) => (
          <Card key={game.game_number}>
            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Game {game.game_number}</CardTitle>
                <CardDescription>
                  Starting player: {game.starting_player} · Winning point: {game.winning_point}
                </CardDescription>
              </div>
              <Badge>
                {game.winner === "player" ? "Win" : "Loss"} {game.player_score}-{game.opponent_score}
              </Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Delta</TableHead>
                    <TableHead>Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {game.events.length ? (
                    game.events.map((event, index) => (
                      <TableRow key={`${game.game_number}-${index}`}>
                        <TableCell>{event.player_side}</TableCell>
                        <TableCell>{event.event_type.replace("_", " ")}</TableCell>
                        <TableCell>{event.points_delta > 0 ? `+${event.points_delta}` : event.points_delta}</TableCell>
                        <TableCell>{event.resulting_player_score}-{event.resulting_opponent_score}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground">
                        No scoring events recorded for this demo game.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}

function getMatchResultLabel(winner: string) {
  if (winner === "player") return "Win";
  if (winner === "opponent") return "Loss";
  return "Tie";
}
