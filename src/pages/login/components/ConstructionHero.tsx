import { HolographicBuildingOverlay } from "./HolographicBuildingOverlay"

interface ConstructionHeroProps {
  // Optional real construction photo. When omitted, a CSS dusk scene is used.
  imageUrl?: string
}

export function ConstructionHero({ imageUrl }: ConstructionHeroProps) {
  return (
    <section className="bf-hero-enter relative hidden flex-1 overflow-hidden lg:block">
      {/* Backdrop: real photo if provided, otherwise a dusk gradient scene */}
      {imageUrl ? (
        <img src={imageUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_30%_15%,#1e3a5f_0%,#0b1d33_38%,#020617_72%)]" />
      )}

      {/* Warm horizon glow (sunset), echoing the reference */}
      <div className="absolute inset-x-0 bottom-1/4 h-1/2 bg-[radial-gradient(60%_100%_at_18%_100%,rgba(251,146,60,0.28)_0%,rgba(120,53,15,0.08)_35%,transparent_70%)]" />

      {/* City silhouette */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,#020617_15%,transparent)]" />

      {/* Dark gradient overlay to fuse with the left panel */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.85)_0%,rgba(2,6,23,0.25)_55%,rgba(2,6,23,0.65)_100%)]" />

      {/* Holographic wireframe building */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-full w-full max-w-[920px]">
          <HolographicBuildingOverlay />
        </div>
      </div>
    </section>
  )
}
