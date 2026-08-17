import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { KPI_STATUSES, type KPI, type KpiStatus } from "@/lib/campaign/types";

const STATUS_STYLES: Record<KpiStatus, string> = {
  Planned: "text-muted-foreground",
  Tracking: "text-primary",
  "At Risk": "text-warning-foreground",
  Achieved: "text-success",
};

type Props = {
  kpis: KPI[];
  onTargetChange: (id: string, value: string) => void;
  onStatusChange: (id: string, status: KpiStatus) => void;
};

export function KPIPlan({ kpis, onTargetChange, onStatusChange }: Props) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Campaign KPI &amp; Measurement Plan
        </h3>
        <p className="text-xs text-muted-foreground">
          Values are planning targets derived from your configuration — edit as needed.
        </p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 pb-1 font-semibold">KPI</th>
              <th className="px-3 pb-1 font-semibold">Planning Target</th>
              <th className="px-3 pb-1 font-semibold">Measurement Source</th>
              <th className="px-3 pb-1 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {kpis.map((kpi) => (
              <tr key={kpi.id} className="rounded-xl">
                <td className="rounded-l-xl border-y border-l border-border bg-secondary/40 px-3 py-2 font-medium">
                  {kpi.name}
                </td>
                <td className="border-y border-border bg-secondary/40 px-3 py-2">
                  <Input
                    aria-label={`${kpi.name} planning target`}
                    value={kpi.target}
                    onChange={(e) => onTargetChange(kpi.id, e.target.value)}
                    className="h-8 bg-card"
                  />
                </td>
                <td className="border-y border-border bg-secondary/40 px-3 py-2 text-muted-foreground">
                  {kpi.source}
                </td>
                <td className="rounded-r-xl border-y border-r border-border bg-secondary/40 px-3 py-2">
                  <Select
                    value={kpi.status}
                    onValueChange={(v) => onStatusChange(kpi.id, v as KpiStatus)}
                  >
                    <SelectTrigger
                      className={cn("h-8 w-[9.5rem] bg-card", STATUS_STYLES[kpi.status])}
                      aria-label={`${kpi.name} status`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KPI_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
