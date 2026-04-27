export function VisaoGeral() {
  return (
    <div>
    <div className="text-left pb-4">
        <span className="label-sm text-inverse-surface/40 uppercase tracking-[0.2em]">Status Atual</span>
        <div className="text-secondary text-2xl font-bold flex items-center justify-start gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>EM ANDAMENTO
        </div>
    </div>
    <div className="flex flex-col lg:flex-row gap-6 w-full">
    <div className="flex-1 bg-surface-container-low rounded-xl p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col gap-10">
        <div>
            <h3 className="text-inverse-surface/40 text-xs font-bold tracking-widest mb-2">ENDEREÇO</h3>
            <p className="text-xl font-medium leading-relaxed">
            Rua das Palmeiras, 123, Bairro Jardins<br/>
            CEP 01234-567, São Paulo - SP<br/>
            Compl. Casa 1
            </p>
        </div>
        <div className="glass-card rounded-xl bg-surface-container-low/40">
            <h3 className="text-inverse-surface/40 text-xs font-bold tracking-widest mb-4">TIPO DE CONSTRUÇÃO</h3>
            <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1 bg-primary-container text-on-primary-container rounded text-xs font-bold tracking-wider">
                NOVA CONSTRUÇÃO
            </div>
            <div className="px-3 py-1 bg-surface-container-highest text-on-surface rounded text-xs font-bold tracking-wider">
                RESIDENCIAL
            </div>
            </div>
        </div>
        </div>
    </div>

    <div className="w-full lg:w-1/3 rounded-xl p-8 flex flex-col justify-between border border-outline-variant/20 bg-surface-container-low">
        <div>
        <h3 className="text-inverse-surfacetext-xs font-bold tracking-widest mb-8">ÁREA </h3>
        <div className="space-y-8">
            <div className="flex items-center justify-between">
            <span className="text-inverse-surface/60">Área do Terreno</span>
            <span className="text-2xl font-black text-on-surface">
                500<span className="text-sm font-normal text-primary ml-1 uppercase">m²</span>
            </span>
            </div>
            <div className="h-px bg-outline-variant/30 w-full"></div>
            <div className="flex items-center justify-between">
            <span className="text-inverse-surface/60">Área de Construção</span>
            <span className="text-2xl font-black text-on-surface">
                350<span className="text-sm font-normal text-primary ml-1 uppercase">m²</span>
            </span>
            </div>
        </div>
        </div>
        <div className="mt-12 bg-primary/5 p-4 rounded-lg border border-primary/10">
        <p className="text-[10px] text-primary font-bold uppercase tracking-widest text-center">
            Structural Density Ratio: 70%
        </p>
        </div>
    </div>
    </div>
    </div>
)
}