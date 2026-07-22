import { LegendAvatar } from "@/components/legend-avatar";
import { cn } from "@/lib/utils";

const vsSizeClasses = {
  sm: "h-6 w-6 text-[8px]",
  md: "h-7 w-7 text-[9px]",
  lg: "h-8 w-8 text-[10px]",
} as const;

export function LegendMatchup({
  playerLegendId,
  playerName,
  opponentLegendId,
  opponentName,
  size = "md",
}: {
  playerLegendId: string;
  playerName: string;
  opponentLegendId: string;
  opponentName: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="flex shrink-0 items-center -space-x-2">
      <LegendAvatar legendId={playerLegendId} name={playerName} size={size} />
      <span
        className={cn(
          "z-10 grid place-items-center rounded-full border-2 border-background bg-card font-bold text-muted-foreground",
          vsSizeClasses[size],
        )}
      >
        VS
      </span>
      <LegendAvatar legendId={opponentLegendId} name={opponentName} size={size} />
    </div>
  );
}
