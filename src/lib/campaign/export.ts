import { CHANNEL_SHORT, formatCurrency, formatDate, formatShort, parseDate } from "@/lib/brief";
import type { HealthSummary } from "./health";
import { monitoringCadence } from "./raid";
import type {
  BudgetAllocation,
  CampaignConfig,
  DeliveryPlan,
  KPI,
  RAIDItem,
} from "./types";

export type ExportPayload = {
  config: CampaignConfig;
  plan: DeliveryPlan;
  kpis: KPI[];
  budget: BudgetAllocation;
  raid: RAIDItem[];
  health: HealthSummary;
  done: string[];
};

function summaryRows(p: ExportPayload): [string, string][] {
  return [
    ["Campaign", p.config.name],
    ["Strategic goal", p.config.goal],
    ["Channels", p.config.channels.map((c) => CHANNEL_SHORT[c] ?? c).join(", ") || "—"],
    ["Launch date", formatDate(parseDate(p.config.launchDate))],
    ["Programme duration", `${p.config.weeks} weeks (${p.budget.spendDays} days)`],
    ["Total budget", formatCurrency(p.budget.total)],
    ["Daily burn rate", formatCurrency(p.budget.dailyBurn)],
    ["Risk sensitivity", p.config.risk],
    ["Campaign health", `${p.health.state} — ${p.health.reason}`],
    ["Planning status", p.health.planningStatus],
    ["Progress", `${p.health.progress}% (${p.health.completed}/${p.health.total} tasks)`],
  ];
}

export function toMarkdown(p: ExportPayload) {
  const done = new Set(p.done);
  const L: string[] = [];
  L.push(`# ${p.config.name} — Campaign Brief`, "");
  L.push("## Executive Summary", "");
  summaryRows(p).forEach(([k, v]) => L.push(`- **${k}:** ${v}`));
  L.push("", `## ${p.plan.label}`, "");
  p.plan.phases.forEach((ph) => {
    L.push(`### ${ph.order} — ${ph.name}`);
    ph.weeks.forEach((w) => {
      L.push("", `**${w.title}** (${formatShort(w.start)} – ${formatShort(w.end)})`);
      w.tasks.forEach((t) => L.push(`- [${done.has(t.id) ? "x" : " "}] ${t.label}`));
    });
    L.push("");
  });
  L.push("## KPI & Measurement Plan", "");
  L.push("| KPI | Planning Target | Measurement Source | Status |", "| --- | --- | --- | --- |");
  p.kpis.forEach((k) => L.push(`| ${k.name} | ${k.target} | ${k.source} | ${k.status} |`));
  L.push("", "## Budget Allocation & Pacing", "");
  L.push("| Category | % | Amount |", "| --- | --- | --- |");
  p.budget.lines.forEach((l) =>
    L.push(`| ${l.category} | ${l.percent}% | ${formatCurrency(l.amount)} |`),
  );
  L.push(
    "",
    `- Total budget: ${formatCurrency(p.budget.total)}`,
    `- Planned allocation: ${formatCurrency(p.budget.planned)}`,
    `- Contingency reserve: ${formatCurrency(p.budget.contingency)}`,
    `- Daily burn rate: ${formatCurrency(p.budget.dailyBurn)}`,
    "",
  );
  L.push("## RAID Log", "");
  L.push("| Type | Severity | Description | Mitigation | Owner | Status |");
  L.push("| --- | --- | --- | --- | --- | --- |");
  p.raid.forEach((r) =>
    L.push(`| ${r.type} | ${r.severity} | ${r.description} | ${r.mitigation} | ${r.owner} | ${r.status} |`),
  );
  L.push("", `_${monitoringCadence(p.config)}_`);
  return L.join("\n");
}

export function toJira(p: ExportPayload) {
  const done = new Set(p.done);
  const L: string[] = [];
  L.push(`h1. ${p.config.name} — Campaign Brief`, "");
  summaryRows(p).forEach(([k, v]) => L.push(`*${k}:* ${v}`));
  L.push("", `h2. ${p.plan.label}`);
  p.plan.phases.forEach((ph) => {
    L.push(`h3. ${ph.order} — ${ph.name}`);
    ph.weeks.forEach((w) => {
      L.push(`h4. ${w.title} (${formatShort(w.start)} – ${formatShort(w.end)})`);
      w.tasks.forEach((t) => L.push(`* ${done.has(t.id) ? "(/)" : "( )"} ${t.label}`));
    });
  });
  L.push("", "h2. KPI & Measurement Plan");
  L.push("||KPI||Planning Target||Source||Status||");
  p.kpis.forEach((k) => L.push(`|${k.name}|${k.target}|${k.source}|${k.status}|`));
  L.push("", "h2. Budget Allocation");
  L.push("||Category||%||Amount||");
  p.budget.lines.forEach((l) => L.push(`|${l.category}|${l.percent}%|${formatCurrency(l.amount)}|`));
  L.push(`|Daily burn rate| |${formatCurrency(p.budget.dailyBurn)}|`);
  L.push("", "h2. RAID Log");
  L.push("||Type||Severity||Description||Mitigation||Owner||Status||");
  p.raid.forEach((r) =>
    L.push(`|${r.type}|${r.severity}|${r.description}|${r.mitigation}|${r.owner}|${r.status}|`),
  );
  L.push("", `h2. Campaign Health`, `${p.health.state} — ${p.health.reason}`);
  return L.join("\n");
}

