import type { Channel, Goal } from "@/lib/brief";
import { formatCurrency } from "@/lib/brief";
import { buildBudget } from "./budget";
import type { CampaignConfig, KPI } from "./types";

const round = (n: number, step = 10) => Math.max(step, Math.round(n / step) * step);

type Def = { id: string; name: string; source: string; target: (c: CampaignConfig) => string };

/** Riskier programs plan more conservative targets. */
function riskFactor(config: CampaignConfig) {
  return config.risk === "High" ? 0.85 : config.risk === "Low" ? 1.1 : 1;
}

function paidBudget(config: CampaignConfig) {
  const b = buildBudget(config);
  return b.lines.find((l) => l.id === "paid")?.amount ?? config.budget * 0.4;
}

const GOAL_KPIS: Record<Goal, Def[]> = {
  "Lead Generation & Conversion Optimization": [
    {
      id: "leads",
      name: "Leads",
      source: "CRM + Web Analytics",
      target: (c) => `${round((paidBudget(c) / 55) * riskFactor(c))}`,
    },
    {
      id: "mql",
      name: "MQLs",
      source: "CRM",
      target: (c) => `${round((paidBudget(c) / 55) * 0.55 * riskFactor(c))}`,
    },
    {
      id: "cpl",
      name: "Cost per Lead",
      source: "Ad Platforms + CRM",
      target: (c) => `≤ ${formatCurrency(Math.round(55 / riskFactor(c)))}`,
    },
    {
      id: "lp-cvr",
      name: "Landing Page Conversion Rate",
      source: "Web Analytics",
      target: (c) => `≥ ${(4 * riskFactor(c)).toFixed(1)}%`,
    },
    { id: "sql", name: "Sales Accepted Leads", source: "CRM", target: (c) => `${round((paidBudget(c) / 55) * 0.18 * riskFactor(c))}` },
  ],
  "SaaS Product Launch (PLG & User Onboarding)": [
    { id: "signups", name: "New Signups", source: "Product Analytics", target: (c) => `${round((c.budget / 40) * riskFactor(c))}` },
    { id: "activation", name: "Activation Rate", source: "Product Analytics", target: (c) => `≥ ${(35 * riskFactor(c)).toFixed(0)}%` },
    { id: "trial-paid", name: "Trial-to-Paid Conversion", source: "Billing + CRM", target: (c) => `≥ ${(12 * riskFactor(c)).toFixed(1)}%` },
    { id: "ttv", name: "Time to First Value", source: "Product Analytics", target: (c) => `≤ ${c.risk === "High" ? 3 : 2} days` },
  ],
  "Enterprise Software Release / IT Migration": [
    { id: "migrated", name: "Users Migrated", source: "IT Asset Register", target: () => "100% of in-scope users" },
    { id: "adoption", name: "Post-Cutover Adoption", source: "Usage Telemetry", target: (c) => `≥ ${(80 * riskFactor(c)).toFixed(0)}% within 30 days` },
    { id: "incidents", name: "Sev-1 Incidents at Cutover", source: "ITSM / Incident Log", target: (c) => `≤ ${c.risk === "High" ? 2 : 1}` },
    { id: "data-integrity", name: "Data Reconciliation Accuracy", source: "Migration Reports", target: () => "≥ 99.9%" },
  ],
  "Customer Retention & Churn Reduction": [
    { id: "churn", name: "Monthly Logo Churn", source: "Billing + CRM", target: (c) => `≤ ${(2.5 / riskFactor(c)).toFixed(1)}%` },
    { id: "saves", name: "At-Risk Accounts Saved", source: "CRM", target: (c) => `${round((c.budget / 500) * riskFactor(c), 5)}` },
    { id: "nrr", name: "Net Revenue Retention", source: "Billing", target: (c) => `≥ ${(102 * riskFactor(c)).toFixed(0)}%` },
    { id: "health", name: "Health Score Improvement", source: "Customer Success Platform", target: () => "+10 pts on targeted cohort" },
  ],
  "Brand Awareness & Market Expansion": [
    { id: "reach", name: "Unique Reach", source: "Ad Platforms", target: (c) => `${round((paidBudget(c) / 8) * 1000 * riskFactor(c), 1000).toLocaleString()}` },
    { id: "sov", name: "Share of Voice", source: "Social / Media Monitoring", target: (c) => `≥ ${(12 * riskFactor(c)).toFixed(0)}%` },
    { id: "brand-lift", name: "Brand Lift (Aided Awareness)", source: "Brand Study", target: () => "+5 pts vs baseline" },
    { id: "branded-search", name: "Branded Search Volume", source: "Search Console", target: (c) => `+${(20 * riskFactor(c)).toFixed(0)}%` },
  ],
  "Feature Rollout & Growth Experimentation": [
    { id: "feature-adoption", name: "Feature Adoption Rate", source: "Product Analytics", target: (c) => `≥ ${(30 * riskFactor(c)).toFixed(0)}%` },
    { id: "experiments", name: "Experiments Shipped", source: "Experimentation Platform", target: (c) => `${Math.max(2, Math.round(c.weeks / 2))}` },
    { id: "winrate", name: "Winning Variants", source: "Experimentation Platform", target: () => "≥ 1 statistically significant win" },
    { id: "rollout", name: "Rollout Coverage", source: "Feature Flag Registry", target: () => "100% of target cohort" },
  ],
};

const CHANNEL_KPIS: Record<Channel, Def> = {
  "Digital Ad Networks (Paid Search, Social, Display)": {
    id: "ctr",
    name: "CTR",
    source: "Ad Platforms",
    target: (c) => `≥ ${(2 * riskFactor(c)).toFixed(1)}%`,
  },
  "Product-Led / In-App (Onboarding Flows, Pop-ups)": {
    id: "flow-completion",
    name: "Onboarding Flow Completion",
    source: "Product Analytics",
    target: (c) => `≥ ${(60 * riskFactor(c)).toFixed(0)}%`,
  },
  "Email & Lifecycle Marketing": {
    id: "email-cvr",
    name: "Email Conversion Rate",
    source: "ESP + Web Analytics",
    target: (c) => `≥ ${(3 * riskFactor(c)).toFixed(1)}%`,
  },
  "Content & SEO Strategy": {
    id: "organic",
    name: "Organic Sessions",
    source: "Web Analytics",
    target: (c) => `+${(15 * riskFactor(c)).toFixed(0)}% vs baseline`,
  },
  "Developer / Tech Docs & API Portals": {
    id: "sandbox",
    name: "Sandbox API Signups",
    source: "Developer Portal",
    target: (c) => `${round((c.budget / 900) * riskFactor(c), 5)}`,
  },
  "Outbound Sales Enablement & Events": {
    id: "pipeline",
    name: "Sourced Pipeline",
    source: "CRM",
    target: (c) => `${formatCurrency(Math.round(c.budget * 4 * riskFactor(c)))}`,
  },
};

export function buildKpis(config: CampaignConfig): KPI[] {
  const defs: Def[] = [...(GOAL_KPIS[config.goal] ?? [])];
  for (const c of config.channels) {
    const d = CHANNEL_KPIS[c];
    if (d && !defs.some((x) => x.id === d.id)) defs.push(d);
  }
  return defs.slice(0, 7).map((d) => ({
    id: d.id,
    name: d.name,
    target: d.target(config),
    source: d.source,
    status: "Planned" as const,
  }));
}
