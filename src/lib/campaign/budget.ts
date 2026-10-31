import { sprintDays, type Channel } from "@/lib/brief";
import { scenarioFor } from "./tasks";
import type {
  BudgetAllocation,
  BudgetLine,
  CampaignConfig,
  CustomBudgetLine,
  ScenarioId,
} from "./types";

type CatId = "paid" | "creative" | "martech" | "events";

const CATEGORY_LABEL: Record<CatId, string> = {
  paid: "Paid Media",
  creative: "Creative & Content",
  martech: "Marketing Technology / Production",
  events: "Events / Enablement",
};

const BASE: Record<ScenarioId, Record<CatId, number>> = {
  marketing: { paid: 50, creative: 20, martech: 15, events: 5 },
  saas: { paid: 30, creative: 22, martech: 28, events: 10 },
  ecom: { paid: 55, creative: 20, martech: 12, events: 3 },
  it: { paid: 10, creative: 18, martech: 45, events: 17 },
  program: { paid: 5, creative: 12, martech: 10, events: 60 },
  ailaunch: { paid: 8, creative: 12, martech: 55, events: 8 },
};

const CHANNEL_WEIGHTS: Record<Channel, Partial<Record<CatId, number>>> = {
  "Digital Ad Networks (Paid Search, Social, Display)": { paid: 18, martech: 2 },
  "Product-Led / In-App (Onboarding Flows, Pop-ups)": { martech: 12, creative: 4 },
  "Email & Lifecycle Marketing": { martech: 8, creative: 5 },
  "Content & SEO Strategy": { creative: 14, martech: 3 },
  "Developer / Tech Docs & API Portals": { martech: 14, creative: 3 },
  "Outbound Sales Enablement & Events": { events: 16, creative: 3 },
  "Community & Partner Outreach (University Groups, Referrals)": { events: 8, creative: 4 },
};

export function contingencyPercent(config: CampaignConfig) {
  let c = config.risk === "High" ? 15 : config.risk === "Low" ? 8 : 10;
  if (config.weeks >= 12) c += 2;
  return c;
}

/**
 * Distributes `available` percent across items proportional to weight, rounded to 1
 * decimal, with rounding drift pushed into the largest share so the total is exact.
 */
function distributePercents<T extends { weight: number }>(
  items: T[],
  available: number,
): (T & { percent: number })[] {
  if (items.length === 0) return [];
  const sum = items.reduce((a, b) => a + b.weight, 0) || 1;
  const raw = items.map((it) => ({ ...it, percent: (it.weight / sum) * available }));
  const rounded = raw.map((r) => ({ ...r, percent: Math.round(r.percent * 10) / 10 }));
  const drift = Math.round((available - rounded.reduce((a, b) => a + b.percent, 0)) * 10) / 10;
  const largest = rounded.reduce((a, b) => (b.percent > a.percent ? b : a), rounded[0]!);
  largest.percent = Math.round((largest.percent + drift) * 10) / 10;
  return rounded;
}

/** Deterministic allocation: always sums to 100% and to the exact total budget. */
export function buildBudget(config: CampaignConfig): BudgetAllocation {
  const scenario = scenarioFor(config.goal, config.presetId);
  const weights: Record<CatId, number> = { ...BASE[scenario] };
  for (const ch of config.channels) {
    const bump = CHANNEL_WEIGHTS[ch];
    if (!bump) continue;
    (Object.keys(bump) as CatId[]).forEach((k) => {
      weights[k] += bump[k]!;
    });
  }

  const contingency = contingencyPercent(config);
  const available = 100 - contingency;
  const ids = (Object.keys(weights) as CatId[]).filter((k) => weights[k] > 0);
  const withPercents = distributePercents(
    ids.map((id) => ({ id, category: CATEGORY_LABEL[id], weight: weights[id] })),
    available,
  );

  const total = Math.max(0, Math.round(config.budget));
  const lines: BudgetLine[] = withPercents.map((r) => ({
    id: r.id,
    category: r.category,
    percent: r.percent,
    amount: Math.round((total * r.percent) / 100),
  }));

  const contingencyAmount = total - lines.reduce((a, b) => a + b.amount, 0);
  lines.push({
    id: "contingency",
    category: "Contingency Reserve",
    percent: Math.round((100 - lines.reduce((a, b) => a + b.percent, 0)) * 10) / 10,
    amount: contingencyAmount,
  });

  const spendDays = sprintDays(config.weeks);
  return {
    lines,
    total,
    planned: total - contingencyAmount,
    contingency: contingencyAmount,
    dailyBurn: total / Math.max(spendDays, 1),
    spendDays,
  };
}

