import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) return 'react';
          if (id.includes('@supabase/supabase-js') || id.includes('@supabase/')) return 'supabase';
          if (id.includes('@tanstack/react-query') || id.includes('@tanstack/query-core')) return 'react-query';
          if (id.includes('@radix-ui/')) return 'radix';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('recharts')) return 'charts';
          if (id.includes('@emoji-mart')) return 'emoji';
          if (id.includes('@dnd-kit')) return 'dnd';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('react-router')) return 'router';
          if (id.includes('date-fns')) return 'date';
          if (id.includes('dompurify') || id.includes('purify.es')) return 'sanitize';
          return 'vendor';
        },
      },
    },
  },
})