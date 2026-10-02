import { motion } from "motion/react"

/**
 * Barra indeterminada da geração por IA: a IA não reporta percentual, e
 * inventar um número seria afirmar o que não se sabe.
 */
export function GeneratingBar({ label }: { label: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-pill bg-raised" role="progressbar" aria-label={label} aria-busy="true">
      <motion.div
        className="h-full w-1/3 rounded-pill bg-gold"
        animate={{ x: ["-100%", "300%"] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
      />
    </div>
  )
}
