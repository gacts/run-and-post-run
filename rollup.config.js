// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'

const main = {
  input: 'src/main.js',
  output: {
    esModule: true,
    file: 'dist/main.mjs',
    format: 'es',
    sourcemap: false,
    compact: true,
    minifyInternalExports: true,
  },
  plugins: [commonjs(), nodeResolve({ preferBuiltins: true }), terser()],
}

const post = {
  input: 'src/post.js',
  output: {
    esModule: true,
    file: 'dist/post.mjs',
    format: 'es',
    sourcemap: false,
    compact: true,
    minifyInternalExports: true,
  },
  plugins: [commonjs(), nodeResolve({ preferBuiltins: true }), terser()],
}

export default [main, post]
