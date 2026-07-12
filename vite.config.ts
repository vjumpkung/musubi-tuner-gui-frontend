import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '')

    return {
        plugins: [react()],
        server: {
            proxy: {
                // Forward API calls to the FastAPI backend during development.
                '/api': {
                    target: env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000',
                    changeOrigin: true
                }
            }
        },
        build: {
            // The production build is hosted by the FastAPI backend from its web/ folder.
            outDir: '../musubi-tuner-gui-backend/web',
            emptyOutDir: true
        }
    }
})
