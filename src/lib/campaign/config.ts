/**
 * Rule-based planning engine configuration.
 *
 * Everything the generator needs lives in plain config objects so the UI stays
 * presentational. Output depends on the *combination* of
 * preset + goal + channels + duration + budget + risk.
 */
import { PRESETS, type Channel, type Goal } from "@/lib/brief";
import { CHANNEL_TASKS, TASK_LIBRARIES, scenarioFor } from "./tasks";
import type { CampaignConfig } from "./types";

/** Canonical config surfaces (named per the planning-engine architecture). */
export const presetConfigs = PRESETS;
export const taskLibraries = TASK_LIBRARIES;
export const channelConfigs = CHANNEL_TASKS;

/** Lifecycle week keys used by every task library. */
export type WeekKey =
  | "kickoff"
  | "research"
  | "architecture"
  | "creative-dev"
  | "production"
  | "tech-setup"
  | "qa"
  | "readiness"
  | "launch"
  | "early-opt"
  | "optimization"
  | "review";

type WeekTasks = Partial<Record<WeekKey, string[]>>;

/** Goal-driven emphasis layered on top of the scenario task library. */
export const goalConfigs: Record<Goal, { emphasis: WeekTasks }> = {
  "Lead Generation & Conversion Optimization": {
    emphasis: {
      architecture: ["Define lead qualification criteria (MQL/SQL)"],
      "creative-dev": ["Wireframe high-intent landing pages"],
      production: ["Build and publish landing page variants"],
      "tech-setup": ["Implement conversion tracking for form submissions"],
      qa: ["Test lead routing and CRM record creation"],
      readiness: ["Confirm sales follow-up SLA and owner coverage"],
      "early-opt": ["Review cost per lead by campaign and keyword"],
      optimization: ["Optimize landing page conversion rate"],
    },
  },
  "SaaS Product Launch (PLG & User Onboarding)": {
    emphasis: {
      architecture: ["Define activation milestone and aha-moment metric"],
      "tech-setup": ["Instrument signup-to-activation funnel events"],
      readiness: ["Rehearse rollback and flag kill-switch"],
      "early-opt": ["Remove the top onboarding drop-off blocker"],
    },
  },
  "Enterprise Software Release / IT Migration": {
    emphasis: {
      research: ["Complete system dependency and risk assessment"],
      architecture: ["Sign off cutover runbook and rollback windows"],
      qa: ["Complete UAT sign-off per business unit"],
      readiness: ["Confirm hypercare roster and escalation tree"],
    },
  },
  "Customer Retention & Churn Reduction": {
    emphasis: {
      research: ["Score at-risk accounts from usage and support signals"],
      "creative-dev": ["Draft save-offer and win-back messaging"],
      "tech-setup": ["Configure churn-risk triggers in lifecycle tooling"],
      optimization: ["Review save rate and offer margin impact"],
    },
  },
  "Brand Awareness & Market Expansion": {
    emphasis: {
      research: ["Baseline share of voice and aided awareness"],
      "creative-dev": ["Adapt messaging for each target market"],
      launch: ["Track reach, frequency and sentiment daily"],
      review: ["Run brand-lift study readout"],
    },
  },
  "Feature Rollout & Growth Experimentation": {
    emphasis: {
      architecture: ["Prioritize experiment backlog by expected impact"],
      "tech-setup": ["Configure experiment variants and sample sizes"],
      launch: ["Ramp rollout percentage against guardrail metrics"],
      optimization: ["Ship winning variants and retire losing flags"],
    },
  },
};

/** Combination rules: goal + channel mixes that unlock specific work. */
type ComboRule = {
  id: string;
  goal?: Goal;
  channels: Channel[]; // all must be selected
  tasks: WeekTasks;
};

