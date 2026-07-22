import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AnalyticsPanel({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) { return <Card className={className}><CardHeader className="p-5 pb-2"><CardTitle className="text-base">{title}</CardTitle>{description && <p className="text-xs text-muted-foreground">{description}</p>}</CardHeader><CardContent className="p-5 pt-2">{children}</CardContent></Card>; }
