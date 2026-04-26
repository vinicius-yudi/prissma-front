import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider } from "@/contexts/AuthContext"
import { MainLayout } from "@/layouts/MainLayout"
import { DashboardPage } from "@/pages/dashboard"
import { ForgotPasswordPage } from "@/pages/forgot-password"
import { LoginPage } from "@/pages/login"
import { CadastroPage } from "@/pages/cadastro"
import { CadastroObra } from "@/pages/cadastroObra"
import { PerfilPage } from "@/pages/perfil"
import { ProjetosPage } from "@/pages/projetos"
import { ResetPasswordPage } from "@/pages/reset-password"
import { ProtectedRoute } from "./ProtectedRoute"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<CadastroPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/perfil" element={<PerfilPage />} />
                <Route path="/projetos" element={<ProjetosPage />} />
                <Route path="/cadastroObra" element={<CadastroObra />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
