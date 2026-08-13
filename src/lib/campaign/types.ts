import type { Channel, Goal, RiskLevel, SprintWeeks } from "@/lib/brief";

export type ScenarioId = "marketing" | "saas" | "ecom" | "it";

export type CampaignConfig = {
  name: string;
  goal: Goal;
  channels: Channel[];
  budget: number;
  launchDate: string; // yyyy-mm-dd
  risk: RiskLevel;
  weeks: SprintWeeks;
  presetId: string | null;
};

export type CampaignTask = {
  id: string;
  label: string;
  /** Launch-readiness / go-live critical task. Used by Campaign Health. */
  critical: boolean;
};

export type CampaignWeek = {
  id: string;
  index: number; // 1-based week number
  title: string;
  start: Date;
  end: Date;
  isLaunchWeek: boolean;
  tasks: CampaignTask[];
};

export type CampaignPhase = {
  id: string;
  order: string; // "01"
  name: string;
  weeks: CampaignWeek[];
};

export type DeliveryPlan = {
  label: string; // "12-Week Campaign Delivery Plan"
  phases: CampaignPhase[];
  weeks: CampaignWeek[];
  totalTasks: number;
};

export type KPI = {
  id: string;
  name: string;
  target: string;
  source: string;
  status: KpiStatus;
};

export type KpiStatus = "Planned" | "Tracking" | "At Risk" | "Achieved";
export const KPI_STATUSES: KpiStatus[] = ["Planned", "Tracking", "At Risk", "Achieved"];

export type BudgetLine = {
  id: string;
  category: string;
  percent: number;
  amount: number;
};

export type BudgetAllocation = {
  lines: BudgetLine[];
  total: number;
  planned: number;
  contingency: number;
  dailyBurn: number;
  spendDays: number;
};

export type RaidType = "Risk" | "Assumption" | "Issue" | "Dependency";
export type RaidSeverity = "Low" | "Medium" | "High";
export type RaidStatus = "Open" | "Monitoring" | "Mitigated" | "Closed";
export const RAID_STATUSES: RaidStatus[] = ["Open", "Monitoring", "Mitigated", "Closed"];

export type RAIDItem = {
  id: string;
  type: RaidType;
  description: string;
  severity: RaidSeverity;
  mitigation: string;
  owner: string;
  status: RaidStatus;
};

export type HealthState = "On Track" | "At Risk" | "Off Track" | "Complete";

export type PlanningStatus =
  | "Planning"
  | "Creative Production"
  | "QA / Launch Readiness"
  | "Live"
  | "Optimization"
  | "Complete";

export type SavedCampaign = {
  id: string;
  savedAt: string;
  label: string;
  config: CampaignConfig;
  done: string[];
  kpiTargets: Record<string, string>;
  kpiStatus: Record<string, KpiStatus>;
  raidStatus: Record<string, RaidStatus>;
};