export function toAsana(p: ExportPayload) {
  const done = new Set(p.done);
  const L: string[] = [];
  L.push(`Project: ${p.config.name}`);
  L.push(
    `Notes: ${p.config.goal} — ${formatCurrency(p.budget.total)} across ${p.config.channels.map((c) => CHANNEL_SHORT[c] ?? c).join(", ") || "no channels"}. Health: ${p.health.state}.`,
  );
  L.push("");
  p.plan.phases.forEach((ph) => {
    ph.weeks.forEach((w) => {
      L.push(`Section: ${ph.order} ${ph.name} · ${w.title} (due ${formatDate(w.end)})`);
      w.tasks.forEach((t) =>
        L.push(`  Task: ${t.label} [due ${formatDate(w.end)}]${done.has(t.id) ? " [completed]" : ""}`),
      );
      L.push("");
    });
  });
  L.push("Section: KPI & Measurement Plan");
  p.kpis.forEach((k) => L.push(`  Task: ${k.name} — Planning Target ${k.target} (source: ${k.source}) [${k.status}]`));
  L.push("");
  L.push("Section: Budget Allocation");
  p.budget.lines.forEach((l) => L.push(`  Task: ${l.category} — ${l.percent}% · ${formatCurrency(l.amount)}`));
  L.push(`  Task: Daily burn rate — ${formatCurrency(p.budget.dailyBurn)}`);
  L.push("");
  L.push("Section: RAID Log");
  p.raid.forEach((r) =>
    L.push(`  Task: [${r.type} · ${r.severity}] ${r.description} — Response: ${r.mitigation} (owner: ${r.owner}, ${r.status})`),
  );
  return L.join("\n");
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Client-side PDF via the browser print dialog — no server, no paid API. */
export function printPdf(p: ExportPayload) {
  const done = new Set(p.done);
  const rows = summaryRows(p)
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
    .join("");

  const plan = p.plan.phases
    .map(
      (ph) => `<h3>${ph.order} — ${esc(ph.name)}</h3>` +
        ph.weeks
          .map(
            (w) =>
              `<p class="wk"><strong>${esc(w.title)}</strong> <span>${formatShort(w.start)} – ${formatShort(w.end)}</span></p>` +
              `<ul>${w.tasks.map((t) => `<li>${done.has(t.id) ? "☑" : "☐"} ${esc(t.label)}</li>`).join("")}</ul>`,
          )
          .join(""),
    )
    .join("");

  const kpis = p.kpis
    .map((k) => `<tr><td>${esc(k.name)}</td><td>${esc(k.target)}</td><td>${esc(k.source)}</td><td>${esc(k.status)}</td></tr>`)
    .join("");
  const budget = p.budget.lines
    .map((l) => `<tr><td>${esc(l.category)}</td><td>${l.percent}%</td><td>${formatCurrency(l.amount)}</td></tr>`)
    .join("");
  const raid = p.raid
    .map(
      (r) =>
        `<tr><td>${r.type}</td><td>${r.severity}</td><td>${esc(r.description)}</td><td>${esc(r.mitigation)}</td><td>${esc(r.owner)}</td><td>${r.status}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(p.config.name)} — Campaign Brief</title>
<style>
:root{color-scheme:light}
body{font-family:ui-sans-serif,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#0f172a;margin:32px;line-height:1.45}
h1{font-size:24px;margin:0 0 4px}h2{font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:#475569;margin:26px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
h3{font-size:13px;margin:14px 0 4px;color:#4338ca}
p.sub{color:#64748b;margin:0 0 8px;font-size:12px}
table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:6px}
th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#f8fafc;width:180px;font-weight:600}
table.grid th{width:auto}
ul{margin:2px 0 10px 18px;padding:0;font-size:12px}
p.wk{margin:8px 0 2px;font-size:12px}p.wk span{color:#64748b}
.badge{display:inline-block;border:1px solid #c7d2fe;background:#eef2ff;color:#3730a3;border-radius:999px;padding:2px 10px;font-size:11px}
@page{margin:16mm}
</style></head><body>
<h1>${esc(p.config.name)}</h1>
<p class="sub">Campaign Brief · generated ${formatDate(new Date())} · <span class="badge">${p.health.state}</span></p>
<h2>Executive Summary</h2><table>${rows}</table>
<h2>${esc(p.plan.label)}</h2>${plan}
<h2>KPI &amp; Measurement Plan</h2><table class="grid"><tr><th>KPI</th><th>Planning Target</th><th>Measurement Source</th><th>Status</th></tr>${kpis}</table>
<h2>Budget Allocation &amp; Pacing</h2><table class="grid"><tr><th>Category</th><th>%</th><th>Amount</th></tr>${budget}</table>
<p class="sub">Total ${formatCurrency(p.budget.total)} · Planned ${formatCurrency(p.budget.planned)} · Contingency ${formatCurrency(p.budget.contingency)} · Daily burn ${formatCurrency(p.budget.dailyBurn)}</p>
<h2>RAID Log</h2><table class="grid"><tr><th>Type</th><th>Severity</th><th>Description</th><th>Mitigation / Response</th><th>Owner</th><th>Status</th></tr>${raid}</table>
<p class="sub">${esc(monitoringCadence(p.config))}</p>
<h2>Progress Summary</h2>
<p class="sub">${p.health.completed} of ${p.health.total} tasks complete (${p.health.progress}%). Planning status: ${p.health.planningStatus}. ${esc(p.health.reason)}</p>
</body></html>`;

  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return false;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 350);
  return true;
}
