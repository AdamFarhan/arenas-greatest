import type { WinrateRecord } from "@/lib/winrate-matrix";

export function MatrixCell({ record }: { record: WinrateRecord }) {
  if (!record.total) {
    return <div className="grid min-h-24 place-items-center text-lg text-muted-foreground">-</div>;
  }

  const heatmap = getHeatmapStyle(record.winRate);
  const winRateLabel = record.winRate === null ? "-" : `${Math.round(record.winRate * 100)}%`;

  return (
    <div
      className="flex min-h-24 flex-col items-center justify-center gap-1 border-l border-white/10 px-2 text-center"
      style={heatmap}
      aria-label={`${winRateLabel} win rate over ${record.total} ${record.total === 1 ? "match" : "matches"}: ${formatRecord(record)}`}
    >
      <span className="text-xl font-black leading-none tracking-normal">{winRateLabel}</span>
      <span className="text-xs font-semibold opacity-85">
        {record.total} {record.total === 1 ? "match" : "matches"}
      </span>
      <span className="text-xs font-bold opacity-75">{formatRecord(record)}</span>
    </div>
  );
}

export function formatRecord(record: WinrateRecord) {
  return `${record.wins}-${record.losses}-${record.ties}`;
}

function getHeatmapStyle(winRate: number | null) {
  if (winRate === null) {
    return { backgroundColor: "var(--secondary)", color: "var(--muted-foreground)" };
  }

  const hue = Math.round(winRate * 132);
  const lightness = Math.round(28 + winRate * 27);
  return {
    backgroundColor: `hsl(${hue} 62% ${lightness}%)`,
    color: winRate >= 0.7 ? "hsl(145 35% 11%)" : "hsl(0 0% 98%)",
  };
}
