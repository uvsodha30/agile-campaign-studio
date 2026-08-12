import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Copy,
  Flame,
  Gauge,
  Save,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  buildRaid,
  buildSprint,
  CHANNELS,
  dailyBurnRate,
  formatCurrency,
  formatDate,
  formatShort,
  GOALS,
  loadBriefs,
  parseDate,
  persistBriefs,
  RISKS,
  toAsanaTemplate,
  toJiraMarkdown,
  type BriefInput,
  type Channel,
  type Goal,
  type RiskLevel,
  type SavedBrief,
} from "@/lib/brief";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agile Campaign Brief Studio | Sprint Plans & RAID Logs" },
      {
        name: "description",
        content:
          "Turn campaign inputs into a 4-week sprint plan, burn-rate math, and an automated RAID log you can export to Jira or Asana.",
      },
      { property: "og:title", content: "Agile Campaign Brief Studio" },
      {
        property: "og:description",
        content:
          "Generate agency-grade campaign briefs with sprint schedules, RAID logs, and Jira/Asana exports.",
      },
    ],
  }),
  component: Index,
});

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 35);
  return d.toISOString().slice(0, 10);
}

const emptyInput: BriefInput = {
  name: "",
  goal: "Product Launch",
  channels: ["Paid Search", "Social Media"],
  budget: 50000,
  launchDate: defaultDate(),
  risk: "Medium",
};

const levelStyles: Record<RiskLevel, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/25",
  Medium: "bg-warning/15 text-warning-foreground border-warning/40",
  Low: "bg-success/12 text-success border-success/30",
};

