import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

const COMPAT_SUBPATH = /^es-toolkit\/compat\/([^/]+)$/
const VIRTUAL_PREFIX = "\0es-toolkit-compat-default:"
const ESBUILD_NAMESPACE = "es-toolkit-compat-default"
const bridgeSource = (name: string): string =>
	`export { ${name} as default } from "es-toolkit/compat";`


interface EsbuildPluginBuild {
	onResolve(
		options: { filter: RegExp; namespace?: string },
		callback: (args: { path: string }) => {
			path: string
			namespace?: string
			external?: boolean
		} | null | undefined,
	): void
	onLoad(
		options: { filter: RegExp; namespace?: string },
		callback: (args: { path: string }) => {
			contents: string
			resolveDir?: string
			loader?: string
		} | null | undefined,
	): void
}

const esToolkitCompatBridge: Plugin = {
	name: "es-toolkit-compat-default-bridge",
	enforce: "pre",
	resolveId(source) {
		const match = source.match(COMPAT_SUBPATH)
		if (!match) {
			return null
		}
		return VIRTUAL_PREFIX + match[1]
	},
	load(id) {
		if (!id.startsWith(VIRTUAL_PREFIX)) {
			return null
		}
		return bridgeSource(id.slice(VIRTUAL_PREFIX.length))
	},
}

const projectRoot = path.resolve(__dirname)

export default defineConfig({
	plugins: [esToolkitCompatBridge, react(), tailwindcss()],
	// Inline (empty) PostCSS config so Vite doesn't search parent dirs and pick up
	// a stray ~/postcss.config.mjs. Tailwind v4 runs via the Vite plugin above.
	css: { postcss: {} },
	optimizeDeps: {
		esbuildOptions: {
			plugins: [
				{
					name: "es-toolkit-compat-default-bridge",
					setup(build: EsbuildPluginBuild) {
						build.onResolve({ filter: COMPAT_SUBPATH }, (args) => {
							const name = args.path.split("/").pop() as string
							return { path: name, namespace: ESBUILD_NAMESPACE }
						})
						build.onLoad(
							{ filter: /.*/, namespace: ESBUILD_NAMESPACE },
							(args) => ({
								contents: bridgeSource(args.path),
								resolveDir: projectRoot,
								loader: "js",
							}),
						)
					},
				},
			],
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"#": path.resolve(__dirname, "./src"),
			"@styles": path.resolve(__dirname, "./src/styles"),
		},
	},
	server: {
		port: 3000,
		proxy: {
			"/api": {
				target: "http://localhost:8080",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
		},
	},
})
