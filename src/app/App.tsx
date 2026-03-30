import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
/* import { LoginPage } from "@/pages/login" */
import { CadastroPage } from "@/pages/cadastro"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* <LoginPage /> */}
      <CadastroPage />
    </QueryClientProvider>
  )
}

export default App
