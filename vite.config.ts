import { defineConfig, loadEnv } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';
import devtools from 'solid-devtools/vite';
import { apiHandler } from './src/api/handler';
import bodyParser from 'body-parser';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const key in env) {
    if (!process.env[key]) {
      process.env[key] = env[key];
    }
  }

  return {
    plugins: [
      devtools(), 
      tailwindcss(), 
      solidPlugin(),
      {
        name: 'api-middleware',
        configureServer(server) {
          server.middlewares.use(bodyParser.json());
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api')) {
              await apiHandler(req, res);
              return;
            }
            next();
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use(bodyParser.json());
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api')) {
              await apiHandler(req, res);
              return;
            }
            next();
          });
        }
      }
    ],
    server: {
      port: 3000,
    },
    build: {
      target: 'esnext',
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['node_modules/@testing-library/jest-dom/vitest'],
      isolate: false,
      exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
      server: {
        deps: {
          inline: [/solid-js/, /@solidjs\/router/],
        },
      },
    },
  };
});
