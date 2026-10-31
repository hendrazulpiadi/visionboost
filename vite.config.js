import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@imgly/background-removal', '@huggingface/transformers', 'onnxruntime-web'],
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
  },
})
