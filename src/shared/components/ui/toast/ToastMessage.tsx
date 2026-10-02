interface ToastMessageProps {
  /** O que aconteceu: "Tarefa movida para Concluída". */
  title: string
  /** A qual item: "Assentar revestimento · Residência Mercês". */
  body?: string
  /** Ação do toast, em geral "Desfazer". */
  action?: {
    label: string
    onClick: () => void
  }
  /** Injetado pelo react-toastify quando o conteúdo é um elemento. */
  closeToast?: () => void
}

/**
 * Conteúdo de toast com título, corpo e ação (DS v2, Toast). Para mensagem de
 * uma linha, `toast.success("…")` com string continua valendo.
 */
export function ToastMessage({ title, body, action, closeToast }: ToastMessageProps) {
  function handleAction() {
    action?.onClick()
    closeToast?.()
  }

  return (
    <div className="flex min-w-0 items-start gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-[620]">{title}</p>
        {body && <p className="mt-0.5 text-[13px] opacity-70">{body}</p>}
      </div>
      {action && (
        <button
          type="button"
          onClick={handleAction}
          className="h-8 flex-none cursor-pointer rounded-[8px] px-2.5 text-[13px] font-[680] underline underline-offset-3"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
