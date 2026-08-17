import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { CampaignSetup } from "@/components/campaign/CampaignSetup";
import { ExecutiveBrief } from "@/components/campaign/ExecutiveBrief";
import { DeliveryPlanView } from "@/components/campaign/DeliveryPlanView";
import { KPIPlan } from "@/components/campaign/KPIPlan";
import { BudgetAllocationCard } from "@/components/campaign/BudgetAllocationCard";
import { RAIDLog } from "@/components/campaign/RAIDLog";
import { ExportMenu } from "@/components/campaign/ExportMenu";
import { SavedCampaigns } from "@/components/campaign/SavedCampaigns";
import type { IndustryPreset } from "@/lib/brief";
import { buildDeliveryPlan } from "@/lib/campaign/plan";
import { buildKpis } from "@/lib/campaign/kpi";
import { buildBudget } from "@/lib/campaign/budget";
import { buildRaidLog, monitoringCadence } from "@/lib/campaign/raid";
import { computeHealth } from "@/lib/campaign/health";
import {
  clearWorking,
  loadCampaigns,
  loadWorking,
  newId,
  persistCampaigns,
  persistWorking,
} from "@/lib/campaign/storage";
import type {
  CampaignConfig,
  KpiStatus,
  RaidStatus,
  SavedCampaign,
} from "@/lib/campaign/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Agile Campaign Brief Studio | Campaign Delivery Planning" },
      {
        name: "description",
        content:
          "Plan campaigns, map delivery, track risk and build stakeholder-ready briefs — delivery plans, KPI targets, budget pacing and RAID logs in one client-side workspace.",
      },
      { property: "og:title", content: "Agile Campaign Brief Studio" },
      {
        property: "og:description",
        content:
          "Campaign operations workspace: delivery plan, KPI & measurement plan, budget allocation, RAID log and stakeholder exports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 35);
  return d.toISOString().slice(0, 10);
}

const emptyConfig: CampaignConfig = {
  name: "",
  goal: "SaaS Product Launch (PLG & User Onboarding)",
  channels: [
    "Product-Led / In-App (Onboarding Flows, Pop-ups)",
    "Email & Lifecycle Marketing",
  ],
  budget: 50000,
  launchDate: defaultDate(),
  risk: "Medium",
  weeks: 6,
  presetId: null,
};

type WorkingState = {
  config: CampaignConfig;
  generated: CampaignConfig | null;
  done: string[];
  kpiTargets: Record<string, string>;
  kpiStatus: Record<string, KpiStatus>;
  raidStatus: Record<string, RaidStatus>;
  activeId: string | null;
};

