import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { loadEnv } from 'vite';
import typescript from '@rollup/plugin-typescript';

import path from 'path';

const resolvePath = (str: string) => path.resolve(__dirname, str);

//https://vitejs.dev/config/
export default defineConfig({
  envDir: path.resolve(__dirname, '../../env'),
  // base:'./',
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'icons',
      fileName: (format) => `icons.${format}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
      plugins: [
        typescript({
          target: 'esnext',
          rootDir: resolvePath('src'),
          declaration: true,
          declarationDir: resolvePath('dist'),
          exclude: resolvePath('node_modules/**'),
          allowSyntheticDefaultImports: true,
        }),
      ],
    },
  },
});
