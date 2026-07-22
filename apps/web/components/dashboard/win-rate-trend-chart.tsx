"use client";
import { Info } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AnalyticsPanel } from "./analytics-panel";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

export function WinRateTrendChart({ data }: { data: Array<{ label: string; winRate: number }> }) { return <AnalyticsPanel title="Win Rate Trend" description="Cumulative match win rate over the selected range"><ChartContainer config={{ winRate: { label: "Win rate", color: "var(--chart-1)" } }} className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(value) => `${value}%`} /><Tooltip shared={false} cursor={{ stroke: "var(--chart-1)", strokeDasharray: "4 4", strokeWidth: 1 }} content={<ChartTooltipContent valueFormatter={(value) => `${Number(value).toFixed(1)}%`} />} /><Line type="monotone" dataKey="winRate" name="Win rate" stroke="var(--color-winRate)" strokeWidth={3} dot={{ r: 3, fill: "var(--color-winRate)" }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></ChartContainer></AnalyticsPanel>; }
