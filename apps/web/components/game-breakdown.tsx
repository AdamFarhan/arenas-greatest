import MdiIcon from "@mdi/react";
import {
  mdiLightningBolt,
  mdiPencil,
  mdiShield,
  mdiSwordCross,
  mdiTrophy,
} from "@mdi/js";
import { formatDuration } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ScoreEvent = {
  event_type: string;
  player_side: string;
  resulting_player_score: number;
  resulting_opponent_score: number;
};

type GameBreakdownData = {
  game_number: number;
  starting_player: string;
  winning_point: number;
  winner: string;
  end_reason?: string;
  player_score: number;
  opponent_score: number;
  duration_seconds?: number | null | undefined;
  events: ScoreEvent[];
};

export function GameBreakdown({
  game,
  className,
}: {
  game: GameBreakdownData;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Game {game.game_number}</CardTitle>
          <CardDescription>
            First turn {game.starting_player === "player" ? "you" : "opponent"}{" "}
            · To {game.winning_point} ·{" "}
            {game.end_reason === "concession" ? "Concession" : "Points"}
            {game.duration_seconds !== undefined
              ? ` · ${formatDuration(game.duration_seconds ?? null)}`
              : ""}
          </CardDescription>
        </div>
        <Badge
          className={cn(
            game.winner === "player" && "border-primary/40 text-primary",
            game.winner === "opponent" && "border-red-400/40 text-red-400",
          )}
        >
          {game.winner === "player" ? "Win" : "Loss"} {game.player_score}-
          {game.opponent_score}
        </Badge>
      </CardHeader>
      <CardContent>
        {game.events.length ? (
          <ScoreHistoryTable game={game} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No scoring events recorded for this game.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreHistoryTable({ game }: { game: GameBreakdownData }) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-background">
      <div className="grid grid-cols-2 border-b border-border bg-card">
        <div className="border-r border-border px-3 py-2 text-sm font-black">You</div>
        <div className="px-3 py-2 text-sm font-black">Opponent</div>
      </div>
      <div className="space-y-1 py-1">
        {game.events.map((event, index) => (
          <div className="grid min-h-10 grid-cols-2" key={`${game.game_number}-${index}`}>
            <div className="flex items-center border-r border-border px-2 py-1">
              {event.player_side === "player" ? <ScoreEntry event={event} score={event.resulting_player_score} winningPoint={game.end_reason === "concession" ? undefined : game.winning_point} /> : null}
            </div>
            <div className="flex items-center px-2 py-1">
              {event.player_side === "opponent" ? <ScoreEntry event={event} score={event.resulting_opponent_score} winningPoint={game.end_reason === "concession" ? undefined : game.winning_point} /> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreEntry({ event, score, winningPoint }: { event: ScoreEvent; score: number; winningPoint: number | undefined }) {
  const isWinningPoint = winningPoint !== undefined && score >= winningPoint;
  const meta = getScoreEventMeta(event.event_type);
  const Icon = meta.icon;

  return (
    <div className={cn("relative flex min-h-7 w-full items-center justify-center rounded-md border bg-card px-2 py-1", isWinningPoint ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black" : event.event_type === "manual_adjustment" ? "border-dashed border-ring bg-secondary" : meta.border)}>
      <span className="flex items-center gap-1.5 text-sm font-black">
        {score}
        {event.event_type === "manual_adjustment" ? <MdiIcon path={mdiPencil} size={0.65} color="currentColor" /> : <MdiIcon path={Icon} size={0.8} color="currentColor" className={cn(isWinningPoint ? "text-primary-foreground" : meta.text)} />}
      </span>
      {isWinningPoint ? <MdiIcon path={mdiTrophy} size={0.65} color="currentColor" className="absolute right-2" /> : null}
    </div>
  );
}

function getScoreEventMeta(eventType: string) {
  if (eventType === "holding") return { icon: mdiShield, border: "border-blue-400", text: "text-blue-400" };
  if (eventType === "conquering") return { icon: mdiSwordCross, border: "border-orange-400", text: "text-orange-400" };
  return { icon: mdiLightningBolt, border: "border-violet-400", text: "text-violet-400" };
}
