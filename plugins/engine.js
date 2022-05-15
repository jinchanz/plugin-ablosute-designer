/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { externals } = require('../build.json');

module.exports = function (options, pluginOptions = {}) {

  const { commandArgs } = options.context;
  const { https } = commandArgs;
  const { engineScope = '@ali' } = pluginOptions || {};

  options.onGetWebpackConfig((config) => {
    config.module // fixes https://github.com/graphql/graphql-js/issues/1272
      .rule('mjs$')
      .test(/\.mjs$/)
      .include
        .add(/node_modules/)
        .end()
      .type('javascript/auto');
    config.merge({
      node: {
        fs: 'empty',
      },
    });

    const entry = {
      lowcode: require.resolve('../demo/index.tsx'),
      preview: require.resolve('../demo/preview.tsx'),
    };
    config.merge({
      entry,
    });
    config.plugin('index').use(HtmlWebpackPlugin, [
      {
        inject: false,
        template: require.resolve('../public/index.html'),
        filename: 'index.html',
      },
    ]);
    config.plugin('preview').use(HtmlWebpackPlugin, [
      {
        inject: false,
        templateParameters: {
          previewCssUrl: '',
        },
        template: require.resolve('../public/preview.html'),
        filename: 'preview.html',
      },
    ]);
    config.devServer.headers({ 'Access-Control-Allow-Origin': '*' });

    config.devServer.https(Boolean(https));
    config.devServer.set('transportMode', 'ws');
    config.externals(externals);

  });

}
