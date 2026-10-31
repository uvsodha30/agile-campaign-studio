import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
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
import { customKpiSchema, type CustomKpiInput, validate } from "@/lib/campaign/validation";

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
  onActualChange: (id: string, value: string) => void;
  onAdd: (input: CustomKpiInput) => void;
  onRemove: (id: string) => void;
};

export function KPIPlan({
  kpis,
  onTargetChange,
  onStatusChange,
  onActualChange,
  onAdd,
  onRemove,
}: Props) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [source, setSource] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const result = validate(customKpiSchema, { name, target, source });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onAdd(result.value);
    setName("");
    setTarget("");
    setSource("");
    setError(null);
  };

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
        <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 pb-1 font-semibold">KPI</th>
              <th className="px-3 pb-1 font-semibold">Planning Target</th>
              <th className="px-3 pb-1 font-semibold">Actual</th>
              <th className="px-3 pb-1 font-semibold">Measurement Source</th>
              <th className="px-3 pb-1 font-semibold">Status</th>
              <th className="px-3 pb-1 font-semibold" aria-label="Remove" />
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
                <td className="border-y border-border bg-secondary/40 px-3 py-2">
                  <Input
                    aria-label={`${kpi.name} actual value`}
                    value={kpi.actual ?? ""}
                    placeholder="—"
                    onChange={(e) => onActualChange(kpi.id, e.target.value)}
                    className="h-8 bg-card"
                  />
                </td>
                <td className="border-y border-border bg-secondary/40 px-3 py-2 text-muted-foreground">
                  {kpi.source}
                </td>
                <td className="border-y border-border bg-secondary/40 px-3 py-2">
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
                <td className="rounded-r-xl border-y border-r border-border bg-secondary/40 px-2 py-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => onRemove(kpi.id)}
                    aria-label={`Remove ${kpi.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-border p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Add custom KPI
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
          <Input
            aria-label="Custom KPI name"
            placeholder="KPI name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 bg-card"
          />
          <Input
            aria-label="Custom KPI planning target"
            placeholder="Planning target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="h-8 bg-card"
          />
          <Input
            aria-label="Custom KPI measurement source"
            placeholder="Measurement source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="h-8 bg-card"
          />
          <Button size="sm" className="h-8" onClick={handleAdd}>
            <Plus className="mr-1 size-3.5" /> Add
          </Button>
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </div>
    </section>
  );
}
