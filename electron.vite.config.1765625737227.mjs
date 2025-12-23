// electron.vite.config.ts
import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import csp from 'vite-plugin-csp-guard';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
var electron_vite_config_default = defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
        main: {
            plugins: [externalizeDepsPlugin()],
            define: {
                'process.env.VITE_CLIENT_ID': `"${env.VITE_CLIENT_ID}"`,
                'process.env.VITE_CLIENT_SECRET': `"${env.VITE_CLIENT_SECRET}"`
            }
        },
        preload: {
            plugins: [externalizeDepsPlugin()]
        },
        renderer: {
            resolve: {
                alias: {
                    '@': resolve('src/renderer')
                }
            },
            plugins: [
                react(),
                tailwindcss(),
                csp({
                    policy: {
                        'default-src': ["'self'"],
                        'connect-src': ["'self'", 'https://www.googleapis.com']
                    }
                })
            ]
        }
    };
});
export { electron_vite_config_default as default };
