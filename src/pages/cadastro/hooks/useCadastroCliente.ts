import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "react-toastify"
import { cadastroCliente } from "../services/cadastroCliente.service"
import { cadastroClienteSchema } from "../schemas/cadastroCliente.schema"
import type { CadastroFormDataCliente } from "../types"

export function useCadastroCliente() {
  const [formDataCliente, setFormData] = useState<CadastroFormDataCliente>({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { saveToken } = useAuth()

  const mutation = useMutation({
    mutationFn: cadastroCliente,
    onSuccess: ({ token }) => {
      saveToken(token)
      navigate("/dashboard")
    },
    onError: (error: Error) => {
    console.error("Erro completo:", error)
    if (error.message.includes("Email já cadastrado")) {
      toast.error("Este e-mail já está sendo utilizado.")
    } else {
      toast.error("Erro ao cadastrar usuário.")
    }
    },
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const result = cadastroClienteSchema.safeParse(formDataCliente)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      const firstErrorKey = Object.keys(fieldErrors).find(
        (key) => fieldErrors[key as keyof typeof fieldErrors]?.length
      )
      if (firstErrorKey) {
        const messages = fieldErrors[firstErrorKey as keyof typeof fieldErrors]
        if (messages && messages.length > 0) {
          toast.error(messages[0])
        }
      }
      return
    }
    mutation.mutate(formDataCliente)
  }

  function togglePassword() {
    setShowPassword((prev) => !prev)
  }

  return {
    formDataCliente,
    showPassword,
    handleChange,
    handleSubmit,
    togglePassword,
    isPending: mutation.isPending,
  }
}