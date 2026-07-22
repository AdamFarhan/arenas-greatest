import { AnalyticsPanel } from "./analytics-panel";

export function PlayPatternPanel({
  data,
}: {
  data: { earlyLead: number; lateRecovery: number } | null;
}) {
  return (
    <AnalyticsPanel title="Play Pattern" description="How your games develop">
      <div className="space-y-5">
        {data ? (
          <>
            <Pattern
              label="Early lead"
              value={data.earlyLead}
              color="var(--chart-1)"
            />
            <Pattern
              label="Late recovery"
              value={data.lateRecovery}
              color="var(--chart-3)"
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Record more score events to reveal your play pattern.
          </p>
        )}
      </div>
    </AnalyticsPanel>
  );
}
function Pattern({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, value)}%`, background: color }}
        />
      </div>
    </div>
  );
}
