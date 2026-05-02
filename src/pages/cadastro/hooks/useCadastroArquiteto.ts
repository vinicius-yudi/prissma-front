import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { useAuth } from "@/contexts/AuthContext"
import { cadastroArquiteto } from "../services/cadastroArquiteto.service"
import { cadastroArquitetoSchema } from "../schemas/cadastroArquiteto.schema"
import type { CadastroFormDataArquiteto } from "../types"

export function useCadastroArquiteto() {
  const [formDataArquiteto, setFormData] = useState<CadastroFormDataArquiteto>({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CadastroFormDataArquiteto, string>>>({});
  const navigate = useNavigate()
  const { saveToken } = useAuth()

  const mutation = useMutation({
    mutationFn: cadastroArquiteto,
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

    if (formErrors[name as keyof CadastroFormDataArquiteto]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const result = cadastroArquitetoSchema.safeParse(formDataArquiteto)
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
    mutation.mutate(formDataArquiteto)
  }

  function togglePassword() {
    setShowPassword((prev) => !prev)
  }

  return {
    formDataArquiteto,
    showPassword,
    handleChange,
    handleSubmit,
    togglePassword,
    isPending: mutation.isPending
  }
}