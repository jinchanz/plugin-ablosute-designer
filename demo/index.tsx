import init, { editor, project, material, plugins } from '@alifd/lowcode-preset-plugin';
import mergeWith from 'lodash/mergeWith';
import AbsoluteDesignerPlugin from '../src/index';

const queryObject = new URLSearchParams(window.location.search);
const platform = queryObject.get('platform') || '';
const isNewEngineVersion = !!material;
const baseLibrary = queryObject.get('baseLibrary') || 'react';
const basePackages = [
  {
    package: 'moment',
    version: '2.24.0',
    urls: ['https://g.alicdn.com/mylib/moment/2.24.0/min/moment.min.js'],
    library: 'moment',
  },
  {
    package: "lodash",
    library: "_",
    urls: [
      "https://g.alicdn.com/platform/c/lodash/4.6.1/lodash.min.js"
    ]
  },
  {
    title: 'fusion组件库',
    package: '@alifd/next',
    version: '1.25.23',
    urls: [
      'https://g.alicdn.com/code/lib/alifd__next/1.25.23/next.min.css',
      'https://g.alicdn.com/code/lib/alifd__next/1.25.23/next-with-locales.min.js',
    ],
    library: 'Next',
  },
  {
    package: 'antd',
    version: '4.17.3',
    urls: [
      'https://g.alicdn.com/code/lib/antd/4.17.3/antd.min.js',
      'https://g.alicdn.com/code/lib/antd/4.17.3/antd.min.css',
    ],
    library: 'antd',
  },
];

if (baseLibrary === 'rax') {
  basePackages.push({
    title: 'meet',
    package: '@alifd/meet',
    version: 'meet@2.4.2-beta.6',
    urls: [
      'https://mc-fusion.alibaba-inc.com/unpkg/@alifd/meet@2.4.2-beta.6/umd/meet.lowcode.js',
      'https://mc-fusion.alibaba-inc.com/unpkg/@alifd/meet@2.4.2-beta.6/umd/meet.min.css',
    ],
    library: 'Meet',
  });
}

const assets = {
  packages: []
};

const schema = getPageSchema() || {
  componentName: 'Page',
  id: 'node_dockcviv8fo1',
  props: {
    ref: 'outterView',
    style: {
      height: '100%',
    },
  },
  fileName: 'lowcode',
  dataSource: {
    list: [],
  },
  state: {
    text: 'outter',
    isShowDialog: false,
  },
  css: 'body {font-size: 12px;} .botton{width:100px;color:#ff00ff}',
  lifeCycles: {
    componentDidMount: {
      type: 'JSFunction',
      value: "function() {\n    console.log('did mount');\n  }",
    },
    componentWillUnmount: {
      type: 'JSFunction',
      value: "function() {\n    console.log('will umount');\n  }",
    },
  },
  methods: {
    testFunc: {
      type: 'JSFunction',
      value: "function() {\n    console.log('test func');\n  }",
    },
    onClick: {
      type: 'JSFunction',
      value: 'function() {\n    this.setState({\n      isShowDialog: true\n    })\n  }',
    },
    closeDialog: {
      type: 'JSFunction',
      value: 'function() {\n    this.setState({\n      isShowDialog: false\n    })\n  }',
    },
  },
  children: [],
};

const LCE_CONTAINER = document.getElementById('lce-container');

const initRegistry = (ctx) => {
  return {
    name: 'editor-init',
    async init() {
      const { skeleton } = ctx;
      console.log('register plugin in lowcode portal');
      skeleton.remove({
        area: 'mainArea',
        name: 'designer',
        type: 'Widget',
      });
      skeleton.add({
        area: 'mainArea',
        name: 'absolute-designer',
        type: 'Widget',
        content: AbsoluteDesignerPlugin,
      });
      
    },
  }
};

initRegistry.pluginName = 'initRegistry';
plugins.register(initRegistry)

init(() => {
  return {
    name: 'editor-init',
    async init() {
      const extraAssets = [];
      const builtinAssets = [ isNewEngineVersion ? 'https://alifd.alicdn.com/npm/@alilc/lowcode-materials@1.0.3/dist/assets.json' : 'https://unpkg.alibaba-inc.com/@ali/ali-lowcode-materials@1.2.6-beta.29/build/lowcode/assets-daily.json'];
      extraAssets && await handleExtraAssets(assets, extraAssets);
      builtinAssets && await handleExtraAssets(assets, builtinAssets);

      assets.packages = basePackages.concat(assets.packages);
      assets.packages = assets.packages.map(item => {
        if (item.editUrls && item.editUrls.length) {
          item.renderUrls = item.urls;
          item.urls = item.editUrls;
        }
        return item;
      })

      assets.components = assets.components.map(item => {
        if (platform && item.advancedUrls && item.advancedUrls[platform] && item.advancedUrls[platform].length) {
          delete item.urls;
          item.url = item.advancedUrls[platform][0];
        }
        return item;
      });
      if (baseLibrary && baseLibrary === 'rax') {
        editor.set('renderEnv', 'rax');
        project.onRendererReady(() => {
          editor.get('designer').currentDocument.simulator._iframe.onload = () => {
            editor.get('designer').currentDocument.simulator.set('device', 'phone');
          }
        });
      }

      if (isNewEngineVersion) {
        material.setAssets(assets);
        project.openDocument(schema);
      } else {
        editor.setAssets(assets);
        project.open(schema);
      }
    },
  }
}, [], LCE_CONTAINER, null);

function getPageSchema() {
  const schema = JSON.parse(
    window.localStorage.getItem('projectSchema') || '{}'
  );

  const pageSchema = schema?.componentsTree?.[0];
  return pageSchema;
};

async function handleExtraAssets(assets, extraAssets) {
  if (extraAssets && Array.isArray(extraAssets) && extraAssets.length) {
    const baseSchemas = await Promise.all(
      extraAssets.map(async (url) => {
        if (typeof url === 'object') {
          return url;
        } else {
          try {
            return (await fetch(url)).json();
          } catch (e) {
            console.error(`get assets data from builtin assets ${url} failed: `, e);
            return {};
          }
        }
      })
    );
    baseSchemas.forEach((item) => {
      const _assets = {
        ...item,
        packages: item.packages || [item.package],
        components: item.components,
        componentList: (item.componentList || []).map((comp) => {
          if (comp.children) {
            comp.children = comp.children.map((snippet) => {
              if (!snippet.sort) {
                snippet.sort = {
                  category: comp.title,
                  group: '原子组件',
                };
              }
              return snippet;
            });
          }
          return comp;
        }),
      };
      mergeWith(assets, _assets, (objValue, srcValue) => {
        if (Array.isArray(objValue) && Array.isArray(srcValue)) {
          return srcValue.concat(objValue);
        }
      });
    });
  }
}