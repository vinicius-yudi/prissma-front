import { Button } from '@/shared/components/ui/button/Button';
import { Input } from '@/shared/components/ui/input/Input';
import { Label } from '@/shared/components/ui/label/Label';
import { Select } from '@/shared/components/ui/select/select';
import type { InterfaceButtonProps } from '@/shared/components/ui/button/ButtonInterface';
import { MapPin, Save } from 'lucide-react';
import type { ElementType } from 'react';
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useCadastroObraForm } from '../hooks/useCadastroObraForm';

interface IconButtonProps extends InterfaceButtonProps {
  icon: ElementType;
}

function IconButton({ icon: Icon, children, ...props }: IconButtonProps) {
  return (<Button {...props}>
            <Icon size={20} />
            {children}
        </Button>
  );
}

export function CadastroObraForm() {
    const { register, handleSubmit, isLoading } = useCadastroObraForm();
  return (
    <div className="flex-1 md:ml-64 bg-background p-6 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
            <header className="mb-6">
                <h1 className="text-5xl font-black text-on-surface tracking-tighter leading-none mb-4">Cadastro de Obra</h1>
                <p className="text-on-surface-variant text-lg max-w-2xl">Defina as informações estruturais e cronológicos para o seu novo projeto.</p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 glass-panel p-8 rounded-xl shadow-2xl relative overflow-hidden">
                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                        <Label className="block text-xs uppercase tracking-widest text-primary font-semibold">Nome da Obra</Label>
                        <Input className="w-full bg-surface-container-highest text-white focus:ring-1" 
                        placeholder="Ex: Residencial Aurora" type="text"
                        {...register("title")}/>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <Label className="block text-xs uppercase tracking-widest text-primary font-semibold">Endereço Completo</Label>
                        <Input className="w-full bg-surface-container-highest text-white focus:ring-1" 
                        placeholder="Rua, Número, Bairro, Cidade - UF" type="text"
                        {...register("address")}
                        prefix={<MapPin size={20} />} />
                    </div>

                    <div className="space-y-2">
                        <Label className="block text-xs uppercase tracking-widest text-primary font-semibold">Tipo de Obra</Label>
                        <Select className="w-full bg-surface-container-highest text-white focus:ring-1"
                        {...register("projectType")}>
                            <option value="">Selecione...</option>
                            <option value="Residencial">Residencial</option>
                            <option value="Comercial">Comercial</option>
                            <option value="Industrial">Industrial</option>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="block text-xs uppercase tracking-widest text-primary font-semibold">Categoria</Label>
                        <Select className="w-full bg-surface-container-highest text-white focus:ring-1"
                        {...register("category")}>
                            <option value="">Selecione...</option>
                            <option value="New-construction">Nova construção</option>
                            <option value="Renovation">Reforma</option>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="block text-xs uppercase tracking-widest text-primary font-semibold">Área do Terreno (m²)</Label>
                        <Input className="w-full bg-surface-container-highest text-white focus:ring-1" 
                        placeholder="0.00" 
                        type="number"
                        {...register("landArea")}/>
                    </div>

                    <div className="space-y-2">
                        <Label className="block text-xs uppercase tracking-widest text-primary font-semibold">Área de Construção (m²)</Label>
                        <Input className="w-full bg-surface-container-highest text-white focus:ring-1" 
                        placeholder="0.00" 
                        type="number"
                        {...register("builtArea")}/>
                    </div>

                    <div className="space-y-2">
                        <Label className="block text-xs uppercase tracking-widest text-primary font-semibold">Data Planejada para Início</Label>
                        <Input className="w-full bg-surface-container-highest text-white focus:ring-1" 
                        type="date"
                        {...register("plannedStartDate")}/>
                    </div>

                    <div className="space-y-2">
                        <Label className="block text-xs uppercase tracking-widest text-primary font-semibold">Data Planejada para Fim</Label>
                        <Input className="w-full bg-surface-container-highest text-white focus:ring-1" 
                        type="date"
                        {...register("plannedEndDate")}/>
                    </div>
                </div>
                <div className="pt-8 flex flex-col sm:flex-row items-center gap-4 border-t border-white/5">
                    <IconButton icon={Save} type="submit" disabled={isLoading}>{isLoading ? "Salvando..." : "Salvar Obra"}</IconButton>
                    <Button type="button" variant="outline">Cancelar</Button>
                </div>
                </form>
            </div>
            </div>
        </div>
        <ToastContainer position="top-right" theme="dark" />
    </div>
)
}