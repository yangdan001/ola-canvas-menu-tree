import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import typescript from '@rollup/plugin-typescript';

import path from 'path';

const resolvePath = (str: string) => path.resolve(__dirname, str);

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    // // 定义开发环境下的变量
    // 'process.env': {
    //   NODE_ENV: JSON.stringify('development'),
    //   API_BASE_URL: JSON.stringify('http://localhost:3000')
    // }
  },
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'components',
      fileName: (format) => `components.${format}.js`,
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
