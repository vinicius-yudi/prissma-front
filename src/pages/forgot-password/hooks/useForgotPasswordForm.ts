import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "react-toastify"
import { forgotPassword } from "../services/forgot-password.service"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function useForgotPasswordForm() {
	const [email, setEmail] = useState("")
	const [submitted, setSubmitted] = useState(false)

	const mutation = useMutation({
		mutationFn: forgotPassword,
		onSuccess: () => {
			setSubmitted(true)
		},
		onError: (error: Error) => {
			toast.error(error.message)
		},
	})

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		if (!email.trim()) {
			toast.warning("O e-mail é obrigatório.")
			return
		}
		if (!EMAIL_REGEX.test(email)) {
			toast.warning("Informe um e-mail válido.")
			return
		}
		mutation.mutate(email)
	}

	return {
		email,
		setEmail,
		handleSubmit,
		isPending: mutation.isPending,
		submitted,
	}
}
