import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: true,
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: {
                    // React core
                    "vendor-react": ["react", "react-dom", "react-router-dom"],
                    // Available Radix UI components
                    "vendor-radix": [
                        "@radix-ui/react-dialog",
                        "@radix-ui/react-dropdown-menu",
                        "@radix-ui/react-label",
                        "@radix-ui/react-tabs",
                        "@radix-ui/react-slot",
                        "@radix-ui/react-avatar",
                        "@radix-ui/react-toast",
                    ],
                    // Charts
                    "vendor-charts": ["recharts"],
                    // Utilities
                    "vendor-utils": ["clsx", "class-variance-authority", "tailwind-merge", "lucide-react"],
                    // HTTP
                    "vendor-http": ["axios"],
                    // i18n
                    "vendor-i18n": ["i18next", "react-i18next"],
                    // Forms
                    "vendor-forms": ["react-hook-form", "zod"],
                },
            },
        },
    },
})
