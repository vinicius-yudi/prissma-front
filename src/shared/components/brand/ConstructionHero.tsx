import { tv } from "tailwind-variants"

import { HolographicBuildingOverlay } from "./HolographicBuildingOverlay"

/**
 * Cena de obra ao entardecer das telas públicas: céu, poente no horizonte,
 * silhueta da cidade e a torre holográfica ao centro.
 *
 * Veio da branch `refactor-tela-login`, onde era um painel inteiro à direita do
 * formulário. Aqui é só a cena — o painel é o <BrandPanel>, que já carrega a
 * grade técnica e o texto de marca das quatro telas públicas. As camadas se
 * posicionam contra o pai, que precisa ser `relative`.
 *
 * `mirror` espelha as camadas para quando o painel fica à direita do
 * formulário; a torre é contra-espelhada para a grua não trocar de lado.
 */

const layers = tv({
  base: "pointer-events-none absolute inset-0",
  variants: {
    mirror: { true: "-scale-x-100", false: "" },
  },
  defaultVariants: { mirror: false },
})

const scene = tv({
  base: "pointer-events-none absolute inset-0 flex items-center justify-center",
  variants: {
    mirror: { true: "-scale-x-100", false: "" },
  },
  defaultVariants: { mirror: false },
})

interface ConstructionHeroProps {
  mirror?: boolean
}

export function ConstructionHero({ mirror = false }: ConstructionHeroProps) {
  return (
    // `absolute inset-0` aqui é obrigatório, não estilo: `enter-hero` anima
    // `transform`, e o fill-mode deixa a propriedade em matriz identidade em
    // vez de `none`. Identidade ainda conta como transform, então esta div
    // vira o bloco contêiner dos filhos absolutos — como bloco estático ela
    // media altura 0 e a cena inteira sumia sem erro nenhum.
    <div className="enter-hero pointer-events-none absolute inset-0">
      <div className={layers({ mirror })}>
        <div className="absolute inset-0 bg-hero-sky" />
        <div className="absolute inset-x-0 bottom-1/4 h-1/2 bg-hero-horizon" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-hero-ground" />
        <div className="absolute inset-0 bg-hero-fuse" />
      </div>

      <div className={scene({ mirror })}>
        <div className="size-full max-w-[920px]">
          <HolographicBuildingOverlay />
        </div>
      </div>
    </div>
  )
}