function Index() {
  const [form, setForm] = useState<BriefInput>(emptyInput);
  const [brief, setBrief] = useState<BriefInput | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [saved, setSaved] = useState<SavedBrief[]>([]);

  useEffect(() => {
    setSaved(loadBriefs());
  }, []);

  const sprint = useMemo(() => (brief ? buildSprint(brief.launchDate) : []), [brief]);
  const raid = useMemo(
    () => (brief ? buildRaid(brief.channels, brief.risk, brief.goal) : []),
    [brief],
  );

  const totalTasks = sprint.reduce((n, w) => n + w.tasks.length, 0);
  const progress = totalTasks ? Math.round((done.length / totalTasks) * 100) : 0;

  const toggleChannel = (c: Channel) =>
    setForm((f) => ({
      ...f,
      channels: f.channels.includes(c)
        ? f.channels.filter((x) => x !== c)
        : [...f.channels, c],
    }));

  const generate = () => {
    if (!form.name.trim()) {
      toast.error("Add a campaign name first.");
      return;
    }
    if (form.channels.length === 0) {
      toast.error("Select at least one channel.");
      return;
    }
    setBrief({ ...form, name: form.name.trim() });
    setDone([]);
    toast.success("Campaign brief generated.");
  };


  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard.`);
    } catch {
      toast.error("Clipboard unavailable in this browser.");
    }
  };

  const saveBrief = () => {
    if (!brief) return;
    const entry: SavedBrief = {
      id: `${Date.now()}`,
      savedAt: new Date().toISOString(),
      input: brief,
      done,
    };
    const next = [entry, ...saved].slice(0, 12);
    setSaved(next);
    persistBriefs(next);
    toast.success("Brief saved to this browser.");
  };

  const restore = (entry: SavedBrief) => {
    setForm(entry.input);
    setBrief(entry.input);
    setDone(entry.done);
    toast.success(`Loaded "${entry.input.name}".`);
  };

  const remove = (id: string) => {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    persistBriefs(next);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
        {/* LEFT PANEL */}
        <aside className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)] lg:sticky lg:top-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight">
                Agile Campaign Brief Studio
              </h1>
              <p className="text-xs text-muted-foreground">
                Inputs in, sprint-ready brief out.
              </p>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
          </div>

          <Section title="Campaign Overview" step="01">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="Q3 Horizon Launch"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Strategic Goal</Label>
              <Select
                value={form.goal}
                onValueChange={(v) => setForm({ ...form, goal: v as Goal })}
              >
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
                  const active = form.channels.includes(c);
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
                      {c}
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
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Target Launch Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.launchDate}
                  onChange={(e) => setForm({ ...form, launchDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Risk Sensitivity Level</Label>
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-secondary p-1">
                {RISKS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, risk: r })}
                    className={cn(
                      "rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                      form.risk === r
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

          <Button className="mt-6 w-full" size="lg" onClick={generate}>
            Generate Campaign Brief &amp; Sprint Plan
          </Button>

          {saved.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Saved briefs
              </p>
              <ul className="mt-2 space-y-2">
                {saved.map((s) => (
                  <li
                    key={s.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2"
                  >
                    <button
                      onClick={() => restore(s)}
                      className="min-w-0 text-left"
                      type="button"
                    >
                      <span className="block truncate text-sm font-medium">
                        {s.input.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {s.input.goal} · {formatCurrency(s.input.budget)}
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${s.input.name}`}
                      onClick={() => remove(s.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* RIGHT PANEL */}
        <main className="min-w-0 space-y-5">
          {!brief ? (
            <div className="grid min-h-[60vh] place-items-center rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
                  <ClipboardList className="size-6" />
                </span>
                <h2 className="mt-4 text-lg font-semibold">No brief yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Fill in the campaign details and generate a 4-week sprint plan with an
                  automated RAID log.
                </p>
              </div>
            </div>
          ) : (
            <>
              <header
                className="rounded-2xl p-6 text-primary-foreground shadow-[var(--shadow-panel)]"
                style={{ background: "var(--gradient-hero)" }}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] opacity-75">
                      Executive Brief
                    </p>
                    <h2 className="truncate text-2xl font-bold sm:text-3xl">{brief.name}</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className="border-0 bg-primary-foreground/15 text-primary-foreground">
                        <Target className="mr-1 size-3" /> {brief.goal}
                      </Badge>
                      <Badge className="border-0 bg-primary-foreground/15 text-primary-foreground">
                        Risk: {brief.risk}
                      </Badge>
                      {brief.channels.map((c) => (
                        <Badge
                          key={c}
                          className="border-0 bg-primary-foreground/10 text-primary-foreground"
                        >
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 rounded-xl bg-primary-foreground/12 px-4 py-3 text-right">
                    <p className="flex items-center justify-end gap-1 text-xs opacity-80">
                      <Flame className="size-3" /> Daily burn rate
                    </p>
                    <p className="text-2xl font-bold tabular-nums">
                      {formatCurrency(dailyBurnRate(brief.budget, brief.launchDate))}
                    </p>
                    <p className="text-xs opacity-75">
                      {formatCurrency(brief.budget)} total
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <Stat
                    icon={<CalendarDays className="size-3.5" />}
                    label="Launch date"
                    value={formatDate(parseDate(brief.launchDate))}
                  />
                  <Stat
                    icon={<Gauge className="size-3.5" />}
                    label="Sprint window"
                    value={`${formatShort(sprint[0].start)} – ${formatShort(sprint[3].end)}`}
                  />
                  <Stat
                    icon={<CheckCircle2 className="size-3.5" />}
                    label="Plan progress"
                    value={`${progress}% · ${done.length}/${totalTasks} tasks`}
                  />
                </div>
                <Progress value={progress} className="mt-4 h-1.5 bg-primary-foreground/20" />
              </header>

              <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)]">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  4-Week Sprint Schedule
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {sprint.map((w, i) => {
                    const weekDone = w.tasks.filter((t) => done.includes(`${w.id}:${t}`)).length;
                    return (
                      <div
                        key={w.id}
                        className="rounded-xl border border-border bg-secondary/40 p-4 transition-colors hover:border-primary/40"
                      >
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {w.title} · {w.phase}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatShort(w.start)} – {formatShort(w.end)}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-1 text-xs font-semibold",
                              weekDone === w.tasks.length
                                ? "bg-success/15 text-success"
                                : "bg-primary/10 text-primary",
                            )}
                          >
                            {weekDone}/{w.tasks.length}
                          </span>
                        </div>
                        <ul className="mt-3 space-y-2">
                          {w.tasks.map((t) => {
                            const key = `${w.id}:${t}`;
                            const checked = done.includes(key);
                            return (
                              <li key={key} className="flex items-start gap-2">
                                <Checkbox
                                  id={key}
                                  checked={checked}
                                  onCheckedChange={(v) =>
                                    setDone((d) =>
                                      v ? [...d, key] : d.filter((x) => x !== key),
                                    )
                                  }
                                  className="mt-0.5 shrink-0"
                                />
                                <label
                                  htmlFor={key}
                                  className={cn(
                                    "min-w-0 cursor-pointer text-sm leading-snug",
                                    checked && "text-muted-foreground line-through",
                                  )}
                                >
                                  {t}
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                        {i === 3 && (
                          <p className="mt-3 text-xs text-muted-foreground">
                            Go-live week — burn rate applies from{" "}
                            {formatShort(parseDate(brief.launchDate))}.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)]">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Automated RAID Log
                </h3>
                <ul className="mt-4 space-y-3">
                  {raid.map((r) => (
                    <li key={r.id} className="rounded-xl border border-border p-4">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                        <p className="min-w-0 text-sm font-medium leading-snug">
                          {r.description}
                        </p>
                        <div className="flex shrink-0 gap-2">
                          <Badge variant="outline" className="border-border text-muted-foreground">
                            {r.category}
                          </Badge>
                          <Badge variant="outline" className={levelStyles[r.level]}>
                            {r.level}
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Mitigation: </span>
                        {r.mitigation}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)]">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Copy className="mr-2 size-4" /> Export brief
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() =>
                        copy(toJiraMarkdown(brief, sprint, raid), "Jira markdown")
                      }
                    >
                      Copy as Jira Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        copy(toAsanaTemplate(brief, sprint, raid), "Asana template")
                      }
                    >
                      Copy as Asana Template
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={saveBrief}>
                  <Save className="mr-2 size-4" /> Save Brief
                </Button>
                <p className="text-xs text-muted-foreground">
                  Saved briefs stay in this browser — no account needed.
                </p>
              </section>
            </>
          )}
        </main>
      </div>
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

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-primary-foreground/10 px-3 py-2">
      <p className="flex items-center gap-1 text-xs opacity-80">
        {icon}
        {label}
      </p>
      <p className="truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
