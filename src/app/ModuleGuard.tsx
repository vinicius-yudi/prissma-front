import { AccessDeniedPage } from "@/pages/access-denied"
import type { AppModule } from "@/shared/constants/access"
import { useAccess } from "@/shared/hooks/useAccess"

/**
 * Guard de rota por módulo.
 *
 * Consulta a mesma matriz que gera a sidebar (`shared/constants/access.ts`),
 * então nav e guard não têm como divergir. Módulo somente-leitura passa: quem
 * marca a restrição é o aviso no header e os controles de cada tela.
 */

interface ModuleGuardProps {
  module: AppModule
  children: React.ReactNode
}

export function ModuleGuard({ module, children }: ModuleGuardProps) {
  const { levelOf, isLoading } = useAccess()

  // Sem esperar o papel carregar, o guard negaria acesso por um instante e
  // piscaria "Acesso negado" para quem tem permissão.
  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-surface-container-low" />
  }

  if (levelOf(module) === "") {
    return <AccessDeniedPage />
  }

  return <>{children}</>
}
