const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
module.exports = {
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = '碧蓝航线大建计算器'
      return args
    })
    config.optimization.splitChunks({
      cacheGroups: {
        common: {
          name: 'chunk-app',
          chunks: 'initial',
          minChunks: 2,
          maxInitialRequests: 5,
          minSize: 0,
          priority: 1,
          reuseExistingChunk: true,
        },
        vendors: {
          name: 'chunk-vendors',
          test: /[\\/]node_modules[\\/]/,
          chunks: 'initial',
          priority: 2,
          reuseExistingChunk: true,
          enforce: true,
        },
      },
    })
  },
  configureWebpack: {
    optimization: {
      minimizer: [
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            safe: true,
            discardComments: {
              removeAll: true,
            },
          },
        }),
      ],
    },
  },
}