const DIGITAL_ADS: Channel = "Digital Ad Networks (Paid Search, Social, Display)";
const EMAIL: Channel = "Email & Lifecycle Marketing";
const SEO: Channel = "Content & SEO Strategy";
const PLG: Channel = "Product-Led / In-App (Onboarding Flows, Pop-ups)";
const DEVDOCS: Channel = "Developer / Tech Docs & API Portals";
const SALES: Channel = "Outbound Sales Enablement & Events";

export const comboRules: ComboRule[] = [
  {
    id: "leadgen-ads-email",
    goal: "Lead Generation & Conversion Optimization",
    channels: [DIGITAL_ADS, EMAIL],
    tasks: {
      architecture: ["Design lead capture-to-nurture journey"],
      production: ["Build nurture sequence for new inbound leads"],
      "tech-setup": ["Sync ad-platform leads into CRM in real time"],
      qa: ["Validate CRM readiness: fields, dedupe and consent"],
      launch: ["Monitor lead quality and routing SLA from Day 1"],
      "early-opt": ["Rebalance paid media toward lowest-CPL segments"],
    },
  },
  {
    id: "leadgen-ads-seo",
    goal: "Lead Generation & Conversion Optimization",
    channels: [DIGITAL_ADS, SEO],
    tasks: {
      research: ["Map paid and organic keyword overlap"],
      optimization: ["Shift budget from keywords now ranking organically"],
    },
  },
  {
    id: "saas-plg-email",
    goal: "SaaS Product Launch (PLG & User Onboarding)",
    channels: [PLG, EMAIL],
    tasks: {
      "creative-dev": ["Align in-app prompts with lifecycle email triggers"],
      "early-opt": ["Re-engage stalled trials with behavioural email"],
    },
  },
  {
    id: "it-devdocs-sales",
    goal: "Enterprise Software Release / IT Migration",
    channels: [DEVDOCS, SALES],
    tasks: {
      "creative-dev": ["Build partner and integrator migration briefing pack"],
      readiness: ["Enable account teams on customer migration questions"],
    },
  },
  {
    id: "retention-plg-email",
    goal: "Customer Retention & Churn Reduction",
    channels: [PLG, EMAIL],
    tasks: {
      production: ["Build in-app and email save-offer flows"],
      optimization: ["Test save-offer timing across both channels"],
    },
  },
  {
    id: "any-ads-sales",
    channels: [DIGITAL_ADS, SALES],
    tasks: {
      readiness: ["Agree lead handoff and follow-up SLA with sales"],
      review: ["Report pipeline sourced by paid media with sales ops"],
    },
  },
];

/** Budget and risk shape how much extra work is realistic per week. */
export const budgetRules = {
  /** Big budgets justify more parallel workstreams; tight budgets stay lean. */
  maxTasksPerWeek(config: CampaignConfig) {
    let max = 6;
    if (config.budget >= 150000) max += 1;
    if (config.budget < 25000) max -= 1;
    if (config.risk === "High") max += 1; // more verification work
    if (config.weeks <= 4) max += 1; // compressed plan packs weeks tighter
    return Math.min(Math.max(max, 5), 9);
  },
};

/** All rule-derived extra tasks for one lifecycle week, in priority order. */
export function extraTasksFor(config: CampaignConfig, weekKey: string): string[] {
  const out: string[] = [];
  const push = (list?: string[]) => {
    for (const t of list ?? []) if (!out.includes(t)) out.push(t);
  };

  // 1. channel rules
  for (const c of config.channels) {
    const t = channelConfigs[c]?.[weekKey];
    if (t && !out.includes(t)) out.push(t);
  }
  // 2. goal emphasis
  push(goalConfigs[config.goal]?.emphasis[weekKey as WeekKey]);
  // 3. combination rules (goal + channel mix)
  for (const rule of comboRules) {
    if (rule.goal && rule.goal !== config.goal) continue;
    if (!rule.channels.every((c) => config.channels.includes(c))) continue;
    push(rule.tasks[weekKey as WeekKey]);
  }
  return out;
}

export { scenarioFor };
