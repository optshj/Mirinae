import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import csp from 'vite-plugin-csp-guard';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    main: {
      build: {
        sourcemap: true
      },
      plugins: [
        externalizeDepsPlugin(),
        sentryVitePlugin({
          authToken: process.env.SENTRY_AUTH_TOKEN,
          org: '174d993e06c2',
          project: 'mirinae'
        })
      ],

      define: {
        'process.env.VITE_CLIENT_ID': `"${env.VITE_CLIENT_ID}"`,
        'process.env.VITE_CLIENT_SECRET': `"${env.VITE_CLIENT_SECRET}"`,
        'process.env.VITE_POSTHOG_API_KEY': `"${env.VITE_POSTHOG_API_KEY}"`,
        'process.env.VITE_POSTHOG_HOST': `"${env.VITE_POSTHOG_HOST}"`
      }
    },
    preload: {
      plugins: [externalizeDepsPlugin()]
    },
    renderer: {
      build: {
        assetsInlineLimit: 0
      },
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
            'connect-src': ["'self'", 'https://www.googleapis.com', 'https://discord.com', 'https://*.i.posthog.com', 'https://*.posthog.com']
          }
        })
      ]
    }
  };
});
