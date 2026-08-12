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

export type BriefInput = {
  name: string;
  goal: Goal;
  channels: Channel[];
  budget: number;
  launchDate: string; // yyyy-mm-dd
  risk: RiskLevel;
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

export function dailyBurnRate(budget: number, launchDate: string) {
  const days = Math.max(campaignDurationDays(launchDate), SPRINT_DURATION_DAYS);
  return budget / days;
}

const WEEK_TASKS: Record<string, string[]> = {
  Discovery: [
    "Kickoff workshop & stakeholder alignment",
    "Audience research and segment definition",
    "Competitive & channel landscape audit",
    "Confirm KPIs and measurement plan",
  ],
  "Creative/Tech": [
    "Concept development and messaging matrix",
    "Produce channel-specific creative assets",
    "Build landing pages & tracking pixels",
    "Internal creative review round",
  ],
  "QA & Testing": [
    "Cross-device and cross-browser QA",
    "Tracking / attribution validation",
    "A/B test variant setup",
    "Legal and brand compliance sign-off",
  ],
  Launch: [
    "Final budget pacing configuration",
    "Staged go-live across channels",
    "Day-1 performance monitoring",
    "Post-launch retro & optimization backlog",
  ],
};

export function buildSprint(launchDate: string): SprintWeek[] {
  const launch = parseDate(launchDate);
  const start = addDays(launch, -SPRINT_DURATION_DAYS);
  const phases = ["Discovery", "Creative/Tech", "QA & Testing", "Launch"];
  return phases.map((phase, i) => ({
    id: `week-${i + 1}`,
    title: `Week ${i + 1}`,
    phase,
    start: addDays(start, i * 7),
    end: addDays(start, i * 7 + 6),
    tasks: WEEK_TASKS[phase] ?? [],
  }));
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

export function buildRaid(channels: Channel[], risk: RiskLevel, goal: Goal): RaidItem[] {
  const base: RaidItem[] = channels.map((c, i) => ({
    id: `raid-${i}`,
    level: risk,
    ...CHANNEL_RAID[c],
  }));

  base.push({
    id: "raid-goal",
    category: "Assumption",
    level: risk === "High" ? "High" : "Medium",
    description:
      goal === "Product Launch"
        ? "Product availability and launch messaging are locked before Week 4 go-live."
        : goal === "Lead Generation"
          ? "Sales team capacity can absorb forecasted MQL volume within SLA."
          : goal === "Retention"
            ? "Existing customer data is accurate enough for lifecycle segmentation."
            : "Brand guidelines remain stable throughout the 4-week sprint.",
    mitigation: "Confirm in the Week 1 kickoff and re-validate at each weekly stand-up.",
  });

  if (risk === "High") {
    base.push({
      id: "raid-budget",
      category: "Risk",
      level: "High",
      description: "Aggressive timeline leaves no contingency if any approval gate slips.",
      mitigation: "Hold 10% budget reserve and pre-book an expedited approval window.",
    });
  }

  const order: RiskLevel[] = ["High", "Medium", "Low"];
  return base
    .slice(0, 5)
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
  lines.push(`*Daily burn:* ${formatCurrency(dailyBurnRate(input.budget, input.launchDate))}`);
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
