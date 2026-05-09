const { defineConfig } = require('@vue/cli-service')
const path = require('path')
const fs = require('fs')

// Resolve the real casing of the project path to prevent webpack casing warnings
const appDirectory = fs.realpathSync(process.cwd())
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath)

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      symlinks: false,
      modules: [resolveApp('node_modules'), 'node_modules'],
    },
    resolveLoader: {
      modules: [resolveApp('node_modules'), 'node_modules'],
    },
  },
})
