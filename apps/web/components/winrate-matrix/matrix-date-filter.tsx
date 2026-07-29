import { CalendarDays } from "lucide-react";
import type { MatrixDateRange } from "@/lib/winrate-matrix";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MatrixDateFilter({
  value,
  onChange,
}: {
  value: MatrixDateRange;
  onChange: (value: MatrixDateRange) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="pointer-events-none -mr-8 z-10 ml-3 h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={(next) => onChange(next as MatrixDateRange)}>
        <SelectTrigger aria-label="Matrix date range" className="w-44 pl-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="60d">Last 60 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
          <SelectItem value="all">All time</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
