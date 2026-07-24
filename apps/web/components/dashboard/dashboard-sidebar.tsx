"use client";

import Link from "next/link";
import { ChartNoAxesCombined, History, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b bg-card/50 p-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r lg:p-5">
      <div className="flex items-center justify-between gap-3 lg:block">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-transparent text-primary-foreground">
            <img src="/adaptive-icon-master.svg" alt="Arena's Greatest" />
          </span>
          <span className="font-semibold leading-tight">
            Arena&apos;s Greatest
          </span>
        </Link>
        <div className="lg:hidden">
          <UserButton afterSignOutUrl="/login" />
        </div>
      </div>
      <nav className="mt-6 grid grid-cols-3 gap-1 lg:block lg:space-y-1">
        <NavItem
          href="/"
          icon={<Home />}
          label="Dashboard"
          active={pathname === "/"}
        />
        <NavItem
          href="/matches"
          icon={<History />}
          label="Matches"
          active={pathname.startsWith("/matches")}
        />
        <NavItem
          href="/#insights"
          icon={<ChartNoAxesCombined />}
          label="Insights"
          active={false}
        />
      </nav>
      <div className="mt-auto hidden border-t pt-5 lg:block">
        <UserButton afterSignOutUrl="/login" />
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-accent-foreground lg:justify-start lg:text-sm",
        active && "font-medium !text-primary",
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
