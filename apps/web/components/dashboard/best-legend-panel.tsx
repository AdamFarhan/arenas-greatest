import { AnalyticsPanel } from "./analytics-panel";
import { LegendAvatar } from "@/components/legend-avatar";

export function BestLegendPanel({
  data,
}: {
  data: { legendId: string; name: string; winRate: number; wins: number; losses: number } | null;
}) {
  return (
    <AnalyticsPanel
      title="Best Legend"
      description="Your strongest recorded legend"
    >
      <div className="flex items-center justify-between gap-4">
        {data ? (
          <LegendAvatar legendId={data.legendId} name={data.name} size="lg" />
        ) : (
          <div className="h-14 w-14 shrink-0 rounded-full border border-primary/40 bg-primary/10" />
        )}
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
