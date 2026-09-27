import type { LucideIcon } from "lucide-react"
import { motion } from "motion/react"

import { SPRING } from "@/shared/constants/motion"

interface RoleCardProps {
  icon: LucideIcon
  label: string
  body: string
  /** Posição na lista — só para a cascata de entrada. */
  index: number
  onSelect: () => void
}

/** Card de escolha do perfil: entra em cascata e desliza 4px no hover. */
export function RoleCard({ icon: Icon, label, body, index, onSelect }: RoleCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: 0.05 * index }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="flex cursor-pointer items-center gap-4 rounded-lg bg-surface p-4 text-left transition-shadow hairline hover:inset-ring-[1.5px] hover:inset-ring-gold"
    >
      <span className="flex size-12 flex-none items-center justify-center rounded-[12px] bg-gold-soft text-gold-hi">
        <Icon size={22} />
      </span>
      <span className="flex-1">
        <span className="t-section block text-[16px] text-ink">{label}</span>
        <span className="block text-[13.5px] text-ink-2">{body}</span>
      </span>
    </motion.button>
  )
}