export type BudgetEdits = {
  /** Percent overrides keyed by line id (generated or custom). */
  overrides: Record<string, number>;
  /** User-added categories; percent for these lives in `overrides`. */
  customLines: CustomBudgetLine[];
  /** Generated line ids to hide. "contingency" is never removable. */
  removedIds: string[];
};

/**
 * Layers user edits onto a generated allocation. Non-overridden lines rebalance
 * proportionally so percentages always sum to 100 and amounts always sum to the
 * total budget. The contingency line can be overridden but never removed, so
 * `planned`/`contingency` stay well-defined.
 */
export function applyBudgetEdits(base: BudgetAllocation, edits: BudgetEdits): BudgetAllocation {
  const removedIds = edits.removedIds.filter((id) => id !== "contingency");
  const kept = base.lines.filter((l) => !removedIds.includes(l.id));
  const custom = edits.customLines
    .filter((c) => !kept.some((l) => l.id === c.id))
    .map((c) => ({ id: c.id, category: c.category, percent: 0 }));
  const merged = [...kept, ...custom];

  const clampPercent = (n: number) => Math.min(Math.max(n, 0), 100);
  const overridden = merged.filter((l) => l.id in edits.overrides);
  const free = merged.filter((l) => !(l.id in edits.overrides));

  const rawOverriddenSum = overridden.reduce((a, l) => a + clampPercent(edits.overrides[l.id]!), 0);
  const scale = rawOverriddenSum > 100 ? 100 / rawOverriddenSum : 1;
  const overriddenResolved = overridden.map((l) => ({
    id: l.id,
    category: l.category,
    percent: Math.round(clampPercent(edits.overrides[l.id]!) * scale * 10) / 10,
  }));
  const overriddenSum = overriddenResolved.reduce((a, l) => a + l.percent, 0);
  const remaining = Math.max(0, Math.round((100 - overriddenSum) * 10) / 10);

  const freeResolved = distributePercents(
    free.map((l) => ({ id: l.id, category: l.category, weight: l.percent || 1 })),
    remaining,
  ).map(({ weight, ...rest }) => rest);

  const withPercents = [...overriddenResolved, ...freeResolved];

  const total = base.total;
  const nonContingency = withPercents.filter((l) => l.id !== "contingency");
  const contingencyPct = withPercents.find((l) => l.id === "contingency")?.percent ?? 0;

  const linesWithAmounts: BudgetLine[] = nonContingency.map((l) => ({
    id: l.id,
    category: l.category,
    percent: l.percent,
    amount: Math.round((total * l.percent) / 100),
  }));
  const contingencyAmount = total - linesWithAmounts.reduce((a, l) => a + l.amount, 0);

  const orderIndex = new Map(merged.map((l, i) => [l.id, i]));
  const lines: BudgetLine[] = [
    ...linesWithAmounts,
    {
      id: "contingency",
      category: "Contingency Reserve",
      percent: contingencyPct,
      amount: contingencyAmount,
    },
  ].sort((a, b) => {
    if (a.id === "contingency") return 1;
    if (b.id === "contingency") return -1;
    return (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0);
  });

  return {
    lines,
    total,
    planned: total - contingencyAmount,
    contingency: contingencyAmount,
    dailyBurn: base.dailyBurn,
    spendDays: base.spendDays,
  };
}
