import { useState } from "react";
import { HardHat, ImagePlus, Plus } from "lucide-react";

import { Modal } from "@/shared/components/ui/modal/Modal";
import { useAccess } from "@/shared/hooks/useAccess";

import { useDiario } from "../hooks/useDiario";
import type { DiarioTag } from "../types/diario";

const TAG_STYLES = {
  Ocorrência: "bg-warn-bg text-warn border-warn/20",
  Entrega: "bg-ok-bg text-ok border-ok/20",
  Impedimento: "bg-danger-bg text-danger border-danger/20",
  Efetivo: "bg-gold/10 text-gold border-gold/20",
};

const DOT_COLOR = {
  Ocorrência: "bg-warn",
  Entrega: "bg-ok",
  Impedimento: "bg-danger",
  Efetivo: "bg-gold",
};

function formatDate(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", ""),
    time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function DiarioDaObra({ projectId }: { projectId: number }) {
  const { entries, isLoading, error, create, isCreating } = useDiario(projectId);
  const { isReadOnly } = useAccess();
  const [draft, setDraft] = useState("");
  const [tag, setTag] = useState<DiarioTag>("Ocorrência");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSave = () => {
    const text = draft.trim();
    if (!text || isReadOnly("diario") || isCreating) return;

    create({ tag, text }, {
      onSuccess: () => {
        setDraft("");
        setIsFormOpen(false);
      },
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-semibold text-on-surface">Diário da obra</h1>
          <div className="flex text-xs font-mono uppercase tracking-widest text-on-surface-variant">
            <span className="mr-2 mt-1 h-1 w-1 rounded-full bg-outline" />
            <span>{entries.length} registros</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 flex flex-col gap-4 lg:col-span-8">
          <div className="flex h-full flex-col rounded-xl bg-surface-container p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between border-b border-outline-variant pb-4">
              <h2 className="text-xl font-semibold text-on-surface">Linha do tempo</h2>
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                disabled={isReadOnly("diario")}
                className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-on-primary shadow-md transition-colors hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
                Novo registro
              </button>
            </div>

            <div className="relative flex-1 space-y-8 overflow-y-auto pr-2" style={{ maxHeight: "60vh" }}>
              <div className="absolute bottom-4 left-9.75 top-4 z-0 w-px bg-outline-variant" />

              {isLoading ? <p className="text-sm text-on-surface-variant">Carregando registros...</p> : null}
              {error ? <p className="text-sm text-danger">Não foi encontrado nenhum registro.</p> : null}
              {!isLoading && !error && entries.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Nenhum registro encontrado.</p>
              ) : null}

              {entries.map((entry) => {
                const { date, time } = formatDate(entry.createdAt);
                return (
                  <div key={entry.id} className="group relative z-10 flex gap-6">
                    <div className="w-20 shrink-0 pt-1 text-right">
                      <div className="text-sm font-semibold text-on-surface">{date}</div>
                      <div className="text-xs font-mono text-on-surface-variant">{time}</div>
                    </div>
                    <div className="relative flex-1 pt-1">
                      <div className={`absolute -left-7.75 top-2 h-3 w-3 rounded-full ${DOT_COLOR[entry.tag]} ring-4 ring-surface-container transition-transform group-hover:scale-125`} />
                      <div className="mb-2 flex items-center gap-3">
                        <span className={`rounded border px-2 py-0.5 text-xs font-medium ${TAG_STYLES[entry.tag]}`}>
                          {entry.tag}
                        </span>
                        <span className="text-sm text-on-surface-variant">{entry.authorName}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-on-surface">{entry.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Registrar o dia"
        icon={<HardHat size={18} />}
        size="lg"
      >
        <form onSubmit={(event) => { event.preventDefault(); handleSave(); }}>
          <div className="grid grid-cols-1 gap-4 px-6 pb-5 pt-1">
            <select
              value={tag}
              onChange={(event) => setTag(event.target.value as DiarioTag)}
              disabled={isReadOnly("diario")}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-highest p-3 text-sm text-on-surface focus:border-gold focus:ring-1 focus:ring-gold"
            >
              <option>Ocorrência</option>
              <option>Entrega</option>
              <option>Impedimento</option>
            </select>

            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={isReadOnly("diario")}
              placeholder="Descreva ocorrências, entregas e impedimentos do dia..."
              className="h-48 w-full resize-none rounded-lg border border-outline-variant bg-surface-container-highest p-4 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-faint focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="mx-6 mb-6 mt-1 flex items-center justify-between gap-3 border-t border-outline-variant pt-5">
            <button
              type="submit"
              disabled={isReadOnly("diario") || isCreating || !draft.trim()}
              className="rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-on-primary shadow-md transition-all hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? "Salvando..." : "Salvar registro"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}