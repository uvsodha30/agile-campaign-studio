import { formatCurrency } from "@/lib/brief";
import type { BudgetAllocation } from "@/lib/campaign/types";

export function BudgetAllocationCard({ budget }: { budget: BudgetAllocation }) {
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
              <span className="text-sm font-semibold tabular-nums">
                {formatCurrency(line.amount)}{" "}
                <span className="text-muted-foreground">· {line.percent}%</span>
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(line.percent, 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
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
