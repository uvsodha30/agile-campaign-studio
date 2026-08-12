export type Goal = "Product Launch" | "Brand Awareness" | "Lead Generation" | "Retention";
export type Channel = "Paid Search" | "Social Media" | "Email" | "Programmatic";
export type RiskLevel = "Low" | "Medium" | "High";

export const GOALS: Goal[] = [
  "Product Launch",
  "Brand Awareness",
  "Lead Generation",
  "Retention",
];
export const CHANNELS: Channel[] = ["Paid Search", "Social Media", "Email", "Programmatic"];
export const RISKS: RiskLevel[] = ["Low", "Medium", "High"];

export type SprintWeeks = 4 | 6 | 8 | 12;

export const SPRINT_OPTIONS: { weeks: SprintWeeks; label: string }[] = [
  { weeks: 4, label: "4 Weeks (Quick Launch)" },
  { weeks: 6, label: "6 Weeks (Standard Campaign)" },
  { weeks: 8, label: "8 Weeks (Multi-Channel Launch)" },
  { weeks: 12, label: "12 Weeks (Enterprise Growth Campaign)" },
];

export type BriefInput = {
  name: string;
  goal: Goal;
  channels: Channel[];
  budget: number;
  launchDate: string; // yyyy-mm-dd
  risk: RiskLevel;
  weeks: SprintWeeks;
};

export type SprintWeek = {
  id: string;
  title: string;
  phase: string;
  start: Date;
  end: Date;
  tasks: string[];
};

export type RaidItem = {
  id: string;
  category: "Risk" | "Assumption" | "Issue" | "Dependency";
  level: RiskLevel;
  description: string;
  mitigation: string;
};

export const SPRINT_DURATION_DAYS = 28;

export function sprintDays(weeks: SprintWeeks) {
  return weeks * 7;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

export function parseDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatShort(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}

/** Days between today and launch, floored to the 28-day sprint window. */
export function campaignDurationDays(launchDate: string) {
  const launch = parseDate(launchDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((launch.getTime() - today.getTime()) / 86_400_000);
  return Math.max(diff, 1);
}

/** Total budget spread across the selected sprint duration. */
export function dailyBurnRate(budget: number, weeks: SprintWeeks) {
  return budget / Math.max(sprintDays(weeks), 1);
}

const PHASES = [
  "Discovery & Strategy",
  "Content & Creative Build",
  "Technical & QA",
  "Media Launch",
  "Post-Launch Optimization",
] as const;

const WEEK_TASKS: Record<string, string[]> = {
  "Discovery & Strategy": [
    "Kickoff workshop & stakeholder alignment",
    "Audience research and segment definition",
    "Competitive & channel landscape audit",
    "Confirm KPIs and measurement plan",
  ],
  "Content & Creative Build": [
    "Concept development and messaging matrix",
    "Produce channel-specific creative assets",
    "Build landing pages and content variants",
    "Internal creative review round",
  ],
  "Technical & QA": [
    "Tracking, pixels and attribution validation",
    "Cross-device and cross-browser QA",
    "A/B test variant setup",
    "Legal and brand compliance sign-off",
  ],
  "Media Launch": [
    "Final budget pacing configuration",
    "Staged go-live across channels",
    "Day-1 performance monitoring",
    "Daily pacing and delivery checks",
  ],
  "Post-Launch Optimization": [
    "Creative refresh based on early signals",
    "Reallocate spend to top-performing channels",
    "Audience and bid optimization pass",
    "Performance readout & optimization backlog",
  ],
};

/** Evenly distributes phases across the selected number of weeks. */
export function phasePlan(weeks: SprintWeeks): string[] {
  const phases =
    weeks < PHASES.length ? PHASES.slice(0, weeks) : (PHASES as readonly string[]);
  return Array.from({ length: weeks }, (_, i) =>
    phases[Math.min(Math.floor((i * phases.length) / weeks), phases.length - 1)]!,
  );
}

export function buildSprint(launchDate: string, weeks: SprintWeeks): SprintWeek[] {
  const plan = phasePlan(weeks);
  const launch = parseDate(launchDate);
  const launchWeek = Math.max(plan.indexOf("Media Launch"), 0);
  const start = addDays(launch, -launchWeek * 7);
  return plan.map((phase, i) => ({
    id: `week-${i + 1}`,
    title: `Week ${i + 1}`,
    phase,
    start: addDays(start, i * 7),
    end: addDays(start, i * 7 + 6),
    tasks: WEEK_TASKS[phase] ?? [],
  }));
}

export function launchWeekIndex(weeks: SprintWeeks) {
  return Math.max(phasePlan(weeks).indexOf("Media Launch"), 0);
}

const CHANNEL_RAID: Record<Channel, Omit<RaidItem, "id" | "level">> = {
  "Paid Search": {
    category: "Risk",
    description: "Auction CPC inflation on core keywords erodes efficiency before launch.",
    mitigation: "Lock in bid caps, build a defensive brand-term campaign, review CPCs weekly.",
  },
  "Social Media": {
    category: "Risk",
    description: "Creative fatigue and platform ad-policy rejections delay in-feed placements.",
    mitigation: "Ship 3+ creative variants per placement and pre-submit assets 5 days early.",
  },
  Email: {
    category: "Dependency",
    description: "Deliverability depends on CRM list hygiene and domain warm-up completing on time.",
    mitigation: "Run seed-list tests in Week 3 and stagger sends to protect sender reputation.",
  },
  Programmatic: {
    category: "Issue",
    description: "DSP inventory and brand-safety allowlists are not finalized with the trading desk.",
    mitigation: "Confirm PMP deals in Week 2 and enforce pre-bid brand-safety segments.",
  },
};

export function buildRaid(
  channels: Channel[],
  risk: RiskLevel,
  goal: Goal,
  weeks: SprintWeeks,
): RaidItem[] {
  const order: RiskLevel[] = ["High", "Medium", "Low"];
  /** Longer campaigns add exposure: scale each risk up a level on long sprints. */
  const bump = (level: RiskLevel, steps: number): RiskLevel =>
    order[Math.max(order.indexOf(level) - steps, 0)]!;
  const scale = weeks >= 12 ? 1 : 0;

  const base: RaidItem[] = channels.map((c, i) => ({
    id: `raid-${i}`,
    level: bump(risk, scale),
    ...CHANNEL_RAID[c],
  }));

  base.push({
    id: "raid-goal",
    category: "Assumption",
    level: risk === "High" ? "High" : "Medium",
    description:
      goal === "Product Launch"
        ? `Product availability and launch messaging are locked before the Week ${launchWeekIndex(weeks) + 1} go-live.`
        : goal === "Lead Generation"
          ? "Sales team capacity can absorb forecasted MQL volume within SLA."
          : goal === "Retention"
            ? "Existing customer data is accurate enough for lifecycle segmentation."
            : `Brand guidelines remain stable throughout the ${weeks}-week sprint.`,
    mitigation: "Confirm in the Week 1 kickoff and re-validate at each weekly stand-up.",
  });

  if (risk === "High" || weeks <= 4) {
    base.push({
      id: "raid-budget",
      category: "Risk",
      level: weeks <= 4 ? "High" : "Medium",
      description:
        weeks <= 4
          ? "A 4-week quick launch leaves no contingency if any approval gate slips."
          : "Aggressive delivery targets leave limited contingency across approval gates.",
      mitigation: "Hold 10% budget reserve and pre-book an expedited approval window.",
    });
  }

  if (weeks >= 8) {
    base.push({
      id: "raid-pacing",
      category: "Risk",
      level: weeks >= 12 ? "High" : "Medium",
      description: `A ${weeks}-week runway increases budget-pacing drift and creative fatigue over ${sprintDays(weeks)} days of spend.`,
      mitigation: "Set bi-weekly pacing reviews and schedule a creative refresh mid-flight.",
    });
    base.push({
      id: "raid-stakeholder",
      category: "Dependency",
      level: "Medium",
      description: "Long campaigns risk stakeholder turnover and shifting priorities mid-flight.",
      mitigation: "Lock a monthly steering review with named decision-makers and deputies.",
    });
  }

  const max = weeks >= 8 ? 7 : 5;
  return base
    .slice(0, max)
    .sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level))
    .map((item, i) => ({ ...item, id: `raid-${i}` }));
}

