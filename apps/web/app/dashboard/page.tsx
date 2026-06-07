"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getLegendById } from "@riftbound/legends";
import { demoMatches, type WebMatch } from "@/lib/demo-data";
import { getBrowserSupabase, hasSupabaseConfig } from "@/lib/supabase";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardPage() {
  const [query, setQuery] = useState("");
  const [cloudMatches, setCloudMatches] = useState<WebMatch[]>([]);
  const [status, setStatus] = useState("");
  const matches = cloudMatches.length ? cloudMatches : demoMatches;

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      setStatus("Demo data shown. Add Supabase environment variables to load your account.");
      return;
    }

    const supabase = getBrowserSupabase();
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        setStatus("Sign in to load your saved matches.");
        return;
      }

      const { data: rows, error } = await supabase
        .from("matches")
        .select("*")
        .order("played_at", { ascending: false });

      if (error) {
        setStatus(error.message);
        return;
      }

      setCloudMatches(
        rows.map((row) => ({
          id: row.id,
          played_at: row.played_at,
          winner: row.winner,
          player_game_wins: row.player_game_wins,
          opponent_game_wins: row.opponent_game_wins,
          player_legend: getLegendById(row.player_legend_id)?.name ?? row.player_legend_id,
          opponent_legend: getLegendById(row.opponent_legend_id)?.name ?? row.opponent_legend_id,
          notes: row.notes ?? "",
          games: []
        }))
      );
      setStatus("");
    });
  }, []);

  const filteredMatches = useMemo(() => {
    const normalized = query.toLowerCase();

    return matches.filter((match) =>
      [
        match.player_legend,
        match.opponent_legend,
        match.winner,
        match.notes,
        new Date(match.played_at).toLocaleDateString()
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [matches, query]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Match History</h1>
          <p className="text-sm text-muted-foreground">Review Riftbound matches saved from your phone.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Link href="/login">Login</Link>
          </Button>
          <Button variant="outline" size="sm">
            Export
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Saved Matches</CardTitle>
            <CardDescription>Filter by legend, opponent, result, notes, or date.</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search matches" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {status ? <p className="mb-4 text-sm text-muted-foreground">{status}</p> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Your Legend</TableHead>
                <TableHead>Opponent</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell>{new Date(match.played_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge>{getMatchResultLabel(match.winner)} {match.player_game_wins}-{match.opponent_game_wins}</Badge>
                  </TableCell>
                  <TableCell>{match.player_legend}</TableCell>
                  <TableCell>{match.opponent_legend}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{match.notes}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      <Link href={`/matches/${match.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

function getMatchResultLabel(winner: string) {
  if (winner === "player") return "Win";
  if (winner === "opponent") return "Loss";
  return "Tie";
}
