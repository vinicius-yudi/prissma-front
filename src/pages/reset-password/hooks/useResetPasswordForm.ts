import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import { resetPassword } from "../services/reset-password.service"

export function useResetPasswordForm() {
	const [searchParams] = useSearchParams()
	const token = searchParams.get("token") ?? ""
	const navigate = useNavigate()

	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)

	const mutation = useMutation({
		mutationFn: () => resetPassword(token, newPassword),
		onSuccess: () => {
			toast.success("Senha redefinida com sucesso!")
			navigate("/login")
		},
		onError: (error: Error) => {
			toast.error(error.message)
		},
	})

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		if (!token) {
			toast.error("Token inválido ou ausente.")
			return
		}
		if (newPassword.length < 6) {
			toast.warning("A senha deve ter no mínimo 6 caracteres.")
			return
		}
		if (newPassword !== confirmPassword) {
			toast.warning("As senhas não coincidem.")
			return
		}
		mutation.mutate()
	}

	return {
		newPassword,
		setNewPassword,
		confirmPassword,
		setConfirmPassword,
		showPassword,
		togglePassword: () => setShowPassword((p) => !p),
		showConfirm,
		toggleConfirm: () => setShowConfirm((p) => !p),
		handleSubmit,
		isPending: mutation.isPending,
		hasToken: !!token,
	}
}
