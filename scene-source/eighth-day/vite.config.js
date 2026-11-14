import {defineConfig} from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: '../../scenes/eighth-day',
    // This directory contains this scene's generated files only.
    emptyOutDir: true,
  },
});
