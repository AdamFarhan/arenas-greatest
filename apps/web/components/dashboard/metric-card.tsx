import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: "positive";
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p
            className={cn(
              "mt-3 text-3xl font-semibold tracking-tight",
              tone === "positive" && "text-primary",
            )}
          >
            {value}
          </p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground">
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}
