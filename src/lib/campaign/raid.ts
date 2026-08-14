import type { Channel, Goal } from "@/lib/brief";
import { scenarioFor } from "./tasks";
import type { CampaignConfig, RAIDItem, RaidSeverity, RaidType, ScenarioId } from "./types";

type Candidate = {
  id: string;
  type: RaidType;
  description: string;
  mitigation: string;
  owner: string;
  base: RaidSeverity;
  weight: number; // higher = included first
};

const CHANNEL_RAID: Record<Channel, Candidate[]> = {
  "Digital Ad Networks (Paid Search, Social, Display)": [
    {
      id: "ch-ads-cpc",
      type: "Risk",
      description: "Auction CPC inflation erodes efficiency and reduces planned paid delivery.",
      mitigation: "Cap bids, review CPC weekly, and hold budget back for the strongest placements.",
      owner: "Paid Media Lead",
      base: "Medium",
      weight: 8,
    },
    {
      id: "ch-ads-policy",
      type: "Dependency",
      description: "Ad-platform policy review must clear before creative can serve.",
      mitigation: "Submit creative five working days early and prepare compliant backup variants.",
      owner: "Paid Media Lead",
      base: "Medium",
      weight: 6,
    },
  ],
  "Product-Led / In-App (Onboarding Flows, Pop-ups)": [
    {
      id: "ch-plg-release",
      type: "Dependency",
      description: "In-app flows depend on the product release train landing on schedule.",
      mitigation: "Gate flows behind feature flags so marketing timing is decoupled from the release.",
      owner: "Product Manager",
      base: "High",
      weight: 8,
    },
    {
      id: "ch-plg-friction",
      type: "Risk",
      description: "Onboarding friction suppresses activation despite healthy top-of-funnel volume.",
      mitigation: "Instrument every funnel step and run a canary cohort before full rollout.",
      owner: "Growth Lead",
      base: "Medium",
      weight: 5,
    },
  ],
  "Email & Lifecycle Marketing": [
    {
      id: "ch-email-deliver",
      type: "Risk",
      description: "Sender reputation or domain warm-up issues suppress inbox placement.",
      mitigation: "Run seed-list tests a week ahead and stagger volume ramp across sends.",
      owner: "Lifecycle Marketing Manager",
      base: "Medium",
      weight: 6,
    },
    {
      id: "ch-email-crm",
      type: "Dependency",
      description: "CRM list hygiene and consent records must be validated before sending.",
      mitigation: "Complete suppression and consent audit during the technical setup week.",
      owner: "Marketing Ops",
      base: "Medium",
      weight: 7,
    },
  ],
  "Content & SEO Strategy": [
    {
      id: "ch-seo-timing",
      type: "Assumption",
      description: "Organic content is assumed to index and compound within the campaign window.",
      mitigation: "Pair evergreen content with paid amplification and track indexation weekly.",
      owner: "Content Lead",
      base: "Low",
      weight: 4,
    },
  ],
  "Developer / Tech Docs & API Portals": [
    {
      id: "ch-dev-limits",
      type: "Issue",
      description: "Sandbox keys, API rate limits and doc versioning are not finalized for external developers.",
      mitigation: "Raise sandbox limits, publish versioned docs, and load-test the portal pre-launch.",
      owner: "Developer Relations",
      base: "High",
      weight: 8,
    },
  ],
  "Outbound Sales Enablement & Events": [
    {
      id: "ch-sales-capacity",
      type: "Dependency",
      description: "Sales capacity and enablement readiness gate conversion of generated demand.",
      mitigation: "Lock enablement two weeks out and agree SLA-backed lead routing with sales ops.",
      owner: "Sales Enablement",
      base: "Medium",
      weight: 7,
    },
  ],
};

