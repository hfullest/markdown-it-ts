import dts from 'rollup-plugin-dts';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import alias from '@rollup/plugin-alias';
import esbuild from 'rollup-plugin-esbuild';
import typescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';

const entries = ['src/index.ts'];

const plugins = [
  babel({
    root: './',
    babelrc: false,
    babelHelpers: 'bundled',
    presets: [['env']],
    exclude: ['node_modules/**'],
  }),
  resolve({
    preferBuiltins: true,
  }),
  alias(),
  json(),
  typescript(),
  commonjs(),
  esbuild(),
];

/** @type {import('rollup').RollupOptions[]} */
export default [
  ...entries.map(
    (input) =>
      /** @type {import('rollup').RollupOptions}*/ ({
        input,
        output: [
          {
            file: input.replace('src/', 'dist/').replace('.ts', '.mjs'),
            format: 'esm',
          },
          {
            file: input.replace('src/', 'dist/').replace('.ts', '.cjs'),
            format: 'cjs',
          },
          {
            file: input.replace('src/', 'dist/').replace('.ts', '.umd.js'),
            format: 'umd',
            exports: 'auto',
            name: 'MarkdownIt',
          },
        ],
        external: [],
        plugins,
      })
  ),
  ...entries.map((input) => ({
    input,
    output: {
      file: input.replace('src/', 'dist/').replace('.ts', '.d.ts'),
      format: 'esm',
    },
    external: [],
    plugins: [dts({ respectExternal: true })],
  })),
];
