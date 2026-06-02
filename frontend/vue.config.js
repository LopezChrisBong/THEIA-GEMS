const { defineConfig } = require('@vue/cli-service')
const path = require('path')

const nodeModules = path.resolve(__dirname, 'node_modules')

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      symlinks: false,
      modules: [nodeModules, 'node_modules'],
    },
    resolveLoader: {
      modules: [nodeModules, 'node_modules'],
    },
    ignoreWarnings: [
      /There are multiple modules with names that only differ in casing/,
    ],
  },
})
