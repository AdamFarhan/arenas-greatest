import { Flag, Swords, Sparkles, SlidersHorizontal } from "lucide-react";
import { AnalyticsPanel } from "./analytics-panel";

const icons = {
  Holding: Flag,
  Conquering: Swords,
  Ability: Sparkles,
  "Manual adjustment": SlidersHorizontal,
};

export function ScoringPatternPanel({
  data,
}: {
  data: Array<{ name: string; value: number; color: string }>;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <AnalyticsPanel
      title="Scoring Pattern"
      description="Points recorded by event type"
    >
      <div className="space-y-4">
        {data.length ? (
          data.map((item) => {
            const Icon = icons[item.name as keyof typeof icons] ?? Sparkles;
            return (
              <div key={item.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {item.name}
                  </span>
                  <span>
                    {total ? Math.round((item.value / total) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${total ? (item.value / total) * 100 : 0}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">
            No scoring events recorded yet.
          </p>
        )}
      </div>
    </AnalyticsPanel>
  );
}
