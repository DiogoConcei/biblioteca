// vite.config.ts
import { defineConfig } from 'vite';
import path from 'node:path';
import electron from 'vite-plugin-electron/simple';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),

    electron({
      // ─── PROCESSO MAIN ─────────────────────────────
      main: {
        // Aqui vai apontar para o seu main.ts
        entry: 'electron/main.ts',

        // ESTE bloco “vite” deve ficar exatamente assim:
        vite: {
          build: {
            // 1) Define que, no bundle do main, o módulo 'sharp' é external
            rollupOptions: {
              external: ['sharp'],
            },
          },
        },
      },

      // ─── PROCESSO PRELOAD ───────────────────────────
      preload: {
        // “input” deve apontar para o seu preload.ts
        input: path.join(__dirname, 'electron/preload.ts'),

        // O bloco “vite” para o preload:
        vite: {
          build: {
            // 2) Define que, no bundle do preload, o 'sharp' é external
            rollupOptions: {
              external: ['sharp'],
            },
          },
        },
      },

      // ─── PROCESSO RENDERER (React) ──────────────────
      // Mantemos exatamente o que você já tinha:
      renderer: process.env.NODE_ENV === 'test' ? undefined : {},
    }),
  ],
});
