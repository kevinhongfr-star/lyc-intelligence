import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN;
  const sentryOrg = env.SENTRY_ORG;
  const sentryProject = env.SENTRY_PROJECT;
  const uploadSourceMaps = Boolean(sentryAuthToken && sentryOrg && sentryProject);

  return {
    plugins: [
      react(),
      uploadSourceMaps
        ? sentryVitePlugin({
            org: sentryOrg,
            project: sentryProject,
            authToken: sentryAuthToken,
            sourcemaps: {
              assets: ['./dist/**/*'],
            },
            telemetry: false,
          })
        : undefined,
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      sourcemap: uploadSourceMaps,
    },
  };
});
