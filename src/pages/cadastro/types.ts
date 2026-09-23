export interface CadastroFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

// Os três perfis têm exatamente os mesmos campos; os aliases existem só para
// manter legível qual hook/serviço cada um alimenta.
export type CadastroFormDataArquiteto = CadastroFormData
export type CadastroFormDataEngenheiro = CadastroFormData
export type CadastroFormDataCliente = CadastroFormData
