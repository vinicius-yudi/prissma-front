import { tv } from "tailwind-variants"
import type { InterfaceSelectProps } from "./SelectInterface"

const select = tv({
	base: "w-full bg-surface-container text-on-surface placeholder:text-on-surface-variant px-5 py-4 rounded-xl outline-none border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all appearance-none cursor-pointer",
})

export function Select({ className, children, ...props }: InterfaceSelectProps) {
	return (
		<div className="relative">
			<select className={select({ className })} {...props}>
				{children}
			</select>
			<span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
				▾
			</span>
		</div>
	)
}
