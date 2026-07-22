"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AnalyticsPanel } from "./analytics-panel";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export function MatchupDistributionChart({
  data,
  total,
}: {
  data: Array<{ name: string; value: number; color: string }>;
  total: number;
}) {
  return (
    <AnalyticsPanel
      title="Matchup Distribution"
      description="Matches by opponent legend"
    >
      <div className="grid items-center gap-4 sm:grid-cols-[1fr_0.9fr]">
        <ChartContainer
          config={{ matches: { label: "Matches", color: "var(--chart-1)" } }}
          className="h-56"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<ChartTooltipContent />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={3}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={entry.color}
                    stroke="hsl(var(--background))"
                  />
                ))}
              </Pie>
              <text
                x="50%"
                y="47%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-2xl font-semibold"
              >
                {total}
              </text>
              <text
                x="50%"
                y="59%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-muted-foreground text-xs"
              >
                Matches
              </text>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="space-y-2">
          {data.slice(0, 5).map((entry) => (
            <div
              key={entry.name}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: entry.color }}
                />
                {entry.name}
              </span>
              <span className="text-muted-foreground">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsPanel>
  );
}
