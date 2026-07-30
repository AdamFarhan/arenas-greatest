import { Flag, Sparkles, Swords } from "lucide-react";
import type { ScoringComparison } from "@/lib/analytics";
import { AnalyticsPanel } from "@/components/dashboard/analytics-panel";

const icons = {
  Holding: Flag,
  Conquering: Swords,
  Ability: Sparkles,
};

export function LegendScoringComparison({ data }: { data: ScoringComparison[] }) {
  const playerTotal = data.reduce((sum, item) => sum + item.playerPoints, 0);
  const opponentTotal = data.reduce((sum, item) => sum + item.opponentPoints, 0);
  const hasData = playerTotal > 0 || opponentTotal > 0;

  return (
    <AnalyticsPanel
      title="How points are scored"
      description="Compare your scoring sources with your opponent's"
    >
      {hasData ? (
        <div className="space-y-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 text-xs font-semibold text-muted-foreground">
            <span>Your points</span>
            <span>Source</span>
            <span className="text-right">Opponent points</span>
          </div>
          {data.map((item) => {
            const Icon = icons[item.name as keyof typeof icons] ?? Sparkles;
            return (
              <div key={item.name} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                <ScoreBar value={item.playerPoints} total={playerTotal} align="left" />
                <span className="flex w-28 flex-col items-center gap-1 text-center text-xs">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {item.name}
                </span>
                <ScoreBar value={item.opponentPoints} total={opponentTotal} align="right" />
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No scoring events recorded for these matches yet.
        </p>
      )}
    </AnalyticsPanel>
  );
}

function ScoreBar({
  value,
  total,
  align,
}: {
  value: number;
  total: number;
  align: "left" | "right";
}) {
  const percentage = total ? Math.round((value / total) * 100) : 0;

  return (
    <div className={align === "right" ? "text-right" : ""}>
      <div className="mb-1 flex items-baseline gap-1 text-xs">
        <span className={align === "right" ? "order-2" : ""}>{value} pts</span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={align === "right" ? "ml-auto h-full" : "h-full bg-primary"}
          style={{
            width: `${percentage}%`,
            ...(align === "right" ? { backgroundColor: "var(--destructive)" } : {}),
          }}
        />
      </div>
    </div>
  );
}
