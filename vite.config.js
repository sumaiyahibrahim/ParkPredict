import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    // GitHub Pages serves this repository under /ParkPredict/; keep local Vite at /.
    base: process.env.GITHUB_ACTIONS === 'true' ? '/ParkPredict/' : '/',
    plugins: [react()],
});
