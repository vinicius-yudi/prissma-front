import { useRef, useState } from "react";
import { HardHat, ImagePlus, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Modal } from "@/shared/components/ui/modal/Modal";
import { useAccess } from "@/shared/hooks/useAccess";
import { useAttachments } from "../hooks/useAttachments";

import { useDiario } from "../hooks/useDiario";
import type { DiarioEntryType } from "../types/diario";

const TAG_STYLES: Record<DiarioEntryType, string> = {
  OCCURRENCE: "bg-warn-bg text-warn border-warn/20",
  DELIVERY: "bg-ok-bg text-ok border-ok/20",
  WORKFORCE: "bg-gold/10 text-gold border-gold/20",
  IMPEDIMENT: "bg-danger-bg text-danger border-danger/20",
};

const DOT_COLOR: Record<DiarioEntryType, string> = {
  OCCURRENCE: "bg-warn",
  DELIVERY: "bg-ok",
  WORKFORCE: "bg-gold",
  IMPEDIMENT: "bg-danger",
};

function currentDateTime() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDate(value: string, language: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString(language, { day: "numeric", month: "short" }).replace(".", ""),
    time: date.toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function DiarioDaObra({ projectId }: { projectId: number }) {
  const { t, i18n } = useTranslation();
  const diario = useDiario(projectId);
  const { entries, isLoading, error, create, isCreating } = diario;
  const attachments = useAttachments(projectId);
  const { isReadOnly } = useAccess();
  const [draft, setDraft] = useState("");
  const [entryType, setEntryType] = useState<DiarioEntryType>("OCCURRENCE");
  const [entryDate, setEntryDate] = useState(currentDateTime);
  const [attachmentId, setAttachmentId] = useState<number | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    const description = draft.trim();
    if (!description || !entryDate || isReadOnly("diario") || isCreating) return;

    create({ entryDate: new Date(entryDate).toISOString(), entryType, description, attachmentId }, {
      onSuccess: () => {
        setDraft("");
        setEntryDate(currentDateTime());
        setAttachmentId(null);
        setAttachmentName(null);
        setIsFormOpen(false);
      },
    });
  };

  const handleAttachmentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    attachments.upload(file, {
      onSuccess: (attachment) => {
        setAttachmentId(attachment.id);
        setAttachmentName(attachment.fileName);
      },
    });
    event.target.value = "";
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-semibold text-on-surface">{t("obra.diario.title")}</h1>
          <div className="flex text-xs font-mono uppercase tracking-widest text-on-surface-variant">
            <span className="mr-2 mt-1 h-1 w-1 rounded-full bg-outline" />
            <span>{t("obra.diario.count", { count: entries.length })}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 flex flex-col gap-4 lg:col-span-8">
          <div className="flex h-full flex-col rounded-xl bg-surface-container p-6 shadow-lg">
            <div className="mb-6 flex items-center justify-between border-b border-outline-variant pb-4">
              <h2 className="text-xl font-semibold text-on-surface">{t("obra.diario.timeline")}</h2>
              <button
                type="button"
                onClick={() => setIsFormOpen(true)}
                disabled={isReadOnly("diario")}
                className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-on-primary shadow-md transition-colors hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={16} />
                {t("obra.diario.newEntry")}
              </button>
            </div>

            <div className="relative flex-1 space-y-8 overflow-y-auto pr-2" style={{ maxHeight: "60vh" }}>
              <div className="absolute bottom-4 left-9.75 top-4 z-0 w-px bg-outline-variant" />

              {isLoading ? <p className="text-sm text-on-surface-variant">{t("obra.diario.loading")}</p> : null}
              {error ? (
                <p className="text-sm text-danger">
                  {t("obra.diario.error")} {error instanceof Error ? `(${error.message})` : ""}
                </p>
              ) : null}
              {!isLoading && !error && entries.length === 0 ? (
                <p className="text-sm text-on-surface-variant">{t("obra.diario.empty")}</p>
              ) : null}

              {entries.map((entry) => {
                const { date, time } = formatDate(entry.entryDate, i18n.language);
                return (
                  <div key={entry.id} className="group relative z-10 flex gap-6">
                    <div className="w-20 shrink-0 pt-1 text-right">
                      <div className="text-sm font-semibold text-on-surface">{date}</div>
                      <div className="text-xs font-mono text-on-surface-variant">{time}</div>
                    </div>
                    <div className="relative flex-1 pt-1">
                      <div className={`absolute -left-7.75 top-2 h-3 w-3 rounded-full ${DOT_COLOR[entry.entryType]} ring-4 ring-surface-container transition-transform group-hover:scale-125`} />
                      <div className="mb-2 flex items-center gap-3">
                        <span className={`rounded border px-2 py-0.5 text-xs font-medium ${TAG_STYLES[entry.entryType]}`}>
                          {t(`obra.diario.types.${entry.entryType}`)}
                        </span>
                        <span className="text-sm text-on-surface-variant">{entry.responsibleName}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-on-surface">{entry.description}</p>
                    </div>
                  </div>
                );
              })}
              {diario.hasNextPage ? (
                <button
                  type="button"
                  onClick={() => diario.fetchNextPage()}
                  disabled={diario.isFetchingNextPage}
                  className="relative z-10 rounded-lg border border-outline px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high disabled:opacity-50"
                >
                  {diario.isFetchingNextPage ? t("obra.diario.loadingMore") : t("obra.diario.loadMore")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={t("obra.diario.form.title")}
        icon={<HardHat size={18} />}
        size="lg"
      >
        <form onSubmit={(event) => { event.preventDefault(); handleSave(); }}>
          <div className="grid grid-cols-1 gap-4 px-6 pb-5 pt-1">
            <select
              value={entryType}
              onChange={(event) => setEntryType(event.target.value as DiarioEntryType)}
              disabled={isReadOnly("diario")}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-highest p-3 text-sm text-on-surface focus:border-gold focus:ring-1 focus:ring-gold"
            >
              {(["OCCURRENCE", "DELIVERY", "WORKFORCE", "IMPEDIMENT"] as DiarioEntryType[]).map((value) => (
                <option key={value} value={value}>{t(`obra.diario.types.${value}`)}</option>
              ))}
            </select>

            <label className="grid gap-1 text-sm text-on-surface-variant">
              {t("obra.diario.form.date")}
              <input
                type="datetime-local"
                value={entryDate}
                onChange={(event) => setEntryDate(event.target.value)}
                disabled={isReadOnly("diario")}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-highest p-3 text-on-surface focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </label>

            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={isReadOnly("diario")}
              placeholder={t("obra.diario.form.descriptionPlaceholder")}
              className="h-48 w-full resize-none rounded-lg border border-outline-variant bg-surface-container-highest p-4 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-faint focus:border-gold focus:ring-1 focus:ring-gold"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAttachmentChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isReadOnly("diario") || attachments.isUploading}
              className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-gold disabled:opacity-50"
            >
              <ImagePlus size={20} />
              {attachments.isUploading ? t("obra.diario.form.uploading") : attachmentName ?? t("obra.diario.form.attach")}
            </button>
          </div>

          <div className="mx-6 mb-6 mt-1 flex items-center justify-between gap-3 border-t border-outline-variant pt-5">
            <button
              type="submit"
              disabled={isReadOnly("diario") || isCreating || !draft.trim()}
              className="rounded-lg bg-gold px-6 py-2.5 text-sm font-semibold text-on-primary shadow-md transition-all hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? t("obra.diario.form.saving") : t("obra.diario.form.save")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}