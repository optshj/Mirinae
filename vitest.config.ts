import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/renderer/src/setupTests.ts'
    },
    resolve: {
        alias: {
            '@': resolve('src/renderer/src')
        }
    }
});
