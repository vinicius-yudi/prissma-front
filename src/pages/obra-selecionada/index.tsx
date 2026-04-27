import { Button } from "@/shared/components/ui/button/Button"
import { MapPin} from 'lucide-react'
import { VisaoGeral } from "./components/visaoGeral"

export function ObraSelecionadaPage() {
  return (
    <div>
        {/* 
        OUTRA VERSÃO DO HEADER
        <header className="bg-surface flex justify-between items-center w-full px-8 h-20 border-b border-inverse-surface/10 z-40">
            <div className="flex flex-col">
                <h2 className="text-2xl font-black text-inverse-surface tracking-tighter uppercase">TITULO OBRA</h2>
                <span className="text-xs text-on-surface-variant tracking-wider uppercase opacity-70">Rua , numero - Cidade, ES(Estado)</span>
            </div>
        </header> */}
        <header className="flex justify-between items-center p-6">
            <div>
                <h1 className="text-[3.5rem] font-black tracking-tighter text-on-surface leading-tight">TITULO OBRA</h1>
                <p className="text-primary font-medium tracking-wide uppercase text-sm mt-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />Cidade, ES(Estado)</p>
            </div>
            <div className="flex items-center">
                <Button variant="primary" className="text-[1.25rem] px-5">Editar</Button>
            </div>
        </header>
        <nav className="bg-surface-container-low px-8 pt-3 pb-4 border border-outline-variant/10 rounded-xl justify-around flex gap-12">
            <Button variant="menuSelected">Visão Geral</Button>
            <Button variant="menu">Etapas</Button>
            <Button variant="menu">Equipe</Button>
            <Button variant="menu">Orçamento</Button>
            <Button variant="menu">Chat</Button> 
        </nav>
        <main className="py-6 px-8">
            <VisaoGeral />
        </main>
    </div>
  )
}