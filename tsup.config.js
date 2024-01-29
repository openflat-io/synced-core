export default {
    entry: ['index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    minify: process.env.NODE_ENV === 'production',
    sourcemap: true
  }