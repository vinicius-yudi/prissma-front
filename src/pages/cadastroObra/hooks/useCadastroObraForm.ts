import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"
import { cadastroObra } from "../services/cadastroObra.service";
import { cadastroObraSchema, type CadastroFormDataObra } from "../types";


export function useCadastroObraForm() {
  const navigate = useNavigate();

  const form = useForm({resolver: zodResolver(cadastroObraSchema), 
    defaultValues: {
    title: "",
    address: "",
    projectType: "",
    category: "",
    status: "PLANNING",
    landArea: 0,
    builtArea: 0,
    plannedStartDate: "",
    plannedEndDate: "",},
  });

  const mutation = useMutation({
    mutationFn: cadastroObra,
    onSuccess: () => {
      toast.success("Obra cadastrada com sucesso!");
      navigate("/dashboard");
    },
    onError: (error: any) => {
      const mensagem = error.response?.data?.message || error.message || "Erro ao cadastrar obra";
      toast.error(mensagem);
    },
  });

  const onInvalid = (errors: any) => {
    const firstError = Object.values(errors)[0] as any;
    if (firstError) {toast.error(firstError.message); }
  };

  const onSubmit = (data: CadastroFormDataObra) => {
    mutation.mutate(data);
  };

  return {
  register: form.register,
  control: form.control,
  handleSubmit: form.handleSubmit(onSubmit, onInvalid),
  errors: form.formState.errors,
  isLoading: mutation.isPending,
};
}