import type { Channel, Goal } from "@/lib/brief";
import type { ScenarioId } from "./types";

export type WeekBlueprint = {
  key: string;
  title: string;
  tasks: string[];
  /** Indexes of tasks in this week that gate go-live. */
  critical?: number[];
};

export const PHASE_NAMES = [
  "Discovery & Strategy",
  "Campaign Architecture & Planning",
  "Creative Production",
  "Technical Readiness & QA",
  "Launch & Monitoring",
  "Optimization & Reporting",
] as const;

/** Blueprint index -> phase index (pairs of weeks). */
export function phaseIndexFor(blueprintIndex: number) {
  return Math.min(Math.floor(blueprintIndex / 2), PHASE_NAMES.length - 1);
}

/** Which of the 12 lifecycle weeks are used for each program duration. */
export const WEEK_SELECTION: Record<number, number[]> = {
  4: [0, 3, 8, 11],
  6: [0, 2, 4, 8, 9, 11],
  8: [0, 1, 3, 4, 6, 8, 9, 11],
  12: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

export const LAUNCH_BLUEPRINT_INDEX = 8;

const marketing: WeekBlueprint[] = [
  {
    key: "kickoff",
    title: "Kickoff & Alignment",
    tasks: [
      "Campaign kickoff workshop",
      "Confirm objectives and success criteria",
      "Identify stakeholders and owners",
      "Initial audience definition",
    ],
  },
  {
    key: "research",
    title: "Research & Strategy",
    tasks: [
      "Audience segmentation",
      "Competitive and channel landscape review",
      "Channel strategy",
      "Initial KPI framework",
    ],
  },
  {
    key: "architecture",
    title: "Campaign Architecture",
    tasks: [
      "Finalize messaging framework",
      "Define campaign funnel",
      "Allocate channel budget",
      "Approve measurement plan",
    ],
    critical: [3],
  },
  {
    key: "creative-dev",
    title: "Creative Development",
    tasks: [
      "Develop campaign concepts",
      "Draft channel-specific messaging",
      "Begin creative asset production",
      "Build content calendar",
    ],
  },
  {
    key: "production",
    title: "Production & Review",
    tasks: [
      "Complete channel assets",
      "Build landing page and content variants",
      "Internal creative review",
      "Incorporate stakeholder feedback",
    ],
    critical: [0],
  },
  {
    key: "tech-setup",
    title: "Technical Setup",
    tasks: [
      "Configure campaign tracking",
      "Set up pixels, events and UTMs",
      "Configure attribution model",
      "Prepare A/B tests",
    ],
    critical: [0, 1],
  },
  {
    key: "qa",
    title: "QA & Compliance",
    tasks: [
      "Cross-device QA",
      "Validate tracking end to end",
      "Brand review",
      "Legal and compliance approval",
    ],
    critical: [1, 3],
  },
  {
    key: "readiness",
    title: "Launch Readiness",
    tasks: [
      "Final stakeholder approval",
      "Confirm media schedules",
      "Verify budget pacing setup",
      "Complete launch-readiness checklist",
    ],
    critical: [0, 3],
  },
  {
    key: "launch",
    title: "Launch",
    tasks: [
      "Stage go-live across channels",
      "Monitor Day-1 performance",
      "Validate campaign delivery",
      "Escalate and resolve launch issues",
    ],
    critical: [0, 2],
  },
  {
    key: "early-opt",
    title: "Early Optimization",
    tasks: [
      "Review early performance",
      "Adjust bids and budgets",
      "Pause weak variants",
      "Scale strong creative",
    ],
  },
  {
    key: "optimization",
    title: "Optimization",
    tasks: [
      "Refresh creative where necessary",
      "Reallocate spend across channels",
      "Optimize audience targeting",
      "Review KPI trajectory",
    ],
  },
  {
    key: "review",
    title: "Performance Review",
    tasks: [
      "Final campaign performance readout",
      "Document lessons learned",
      "Build optimization backlog",
      "Prepare stakeholder summary",
    ],
  },
];

const saas: WeekBlueprint[] = [
  {
    key: "kickoff",
    title: "Release Kickoff & Alignment",
    tasks: [
      "Launch kickoff with product, growth and support",
      "Confirm activation and adoption targets",
      "Assign release owners and RACI",
      "Define target user segments and personas",
    ],
  },
  {
    key: "research",
    title: "Product & Market Research",
    tasks: [
      "Analyze current activation funnel drop-off",
      "Review competitor positioning",
      "Interview design partners",
      "Draft value proposition and KPI framework",
    ],
  },
  {
    key: "architecture",
    title: "Launch Architecture",
    tasks: [
      "Finalize positioning and messaging house",
      "Map PLG funnel and trial-to-paid path",
      "Allocate budget across launch motions",
      "Approve instrumentation and measurement plan",
    ],
    critical: [3],
  },
  {
    key: "creative-dev",
    title: "Narrative & Asset Development",
    tasks: [
      "Write launch narrative and release notes",
      "Draft in-app onboarding copy",
      "Design product screenshots and demo assets",
      "Plan lifecycle email sequence",
    ],
  },
  {
    key: "production",
    title: "Production & Enablement",
    tasks: [
      "Ship launch page and pricing updates",
      "Build in-app tours and empty states",
      "Produce demo video and help-center articles",
      "Brief support and success teams",
    ],
    critical: [0],
  },
  {
    key: "tech-setup",
    title: "Instrumentation & Flags",
    tasks: [
      "Instrument activation and feature events",
      "Configure feature flags and cohorts",
      "Validate billing and entitlement logic",
      "Set up experiment variants",
    ],
    critical: [0, 2],
  },
  {
    key: "qa",
    title: "QA & Release Gate",
    tasks: [
      "End-to-end signup and upgrade QA",
      "Verify analytics events fire correctly",
      "Security and privacy review",
      "Release gate sign-off",
    ],
    critical: [0, 3],
  },
  {
    key: "readiness",
    title: "Launch Readiness",
    tasks: [
      "Run 10% canary cohort",
      "Confirm rollback plan and owners",
      "Finalize launch-day comms schedule",
      "Complete go/no-go checklist",
    ],
    critical: [1, 3],
  },
  {
    key: "launch",
    title: "Release & Monitoring",
    tasks: [
      "Progressive rollout to 100% of users",
      "Monitor activation and error rates",
      "Publish launch announcement and changelog",
      "Triage inbound support themes",
    ],
    critical: [0, 1],
  },
  {
    key: "early-opt",
    title: "Adoption Optimization",
    tasks: [
      "Review activation funnel by cohort",
      "Fix highest-friction onboarding step",
      "Trigger re-engagement for stalled trials",
      "Scale the best-performing onboarding variant",
    ],
  },
  {
    key: "optimization",
    title: "Expansion & Conversion",
    tasks: [
      "Optimize trial-to-paid prompts",
      "Test pricing and packaging messaging",
      "Expand rollout to secondary segments",
      "Review retention and expansion trends",
    ],
  },
  {
    key: "review",
    title: "Release Retrospective",
    tasks: [
      "Adoption and revenue readout",
      "Run release retrospective",
      "Log product backlog items",
      "Prepare stakeholder summary",
    ],
  },
];

const ecom: WeekBlueprint[] = [
  {
    key: "kickoff",
    title: "Kickoff & Commercial Alignment",
    tasks: [
      "Kickoff with merchandising and media teams",
      "Confirm revenue and ROAS targets",
      "Agree promotional calendar owners",
      "Define priority customer segments",
    ],
  },
  {
    key: "research",
    title: "Demand & Category Research",
    tasks: [
      "Analyze last-season performance by category",
      "Review competitor pricing and promotions",
      "Forecast demand and inventory coverage",
      "Draft KPI and margin guardrails",
    ],
  },
  {
    key: "architecture",
    title: "Offer & Funnel Architecture",
    tasks: [
      "Lock promotional offer structure",
      "Map acquisition and retention funnels",
      "Allocate media budget by category",
      "Approve measurement and attribution plan",
    ],
    critical: [0, 3],
  },
  {
    key: "creative-dev",
    title: "Creative & Merchandising",
    tasks: [
      "Develop hero campaign concept",
      "Produce product and lifestyle creative",
      "Draft category and PDP copy",
      "Build promotional content calendar",
    ],
  },
  {
    key: "production",
    title: "Store & Asset Production",
    tasks: [
      "Build campaign landing and category pages",
      "Upload creative to ad platforms",
      "Configure product feed and catalog rules",
      "Merchandising and brand review",
    ],
    critical: [2],
  },
  {
    key: "tech-setup",
    title: "Tracking & Checkout Readiness",
    tasks: [
      "Configure purchase and add-to-cart events",
      "Validate feed, pixels and server-side tagging",
      "Set up promo codes and cart rules",
      "Prepare checkout A/B tests",
    ],
    critical: [0, 2],
  },
  {
    key: "qa",
    title: "QA & Peak Load Checks",
    tasks: [
      "Cross-device purchase journey QA",
      "Validate revenue tracking accuracy",
      "Load-test checkout and CDN",
      "Legal and promotional compliance sign-off",
    ],
    critical: [0, 1, 3],
  },
  {
    key: "readiness",
    title: "Launch Readiness",
    tasks: [
      "Confirm inventory and fulfilment capacity",
      "Verify media pacing and bid caps",
      "Brief customer service on offers",
      "Complete launch-readiness checklist",
    ],
    critical: [0, 3],
  },
  {
    key: "launch",
    title: "Go-Live & Trading",
    tasks: [
      "Activate campaigns across channels",
      "Monitor Day-1 revenue and conversion rate",
      "Verify promo codes and pricing in production",
      "Run daily trading stand-up",
    ],
    critical: [0, 2],
  },
  {
    key: "early-opt",
    title: "Early Trading Optimization",
    tasks: [
      "Reallocate spend to top ROAS campaigns",
      "Pause underperforming creative",
      "Optimize product feed priorities",
      "Launch abandoned-cart recovery flows",
    ],
  },
  {
    key: "optimization",
    title: "Scale & Margin Management",
    tasks: [
      "Scale winning audiences and placements",
      "Refresh fatigued creative",
      "Tune discount depth against margin",
      "Review AOV and repeat-purchase trends",
    ],
  },
  {
    key: "review",
    title: "Trading Review",
    tasks: [
      "Revenue, ROAS and margin readout",
      "Document lessons learned",
      "Build next-season optimization backlog",
      "Prepare stakeholder summary",
    ],
  },
];

const it: WeekBlueprint[] = [
  {
    key: "kickoff",
    title: "Programme Kickoff",
    tasks: [
      "Kickoff with IT, security and business owners",
      "Confirm cutover objectives and success criteria",
      "Establish governance and escalation path",
      "Identify affected user groups and systems",
    ],
  },
  {
    key: "research",
    title: "Discovery & Assessment",
    tasks: [
      "Inventory legacy systems and integrations",
      "Assess data quality and migration scope",
      "Map compliance and regulatory requirements",
      "Draft adoption and KPI framework",
    ],
  },
  {
    key: "architecture",
    title: "Migration Architecture",
    tasks: [
      "Finalize target architecture and cutover approach",
      "Define rollback and contingency plan",
      "Allocate budget across workstreams",
      "Approve measurement and reporting plan",
    ],
    critical: [0, 1],
  },
  {
    key: "creative-dev",
    title: "Comms & Enablement Design",
    tasks: [
      "Draft change-management communications plan",
      "Design training curriculum by user group",
      "Write migration and API documentation",
      "Build stakeholder update cadence",
    ],
  },
  {
    key: "production",
    title: "Build & Configuration",
    tasks: [
      "Configure target environment",
      "Build integrations and data mappings",
      "Publish versioned developer documentation",
      "Internal technical review",
    ],
    critical: [1],
  },
  {
    key: "tech-setup",
    title: "Dry-Run Migration",
    tasks: [
      "Run staging dry-run migration",
      "Validate data reconciliation reports",
      "Load-test integrations and rate limits",
      "Confirm monitoring and alerting coverage",
    ],
    critical: [0, 1],
  },
  {
    key: "qa",
    title: "UAT, Security & Compliance",
    tasks: [
      "User acceptance testing by business unit",
      "Penetration test and remediation",
      "Access control and audit review",
      "Compliance sign-off",
    ],
    critical: [0, 1, 3],
  },
  {
    key: "readiness",
    title: "Cutover Readiness",
    tasks: [
      "Complete training for all user groups",
      "Confirm hypercare support roster",
      "Freeze legacy system changes",
      "Go/no-go cutover decision",
    ],
    critical: [1, 3],
  },
  {
    key: "launch",
    title: "Cutover & Hypercare",
    tasks: [
      "Execute production cutover",
      "Validate data integrity post-migration",
      "Monitor system stability and incidents",
      "Run hypercare stand-ups and triage",
    ],
    critical: [0, 1],
  },
  {
    key: "early-opt",
    title: "Stabilization",
    tasks: [
      "Resolve priority defects",
      "Review incident and ticket trends",
      "Reinforce training for low-adoption groups",
      "Tune performance and integration limits",
    ],
  },
  {
    key: "optimization",
    title: "Adoption & Decommission",
    tasks: [
      "Drive adoption in lagging business units",
      "Plan legacy system decommission",
      "Optimize licence and capacity costs",
      "Review adoption KPI trajectory",
    ],
  },
  {
    key: "review",
    title: "Programme Review",
    tasks: [
      "Cutover and adoption readout",
      "Document lessons learned",
      "Build post-migration backlog",
      "Prepare steering committee summary",
    ],
  },
];

export const TASK_LIBRARIES: Record<ScenarioId, WeekBlueprint[]> = {
  marketing,
  saas,
  ecom,
  it,
};

/** Extra tasks injected into specific lifecycle weeks when a channel is selected. */
export const CHANNEL_TASKS: Record<Channel, Partial<Record<string, string>>> = {
  "Digital Ad Networks (Paid Search, Social, Display)": {
    architecture: "Plan paid media mix and bid strategy",
    production: "Traffic ad creative variants per placement",
    "tech-setup": "Verify conversion tracking in ad platforms",
    readiness: "Submit creative for ad-platform policy review",
    launch: "Monitor CPC, CTR and delivery pacing",
    optimization: "Rebalance paid media spend toward top performers",
  },
  "Product-Led / In-App (Onboarding Flows, Pop-ups)": {
    architecture: "Define in-app activation milestones",
    "creative-dev": "Design in-app messaging and tooltips",
    "tech-setup": "Gate in-app flows behind feature flags",
    qa: "QA in-app flows across app versions",
    launch: "Release in-app flow to a canary cohort",
    "early-opt": "Iterate on the highest drop-off onboarding step",
  },
  "Email & Lifecycle Marketing": {
    research: "Audit CRM list hygiene and consent records",
    "creative-dev": "Draft lifecycle email sequence",
    "tech-setup": "Warm sending domain and configure suppression rules",
    qa: "Run seed-list deliverability test",
    launch: "Stagger first sends to protect sender reputation",
    optimization: "Test subject lines and send-time optimization",
  },
  "Content & SEO Strategy": {
    research: "Keyword and search-intent research",
    architecture: "Define content pillar and internal linking plan",
    "creative-dev": "Draft cornerstone content pieces",
    production: "Publish and optimize on-page SEO",
    "early-opt": "Review indexation in Search Console",
    optimization: "Refresh underperforming content",
  },
  "Developer / Tech Docs & API Portals": {
    architecture: "Define API versioning and doc structure",
    production: "Publish developer docs and code samples",
    "tech-setup": "Provision sandbox keys and raise rate limits",
    qa: "Load-test the developer portal",
    launch: "Monitor API error rates and sandbox signups",
    optimization: "Close documentation gaps from developer feedback",
  },
  "Outbound Sales Enablement & Events": {
    research: "Align target account list with sales",
    "creative-dev": "Build sales enablement deck and one-pagers",
    readiness: "Run enablement session with the sales team",
    launch: "Activate outbound sequences and event follow-up",
    "early-opt": "Review lead routing SLA compliance",
    review: "Pipeline contribution review with sales ops",
  },
};

const GOAL_SCENARIO: Record<Goal, ScenarioId> = {
  "SaaS Product Launch (PLG & User Onboarding)": "saas",
  "Enterprise Software Release / IT Migration": "it",
  "Customer Retention & Churn Reduction": "saas",
  "Lead Generation & Conversion Optimization": "marketing",
  "Brand Awareness & Market Expansion": "marketing",
  "Feature Rollout & Growth Experimentation": "saas",
};

const PRESET_SCENARIO: Record<string, ScenarioId> = {
  saas: "saas",
  ecom: "ecom",
  it: "it",
  marketing: "marketing",
};

export function scenarioFor(goal: Goal, presetId: string | null): ScenarioId {
  if (presetId && PRESET_SCENARIO[presetId]) return PRESET_SCENARIO[presetId]!;
  return GOAL_SCENARIO[goal] ?? "marketing";
}