function Index() {
  const [config, setConfig] = useState<CampaignConfig>(emptyConfig);
  const [generated, setGenerated] = useState<CampaignConfig | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [kpiTargets, setKpiTargets] = useState<Record<string, string>>({});
  const [kpiStatus, setKpiStatus] = useState<Record<string, KpiStatus>>({});
  const [raidStatus, setRaidStatus] = useState<Record<string, RaidStatus>>({});
  const [saved, setSaved] = useState<SavedCampaign[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSaved(loadCampaigns());
    const w = loadWorking<WorkingState>();
    if (w?.config) {
      setConfig(w.config);
      setGenerated(w.generated ?? null);
      setDone(w.done ?? []);
      setKpiTargets(w.kpiTargets ?? {});
      setKpiStatus(w.kpiStatus ?? {});
      setRaidStatus(w.raidStatus ?? {});
      setActiveId(w.activeId ?? null);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistWorking({
      config,
      generated,
      done,
      kpiTargets,
      kpiStatus,
      raidStatus,
      activeId,
    } satisfies WorkingState);
  }, [hydrated, config, generated, done, kpiTargets, kpiStatus, raidStatus, activeId]);

  const plan = useMemo(() => (generated ? buildDeliveryPlan(generated) : null), [generated]);
  const budget = useMemo(() => (generated ? buildBudget(generated) : null), [generated]);
  const kpis = useMemo(() => {
    if (!generated) return [];
    return buildKpis(generated).map((k) => ({
      ...k,
      target: kpiTargets[k.id] ?? k.target,
      status: kpiStatus[k.id] ?? k.status,
    }));
  }, [generated, kpiTargets, kpiStatus]);
  const raid = useMemo(() => {
    if (!generated) return [];
    return buildRaidLog(generated).map((r) => ({ ...r, status: raidStatus[r.id] ?? r.status }));
  }, [generated, raidStatus]);
  const health = useMemo(
    () => (plan ? computeHealth(plan, raid, done) : null),
    [plan, raid, done],
  );

  const dirty =
    !!generated && JSON.stringify(config) !== JSON.stringify(generated) ? true : !!generated;

  const patch = (p: Partial<CampaignConfig>) => setConfig((c) => ({ ...c, ...p, ...(p.presetId === undefined && ("goal" in p || "channels" in p || "weeks" in p || "risk" in p) ? {} : {}) }));

  const applyPreset = (p: IndustryPreset) => {
    const overridden =
      generated &&
      (generated.goal !== config.goal ||
        JSON.stringify(generated.channels) !== JSON.stringify(config.channels) ||
        generated.weeks !== config.weeks);
    if (
      overridden &&
      !window.confirm("Applying a preset will replace your manual edits. Continue?")
    ) {
      return;
    }
    setConfig((c) => ({
      ...c,
      name: c.name.trim() || p.namePlaceholder,
      goal: p.goal,
      channels: p.channels,
      risk: p.risk,
      weeks: p.weeks,
      budget: p.budget,
      presetId: p.id,
    }));
    toast.success(`${p.label} scenario applied.`);
  };

  const generate = () => {
    if (!config.name.trim()) {
      toast.error("Add a campaign name first.");
      return;
    }
    if (config.channels.length === 0) {
      toast.error("Select at least one channel.");
      return;
    }
    const next = { ...config, name: config.name.trim() };
    setConfig(next);
    setGenerated(next);
    setDone([]);
    setKpiTargets({});
    setKpiStatus({});
    setRaidStatus({});
    toast.success("Campaign delivery plan generated.");
  };

  const newCampaign = () => {
    if (dirty && !window.confirm("Start a new campaign? Unsaved changes will be lost.")) return;
    setConfig({ ...emptyConfig, launchDate: defaultDate() });
    setGenerated(null);
    setDone([]);
    setKpiTargets({});
    setKpiStatus({});
    setRaidStatus({});
    setActiveId(null);
    clearWorking();
    toast.success("New campaign started.");
  };

  const persist = (list: SavedCampaign[]) => {
    setSaved(list);
    persistCampaigns(list);
  };

  const saveCampaign = () => {
    if (!generated) return;
    const existing = saved.find((s) => s.id === activeId);
    const entry: SavedCampaign = {
      id: existing?.id ?? newId(),
      savedAt: new Date().toISOString(),
      label: existing?.label ?? generated.name,
      config: generated,
      done,
      kpiTargets,
      kpiStatus,
      raidStatus,
    };
    persist([entry, ...saved.filter((s) => s.id !== entry.id)]);
    setActiveId(entry.id);
    toast.success(existing ? "Campaign updated." : "Campaign saved to this browser.");
  };

  const loadCampaign = (c: SavedCampaign) => {
    setConfig(c.config);
    setGenerated(c.config);
    setDone(c.done ?? []);
    setKpiTargets(c.kpiTargets ?? {});
    setKpiStatus(c.kpiStatus ?? {});
    setRaidStatus(c.raidStatus ?? {});
    setActiveId(c.id);
    toast.success(`Loaded "${c.label}".`);
  };

  const renameCampaign = (c: SavedCampaign) => {
    const label = window.prompt("Rename campaign", c.label);
    if (!label?.trim()) return;
    persist(saved.map((s) => (s.id === c.id ? { ...s, label: label.trim() } : s)));
  };

  const duplicateCampaign = (c: SavedCampaign) => {
    persist([
      { ...c, id: newId(), label: `${c.label} (copy)`, savedAt: new Date().toISOString() },
      ...saved,
    ]);
    toast.success("Campaign duplicated.");
  };

  const deleteCampaign = (c: SavedCampaign) => {
    if (!window.confirm(`Delete "${c.label}"?`)) return;
    persist(saved.filter((s) => s.id !== c.id));
    if (activeId === c.id) setActiveId(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)] lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight">
                Agile Campaign Brief Studio
              </h1>
              <p className="text-xs text-muted-foreground">Inputs in, sprint-ready brief out.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Plan campaigns, map delivery, track risk, and build stakeholder-ready briefs.
              </p>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
          </div>

          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={newCampaign}>
            <Plus className="mr-1 size-4" /> New Campaign
          </Button>

          <div className="mt-4">
            <CampaignSetup
              config={config}
              onChange={patch}
              onPreset={applyPreset}
              onGenerate={generate}
            />
          </div>

          <SavedCampaigns
            campaigns={saved}
            activeId={activeId}
            onLoad={loadCampaign}
            onRename={renameCampaign}
            onDuplicate={duplicateCampaign}
            onDelete={deleteCampaign}
          />
        </aside>

        <main className="min-w-0 space-y-5">
          {!generated || !plan || !budget || !health ? (
            <div className="grid min-h-[60vh] place-items-center rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
              <div className="max-w-sm">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
                  <ClipboardList className="size-6" />
                </span>
                <h2 className="mt-4 text-lg font-semibold">No campaign plan yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pick a preset or fill in the campaign details to generate a delivery plan, KPI
                  plan, budget allocation and RAID log.
                </p>
              </div>
            </div>
          ) : (
            <>
              <ExecutiveBrief
                config={generated}
                plan={plan}
                budget={budget}
                health={health}
              />
              <DeliveryPlanView
                plan={plan}
                done={done}
                onToggle={(id, next) =>
                  setDone((d) => (next ? [...new Set([...d, id])] : d.filter((x) => x !== id)))
                }
              />
              <KPIPlan
                kpis={kpis}
                onTargetChange={(id, value) => setKpiTargets((t) => ({ ...t, [id]: value }))}
                onStatusChange={(id, status) => setKpiStatus((s) => ({ ...s, [id]: status }))}
              />
              <BudgetAllocationCard budget={budget} />
              <RAIDLog
                items={raid}
                cadence={monitoringCadence(generated)}
                onStatusChange={(id, status) => setRaidStatus((s) => ({ ...s, [id]: status }))}
              />
              <ExportMenu
                payload={{ config: generated, plan, kpis, budget, raid, health, done }}
                onSave={saveCampaign}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
