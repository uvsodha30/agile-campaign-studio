import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CHANNELS,
  CHANNEL_SHORT,
  GOALS,
  PRESETS,
  RISKS,
  SPRINT_OPTIONS,
  type Channel,
  type Goal,
  type IndustryPreset,
  type SprintWeeks,
} from "@/lib/brief";
import type { CampaignConfig } from "@/lib/campaign/types";

type Props = {
  config: CampaignConfig;
  onChange: (patch: Partial<CampaignConfig>) => void;
  onPreset: (preset: IndustryPreset) => void;
  onGenerate: () => void;
};

export function CampaignSetup({ config, onChange, onPreset, onGenerate }: Props) {
  const toggleChannel = (c: Channel) =>
    onChange({
      channels: config.channels.includes(c)
        ? config.channels.filter((x) => x !== c)
        : [...config.channels, c],
    });

  return (
    <div>
      <div className="rounded-xl border border-border bg-secondary/50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Industry Preset
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPreset(p)}
              aria-pressed={config.presetId === p.id}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-semibold transition-all",
                config.presetId === p.id
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:text-primary",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          Presets seed goal, channels, duration, tasks, KPIs, budget split and RAID items. Every
          field stays editable.
        </p>
      </div>

      <Section title="Campaign Overview" step="01">
        <div className="space-y-2">
          <Label htmlFor="name">Campaign Name</Label>
          <Input
            id="name"
            placeholder="Q3 Horizon Launch"
            value={config.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Strategic Goal</Label>
          <Select value={config.goal} onValueChange={(v) => onChange({ goal: v as Goal })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOALS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Target Channels</Label>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((c) => {
              const active = config.channels.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleChannel(c)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-secondary text-secondary-foreground hover:border-primary/40 hover:text-primary",
                  )}
                >
                  {CHANNEL_SHORT[c]}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      <Section title="Constraints & Parameters" step="02">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="budget">Total Budget (USD)</Label>
            <Input
              id="budget"
              type="number"
              min={0}
              step={1000}
              value={config.budget}
              onChange={(e) => onChange({ budget: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Target Launch Date</Label>
            <Input
              id="date"
              type="date"
              value={config.launchDate}
              onChange={(e) => onChange({ launchDate: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Program Duration</Label>
          <Select
            value={String(config.weeks)}
            onValueChange={(v) => onChange({ weeks: Number(v) as SprintWeeks })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPRINT_OPTIONS.map((o) => (
                <SelectItem key={o.weeks} value={String(o.weeks)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Risk Sensitivity Level</Label>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-secondary p-1">
            {RISKS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChange({ risk: r })}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                  config.risk === r
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Button className="mt-6 w-full" size="lg" onClick={onGenerate}>
        Generate Campaign Brief &amp; Sprint Plan
      </Button>
    </div>
  );
}

function Section({
  title,
  step,
  children,
}: {
  title: string;
  step: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 space-y-4 border-t border-border pt-5">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
          {step}
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
