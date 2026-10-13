import type { Transition } from "motion/react"

/**
 * Molas do DS v2 — o movimento explica o que mudou, nunca é enfeite.
 *
 * - `SPRING`: controles e indicadores (aba ativa, segmentado, nav, toast,
 *   modal). Rígida, assenta rápido e sem oscilar.
 * - `SPRING_SLOW`: preenchimentos (trena, fachada, cronograma), uma vez ao
 *   entrar na tela.
 * - `SPRING_SOFT`: troca de passo e de conteúdo dentro de um mesmo painel.
 *
 * Movimento reduzido é tratado uma vez, no `<MotionConfig reducedMotion="user">`
 * do App: com ele, transform e layout ficam instantâneos e a informação
 * continua presente.
 */
export const SPRING: Transition = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 }

export const SPRING_SLOW: Transition = { type: "spring", stiffness: 70, damping: 20 }

export const SPRING_SOFT: Transition = { type: "spring", stiffness: 180, damping: 26 }

/** Curva das transições por duração (entrada de página, fade). */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

/** Atraso entre itens de uma lista que entra em cascata. */
export const STAGGER = 0.04
