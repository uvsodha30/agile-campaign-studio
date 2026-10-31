import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/brief";
import type { BudgetAllocation } from "@/lib/campaign/types";
import {
  budgetPercentSchema,
  customBudgetLineSchema,
  type CustomBudgetLineInput,
  validate,
} from "@/lib/campaign/validation";

type Props = {
  budget: BudgetAllocation;
  onPercentChange: (id: string, percent: number) => void;
  onAddLine: (input: CustomBudgetLineInput) => void;
  onRemoveLine: (id: string) => void;
};

export function BudgetAllocationCard({ budget, onPercentChange, onAddLine, onRemoveLine }: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const commitPercent = (id: string) => {
    const raw = drafts[id];
    if (raw === undefined) return;
    const result = validate(budgetPercentSchema, raw);
    if (!result.ok) {
      setErrors((e) => ({ ...e, [id]: result.error }));
      return;
    }
    setErrors((e) => {
      const { [id]: _removed, ...rest } = e;
      return rest;
    });
    setDrafts((d) => {
      const { [id]: _removed, ...rest } = d;
      return rest;
    });
    onPercentChange(id, result.value);
  };

  const [category, setCategory] = useState("");
  const [percent, setPercent] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  const handleAdd = () => {
    const result = validate(customBudgetLineSchema, { category, percent });
    if (!result.ok) {
      setAddError(result.error);
      return;
    }
    onAddLine(result.value);
    setCategory("");
    setPercent("");
    setAddError(null);
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)]">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Budget Allocation &amp; Pacing
      </h3>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total budget" value={formatCurrency(budget.total)} />
        <Metric label="Planned allocation" value={formatCurrency(budget.planned)} />
        <Metric label="Contingency reserve" value={formatCurrency(budget.contingency)} />
        <Metric
          label="Daily burn rate"
          value={formatCurrency(budget.dailyBurn)}
          hint={`over ${budget.spendDays} days`}
        />
      </div>

      <ul className="mt-4 space-y-2">
        {budget.lines.map((line) => (
          <li key={line.id} className="rounded-xl border border-border bg-secondary/40 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">{line.category}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(line.amount)}
                </span>
                <Input
                  aria-label={`${line.category} percent`}
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={drafts[line.id] ?? String(line.percent)}
                  onChange={(e) => setDrafts((d) => ({ ...d, [line.id]: e.target.value }))}
                  onBlur={() => commitPercent(line.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitPercent(line.id);
                  }}
                  className="h-8 w-20 bg-card text-right"
                />
                <span className="text-sm text-muted-foreground">%</span>
                {line.id !== "contingency" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => onRemoveLine(line.id)}
                    aria-label={`Remove ${line.category}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
            {errors[line.id] && <p className="mt-1 text-xs text-destructive">{errors[line.id]}</p>}
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(line.percent, 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-xl border border-dashed border-border p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Add category
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_8rem_auto]">
          <Input
            aria-label="Custom budget category"
            placeholder="Category name"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-8 bg-card"
          />
          <Input
            aria-label="Custom budget category percent"
            type="number"
            min={0}
            max={100}
            step={0.5}
            placeholder="%"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            className="h-8 bg-card"
          />
          <Button size="sm" className="h-8" onClick={handleAdd}>
            <Plus className="mr-1 size-3.5" /> Add
          </Button>
        </div>
        {addError && <p className="mt-2 text-xs text-destructive">{addError}</p>}
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          Adding or editing a line rebalances the other categories so the total always stays at 100%
          of the budget.
        </p>
      </div>
    </section>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
