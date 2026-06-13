import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    // Tiptap + ProseMirror core is ~441KB minified (irreducible without dynamic imports)
    chunkSizeWarningLimit: 450,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // React runtime — tiny, cached separately for long-term caching
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor'
          }
          // Tiptap + all ProseMirror deps — large but stable, cached independently
          if (id.includes('@tiptap/') || id.includes('prosemirror')) {
            return 'tiptap'
          }
          // Remaining node_modules (uuid etc.)
          if (id.includes('node_modules')) {
            return 'utils'
          }
          // App code falls into default index chunk
        },
      },
    },
  },
})
