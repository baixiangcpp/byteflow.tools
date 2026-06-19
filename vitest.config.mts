import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: [
                'src/core/registry/**/*.{ts,tsx}',
                'src/core/routing/**/*.{ts,tsx}',
                'src/core/security/**/*.{ts,tsx}',
                'src/core/storage/**/*.{ts,tsx}',
                'src/features/tools/**/{logic,utils}.{ts,tsx}',
            ],
            exclude: [
                'src/core/registry/types.ts',
                'src/core/registry/tool-meta/**',
            ],
            thresholds: {
                branches: 60,
                functions: 70,
                lines: 75,
                statements: 75,
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    }
})
