import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { LoginPage } from "@/pages/login"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LoginPage />
    </QueryClientProvider>
  )
}

export default App
