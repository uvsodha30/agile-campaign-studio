import { sprintDays, type Channel } from "@/lib/brief";
import { scenarioFor } from "./tasks";
import type { BudgetAllocation, BudgetLine, CampaignConfig, ScenarioId } from "./types";

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
};

const CHANNEL_WEIGHTS: Record<Channel, Partial<Record<CatId, number>>> = {
  "Digital Ad Networks (Paid Search, Social, Display)": { paid: 18, martech: 2 },
  "Product-Led / In-App (Onboarding Flows, Pop-ups)": { martech: 12, creative: 4 },
  "Email & Lifecycle Marketing": { martech: 8, creative: 5 },
  "Content & SEO Strategy": { creative: 14, martech: 3 },
  "Developer / Tech Docs & API Portals": { martech: 14, creative: 3 },
  "Outbound Sales Enablement & Events": { events: 16, creative: 3 },
};

export function contingencyPercent(config: CampaignConfig) {
  let c = config.risk === "High" ? 15 : config.risk === "Low" ? 8 : 10;
  if (config.weeks >= 12) c += 2;
  return c;
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
  const sum = (Object.values(weights) as number[]).reduce((a, b) => a + b, 0) || 1;

  const ids = (Object.keys(weights) as CatId[]).filter((k) => weights[k] > 0);
  const raw = ids.map((id) => ({ id, pct: (weights[id] / sum) * available }));

  // Round percentages to 1 decimal, push drift into the largest line.
  const rounded = raw.map((r) => ({ ...r, pct: Math.round(r.pct * 10) / 10 }));
  const drift = Math.round((available - rounded.reduce((a, b) => a + b.pct, 0)) * 10) / 10;
  const largest = rounded.reduce((a, b) => (b.pct > a.pct ? b : a), rounded[0]!);
  largest.pct = Math.round((largest.pct + drift) * 10) / 10;

  const total = Math.max(0, Math.round(config.budget));
  const lines: BudgetLine[] = rounded.map((r) => ({
    id: r.id,
    category: CATEGORY_LABEL[r.id],
    percent: r.pct,
    amount: Math.round((total * r.pct) / 100),
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