export type SavedBrief = {
  id: string;
  savedAt: string;
  input: BriefInput;
  done: string[];
};

const KEY = "acbs.briefs.v1";

export function loadBriefs(): SavedBrief[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedBrief[]) : [];
  } catch {
    return [];
  }
}

export function persistBriefs(briefs: SavedBrief[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(briefs));
}

export function toJiraMarkdown(input: BriefInput, sprint: SprintWeek[], raid: RaidItem[]) {
  const lines: string[] = [];
  lines.push(`h1. ${input.name} — Campaign Brief`);
  lines.push("");
  lines.push(`*Goal:* ${input.goal}`);
  lines.push(`*Channels:* ${input.channels.join(", ") || "—"}`);
  lines.push(`*Budget:* ${formatCurrency(input.budget)}`);
  lines.push(`*Launch:* ${formatDate(parseDate(input.launchDate))}`);
  lines.push(`*Sprint duration:* ${input.weeks} weeks (${sprintDays(input.weeks)} days)`);
  lines.push(`*Daily burn:* ${formatCurrency(dailyBurnRate(input.budget, input.weeks))}`);
  lines.push(`*Risk sensitivity:* ${input.risk}`);
  lines.push("");
  lines.push("h2. Sprint Plan");
  sprint.forEach((w) => {
    lines.push(`h3. ${w.title}: ${w.phase} (${formatShort(w.start)} – ${formatShort(w.end)})`);
    w.tasks.forEach((t) => lines.push(`* ${t}`));
  });
  lines.push("");
  lines.push("h2. RAID Log");
  lines.push("||Type||Level||Description||Mitigation||");
  raid.forEach((r) =>
    lines.push(`|${r.category}|${r.level}|${r.description}|${r.mitigation}|`),
  );
  return lines.join("\n");
}

export function toAsanaTemplate(input: BriefInput, sprint: SprintWeek[], raid: RaidItem[]) {
  const lines: string[] = [];
  lines.push(`Project: ${input.name}`);
  lines.push(`Notes: ${input.goal} campaign — ${formatCurrency(input.budget)} budget across ${input.channels.join(", ") || "no channels"}.`);
  lines.push("");
  sprint.forEach((w) => {
    lines.push(`Section: ${w.title} — ${w.phase} (due ${formatDate(w.end)})`);
    w.tasks.forEach((t) => lines.push(`  Task: ${t} [due ${formatDate(w.end)}]`));
    lines.push("");
  });
  lines.push("Section: RAID Log");
  raid.forEach((r) =>
    lines.push(`  Task: [${r.category} · ${r.level}] ${r.description} — Mitigation: ${r.mitigation}`),
  );
  return lines.join("\n");
}