const GOAL_RAID: Record<Goal, Candidate[]> = {
  "Lead Generation & Conversion Optimization": [
    {
      id: "goal-attrib",
      type: "Risk",
      description: "Attribution and conversion-tracking gaps make pipeline contribution unprovable.",
      mitigation: "Validate UTM taxonomy, conversion events and CRM handoff before spend goes live.",
      owner: "Marketing Ops",
      base: "High",
      weight: 9,
    },
    {
      id: "goal-crm",
      type: "Dependency",
      description: "CRM integration and lead routing must be live before demand generation starts.",
      mitigation: "Complete CRM integration test with a synthetic lead during QA week.",
      owner: "Marketing Ops",
      base: "High",
      weight: 9,
    },
    {
      id: "goal-lp",
      type: "Risk",
      description: "Landing page conversion rate may fall short of the planning target.",
      mitigation: "Ship two page variants and start A/B testing in the first optimization week.",
      owner: "Conversion Lead",
      base: "Medium",
      weight: 6,
    },
  ],
  "SaaS Product Launch (PLG & User Onboarding)": [
    {
      id: "goal-activation",
      type: "Risk",
      description: "Self-serve activation drop-off blocks product-led adoption at launch.",
      mitigation: "Instrument activation events and run onboarding experiments from week one of traffic.",
      owner: "Growth Lead",
      base: "High",
      weight: 9,
    },
    {
      id: "goal-billing",
      type: "Dependency",
      description: "Billing, entitlement and trial-to-paid logic must ship with the onboarding flow.",
      mitigation: "Freeze billing scope early and rehearse an end-to-end trial conversion.",
      owner: "Product Manager",
      base: "Medium",
      weight: 7,
    },
  ],
  "Enterprise Software Release / IT Migration": [
    {
      id: "goal-security",
      type: "Dependency",
      description: "Security and compliance review (SOC 2 / GDPR / pen-test remediation) gates the release.",
      mitigation: "Book the review at the halfway point and track remediation as release blockers.",
      owner: "Security Lead",
      base: "High",
      weight: 10,
    },
    {
      id: "goal-migration",
      type: "Issue",
      description: "Data migration and legacy integrations threaten cutover stability.",
      mitigation: "Run a staging dry-run, reconcile records, and agree a rollback window.",
      owner: "Migration Architect",
      base: "High",
      weight: 9,
    },
    {
      id: "goal-adoption",
      type: "Assumption",
      description: "End users are assumed ready to adopt post-cutover with the planned training.",
      mitigation: "Publish enablement docs and staff a hypercare desk for the first two weeks.",
      owner: "Change Manager",
      base: "Medium",
      weight: 6,
    },
  ],
  "Customer Retention & Churn Reduction": [
    {
      id: "goal-health-data",
      type: "Assumption",
      description: "Customer health and usage data are accurate enough to target at-risk accounts.",
      mitigation: "Validate the churn model against last quarter's cohort before targeting.",
      owner: "Customer Success Ops",
      base: "Medium",
      weight: 7,
    },
    {
      id: "goal-discount",
      type: "Risk",
      description: "Save offers may cannibalize revenue from otherwise healthy accounts.",
      mitigation: "Hold a control group and cap discount exposure per segment.",
      owner: "Revenue Lead",
      base: "Medium",
      weight: 6,
    },
  ],
  "Brand Awareness & Market Expansion": [
    {
      id: "goal-localization",
      type: "Dependency",
      description: "Localized messaging requires in-market review before publishing.",
      mitigation: "Lock the messaging matrix at kickoff and schedule in-market reviewer sign-off.",
      owner: "Brand Lead",
      base: "Medium",
      weight: 7,
    },
    {
      id: "goal-attribution-brand",
      type: "Assumption",
      description: "Awareness outcomes are assumed measurable via proxy metrics inside the window.",
      mitigation: "Agree brand-lift and share-of-voice proxies as primary KPIs up front.",
      owner: "Insights Lead",
      base: "Low",
      weight: 4,
    },
  ],
  "Feature Rollout & Growth Experimentation": [
    {
      id: "goal-significance",
      type: "Risk",
      description: "Experiments may not reach statistical significance inside the rollout window.",
      mitigation: "Pre-compute sample sizes and sequence tests by expected traffic volume.",
      owner: "Experimentation Lead",
      base: "Medium",
      weight: 7,
    },
    {
      id: "goal-flags",
      type: "Issue",
      description: "Feature-flag drift creates inconsistent experiences across cohorts.",
      mitigation: "Maintain a flag registry with owners and schedule clean-up at rollout end.",
      owner: "Engineering Lead",
      base: "Medium",
      weight: 6,
    },
  ],
};

