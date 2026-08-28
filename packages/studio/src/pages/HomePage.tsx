import { Link } from "react-router-dom";
import { AppShell } from "@/components/flow/AppShell";
import { Workflow, Plug, ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <AppShell>
      <main className="flex-1 overflow-y-auto px-10 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2 text-brand">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">BerryStudio</span>
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">
            Construa fluxos para o <span className="text-brand">BerryProtocol</span>
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Crie experiencias conversacionais visuais, conecte suas instancias e publique em segundos.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <Link
              to="/"
              className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-brand/60"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand/15 text-brand">
                <Workflow className="h-5 w-5" />
              </div>
              <div className="mt-4 flex items-center gap-2 text-lg font-semibold">
                Abrir Studio <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Editor visual de fluxos com blocos, condicoes e midia.
              </p>
            </Link>

            <Link
              to="/conexoes"
              className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-brand/60"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand/15 text-brand">
                <Plug className="h-5 w-5" />
              </div>
              <div className="mt-4 flex items-center gap-2 text-lg font-semibold">
                Gerenciar Conexoes <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Conecte suas instancias do BerryProtocol ao Studio.
              </p>
            </Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
