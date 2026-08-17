import { Activity, CalendarDays, CheckCircle2, Flame, Gauge, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CHANNEL_SHORT, formatCurrency, formatDate, formatShort, parseDate } from "@/lib/brief";
import type { HealthSummary } from "@/lib/campaign/health";
import type { BudgetAllocation, CampaignConfig, DeliveryPlan, HealthState } from "@/lib/campaign/types";

const HEALTH_STYLES: Record<HealthState, string> = {
  "On Track": "bg-success/20 text-success-foreground ring-1 ring-success/40",
  "At Risk": "bg-warning/25 text-warning-foreground ring-1 ring-warning/50",
  "Off Track": "bg-destructive/25 text-primary-foreground ring-1 ring-destructive/50",
  Complete: "bg-primary-foreground/20 text-primary-foreground ring-1 ring-primary-foreground/30",
};

type Props = {
  config: CampaignConfig;
  plan: DeliveryPlan;
  budget: BudgetAllocation;
  health: HealthSummary;
};

export function ExecutiveBrief({ config, plan, budget, health }: Props) {
  const first = plan.weeks[0];
  const last = plan.weeks[plan.weeks.length - 1];

  return (
    <header
      className="rounded-2xl p-5 text-primary-foreground shadow-[var(--shadow-panel)] sm:p-6"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] opacity-75">Executive Brief</p>
          <h2 className="truncate text-2xl font-bold sm:text-3xl">{config.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="border-0 bg-primary-foreground/15 text-primary-foreground">
              <Target className="mr-1 size-3" /> {config.goal}
            </Badge>
            <Badge className="border-0 bg-primary-foreground/15 text-primary-foreground">
              Risk: {config.risk}
            </Badge>
            <Badge className="border-0 bg-primary-foreground/15 text-primary-foreground">
              {config.weeks}-week program
            </Badge>
            {config.channels.map((c) => (
              <Badge
                key={c}
                className="border-0 bg-primary-foreground/10 text-primary-foreground"
              >
                {CHANNEL_SHORT[c] ?? c}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-3 sm:justify-end">
          <div className={cn("rounded-xl px-4 py-3", HEALTH_STYLES[health.state])}>
            <p className="flex items-center gap-1 text-xs opacity-90">
              <Activity className="size-3" /> Campaign health
            </p>
            <p className="text-lg font-bold">{health.state}</p>
            <p className="max-w-[16rem] text-[11px] leading-snug opacity-85">{health.reason}</p>
          </div>
          <div className="rounded-xl bg-primary-foreground/12 px-4 py-3 text-right">
            <p className="flex items-center justify-end gap-1 text-xs opacity-80">
              <Flame className="size-3" /> Daily burn rate
            </p>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(budget.dailyBurn)}</p>
            <p className="text-xs opacity-75">
              {formatCurrency(budget.total)} over {budget.spendDays} days
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<CalendarDays className="size-3.5" />}
          label="Launch date"
          value={formatDate(parseDate(config.launchDate))}
        />
        <Stat
          icon={<Gauge className="size-3.5" />}
          label="Delivery window"
          value={first && last ? `${formatShort(first.start)} – ${formatShort(last.end)}` : "—"}
        />
        <Stat
          icon={<Activity className="size-3.5" />}
          label="Planning status"
          value={health.planningStatus}
        />
        <Stat
          icon={<CheckCircle2 className="size-3.5" />}
          label="Plan progress"
          value={`${health.progress}% · ${health.completed}/${health.total} tasks`}
        />
      </div>
      <Progress value={health.progress} className="mt-4 h-1.5 bg-primary-foreground/20" />
    </header>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-primary-foreground/10 px-3 py-2">
      <p className="flex items-center gap-1 text-xs opacity-80">
        {icon}
        {label}
      </p>
      <p className="truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
