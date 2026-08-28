import { useEffect, useMemo, useState } from "react";
import { BarChart3, MessageSquare, Users, Target, TrendingUp } from "lucide-react";
import { getStudioAnalytics } from "@/lib/studio-api";

type Metric = {
  visitors: number;
  conversations: number;
  leads: number;
  conversions: number;
  conversionRate: number;
};

export function AnalysisView({ flowId, flowName }: { flowId: string; flowName: string }) {
  const [metrics, setMetrics] = useState<Metric>({
    visitors: 0,
    conversations: 0,
    leads: 0,
    conversions: 0,
    conversionRate: 0,
  });
  const [series, setSeries] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const analytics = await getStudioAnalytics(flowId, 7);
        if (!active) {
          return;
        }

        setMetrics({
          visitors: analytics.totals.visitors,
          conversations: analytics.totals.conversations,
          leads: analytics.totals.leads,
          conversions: analytics.totals.conversions,
          conversionRate: analytics.totals.conversionRate,
        });
        setSeries(analytics.activity.map((item) => item.value));
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Failed to load analytics.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [flowId]);

  const max = useMemo(() => Math.max(1, ...series), [series]);

  const stats = [
    { icon: MessageSquare, label: "Conversations", value: metrics.conversations },
    { icon: Users, label: "Leads", value: metrics.leads },
    { icon: Target, label: "Conversion", value: `${metrics.conversionRate}%` },
    { icon: TrendingUp, label: "Visitors", value: metrics.visitors },
  ];

  return (
    <div className="h-full overflow-y-auto bg-background px-8 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand/15 text-brand">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Flow analytics</h2>
            <p className="text-sm text-muted-foreground">Performance for “{flowName}” over the last 7 days.</p>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl border border-border bg-card p-5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand/15 text-brand">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="mt-3 text-2xl font-bold">{loading ? "…" : stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h3 className="font-semibold">Conversations per day</h3>
          {loading ? (
            <div className="mt-6 h-48 rounded-xl bg-white/5" />
          ) : (
            <div className="mt-6 flex h-48 items-end gap-3">
              {series.length === 0 ? (
                <div className="grid h-full w-full place-items-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                  No executions recorded yet.
                </div>
              ) : (
                series.map((value, index) => (
                  <div key={`${index}-${value}`} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-brand/40 to-brand" style={{ height: `${(value / max) * 100}%` }} />
                    <div className="text-[11px] text-muted-foreground">D{index + 1}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
