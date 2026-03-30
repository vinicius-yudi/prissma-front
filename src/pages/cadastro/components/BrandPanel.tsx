import { Building2, CircleCheckBig } from "lucide-react"

export function BrandPanel() {
  return (
    <section
      className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-16 overflow-hidden"
      style={{ backgroundColor: "#0d1f20" }}
    >
      {/* Blueprint grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(1, 83, 76, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(1, 83, 76, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Headline */}
      <div className="z-10">
        <h1 className="text-white text-5xl font-black tracking-tighter leading-tight max-w-md">
          Gerencie suas Obras!
        </h1>
      </div>

      {/* Hero visual */}
      <div className="relative flex-1 flex items-center justify-center">
        <div
          className="absolute w-4/5 aspect-square rounded-[3rem] rotate-3 opacity-90 blur-sm"
          style={{ backgroundColor: "#01534c" }}
        />

        <div className="relative w-[75%] aspect-[4/5] z-10">
          {/* Floating card: status */}
          <div
            className="absolute -top-6 -left-8 backdrop-blur-md p-4 rounded-xl flex items-center gap-3"
            style={{
              backgroundColor: "rgba(43, 60, 61, 0.9)",
              border: "1px solid rgba(63, 73, 73, 0.2)",
            }}
          >
            <div className="bg-green-500/20 text-green-400 p-2 rounded-full">
              <CircleCheckBig size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "#bec8c8" }}>
                Etapa Concluída
              </p>
              <p className="font-semibold text-sm" style={{ color: "#d2e6e7" }}>
                Fundação Bloco A
              </p>
            </div>
          </div>

          {/* Floating card: active works */}
          <div
            className="absolute top-1/2 -right-12 p-4 rounded-xl flex items-center gap-4"
            style={{
              backgroundColor: "#01534c",
              border: "1px solid rgba(138, 211, 214, 0.2)",
            }}
          >
            <div className="p-2 rounded-lg" style={{ backgroundColor: "rgba(138, 211, 214, 0.2)" }}>
              <Building2 size={20} color="#8ad3d6" />
            </div>
            <div className="pr-4">
              <p className="font-black text-lg leading-none" style={{ color: "#9ee7ea" }}>3</p>
              <p className="text-[10px] uppercase font-bold" style={{ color: "rgba(158, 231, 234, 0.8)" }}>
                Obras Ativas
              </p>
            </div>
          </div>

          {/* Floating card: progress */}
          <div
            className="absolute -bottom-10 -right-8 backdrop-blur-md p-6 rounded-2xl"
            style={{
              backgroundColor: "rgba(43, 60, 61, 0.9)",
              border: "1px solid rgba(63, 73, 73, 0.2)",
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="transparent" stroke="#263839" strokeWidth="6" />
                  <circle
                    cx="32" cy="32" r="28"
                    fill="transparent"
                    stroke="#ffc56a"
                    strokeWidth="6"
                    strokeDasharray="175"
                    strokeDashoffset="45"
                  />
                </svg>
                <span className="absolute text-xs font-bold" style={{ color: "#ffc56a" }}>74%</span>
              </div>
              <p className="text-[10px] uppercase font-bold tracking-tighter" style={{ color: "#bec8c8" }}>
                Progresso Geral
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer tagline */}
      <div className="z-10">
        <p className="text-xl font-medium tracking-tight max-w-sm" style={{ color: "#01534c" }}>
          Uma forma inteligente de gerenciar suas obras e reformas.
        </p>
      </div>

      {/* Light leak */}
      <div
        className="absolute bottom-0 left-0 w-full h-1/2 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(1, 83, 76, 0.1), transparent)" }}
      />
    </section>
  )
}
