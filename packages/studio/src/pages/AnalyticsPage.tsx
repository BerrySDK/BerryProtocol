import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Users, MessageSquare, Percent, UserPlus, Target, TrendingUp, Download, RefreshCw, ChevronDown, Clock } from "lucide-react";

import { AppShell } from "@/components/flow/AppShell";
import { getStudioAnalytics, resetStudioAnalytics, type StudioAnalytics } from "@/lib/studio-api";

type Period = "7" | "14" | "30" | "all";
const periodLabel: Record<Period, string> = {
  "7": "7 days",
  "14": "14 days",
  "30": "30 days",
  all: "All time",
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<StudioAnalytics | null>(null);
  const [flowId, setFlowId] = useState<string>("all");
  const [period, setPeriod] = useState<Period>("14");
  const [openFlow, setOpenFlow] = useState(false);
  const [openPeriod, setOpenPeriod] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const days = period === "all" ? 90 : Number(period);
      const data = await getStudioAnalytics(flowId, days);
      setAnalytics(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }, [flowId, period]);

  useEffect(() => {
    void load();
  }, [load]);

  const flowName = useMemo(() => {
    if (!analytics || flowId === "all") return "All flows";
    return analytics.flowOptions.find((flow) => flow.id === flowId)?.name ?? "Select flow";
  }, [analytics, flowId]);

  const series = analytics?.activity.map((item) => item.value) ?? [];
  const max = Math.max(1, ...series);

  const exportCsv = () => {
    if (!analytics) return;
    const rows = ["date,value", ...analytics.activity.map((item) => `${item.label},${item.value}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `analytics-${flowId}-${period}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const doReset = async () => {
    await resetStudioAnalytics(flowId === "all" ? undefined : flowId);
    setConfirmReset(false);
    setToast("Analytics reset successfully.");
    window.setTimeout(() => setToast(null), 2500);
    await load();
  };

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto px-10 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
              <p className="mt-1 text-sm text-muted-foreground">Real execution metrics from BerryAPI.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button onClick={() => { setOpenFlow((value) => !value); setOpenPeriod(false); }} className="flex min-w-[180px] items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                  <span className="truncate">{flowName}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {openFlow ? (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setOpenFlow(false)} />
                    <div className="absolute right-0 z-40 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-popover shadow-2xl">
                      <FlowOption active={flowId === "all"} onClick={() => { setFlowId("all"); setOpenFlow(false); }}>
                        All flows
                      </FlowOption>
                      {analytics?.flowOptions.map((flow) => (
                        <FlowOption key={flow.id} active={flowId === flow.id} onClick={() => { setFlowId(flow.id); setOpenFlow(false); }}>
                          {flow.name}
                        </FlowOption>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="relative">
                <button onClick={() => { setOpenPeriod((value) => !value); setOpenFlow(false); }} className="flex min-w-[110px] items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                  <span>{periodLabel[period]}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
                {openPeriod ? (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setOpenPeriod(false)} />
                    <div className="absolute right-0 z-40 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-popover shadow-2xl">
                      {(Object.keys(periodLabel) as Period[]).map((value) => (
                        <FlowOption key={value} active={period === value} onClick={() => { setPeriod(value); setOpenPeriod(false); }}>
                          {periodLabel[value]}
                        </FlowOption>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              <button onClick={exportCsv} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-white/5">
                <Download className="h-4 w-4" /> Export CSV
              </button>
              <button onClick={() => setConfirmReset(true)} className="flex items-center gap-2 rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10">
                <RefreshCw className="h-4 w-4" /> Reset metrics
              </button>
            </div>
          </div>

          {error ? <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">{error}</div> : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Kpi icon={Users} label="Visitors" value={loading ? "…" : analytics?.totals.visitors ?? 0} />
            <Kpi icon={MessageSquare} label="Conversations" value={loading ? "…" : analytics?.totals.conversations ?? 0} />
            <Kpi icon={Percent} label="Start rate" value={loading ? "…" : `${analytics?.totals.startRate ?? 0}%`} />
            <Kpi icon={UserPlus} label="Leads" value={loading ? "…" : analytics?.totals.leads ?? 0} />
            <Kpi icon={Target} label="Conversions" value={loading ? "…" : analytics?.totals.conversions ?? 0} />
            <Kpi icon={TrendingUp} label="Conversion rate" value={loading ? "…" : `${analytics?.totals.conversionRate ?? 0}%`} highlight />
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Activity ({periodLabel[period]})</h2>
              <div className="flex gap-1.5">
                {["Visitors", "Conversations", "Conversions"].map((label) => (
                  <span key={label} className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-6">
              {loading ? <div className="h-48 rounded-xl bg-white/5" /> : <SmoothChart values={series} max={max} />}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <h3 className="font-semibold">Flow overview</h3>
            <div className="mt-4 space-y-2">
              {(analytics?.perFlow ?? []).map((flow, index) => (
                <div key={flow.id} className="flex items-center gap-4 rounded-xl border border-border bg-background/40 px-4 py-3">
                  <span className="text-sm text-muted-foreground">#{index + 1}</span>
                  <span className="rounded-md bg-brand/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-brand">{flow.status.toUpperCase()}</span>
                  <span className="flex-1 text-sm font-medium">{flow.name}</span>
                  <span className="text-sm font-semibold">{flow.stats.conversas}</span>
                  <span className="text-xs text-muted-foreground">{flow.stats.leads} leads</span>
                  <span className="text-xs text-muted-foreground">{flow.stats.conversao}% conv.</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Runtime summary</h3>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-muted-foreground">Completed runs</div>
                  <div className="mt-1 text-3xl font-bold">{loading ? "…" : analytics?.totals.conversions ?? 0}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Failed runs</div>
                  <div className="mt-1 text-3xl font-bold">{loading ? "…" : analytics?.totals.failures ?? 0}</div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold">Peak activity</h3>
              <Heatmap values={series} />
            </div>
          </div>
        </div>

        {toast ? (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-2xl">
            <div className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">✓</div>
            {toast}
          </div>
        ) : null}

        {confirmReset ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl border border-border bg-popover p-6 shadow-2xl">
              <h3 className="text-lg font-semibold">Reset analytics for this scope?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                This removes the stored flow run history for {flowId === "all" ? "all flows" : "the selected flow"}.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setConfirmReset(false)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-white/5">
                  Cancel
                </button>
                <button onClick={() => void doReset()} className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                  Reset
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </AppShell>
  );
}

function FlowOption({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-white/5 ${active ? "bg-brand/15 text-brand" : ""}`}>
      <span className="truncate">{children}</span>
      {active ? <span>✓</span> : null}
    </button>
  );
}

function Kpi({ icon: Icon, label, value, highlight }: { icon: typeof Users; label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-card p-5 ${highlight ? "border-brand/40" : "border-border"}`}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className={`mt-3 text-4xl font-bold tracking-tight ${highlight ? "text-brand" : ""}`}>{value}</div>
    </div>
  );
}

function SmoothChart({ values, max }: { values: number[]; max: number }) {
  const width = 800;
  const height = 200;
  const step = width / Math.max(1, values.length - 1);
  const points = values.map((value, index) => [index * step, height - (value / max) * (height - 20) - 10] as const);
  const path = points
    .map((point, index) => {
      if (index === 0) return `M ${point[0]} ${point[1]}`;
      const previous = points[index - 1];
      const controlX = (previous[0] + point[0]) / 2;
      return `C ${controlX} ${previous[1]}, ${controlX} ${point[1]}, ${point[0]} ${point[1]}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map((index) => (
        <line key={index} x1="0" x2={width} y1={(height / 4) * index} y2={(height / 4) * index} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="4 4" />
      ))}
      <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill="url(#grad)" />
      <path d={path} fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function Heatmap({ values }: { values: number[] }) {
  const buckets = values.length ? values : Array.from({ length: 24 }, () => 0);
  const padded = [...buckets, ...Array.from({ length: Math.max(0, 24 - buckets.length) }, () => 0)].slice(0, 24);
  return (
    <div className="mt-4 space-y-2">
      <div className="grid grid-cols-12 gap-1.5">
        {padded.slice(0, 12).map((value, index) => (
          <div key={index} className="aspect-square rounded-md" style={{ backgroundColor: `oklch(0.65 0.22 300 / ${0.08 + value * 0.18})` }} />
        ))}
      </div>
      <div className="flex justify-between px-0.5 text-[10px] text-muted-foreground">
        <span>0h</span><span>3h</span><span>6h</span><span>9h</span>
      </div>
      <div className="grid grid-cols-12 gap-1.5">
        {padded.slice(12).map((value, index) => (
          <div key={index} className="aspect-square rounded-md" style={{ backgroundColor: `oklch(0.65 0.22 300 / ${0.08 + value * 0.18})` }} />
        ))}
      </div>
      <div className="flex justify-between px-0.5 text-[10px] text-muted-foreground">
        <span>12h</span><span>15h</span><span>18h</span><span>21h</span>
      </div>
    </div>
  );
}
