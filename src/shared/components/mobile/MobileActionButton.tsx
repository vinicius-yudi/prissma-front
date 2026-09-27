import { Plus } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { useRegisteredPrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"
import { SPRING } from "@/shared/constants/motion"

/**
 * Ação primária da tela no celular, flutuando acima da navegação inferior.
 *
 * As telas escondem o botão primário abaixo de `lg` e registram a ação com
 * `usePrimaryAction` ("Nova obra", "Nova tarefa", "Lançar despesa"). A
 * navegação do DS v2 tem quatro destinos e nenhum espaço para ação, então ela
 * sobe para este botão — o mesmo papel do FAB antigo, sem roubar uma coluna.
 */
export function MobileActionButton() {
  const action = useRegisteredPrimaryAction()
  const Icon = action?.icon ?? Plus

  return (
    <AnimatePresence>
      {action && (
        <motion.button
          key={action.label}
          type="button"
          onClick={action.onClick}
          disabled={action.disabled}
          aria-label={action.label}
          title={action.label}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={SPRING}
          whileTap={{ scale: 0.94 }}
          className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+80px)] z-(--z-nav) flex h-14 cursor-pointer items-center gap-2 rounded-pill bg-gold-grad pr-5 pl-4 text-[14px] font-[620] text-on-gold shadow-lift disabled:cursor-not-allowed disabled:opacity-50 lg:hidden"
        >
          <Icon size={20} strokeWidth={2.2} />
          <span className="max-w-[40vw] truncate">{action.shortLabel ?? action.label}</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
