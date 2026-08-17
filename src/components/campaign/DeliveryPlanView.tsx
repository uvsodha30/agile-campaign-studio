import { ChevronDown, Rocket } from "lucide-react";
import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatShort } from "@/lib/brief";
import { countDone, weekRangeLabel } from "@/lib/campaign/plan";
import type { CampaignPhase, DeliveryPlan } from "@/lib/campaign/types";

type Props = {
  plan: DeliveryPlan;
  done: string[];
  onToggle: (taskId: string, next: boolean) => void;
};

export function DeliveryPlanView({ plan, done, onToggle }: Props) {
  const [open, setOpen] = useState<string[]>(() => plan.phases.map((p) => p.id).slice(0, 2));
  const completed = countDone(plan.weeks.flatMap((w) => w.tasks), done);
  const allOpen = open.length === plan.phases.length;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {plan.label}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Overall campaign: {completed}/{plan.totalTasks} tasks complete
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(allOpen ? [] : plan.phases.map((p) => p.id))}
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {plan.phases.map((phase) => (
          <PhaseAccordion
            key={phase.id}
            phase={phase}
            done={done}
            expanded={open.includes(phase.id)}
            onExpand={() =>
              setOpen((o) =>
                o.includes(phase.id) ? o.filter((x) => x !== phase.id) : [...o, phase.id],
              )
            }
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  );
}

function PhaseAccordion({
  phase,
  done,
  expanded,
  onExpand,
  onToggle,
}: {
  phase: CampaignPhase;
  done: string[];
  expanded: boolean;
  onExpand: () => void;
  onToggle: (taskId: string, next: boolean) => void;
}) {
  const tasks = phase.weeks.flatMap((w) => w.tasks);
  const complete = countDone(tasks, done);
  const full = complete === tasks.length;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <button
        type="button"
        onClick={onExpand}
        aria-expanded={expanded}
        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 bg-secondary/50 px-4 py-3 text-left transition-colors hover:bg-secondary"
      >
        <span className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
          {phase.order}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{phase.name}</span>
          <span className="block text-xs text-muted-foreground">{weekRangeLabel(phase)}</span>
        </span>
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-1 text-xs font-semibold",
              full ? "bg-success/15 text-success" : "bg-primary/10 text-primary",
            )}
          >
            {complete}/{tasks.length}
          </span>
          <ChevronDown
            className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")}
          />
        </span>
      </button>

      {expanded && (
        <div className="grid gap-4 p-4 md:grid-cols-2">
          {phase.weeks.map((week) => {
            const weekDone = countDone(week.tasks, done);
            return (
              <div
                key={week.id}
                className="rounded-xl border border-border bg-secondary/40 p-4 transition-colors hover:border-primary/40"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{week.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatShort(week.start)} – {formatShort(week.end)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-1 text-xs font-semibold",
                      weekDone === week.tasks.length
                        ? "bg-success/15 text-success"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {weekDone}/{week.tasks.length}
                  </span>
                </div>

                {week.isLaunchWeek && (
                  <p className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
                    <Rocket className="size-3" /> Go-live week
                  </p>
                )}

                <ul className="mt-3 space-y-2">
                  {week.tasks.map((task) => {
                    const checked = done.includes(task.id);
                    return (
                      <li key={task.id} className="flex items-start gap-2">
                        <Checkbox
                          id={task.id}
                          checked={checked}
                          onCheckedChange={(v) => onToggle(task.id, Boolean(v))}
                          className="mt-0.5 shrink-0"
                        />
                        <label
                          htmlFor={task.id}
                          className={cn(
                            "min-w-0 cursor-pointer text-sm leading-snug",
                            checked && "text-muted-foreground line-through",
                          )}
                        >
                          {task.label}
                          {task.critical && !checked && (
                            <span className="ml-1.5 rounded bg-warning/20 px-1 py-0.5 text-[10px] font-semibold uppercase text-warning-foreground">
                              Critical
                            </span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
