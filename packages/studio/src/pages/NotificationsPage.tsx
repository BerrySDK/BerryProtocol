import { useEffect, useState } from "react";
import { Bell, Plug, Workflow, AlertCircle, RefreshCw } from "lucide-react";

import { AppShell } from "@/components/flow/AppShell";
import { listStudioNotifications, type StudioNotification } from "@/lib/studio-api";

function timeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<StudioNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listStudioNotifications());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto px-10 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand/15 text-brand">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Real operational updates from your flows and instances.
                </p>
              </div>
            </div>
            <button onClick={() => void load()} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-white/5">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          {error ? <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">{error}</div> : null}

          <div className="mt-8 space-y-2">
            {loading ? (
              <div className="grid place-items-center rounded-2xl border border-border bg-card py-20 text-center text-sm text-muted-foreground">
                Loading notifications…
              </div>
            ) : items.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-border bg-card py-20 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-white/5">
                  <Bell className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">No notifications available yet.</p>
              </div>
            ) : (
              items.map((notification) => {
                const Icon = notification.type === "flow" ? Workflow : notification.type === "connection" ? Plug : AlertCircle;
                const color = notification.type === "alert" ? "text-amber-400 bg-amber-500/15" : "text-brand bg-brand/15";
                return (
                  <div key={notification.id} className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{notification.title}</div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(notification.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