const SCENARIO_RAID: Record<ScenarioId, Candidate[]> = {
  marketing: [
    {
      id: "sc-creative-approval",
      type: "Dependency",
      description: "Creative approval from brand and legal is on the critical path to launch.",
      mitigation: "Book review slots at kickoff and cap feedback to two consolidated rounds.",
      owner: "Campaign Manager",
      base: "Medium",
      weight: 7,
    },
  ],
  saas: [
    {
      id: "sc-support-readiness",
      type: "Dependency",
      description: "Support and success teams need enablement before adoption volume arrives.",
      mitigation: "Run enablement one week before rollout and publish help-centre articles.",
      owner: "Support Lead",
      base: "Low",
      weight: 5,
    },
  ],
  ecom: [
    {
      id: "sc-inventory",
      type: "Risk",
      description: "Inventory or fulfilment capacity may not cover forecast campaign demand.",
      mitigation: "Confirm stock cover in launch-readiness week and set spend caps per category.",
      owner: "Merchandising Lead",
      base: "High",
      weight: 9,
    },
    {
      id: "sc-checkout",
      type: "Issue",
      description: "Peak traffic could degrade checkout performance and lose revenue.",
      mitigation: "Load-test checkout and CDN before go-live and agree an incident escalation path.",
      owner: "E-Commerce Engineering",
      base: "Medium",
      weight: 7,
    },
  ],
  it: [
    {
      id: "sc-freeze",
      type: "Dependency",
      description: "Change freeze on legacy systems must be agreed with all business units.",
      mitigation: "Confirm the freeze window in the steering review two weeks before cutover.",
      owner: "Programme Manager",
      base: "Medium",
      weight: 7,
    },
  ],
};

function durationCandidates(config: CampaignConfig): Candidate[] {
  const out: Candidate[] = [];
  if (config.weeks <= 4) {
    out.push({
      id: "dur-compressed",
      type: "Risk",
      description: "A 4-week plan leaves no contingency if any approval gate slips.",
      mitigation: "Pre-book expedited approvals and hold a reserve in the contingency line.",
      owner: "Programme Manager",
      base: "High",
      weight: 9,
    });
  }
  if (config.weeks >= 8) {
    out.push({
      id: "dur-pacing",
      type: "Risk",
      description: `Budget pacing drift and creative fatigue build over a ${config.weeks}-week delivery window.`,
      mitigation: "Set bi-weekly pacing reviews and schedule a mid-flight creative refresh.",
      owner: "Media Planner",
      base: "Medium",
      weight: 6,
    });
  }
  if (config.weeks >= 12) {
    out.push({
      id: "dur-stakeholder",
      type: "Assumption",
      description: "Stakeholder priorities and named decision-makers are assumed stable for the full programme.",
      mitigation: "Lock a monthly steering review with named deputies for each decision-maker.",
      owner: "Programme Manager",
      base: "Low",
      weight: 5,
    });
  }
  if (config.channels.length >= 4) {
    out.push({
      id: "dur-complexity",
      type: "Risk",
      description: "Coordinating four or more channels increases handover and sequencing complexity.",
      mitigation: "Run a weekly cross-channel stand-up with a single delivery owner per channel.",
      owner: "Campaign Manager",
      base: "Medium",
      weight: 6,
    });
  }
  return out;
}

const ORDER: RaidSeverity[] = ["High", "Medium", "Low"];

function targetCount(config: CampaignConfig) {
  let n = 5;
  if (config.weeks >= 8) n += 1;
  if (config.weeks >= 12) n += 1;
  n += Math.floor(config.channels.length / 2);
  if (config.risk === "High") n += 2;
  if (config.risk === "Low") n -= 1;
  return Math.min(Math.max(n, 4), 10);
}

/** Risk sensitivity shifts the severity distribution, it never flattens everything to High. */
function severityFor(base: RaidSeverity, rank: number, config: CampaignConfig): RaidSeverity {
  const idx = ORDER.indexOf(base);
  let shift = 0;
  if (config.risk === "High" && rank < 3) shift = -1;
  if (config.risk === "Low" && rank >= 2) shift = 1;
  return ORDER[Math.min(Math.max(idx + shift, 0), ORDER.length - 1)]!;
}

export function buildRaidLog(config: CampaignConfig): RAIDItem[] {
  const scenario = scenarioFor(config.goal, config.presetId);
  const pool: Candidate[] = [
    ...(GOAL_RAID[config.goal] ?? []),
    ...config.channels.flatMap((c) => CHANNEL_RAID[c] ?? []),
    ...(SCENARIO_RAID[scenario] ?? []),
    ...durationCandidates(config),
  ];

  const seen = new Set<string>();
  const unique = pool.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));

  const ranked = unique
    .slice()
    .sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))
    .slice(0, targetCount(config));

  return ranked
    .map((c, rank) => ({
      id: c.id,
      type: c.type,
      description: c.description,
      mitigation: c.mitigation,
      owner: c.owner,
      severity: severityFor(c.base, rank, config),
      status: "Open" as const,
    }))
    .sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));
}

export function monitoringCadence(config: CampaignConfig) {
  if (config.risk === "High") return "Twice-weekly RAID review with an escalation path to the sponsor.";
  if (config.risk === "Low") return "Fortnightly RAID review at the delivery stand-up.";
  return "Weekly RAID review at the campaign stand-up.";
}
