"use client";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnalyticsPanel } from "./analytics-panel";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export function WinRateTrendChart({
  data,
}: {
  data: Array<{
    label: string;
    winRate: number;
    firstWinRate: number | null;
    secondWinRate: number | null;
  }>;
}) {
  return (
    <AnalyticsPanel
      title="Win Rate Trend"
      description="Cumulative win rates over the selected period"
    >
      <ChartContainer
        config={{
          winRate: { label: "Match win rate", color: "var(--chart-1)" },
          firstWinRate: {
            label: "Going first",
            color: "var(--chart-going-first)",
          },
          secondWinRate: {
            label: "Going second",
            color: "var(--chart-going-second)",
          },
        }}
        className="h-64"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ top: 12, right: 12, left: 12, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeOpacity={0.45}
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  valueFormatter={(value) => `${Number(value).toFixed(1)}%`}
                />
              }
            />
            <Area
              type="natural"
              dataKey="winRate"
              name="Match win rate"
              stroke="var(--color-winRate)"
              strokeWidth={3}
              fill="none"
              fillOpacity={0}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              type="natural"
              dataKey="firstWinRate"
              name="Going first"
              stroke="var(--color-firstWinRate)"
              strokeWidth={2}
              strokeDasharray="6 4"
              fill="none"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
            <Area
              type="natural"
              dataKey="secondWinRate"
              name="Going second"
              stroke="var(--color-secondWinRate)"
              strokeWidth={2}
              strokeDasharray="6 4"
              fill="none"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <TrendKey color="var(--chart-1)" label="Match win rate" />
        <TrendKey color="var(--chart-going-first)" label="Going first" dashed />
        <TrendKey
          color="var(--chart-going-second)"
          label="Going second"
          dashed
        />
      </div>
    </AnalyticsPanel>
  );
}

function TrendKey({
  color,
  label,
  dashed = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={dashed ? "w-5 border-t-2 border-dashed" : "w-5 border-t-2"}
        style={{ borderColor: color }}
      />
      {label}
    </span>
  );
}
