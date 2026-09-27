import { motion } from "motion/react"

import { useOverlayLifecycle } from "@/shared/hooks/useOverlayLifecycle"

import type { DrawerProps } from "./Drawer"

const SLIDE = { type: "spring", stiffness: 380, damping: 40 } as const

type DrawerPanelProps = Omit<DrawerProps, "open">

/** Painel do drawer — só existe montado enquanto o drawer está aberto. */
export function DrawerPanel({ onClose, label, width = 480, children }: DrawerPanelProps) {
  const { panelRef, handleKeyDown } = useOverlayLifecycle<HTMLElement>(onClose)

  return (
    <motion.div
      className="fixed inset-0 z-(--z-drawer)"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-bg/40 backdrop-blur-[3px]" onClick={onClose} aria-hidden="true" />
      <motion.aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full flex-col bg-surface pt-[env(safe-area-inset-top)] pb-safe shadow-lift hairline outline-none"
        style={{ maxWidth: width }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={SLIDE}
        onKeyDown={handleKeyDown}
      >
        {children}
      </motion.aside>
    </motion.div>
  )
}
