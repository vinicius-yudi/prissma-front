import { cssTransition, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import { ToastCloseButton } from "./ToastCloseButton"
import { ToastIcon } from "./ToastIcon"

/** Entra subindo, sai para a direita (keyframes em `index.css`). */
const toastMotion = cssTransition({
  enter: "pr-toast-in",
  exit: "pr-toast-out",
})

/**
 * Contêiner único de toasts (DS v2).
 *
 * 3,8s sem ação; toast com Desfazer passa `autoClose: 6000` na chamada. No
 * máximo 4 empilhados. O tema do toastify fica sempre em `light` porque as
 * variáveis do contêiner já apontam para a superfície `inverse` — que troca
 * sozinha com o tema do app.
 */
export function Toaster() {
  return (
    <ToastContainer
      position="bottom-right"
      theme="light"
      autoClose={3800}
      limit={4}
      hideProgressBar
      closeOnClick={false}
      icon={ToastIcon}
      closeButton={ToastCloseButton}
      transition={toastMotion}
      toastClassName="items-start gap-3 text-[14px] font-[620]"
    />
  )
}
