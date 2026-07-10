import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Target modern browsers for smaller output
    target: 'es2020',
    // Sourcemaps for debugging
    sourcemap: false,
    // Rollup configuration for chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem — cached separately
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Supabase client — loaded once, cached
          'supabase': ['@supabase/supabase-js'],
          // Animation library
          'animation': ['framer-motion'],
          // Charts — only used in OrgIntelligence but heavy
          'charts': ['recharts'],
          // PDF generation — lazy but needs its own chunk
          'pdf': ['jspdf'],
          // Markdown rendering
          'markdown': ['react-markdown', 'remark-gfm'],
          // Icons
          'icons': ['lucide-react'],
          // State management
          'state': ['zustand', 'zod'],
        },
      },
    },
    // Increase warning limit since we know about heavy chunks
    chunkSizeWarningLimit: 300,
    // Minify with esbuild (fast)
    minify: 'esbuild',
    // CSS code split
    cssCodeSplit: true,
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'recharts',
      'framer-motion',
    ],
  },
});
