import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "react-toastify"
import { cadastroEngenheiro } from "../services/cadastroEngenheiro.service"
import { cadastroEngenheiroSchema } from "../schemas/cadastroEngenheiro.schemas"
import type { CadastroFormDataEngenheiro } from "../types"

export function useCadastroEngenheiro() {
  const [formDataEngenheiro, setFormData] = useState<CadastroFormDataEngenheiro>({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CadastroFormDataEngenheiro, string>>>({});
  const navigate = useNavigate()
  const { saveToken } = useAuth()

  const mutation = useMutation({
    mutationFn: cadastroEngenheiro,
    onSuccess: ({ token }) => {
      saveToken(token)
      navigate("/dashboard")
    },
    onError: (error: Error) => {
      console.error(error.message)
    },
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    
        if (formErrors[name as keyof CadastroFormDataEngenheiro]) {
          setFormErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const result = cadastroEngenheiroSchema.safeParse(formDataEngenheiro)
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
    mutation.mutate(formDataEngenheiro)
  }

  function togglePassword() {
    setShowPassword((prev) => !prev)
  }

  return {
    formDataEngenheiro,
    showPassword,
    handleChange,
    handleSubmit,
    togglePassword,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage: mutation.error?.message,
  }
}