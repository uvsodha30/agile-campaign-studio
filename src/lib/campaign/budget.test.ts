import { describe, expect, it } from "vitest";

import { applyBudgetEdits, buildBudget, type BudgetEdits } from "./budget";
import type { BudgetAllocation, CampaignConfig } from "./types";

function makeConfig(overrides: Partial<CampaignConfig> = {}): CampaignConfig {
  return {
    name: "Test Campaign",
    goal: "SaaS Product Launch (PLG & User Onboarding)",
    channels: ["Product-Led / In-App (Onboarding Flows, Pop-ups)", "Email & Lifecycle Marketing"],
    budget: 60000,
    launchDate: "2026-09-23",
    risk: "Medium",
    weeks: 6,
    presetId: "saas",
    ...overrides,
  };
}

const sumPercents = (b: BudgetAllocation) => b.lines.reduce((a, l) => a + l.percent, 0);
const sumAmounts = (b: BudgetAllocation) => b.lines.reduce((a, l) => a + l.amount, 0);
const noEdits: BudgetEdits = { overrides: {}, customLines: [], removedIds: [] };

describe("buildBudget", () => {
  it("always sums percents to 100 and amounts to the exact total", () => {
    const budget = buildBudget(makeConfig());
    expect(sumPercents(budget)).toBeCloseTo(100, 5);
    expect(sumAmounts(budget)).toBe(budget.total);
  });

  it("includes a contingency line", () => {
    const budget = buildBudget(makeConfig());
    expect(budget.lines.some((l) => l.id === "contingency")).toBe(true);
  });
});

describe("applyBudgetEdits", () => {
  it("is a no-op (still sums to 100/total) when there are no edits", () => {
    const base = buildBudget(makeConfig());
    const result = applyBudgetEdits(base, noEdits);
    expect(sumPercents(result)).toBeCloseTo(100, 5);
    expect(sumAmounts(result)).toBe(result.total);
    expect(result.lines.map((l) => l.id).sort()).toEqual(base.lines.map((l) => l.id).sort());
  });

  it("rebalances non-overridden lines proportionally when one line is overridden", () => {
    const base = buildBudget(makeConfig());
    const firstId = base.lines[0]!.id;
    const otherIds = base.lines.slice(1).map((l) => l.id);
    const otherBaseSum = base.lines.slice(1).reduce((a, l) => a + l.percent, 0);

    const result = applyBudgetEdits(base, { ...noEdits, overrides: { [firstId]: 40 } });

    expect(sumPercents(result)).toBeCloseTo(100, 5);
    expect(sumAmounts(result)).toBe(result.total);
    expect(result.lines.find((l) => l.id === firstId)!.percent).toBe(40);

    // Each non-overridden line should keep its original relative share of the remainder.
    const scale = (100 - 40) / otherBaseSum;
    for (const id of otherIds) {
      const basePct = base.lines.find((l) => l.id === id)!.percent;
      const resultPct = result.lines.find((l) => l.id === id)!.percent;
      expect(resultPct).toBeCloseTo(basePct * scale, 0);
    }
  });

  it("clamps and scales down overrides that individually or together exceed 100", () => {
    const base = buildBudget(makeConfig());
    const [firstId, secondId] = base.lines.map((l) => l.id);
    const result = applyBudgetEdits(base, {
      ...noEdits,
      overrides: { [firstId!]: 70, [secondId!]: 70 },
    });

    expect(sumPercents(result)).toBeCloseTo(100, 5);
    // 70/70 requested in a 1:1 ratio should scale down to roughly 50/50.
    const a = result.lines.find((l) => l.id === firstId)!.percent;
    const b = result.lines.find((l) => l.id === secondId)!.percent;
    expect(a).toBeCloseTo(b, 0);
  });

  it("adds a custom line and still sums to 100/total", () => {
    const base = buildBudget(makeConfig());
    const result = applyBudgetEdits(base, {
      overrides: { influencer: 10 },
      customLines: [{ id: "influencer", category: "Influencer" }],
      removedIds: [],
    });

    expect(result.lines.some((l) => l.id === "influencer")).toBe(true);
    expect(result.lines.find((l) => l.id === "influencer")!.percent).toBe(10);
    expect(sumPercents(result)).toBeCloseTo(100, 5);
    expect(sumAmounts(result)).toBe(result.total);
  });

  it("removing a non-contingency line redistributes its share and drops it", () => {
    const base = buildBudget(makeConfig());
    const removedId = base.lines.find((l) => l.id !== "contingency")!.id;

    const result = applyBudgetEdits(base, { ...noEdits, removedIds: [removedId] });

    expect(result.lines.some((l) => l.id === removedId)).toBe(false);
    expect(sumPercents(result)).toBeCloseTo(100, 5);
    expect(sumAmounts(result)).toBe(result.total);
  });

  it("never removes the contingency line even if asked to", () => {
    const base = buildBudget(makeConfig());
    const result = applyBudgetEdits(base, { ...noEdits, removedIds: ["contingency"] });

    expect(result.lines.some((l) => l.id === "contingency")).toBe(true);
    expect(result.planned + result.contingency).toBe(result.total);
  });
});
