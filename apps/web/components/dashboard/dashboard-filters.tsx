import { CalendarDays } from "lucide-react";
import { LEGENDS } from "@riftbound/legends";
import type { DashboardFilters } from "@/lib/analytics";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DashboardFiltersBar({
  filters,
  onChange,
}: {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <div className="flex items-center gap-2">
        <CalendarDays className="pointer-events-none -mr-8 z-10 ml-3 h-4 w-4 text-muted-foreground" />
        <Select
          value={filters.range}
          onValueChange={(value) =>
            onChange({ ...filters, range: value as DashboardFilters["range"] })
          }
        >
          <SelectTrigger
            aria-label="Date range"
            className="w-full pl-10 sm:w-44"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Select
        value={filters.legendId}
        onValueChange={(value) => onChange({ ...filters, legendId: value })}
      >
        <SelectTrigger aria-label="Player legend" className="w-full sm:w-56">
          <SelectValue placeholder="All Legends" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Legends</SelectItem>
          {LEGENDS.map((legend) => (
            <SelectItem key={legend.id} value={legend.id}>
              {legend.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
