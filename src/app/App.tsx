import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import { AuthProvider } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { MainLayout } from "@/layouts/MainLayout"
import { CadastroPage } from "@/pages/cadastro"
import { DashboardPage } from "@/pages/dashboard"
import { ForgotPasswordPage } from "@/pages/forgot-password"
import { LoginPage } from "@/pages/login"
import { NotFoundPage } from "@/pages/not-found"
import { ObraLayout } from "@/pages/obra-selecionada/ObraLayout"
import {
  DiarioModule,
  DocumentosModule,
  EquipesModule,
  EtapasModule,
  IndicadoresModule,
  OrcamentoModule,
  PessoasModule,
  PropostasModule,
  TarefasModule,
  VisaoGeralModule,
} from "@/pages/obra-selecionada/modules"
import { ProjetosPage } from "@/pages/projetos"
import { ResetPasswordPage } from "@/pages/reset-password"

import { ModuleGuard } from "./ModuleGuard"
import { ProtectedRoute } from "./ProtectedRoute"

const queryClient = new QueryClient()

/**
 * Navegação em dois níveis (Fluxos v2 §1).
 *
 * Nível 1 — workspace: Home e Obras.
 * Nível 2 — contexto de obra: cada aba antiga virou módulo com URL própria,
 * sob <ObraLayout>, que carrega a obra uma vez e a passa pelo Outlet.
 *
 * Toda a árvore autenticada fica sob **um único** elemento pai, para que o
 * prefixo `/w/:wsId` do Workspace entre depois sem reescrever este arquivo.
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cadastro" element={<CadastroPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />

                  {/* Nível 1 — workspace */}
                  <Route
                    path="dashboard"
                    element={
                      <ModuleGuard module="home">
                        <DashboardPage />
                      </ModuleGuard>
                    }
                  />
                  <Route
                    path="obras"
                    element={
                      <ModuleGuard module="obras">
                        <ProjetosPage />
                      </ModuleGuard>
                    }
                  />

                  {/* Nível 2 — contexto de obra */}
                  <Route path="obras/:obraId" element={<ObraLayout />}>
                    <Route index element={<Navigate to="visao-geral" replace />} />
                    <Route
                      path="visao-geral"
                      element={
                        <ModuleGuard module="visao-geral">
                          <VisaoGeralModule />
                        </ModuleGuard>
                      }
                    />
                    <Route
                      path="indicadores"
                      element={
                        <ModuleGuard module="indicadores">
                          <IndicadoresModule />
                        </ModuleGuard>
                      }
                    />
                    <Route
                      path="etapas"
                      element={
                        <ModuleGuard module="etapas">
                          <EtapasModule />
                        </ModuleGuard>
                      }
                    />
                    <Route
                      path="tarefas"
                      element={
                        <ModuleGuard module="tarefas">
                          <TarefasModule />
                        </ModuleGuard>
                      }
                    />
                    <Route
                      path="equipes"
                      element={
                        <ModuleGuard module="equipes">
                          <EquipesModule />
                        </ModuleGuard>
                      }
                    />
                    <Route
                      path="orcamento"
                      element={
                        <ModuleGuard module="orcamento">
                          <OrcamentoModule />
                        </ModuleGuard>
                      }
                    />
                    <Route
                      path="diario"
                      element={
                        <ModuleGuard module="diario">
                          <DiarioModule />
                        </ModuleGuard>
                      }
                    />
                    <Route
                      path="documentos"
                      element={
                        <ModuleGuard module="documentos">
                          <DocumentosModule />
                        </ModuleGuard>
                      }
                    />
                    <Route
                      path="propostas"
                      element={
                        <ModuleGuard module="propostas">
                          <PropostasModule />
                        </ModuleGuard>
                      }
                    />
                    <Route
                      path="pessoas"
                      element={
                        <ModuleGuard module="pessoas">
                          <PessoasModule />
                        </ModuleGuard>
                      }
                    />
                  </Route>

                  {/* Rotas da estrutura anterior, mantidas por um ciclo. */}
                  <Route path="projetos" element={<Navigate to="/obras" replace />} />

                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
          <ToastContainer position="top-right" theme="dark" autoClose={3000} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
