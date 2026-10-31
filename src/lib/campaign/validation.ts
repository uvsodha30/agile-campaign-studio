import { z } from "zod";

/** Total campaign budget: must be a finite positive number. */
export const budgetAmountSchema = z.coerce
  .number({ invalid_type_error: "Enter a valid number" })
  .finite("Enter a valid number")
  .gt(0, "Budget must be greater than $0");

/** A single budget line's percent share of the total. */
export const budgetPercentSchema = z.coerce
  .number({ invalid_type_error: "Enter a valid number" })
  .finite("Enter a valid number")
  .min(0, "Must be 0 or more")
  .max(100, "Must be 100 or less");

/** Free-text KPI planning target — just needs real content. */
export const kpiTargetSchema = z.string().trim().min(1, "Target is required");

export const customKpiSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  target: kpiTargetSchema,
  source: z.string().trim().min(1, "Source is required"),
});
export type CustomKpiInput = z.infer<typeof customKpiSchema>;

export const customBudgetLineSchema = z.object({
  category: z.string().trim().min(1, "Category is required"),
  percent: budgetPercentSchema,
});
export type CustomBudgetLineInput = z.infer<typeof customBudgetLineSchema>;

/** Runs a schema and returns either the parsed value or a single display-ready error string. */
export function validate<T>(
  schema: z.ZodType<T>,
  value: unknown,
): { ok: true; value: T } | { ok: false; error: string } {
  const result = schema.safeParse(value);
  if (result.success) return { ok: true, value: result.data };
  return { ok: false, error: result.error.issues[0]?.message ?? "Invalid value" };
}
