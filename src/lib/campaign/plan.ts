import { addDays, parseDate, type SprintWeeks } from "@/lib/brief";
import {
  CHANNEL_TASKS,
  LAUNCH_BLUEPRINT_INDEX,
  PHASE_NAMES,
  TASK_LIBRARIES,
  WEEK_SELECTION,
  phaseIndexFor,
  scenarioFor,
} from "./tasks";
import type { CampaignConfig, CampaignPhase, CampaignWeek, DeliveryPlan } from "./types";

export function planLabel(weeks: SprintWeeks) {
  return `${weeks}-Week Campaign Delivery Plan`;
}

/** Deterministic delivery plan: unique weekly tasks, grouped into agile phases. */
export function buildDeliveryPlan(config: CampaignConfig): DeliveryPlan {
  const library = TASK_LIBRARIES[scenarioFor(config.goal, config.presetId)];
  const selection = WEEK_SELECTION[config.weeks] ?? WEEK_SELECTION[12]!;
  const launchPos = Math.max(selection.indexOf(LAUNCH_BLUEPRINT_INDEX), 0);
  const launch = parseDate(config.launchDate);
  const planStart = addDays(launch, -launchPos * 7);

  const weeks: CampaignWeek[] = selection.map((blueprintIndex, i) => {
    const bp = library[blueprintIndex]!;
    const extras = config.channels
      .map((c) => CHANNEL_TASKS[c]?.[bp.key])
      .filter((t): t is string => Boolean(t));

    const labels = [...bp.tasks];
    for (const extra of extras) if (!labels.includes(extra)) labels.push(extra);

    return {
      id: `w${i + 1}-${bp.key}`,
      index: i + 1,
      title: `Week ${i + 1} — ${bp.title}`,
      start: addDays(planStart, i * 7),
      end: addDays(planStart, i * 7 + 6),
      isLaunchWeek: blueprintIndex === LAUNCH_BLUEPRINT_INDEX,
      tasks: labels.map((label, ti) => ({
        id: `w${i + 1}-${bp.key}:${ti}`,
        label,
        critical:
          (bp.critical?.includes(ti) ?? false) ||
          (blueprintIndex === LAUNCH_BLUEPRINT_INDEX && ti < 2),
      })),
    };
  });

  const phases: CampaignPhase[] = [];
  selection.forEach((blueprintIndex, i) => {
    const pi = phaseIndexFor(blueprintIndex);
    const name = PHASE_NAMES[pi]!;
    let phase = phases.find((p) => p.name === name);
    if (!phase) {
      phase = { id: `phase-${pi}`, order: "", name, weeks: [] };
      phases.push(phase);
    }
    phase.weeks.push(weeks[i]!);
  });
  phases.forEach((p, i) => {
    p.order = `S${i + 1}`;
    p.name = `Sprint ${i + 1} — ${p.name}`;
  });

  return {
    label: planLabel(config.weeks),
    phases,
    weeks,
    totalTasks: weeks.reduce((n, w) => n + w.tasks.length, 0),
  };
}

export function countDone(tasks: { id: string }[], done: string[]) {
  const set = new Set(done);
  return tasks.filter((t) => set.has(t.id)).length;
}

export function weekRangeLabel(phase: CampaignPhase) {
  const first = phase.weeks[0]!.index;
  const last = phase.weeks[phase.weeks.length - 1]!.index;
  return first === last ? `Week ${first}` : `Weeks ${first}–${last}`;
}
