import Image from "next/image";
import { getLegendArtSource } from "@/lib/legend-art";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-11 w-11",
  lg: "h-20 w-20",
} as const;

export function LegendAvatar({
  legendId,
  name,
  size = "md",
  className,
}: {
  legendId: string;
  name: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  const source = getLegendArtSource(legendId);

  return (
    <span
      aria-label={name}
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted",
        sizeClasses[size],
        className,
      )}
    >
      {source ? (
        <Image
          src={source}
          alt=""
          fill
          sizes={size === "lg" ? "80px" : size === "md" ? "44px" : "32px"}
          className="!h-[154%] !w-[110%] !max-w-none object-cover"
        />
      ) : (
        <span className="grid h-full w-full place-items-center text-xs font-semibold text-muted-foreground">
          {name.charAt(0)}
        </span>
      )}
    </span>
  );
}
