import { Badge } from "@/components/ui/badge";

export function DashboardHeader({ children }: { children?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Performance Overview
        </h1>
      </div>
      {children}
    </header>
  );
}
