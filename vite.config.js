import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Obrigatório para CrazyGames - caminhos estritamente relativos
  server: {
    port: 3010,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});
