import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { MainLayout } from "@/layouts/MainLayout"
import { DashboardPage } from "@/pages/dashboard"
import { ForgotPasswordPage } from "@/pages/forgot-password"
import { LoginPage } from "@/pages/login"
import { CadastroPage } from "@/pages/cadastro"
import { ProjetosPage } from "@/pages/projetos"
import { ObraSelecionadaPage } from "@/pages/obra-selecionada"
import { NotFoundPage } from "@/pages/not-found"
import { ResetPasswordPage } from "@/pages/reset-password"
import { ProtectedRoute } from "./ProtectedRoute"

const queryClient = new QueryClient()

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
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/projetos" element={<ProjetosPage />} />
                {/* Tarefas e Equipe são abas dentro de um projeto; a sidebar
                    encaminha para a lista de projetos para escolher um. */}
                <Route path="/tarefas" element={<Navigate to="/projetos" replace />} />
                <Route path="/equipe" element={<Navigate to="/projetos" replace />} />
                <Route path="/obras/:id" element={<ObraSelecionadaPage />} />
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
