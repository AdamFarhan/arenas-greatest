import { Badge } from "@/components/ui/badge";

export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Performance Overview
        </h1>
      </div>
    </header>
  );
}
