import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { getMyProfile } from "@/shared/services/user.service"
import { GlobalRole, type Role, type UserProfile } from "@/shared/types/user"

import { updateProfile } from "../services/perfil.service"
import type { UpdateProfilePayload } from "../types"

interface PerfilFormState {
  name: string
  email: string
  role: Role
  newPassword: string
  confirmPassword: string
}

const INITIAL_STATE: PerfilFormState = {
  name: "",
  email: "",
  role: GlobalRole.USER,
  newPassword: "",
  confirmPassword: "",
}

/** Chaves de i18n dos avisos do perfil. */
const TOAST_MESSAGES = {
  success: "perfil.toasts.success",
  noChanges: "perfil.toasts.noChanges",
  passwordMismatch: "perfil.toasts.passwordMismatch",
  passwordUppercase: "perfil.toasts.passwordUppercase",
  passwordLowercase: "perfil.toasts.passwordLowercase",
  passwordDigit: "perfil.toasts.passwordDigit",
  passwordSpecial: "perfil.toasts.passwordSpecial",
} as const

function buildPayload(original: UserProfile, form: PerfilFormState): UpdateProfilePayload {
  const payload: UpdateProfilePayload = {}
  if (form.name !== original.name) payload.name = form.name
  if (form.email !== original.email) payload.email = form.email
  if (form.role !== original.role) payload.role = form.role
  if (form.newPassword) payload.password = form.newPassword
  return payload
}

function validateNewPassword(password: string): string | null {
  if (!/[A-Z]/.test(password)) return TOAST_MESSAGES.passwordUppercase
  if (!/[a-z]/.test(password)) return TOAST_MESSAGES.passwordLowercase
  if (!/[0-9]/.test(password)) return TOAST_MESSAGES.passwordDigit
  if (!/[^a-zA-Z0-9]/.test(password)) return TOAST_MESSAGES.passwordSpecial
  return null
}

interface UsePerfilFormOptions {
  open: boolean
  onClose: () => void
}

export function usePerfilForm({ open, onClose }: UsePerfilFormOptions) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<PerfilFormState>(INITIAL_STATE)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const initialized = useRef(false)

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  })

  useEffect(() => {
    if (!open) return
    initialized.current = false
    setForm(INITIAL_STATE)
    setShowPassword(false)
    setShowConfirm(false)
  }, [open])

  useEffect(() => {
    if (!profile || initialized.current) return
    initialized.current = true
    setForm({
      name: profile.name,
      email: profile.email,
      role: profile.role,
      newPassword: "",
      confirmPassword: "",
    })
  }, [profile])

  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateProfilePayload }) =>
      updateProfile(id, payload),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(["profile"], updatedProfile)
      toast.success(t(TOAST_MESSAGES.success))
      onClose()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value as Role
    setForm((prev) => ({ ...prev, role: value }))
  }

  function togglePassword() {
    setShowPassword((p) => !p)
  }

  function toggleConfirm() {
    setShowConfirm((p) => !p)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!profile) return

    if (form.newPassword) {
      const error = validateNewPassword(form.newPassword)
      if (error) {
        toast.warning(t(error))
        return
      }
      if (form.newPassword !== form.confirmPassword) {
        toast.warning(t(TOAST_MESSAGES.passwordMismatch))
        return
      }
    }

    const payload = buildPayload(profile, form)
    if (Object.keys(payload).length === 0) {
      toast.info(t(TOAST_MESSAGES.noChanges))
      return
    }

    mutation.mutate({ id: profile.id, payload })
  }

  return {
    form,
    isLoading,
    isPending: mutation.isPending,
    showPassword,
    showConfirm,
    handleChange,
    handleRoleChange,
    handleSubmit,
    togglePassword,
    toggleConfirm,
  }
}
