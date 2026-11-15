import { Bell } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { IconButton } from "@/shared/components/ui/icon-button/IconButton"
import { useNotifications } from "@/shared/hooks/useNotifications"

export function NotificationsMenu() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { notifications, isLoading, isError, refetch, markAsRead } = useNotifications()
  const unreadCount = notifications.filter((notification) => !notification.read).length

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  function formatCreatedAt(createdAt: string) {
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(createdAt))
  }

  return (
    <div ref={ref} className="relative">
      <IconButton
        label={t("header.notifications")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-none font-semibold text-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </IconButton>

      {open && (
        <section
          role="dialog"
          aria-label={t("header.notifications")}
          className="absolute right-0 top-full z-50 mt-1.5 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">{t("header.notifications")}</h2>
            {unreadCount > 0 && (
              <span className="text-xs text-ink-2">
                {t("header.unreadCount", { count: unreadCount })}
              </span>
            )}
          </div>

          <div className="max-h-[min(60vh,28rem)] overflow-y-auto">
            {isLoading ? (
              <p role="status" className="px-4 py-6 text-center text-sm text-ink-2">
                {t("header.loadingNotifications")}
              </p>
            ) : isError ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-ink-2">{t("header.notificationsError")}</p>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="mt-2 text-sm font-medium text-gold-hi hover:underline"
                >
                  {t("header.retryNotifications")}
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-2">
                {t("header.noNotifications")}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      disabled={notification.read}
                      onClick={() => markAsRead(notification.id)}
                      className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-raised disabled:cursor-default disabled:hover:bg-transparent"
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 size-2 flex-none rounded-full ${notification.read ? "bg-transparent" : "bg-gold-hi"}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm text-ink ${notification.read ? "font-medium" : "font-semibold"}`}>
                          {notification.title}
                        </span>
                        {notification.message && (
                          <span className="mt-0.5 block text-sm text-ink-2">{notification.message}</span>
                        )}
                        <time
                          dateTime={notification.createdAt}
                          className="mt-1 block text-xs text-ink-3"
                        >
                          {formatCreatedAt(notification.createdAt)}
                        </time>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  )
}