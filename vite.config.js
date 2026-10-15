import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // CAMINHOS RELATIVOS — obrigatório para CrazyGames (rejeita /assets/...)
  base: './',

  root: '.',

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2017',

    // Sem minificação agressiva que quebre Godot Wasm
    minify: 'esbuild',

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        // Mantém estrutura de assets relativa
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },

    // Não excluir assets do Godot export (game/)
    assetsInlineLimit: 0,

    // Aviso em 50MB (limite CrazyGames)
    chunkSizeWarningLimit: 51200,
  },

  server: {
    port: 3000,
    open: true,
    // Headers necessários para SharedArrayBuffer / Godot Threads
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },

  preview: {
    port: 4173,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },

  // Otimizações
  optimizeDeps: {
    exclude: ['ShiftCore3D.js'],
  },
})
