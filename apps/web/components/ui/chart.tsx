import * as React from "react";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<string, { label: string; color: string }>;

export function ChartContainer({ className, config, children }: { className?: string; config: ChartConfig; children: React.ReactNode }) {
  const variables = Object.fromEntries(Object.entries(config).map(([key, value]) => [`--color-${key}`, value.color]));

  return <div className={cn("w-full", className)} style={variables as React.CSSProperties}>{children}</div>;
}

export function ChartTooltipContent({ active, payload, label, valueFormatter }: { active?: boolean; payload?: Array<{ name?: string; value?: string | number; color?: string }>; label?: string | number; valueFormatter?: (value: string | number) => string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="grid min-w-32 gap-1.5 rounded-md border bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-medium text-foreground">{valueFormatter && entry.value !== undefined ? valueFormatter(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  );
}
