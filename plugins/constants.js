const COMMON_EXTERNALS = {
  react: 'var window.React',
  'react-dom': 'var window.ReactDOM',
  'prop-types': 'var window.PropTypes',
  'moment': 'var window.moment',
  '@alifd/next': 'var window.Next',
  '@alifd/meet': 'var window.Meet',
  '@ali/visualengine': 'var window.VisualEngine',
  '@ali/visualengine-utils': 'var window.VisualEngineUtils',
  '@ali/lowcode-engine': 'var window.AliLowCodeEngine',
  '@alilc/lowcode-engine': 'var window.AliLowCodeEngine',
  rax: 'var window.Rax',
  antd: 'var window.antd',
  '@ant-design/icons': 'var window.icons',
  '@alifd/lowcode-preset-plugin': 'var window.PluginLowcodeEditor',
  'monaco-editor/esm/vs/editor/editor.api': 'var window.monaco',
  'monaco-editor/esm/vs/editor/editor.main.js': 'var window.monaco',
};

module.exports = {
  COMMON_EXTERNALS
};