import type { ElementType } from 'react'
import { MapPin, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import { Button } from '@/shared/components/ui/button/Button'
import type { InterfaceButtonProps } from '@/shared/components/ui/button/ButtonInterface'
import { Input } from '@/shared/components/ui/input/Input'
import { Label } from '@/shared/components/ui/label/Label'
import { Select } from '@/shared/components/ui/select/Select'
import { useCadastroObraForm } from '../hooks/useCadastroObraForm'

const AREA_PLACEHOLDER = "0.00"
const LABEL_CLASS = "block text-xs uppercase tracking-widest text-primary font-semibold"
const INPUT_CLASS = "w-full bg-surface-container-highest text-on-surface focus:ring-1"

interface IconButtonProps extends InterfaceButtonProps {
  icon: ElementType
}

function IconButton({ icon: Icon, children, ...props }: IconButtonProps) {
  return (
    <Button {...props}>
      <Icon size={20} />
      {children}
    </Button>
  )
}

export function CadastroObraForm() {
  const { register, handleSubmit, isLoading } = useCadastroObraForm()
  const { t } = useTranslation()

  const mapPinPrefix = <MapPin size={20} />

  return (
    <div className="flex-1 w-full overflow-y-auto bg-surface">
      <div className="w-full max-w-3xl mx-auto min-h-full px-6 py-2">
        <header className="w-full mb-6">
          <h1 className="text-5xl font-black text-on-surface tracking-tighter leading-none mb-4">
            {t("registerWork.title")}
          </h1>
          <p className="text-on-surface-variant text-lg max-w-2xl">
            {t("registerWork.subtitle")}
          </p>
        </header>

        <div className="w-full grid grid-cols-1 gap-8">
          <div className="lg:col-span-8 bg-surface-container p-8 rounded-2xl relative overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label className={LABEL_CLASS}>{t("registerWork.name")}</Label>
                  <Input
                    className={INPUT_CLASS}
                    placeholder={t("registerWork.namePlaceholder")}
                    type="text"
                    {...register("title")}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className={LABEL_CLASS}>{t("registerWork.address")}</Label>
                  <Input
                    className={INPUT_CLASS}
                    placeholder={t("registerWork.addressPlaceholder")}
                    type="text"
                    {...register("address")}
                    prefix={mapPinPrefix}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{t("registerWork.type")}</Label>
                  <Select className={INPUT_CLASS} {...register("projectType")}>
                    <option value="RESIDENTIAL">{t("registerWork.typeResidential")}</option>
                    <option value="COMMERCIAL">{t("registerWork.typeCommercial")}</option>
                    <option value="INDUSTRIAL">{t("registerWork.typeIndustrial")}</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{t("registerWork.category")}</Label>
                  <Select className={INPUT_CLASS} {...register("category")}>
                    <option value="BUILDING">{t("registerWork.categoryBuilding")}</option>
                    <option value="RENOVATION">{t("registerWork.categoryRenovation")}</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{t("registerWork.landArea")}</Label>
                  <Input
                    className={INPUT_CLASS}
                    placeholder={AREA_PLACEHOLDER}
                    type="number"
                    {...register("landArea")}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{t("registerWork.builtArea")}</Label>
                  <Input
                    className={INPUT_CLASS}
                    placeholder={AREA_PLACEHOLDER}
                    type="number"
                    {...register("builtArea")}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{t("registerWork.startDate")}</Label>
                  <Input className={INPUT_CLASS} type="date" {...register("plannedStartDate")} />
                </div>

                <div className="space-y-2">
                  <Label className={LABEL_CLASS}>{t("registerWork.endDate")}</Label>
                  <Input className={INPUT_CLASS} type="date" {...register("plannedEndDate")} />
                </div>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row items-center gap-4 border-t border-outline-variant">
                <IconButton icon={Save} type="submit" disabled={isLoading}>
                  {isLoading ? t("registerWork.saving") : t("registerWork.save")}
                </IconButton>
                <Button type="button" variant="outline">{t("registerWork.cancel")}</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" theme="dark" />
    </div>
  )
}
