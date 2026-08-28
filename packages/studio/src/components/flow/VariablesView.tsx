import { Plus, Trash2, Variable as VarIcon } from "lucide-react";

export type FlowVariable = {
  id: string;
  name: string;
  type: "texto" | "numero" | "booleano";
  defaultValue: string;
};

export function VariablesView({
  vars,
  onChange,
}: {
  vars: FlowVariable[];
  onChange: (vars: FlowVariable[]) => void;
}) {
  const add = () =>
    onChange([...vars, { id: crypto.randomUUID(), name: "nova_variavel", type: "texto", defaultValue: "" }]);
  const update = (id: string, patch: Partial<FlowVariable>) =>
    onChange(vars.map((variable) => (variable.id === id ? { ...variable, ...patch } : variable)));
  const remove = (id: string) => onChange(vars.filter((variable) => variable.id !== id));

  return (
    <div className="h-full overflow-y-auto bg-background px-8 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand/15 text-brand">
              <VarIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Variáveis do fluxo</h2>
              <p className="text-sm text-muted-foreground">
                Use variáveis para guardar respostas e personalizar mensagens com <code className="text-brand">{"{{nome}}"}</code>.
              </p>
            </div>
          </div>
          <button onClick={add} className="flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Nova variável
          </button>
        </div>

        {vars.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-2xl border border-dashed border-border bg-card/40 py-16 text-center">
            <VarIcon className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Nenhuma variável criada.</p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="grid grid-cols-[1fr_140px_1fr_40px] gap-3 border-b border-border bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <div>Nome</div><div>Tipo</div><div>Valor padrão</div><div></div>
            </div>
            {vars.map((variable) => (
              <div key={variable.id} className="grid grid-cols-[1fr_140px_1fr_40px] items-center gap-3 border-b border-border px-4 py-3 last:border-0">
                <input value={variable.name} onChange={(event) => update(variable.id, { name: event.target.value })} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-brand" />
                <select value={variable.type} onChange={(event) => update(variable.id, { type: event.target.value as FlowVariable["type"] })} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-brand">
                  <option value="texto">Texto</option>
                  <option value="numero">Número</option>
                  <option value="booleano">Booleano</option>
                </select>
                <input value={variable.defaultValue} onChange={(event) => update(variable.id, { defaultValue: event.target.value })} placeholder="—" className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-brand" />
                <button onClick={() => remove(variable.id)} className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
