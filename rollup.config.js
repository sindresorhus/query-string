const {nodeResolve} = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const babel = require('rollup-plugin-babel')
const {terser} = require('rollup-plugin-terser')

const suffix = process.env.USE_POLYFILLS == 'on' ? '.polyfilled' : ''

module.exports = {
  input: 'index.js',
  output: [
    {
      format: 'amd',
      file: 'dist/query-string.amd' + suffix + '.js'
    },
    {
      format: 'cjs',
      file: 'dist/query-string.cjs' + suffix + '.js'
    },
    {
      format: 'es',
      file: 'dist/query-string.es' + suffix + '.js'
    },
    {
      format: 'iife',
      file: 'dist/query-string.iife' + suffix + '.js',
      name: 'QueryString'
    },
    {
      format: 'umd',
      file: 'dist/query-string.umd' + suffix + '.js',
      name: 'QueryString'
    }
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    babel(),
    terser()
  ]
}
