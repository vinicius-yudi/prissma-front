import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [react(), tailwindcss()],
	// Inline (empty) PostCSS config so Vite doesn't search parent dirs and pick up
	// a stray ~/postcss.config.mjs. Tailwind v4 runs via the Vite plugin above.
	css: { postcss: {} },
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
