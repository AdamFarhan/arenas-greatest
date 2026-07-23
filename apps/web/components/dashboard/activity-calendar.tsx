"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AnalyticsPanel } from "./analytics-panel";

const weekdayLabels = ["Sun", "", "Tue", "", "Thu", "", "Sat"];
const intensityClasses = [
  "bg-transparent",
  "bg-activity-1",
  "bg-activity-2",
  "bg-activity-3",
  "bg-activity-4",
];

export function ActivityCalendar({
  data,
  compact = false,
}: {
  data: Array<{ date: string; count: number }>;
  compact?: boolean;
}) {
  if (compact) return <CompactActivityCalendar data={data} />;

  const totalMatches = data.reduce((total, day) => total + day.count, 0);
  const weeks = chunkIntoWeeks(data);
  const gridWidth = weeks.length * 14 + Math.max(0, weeks.length - 1) * 4;

  return (
    <div className="mx-auto w-full max-w-[1400px] py-2">
      {data.length ? (
        <div className="space-y-3">
          <div className="flex justify-center gap-2">
            <div className="w-7 shrink-0" />
            <div
              className="flex items-end justify-between gap-4"
              style={{ width: gridWidth }}
            >
              <div>
                <h2 className="text-base font-semibold">Match Activity</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Matches logged by day
                </p>
              </div>
              <span className="text-xs font-medium text-foreground">
                {totalMatches} matches logged
              </span>
            </div>
          </div>
          <div className="flex min-w-0 justify-center gap-2">
            <div className="grid shrink-0 grid-rows-7 gap-1 pt-0.5 text-[10px] leading-[14px] text-muted-foreground">
              {weekdayLabels.map((label, index) => (
                <span key={`${label}-${index}`} className="h-3.5">
                  {label}
                </span>
              ))}
            </div>
            <div className="min-w-0 max-w-full overflow-x-auto pb-1">
              <div
                className="mx-auto grid grid-flow-col auto-cols-[14px] grid-rows-7 gap-1"
                style={{ width: gridWidth }}
              >
                {weeks.flatMap((week) =>
                  week.map((day) => (
                    <Tooltip key={day.date}>
                      <TooltipTrigger asChild>
                        <div
                          tabIndex={0}
                          aria-label={`${formatActivityDate(day.date)}: ${day.count} ${day.count === 1 ? "match" : "matches"}`}
                          className={`h-3.5 w-3.5 cursor-default rounded-[3px] border border-primary/30 outline-none focus-visible:ring-2 focus-visible:ring-ring ${intensityClasses[intensityFor(day.count)]}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {formatActivityDate(day.date)} • {day.count}{" "}
                        {day.count === 1 ? "match" : "matches"}
                      </TooltipContent>
                    </Tooltip>
                  )),
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-2">
            <div className="w-7 shrink-0" />
            <div
              className="grid grid-flow-col auto-cols-[14px] gap-1 text-[10px] text-muted-foreground"
              style={{ width: gridWidth }}
            >
              {weeks.map((week, index) => (
                <span key={index} className="h-3 whitespace-nowrap">
                  {monthLabel(week, index)}
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <div
              className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground"
              style={{ width: gridWidth }}
            >
              <span>Less</span>
              <span className="h-3.5 w-3.5 rounded-[3px] border border-primary/30 bg-transparent" />
              <span className="h-3.5 w-3.5 rounded-[3px] border border-primary/30 bg-activity-1" />
              <span className="h-3.5 w-3.5 rounded-[3px] border border-primary/30 bg-activity-2" />
              <span className="h-3.5 w-3.5 rounded-[3px] border border-primary/30 bg-activity-3" />
              <span className="h-3.5 w-3.5 rounded-[3px] border border-primary/30 bg-activity-4" />
              <span>More</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-20 items-center justify-center text-sm text-muted-foreground">
          No matches recorded in this range.
        </div>
      )}
    </div>
  );
}

function CompactActivityCalendar({
  data,
}: {
  data: Array<{ date: string; count: number }>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleWeekCount, setVisibleWeekCount] = useState(5);
  const allWeeks = useMemo(() => chunkIntoWeeks(data), [data]);
  const visibleWeeks = allWeeks.slice(-visibleWeekCount);
  const visibleData = visibleWeeks.flat();

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateVisibleWeeks = () => {
      const cellSize = 18;
      const cellGap = 4;
      const cardContentPadding = 32;
      const availableWidth = element.clientWidth - cardContentPadding;
      setVisibleWeekCount(
        Math.max(1, Math.floor((availableWidth + cellGap) / (cellSize + cellGap))),
      );
    };
    updateVisibleWeeks();
    const observer = new ResizeObserver(updateVisibleWeeks);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const totalMatches = visibleData.reduce((total, day) => total + day.count, 0);
  const weeks = visibleWeeks;
  const cellSize = 18;
  const gapSize = 4;
  const gridWidth = weeks.length * cellSize + Math.max(0, weeks.length - 1) * gapSize;

  return (
    <div ref={containerRef} className="min-w-0">
      <AnalyticsPanel
        title="Match Activity"
        description="Matches logged by day"
        className="h-full min-w-0"
      >
      <div className="space-y-4 pt-1">
        <div className="flex justify-end text-xs font-medium text-foreground">
          {totalMatches} matches logged
        </div>
        <div className="flex justify-center overflow-x-auto pb-1">
          <div
            className="grid shrink-0 grid-flow-col grid-rows-7 gap-1"
            style={{
              width: gridWidth,
              gridAutoColumns: `${cellSize}px`,
            }}
          >
            {weeks.flatMap((week) =>
              week.map((day) => (
                <Tooltip key={day.date}>
                  <TooltipTrigger asChild>
                    <div
                      tabIndex={0}
                      aria-label={`${formatActivityDate(day.date)}: ${day.count} ${day.count === 1 ? "match" : "matches"}`}
                      className={`h-[18px] w-[18px] cursor-default rounded-[3px] border border-primary/30 outline-none focus-visible:ring-2 focus-visible:ring-ring ${intensityClasses[intensityFor(day.count)]}`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {formatActivityDate(day.date)} • {day.count}{" "}
                    {day.count === 1 ? "match" : "matches"}
                  </TooltipContent>
                </Tooltip>
              )),
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
          <span>Less</span>
          <span className="h-3.5 w-3.5 rounded-[3px] border border-primary/30 bg-transparent" />
          <span className="h-3.5 w-3.5 rounded-[3px] border border-primary/30 bg-activity-1" />
          <span className="h-3.5 w-3.5 rounded-[3px] border border-primary/30 bg-activity-2" />
          <span className="h-3.5 w-3.5 rounded-[3px] border border-primary/30 bg-activity-3" />
          <span className="h-3.5 w-3.5 rounded-[3px] border border-primary/30 bg-activity-4" />
          <span>More</span>
        </div>
      </div>
      </AnalyticsPanel>
    </div>
  );
}

function chunkIntoWeeks(data: Array<{ date: string; count: number }>) {
  const weeks: Array<Array<{ date: string; count: number }>> = [];
  for (let index = 0; index < data.length; index += 7) {
    weeks.push(data.slice(index, index + 7));
  }
  return weeks;
}

function intensityFor(count: number) {
  return Math.min(4, Math.max(0, count));
}

function formatActivityDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", year: "numeric" },
  );
}

function monthLabel(
  week: Array<{ date: string; count: number }>,
  weekIndex: number,
) {
  const monthStart = week.find((day) => day.date.endsWith("-01"));
  const value =
    monthStart?.date ?? (weekIndex === 0 ? week[0]?.date : undefined);
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1).toLocaleDateString(
    undefined,
    { month: "short" },
  );
}
