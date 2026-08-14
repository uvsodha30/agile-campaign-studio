import type {
  DeliveryPlan,
  HealthState,
  PlanningStatus,
  RAIDItem,
  RaidStatus,
} from "./types";

const UNRESOLVED: RaidStatus[] = ["Open", "Monitoring"];

export type HealthSummary = {
  state: HealthState;
  reason: string;
  expected: number;
  completed: number;
  total: number;
  progress: number;
  planningStatus: PlanningStatus;
};

/** Tasks that should be complete given today's date (weeks fully elapsed). */
function expectedTasks(plan: DeliveryPlan, today: Date) {
  return plan.weeks
    .filter((w) => w.end.getTime() < today.getTime())
    .reduce((n, w) => n + w.tasks.length, 0);
}

function planningStatusFor(plan: DeliveryPlan, today: Date, allDone: boolean): PlanningStatus {
  if (allDone) return "Complete";
  const current = plan.weeks.find((w) => today.getTime() <= w.end.getTime());
  if (!current) return "Complete";
  const launchIndex = plan.weeks.find((w) => w.isLaunchWeek)?.index ?? plan.weeks.length;
  if (current.index === launchIndex) return "Live";
  if (current.index > launchIndex) return "Optimization";
  const ratio = current.index / Math.max(launchIndex, 1);
  if (ratio <= 0.4) return "Planning";
  if (ratio <= 0.7) return "Creative Production";
  return "QA / Launch Readiness";
}

export function computeHealth(
  plan: DeliveryPlan,
  raid: RAIDItem[],
  done: string[],
  now: Date = new Date(),
): HealthSummary {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const doneSet = new Set(done);
  const total = plan.totalTasks;
  const completed = plan.weeks.reduce(
    (n, w) => n + w.tasks.filter((t) => doneSet.has(t.id)).length,
    0,
  );
  const expected = expectedTasks(plan, today);
  const progress = total ? Math.round((completed / total) * 100) : 0;

  const unresolvedHigh = raid.filter(
    (r) => r.severity === "High" && UNRESOLVED.includes(r.status),
  );
  const unresolvedHighIssue = unresolvedHigh.some(
    (r) => r.type === "Issue" || r.type === "Risk",
  );

  const launchWeek = plan.weeks.find((w) => w.isLaunchWeek);
  const criticalPending = plan.weeks
    .filter((w) => !launchWeek || w.index <= launchWeek.index)
    .flatMap((w) => w.tasks.filter((t) => t.critical && !doneSet.has(t.id)));
  const nearLaunch =
    !!launchWeek && today.getTime() >= launchWeek.start.getTime() - 7 * 86_400_000;

  const allCriticalDone = plan.weeks
    .flatMap((w) => w.tasks.filter((t) => t.critical))
    .every((t) => doneSet.has(t.id));
  const pastFinalWeek =
    plan.weeks.length > 0 &&
    today.getTime() > plan.weeks[plan.weeks.length - 1]!.end.getTime();

  const planningStatus = planningStatusFor(plan, today, completed === total && total > 0);

  if (total > 0 && (completed === total || (allCriticalDone && pastFinalWeek))) {
    return {
      state: "Complete",
      reason: "All critical tasks are complete and the plan has passed its final reporting week.",
      expected,
      completed,
      total,
      progress,
      planningStatus: "Complete",
    };
  }

  if (nearLaunch && criticalPending.length > 0) {
    return {
      state: "Off Track",
      reason: `${criticalPending.length} launch-critical task${criticalPending.length === 1 ? "" : "s"} still open close to go-live.`,
      expected,
      completed,
      total,
      progress,
      planningStatus,
    };
  }

  if (unresolvedHighIssue && completed < expected) {
    return {
      state: "Off Track",
      reason: "Unresolved high-severity issue combined with overdue delivery tasks.",
      expected,
      completed,
      total,
      progress,
      planningStatus,
    };
  }

  const shortfall = expected - completed;
  if (shortfall > 2 || unresolvedHigh.length > 0) {
    return {
      state: "At Risk",
      reason:
        shortfall > 2
          ? `${shortfall} scheduled tasks are overdue against the plan.`
          : `${unresolvedHigh.length} unresolved high-severity RAID item${unresolvedHigh.length === 1 ? "" : "s"}.`,
      expected,
      completed,
      total,
      progress,
      planningStatus,
    };
  }

  return {
    state: "On Track",
    reason: "Scheduled tasks are on plan with no unresolved high-severity items.",
    expected,
    completed,
    total,
    progress,
    planningStatus,
  };
}
