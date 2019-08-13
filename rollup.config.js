import babel from 'rollup-plugin-babel'
import uglify from 'rollup-plugin-uglify'

const config = {
  input: 'src/index.js',
  plugins: [babel({ exclude: 'node_modules/**' })],
  output: {
    name: 'robin',
    sourcemap: false,
    format: 'es'
  }
}

if (process.env.NODE_ENV === 'production') {
  config.output.file = 'dist/robin.min.js'
  config.plugins.push(uglify())
} else {
  config.output.file = 'dist/robin.js'
}

export default config
