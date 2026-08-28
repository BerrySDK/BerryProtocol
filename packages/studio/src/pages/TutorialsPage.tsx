import { useMemo, useState } from "react";
import { AppShell } from "@/components/flow/AppShell";
import {
  Search,
  Play,
  Check,
  Rocket,
  Zap,
  Plug,
  MessageSquare,
  Users,
  Palette,
  GraduationCap,
  Clock,
} from "lucide-react";

const categories = [
  { id: "all", label: "Todos", icon: Palette },
  { id: "start", label: "Começando", icon: Rocket },
  { id: "advanced", label: "Avançado", icon: Zap },
  { id: "integrations", label: "Integrações", icon: Plug },
  { id: "copy", label: "Copy", icon: MessageSquare },
  { id: "leads", label: "Leads", icon: Users },
  { id: "visual", label: "Visual", icon: Palette },
];

type Lesson = {
  id: string;
  title: string;
  time: string;
  category: string;
  done?: boolean;
};

const lessons: Lesson[] = [
  { id: "1", title: "Como criar seu primeiro fluxo", time: "5 min", category: "start", done: true },
  { id: "2", title: "Conectando o BerryProtocol", time: "3 min", category: "integrations" },
  { id: "3", title: "Mensagens, mídia e variáveis", time: "4 min", category: "start" },
  { id: "4", title: "Condições e múltipla escolha", time: "7 min", category: "advanced" },
  { id: "5", title: "Tags e segmentação de leads", time: "6 min", category: "leads" },
  { id: "6", title: "Webhooks e automações externas", time: "10 min", category: "advanced" },
  { id: "7", title: "Copy que converte no chat", time: "8 min", category: "copy" },
];

export default function TutorialsPage() {
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");

  const visible = useMemo(
    () =>
      lessons.filter(
        (l) =>
          (cat === "all" || l.category === cat) &&
          l.title.toLowerCase().includes(q.toLowerCase()),
      ),
    [cat, q],
  );

  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto px-10 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Tutoriais</h1>
              <p className="mt-1 text-sm text-muted-foreground">Aprenda a tirar o máximo do BerryStudio</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar tutorial..."
                className="w-full rounded-full border border-border bg-card py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand"
              />
            </div>
          </div>

          {/* category pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => {
              const Icon = c.icon;
              const active = cat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                    active
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* featured hero */}
          <div className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand/60 p-8 text-brand-foreground shadow-xl">
            <div className="flex items-start justify-between gap-6">
              <div className="max-w-xl">
                <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold tracking-wider">
                  RECOMENDADO PARA COMEÇAR
                </span>
                <h2 className="mt-4 text-3xl font-bold">Como criar seu primeiro fluxo</h2>
                <p className="mt-2 text-sm opacity-90">
                  Monte uma conversa que converte no BerryProtocol em menos de 5 minutos.
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <button className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand shadow hover:opacity-95">
                    <Play className="h-4 w-4 fill-current" /> Assistir agora
                  </button>
                  <span className="flex items-center gap-1.5 text-sm opacity-90">
                    <Clock className="h-4 w-4" /> 5 min
                  </span>
                </div>
              </div>
              <GraduationCap className="hidden h-32 w-32 shrink-0 opacity-20 md:block" />
            </div>
          </div>

          {/* learning path */}
          <h3 className="mt-10 text-xl font-bold">Aprenda na ordem certa</h3>
          <div className="mt-4 space-y-3">
            {visible.map((l, i) => (
              <div
                key={l.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <div
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    l.done
                      ? "bg-brand text-brand-foreground"
                      : "border border-brand/40 text-brand"
                  }`}
                >
                  {l.done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{l.title}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {l.time}
                  </div>
                </div>
                {l.done ? (
                  <span className="flex items-center gap-1 text-sm text-emerald-400">
                    <Check className="h-4 w-4" /> Concluído
                  </span>
                ) : (
                  <button className="rounded-lg bg-brand/15 px-4 py-2 text-sm font-medium text-brand hover:bg-brand/25">
                    Começar
                  </button>
                )}
              </div>
            ))}
            {visible.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 py-12 text-center text-sm text-muted-foreground">
                Nenhum tutorial encontrado.
              </div>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
