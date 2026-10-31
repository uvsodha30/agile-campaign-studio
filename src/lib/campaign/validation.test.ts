import { describe, expect, it } from "vitest";

import {
  budgetAmountSchema,
  budgetPercentSchema,
  customBudgetLineSchema,
  customKpiSchema,
  kpiTargetSchema,
  validate,
} from "./validation";

describe("budgetAmountSchema", () => {
  it("accepts a positive finite number", () => {
    expect(budgetAmountSchema.safeParse("60000").success).toBe(true);
    expect(budgetAmountSchema.safeParse(1).success).toBe(true);
  });

  it("rejects zero, blank, negative and non-numeric input", () => {
    expect(budgetAmountSchema.safeParse("").success).toBe(false);
    expect(budgetAmountSchema.safeParse("0").success).toBe(false);
    expect(budgetAmountSchema.safeParse("-500").success).toBe(false);
    expect(budgetAmountSchema.safeParse("abc").success).toBe(false);
    expect(budgetAmountSchema.safeParse(Infinity).success).toBe(false);
  });
});

describe("budgetPercentSchema", () => {
  it("accepts values within 0-100 inclusive", () => {
    expect(budgetPercentSchema.safeParse("0").success).toBe(true);
    expect(budgetPercentSchema.safeParse("100").success).toBe(true);
    expect(budgetPercentSchema.safeParse("42.5").success).toBe(true);
  });

  it("rejects out-of-range or non-numeric input", () => {
    expect(budgetPercentSchema.safeParse("-1").success).toBe(false);
    expect(budgetPercentSchema.safeParse("100.1").success).toBe(false);
    expect(budgetPercentSchema.safeParse("nope").success).toBe(false);
  });
});

describe("kpiTargetSchema", () => {
  it("rejects empty or whitespace-only strings", () => {
    expect(kpiTargetSchema.safeParse("").success).toBe(false);
    expect(kpiTargetSchema.safeParse("   ").success).toBe(false);
  });

  it("trims and accepts real content", () => {
    const result = kpiTargetSchema.safeParse("  ≥ 4%  ");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe("≥ 4%");
  });
});

describe("customKpiSchema", () => {
  it("requires name, target and source", () => {
    expect(customKpiSchema.safeParse({ name: "", target: "10", source: "CRM" }).success).toBe(
      false,
    );
    expect(customKpiSchema.safeParse({ name: "Leads", target: "", source: "CRM" }).success).toBe(
      false,
    );
    expect(customKpiSchema.safeParse({ name: "Leads", target: "10", source: "" }).success).toBe(
      false,
    );
    expect(customKpiSchema.safeParse({ name: "Leads", target: "10", source: "CRM" }).success).toBe(
      true,
    );
  });
});

describe("customBudgetLineSchema", () => {
  it("requires a category and a valid percent", () => {
    expect(customBudgetLineSchema.safeParse({ category: "", percent: "10" }).success).toBe(false);
    expect(
      customBudgetLineSchema.safeParse({ category: "Influencer", percent: "150" }).success,
    ).toBe(false);
    expect(
      customBudgetLineSchema.safeParse({ category: "Influencer", percent: "10" }).success,
    ).toBe(true);
  });
});

describe("validate", () => {
  it("returns ok with the parsed value on success", () => {
    const result = validate(budgetAmountSchema, "1000");
    expect(result).toEqual({ ok: true, value: 1000 });
  });

  it("returns the first issue message as a display-ready string on failure", () => {
    const result = validate(budgetAmountSchema, "-5");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Budget must be greater than $0");
  });
});
