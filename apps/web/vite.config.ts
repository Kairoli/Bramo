import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // BRAMO_API : relayer vers un autre serveur (une seconde pile de développement, sur une autre base).
    proxy: { '/api': process.env.BRAMO_API ?? 'http://127.0.0.1:3001' },
    // Les pièces des personnages sont lues dans art/, à la racine du dépôt.
    fs: { allow: ['../..'] },
  },
});
