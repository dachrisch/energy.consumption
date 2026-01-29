import { defineConfig, loadEnv } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import tailwindcss from '@tailwindcss/vite';
import devtools from 'solid-devtools/vite';
import { apiHandler } from './src/api/handler';
import bodyParser from 'body-parser';
import { IncomingMessage, ServerResponse } from 'http';

const apiMiddleware = {
  name: 'api-middleware',
  configureServer(server: any) {
    server.middlewares.use(bodyParser.json({ limit: '10mb' }));
    server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: any) => {
      if (req.url?.startsWith('/api')) {
        await apiHandler(req as any, res as any);
        return;
      }
      next();
    });
  },
  configurePreviewServer(server: any) {
    server.middlewares.use(bodyParser.json({ limit: '10mb' }));
    server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: any) => {
      if (req.url?.startsWith('/api')) {
        await apiHandler(req as any, res as any);
        return;
      }
      next();
    });
  }
};

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
      apiMiddleware
    ],
    define: {
      'import.meta.env.VITE_BUILD_VERSION': JSON.stringify(
        process.env.VITE_BUILD_VERSION || 'dev'
      ),
    },
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
