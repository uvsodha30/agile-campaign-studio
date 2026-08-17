import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  RAID_STATUSES,
  type RAIDItem,
  type RaidSeverity,
  type RaidStatus,
} from "@/lib/campaign/types";

const SEVERITY: Record<RaidSeverity, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/25",
  Medium: "bg-warning/15 text-warning-foreground border-warning/40",
  Low: "bg-success/12 text-success border-success/30",
};

type Props = {
  items: RAIDItem[];
  cadence: string;
  onStatusChange: (id: string, status: RaidStatus) => void;
};

export function RAIDLog({ items, cadence, onStatusChange }: Props) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          RAID Log
        </h3>
        <p className="text-xs text-muted-foreground">{cadence}</p>
      </div>

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-border p-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
              <p className="min-w-0 text-sm font-medium leading-snug">{item.description}</p>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Badge variant="outline" className="border-border text-muted-foreground">
                  {item.type}
                </Badge>
                <Badge variant="outline" className={cn(SEVERITY[item.severity])}>
                  {item.severity}
                </Badge>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Mitigation / response: </span>
              {item.mitigation}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Owner: <span className="font-medium text-foreground">{item.owner}</span>
              </span>
              <Select
                value={item.status}
                onValueChange={(v) => onStatusChange(item.id, v as RaidStatus)}
              >
                <SelectTrigger className="h-8 w-[10rem]" aria-label={`${item.type} status`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RAID_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
