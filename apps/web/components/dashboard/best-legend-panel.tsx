import { Trophy } from "lucide-react";
import { AnalyticsPanel } from "./analytics-panel";

export function BestLegendPanel({
  data,
}: {
  data: { name: string; winRate: number; wins: number; losses: number } | null;
}) {
  return (
    <AnalyticsPanel
      title="Best Legend"
      description="Your strongest recorded legend"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary">
          <Trophy className="h-6 w-6" />
        </div>
        {data ? (
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold">{data.name}</p>
            <p className="text-sm text-primary">
              {data.winRate.toFixed(1)}% win rate
            </p>
            <p className="text-xs text-muted-foreground">
              {data.wins}W · {data.losses}L
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Record at least two matches with a legend.
          </p>
        )}
      </div>
    </AnalyticsPanel>
  );
}
