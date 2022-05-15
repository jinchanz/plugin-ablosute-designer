import ReactDOM from 'react-dom';
import React, { useState } from 'react';
import { Loading } from '@alifd/next';
import Renderer from '@alilc/lowcode-react-renderer';

import { buildComponents, assetBundle, AssetLevel, AssetLoader } from '@alilc/lowcode-utils';

const queryObject = new URLSearchParams(window.location.search);
const platform = queryObject.get('platform') || 'default';

const LowcodePreview = () => {
  const [data, setData] = useState({});

  async function init() {
    const packages = JSON.parse(window.localStorage.getItem('packages'));
    const projectSchema = JSON.parse(window.localStorage.getItem('projectSchema'));
    const { componentsMap: componentsMapArray, componentsTree } = projectSchema;
    const componentsMap = {};
    componentsMapArray.forEach((component) => {
      componentsMap[component.componentName] = component;
    });
    const schema = componentsTree[0];

    const libraryMap = {};
    const libraryAsset = [];
    packages.forEach(({ package: _package, library, urls, renderUrls, advancedUrls }) => {
      libraryMap[_package] = library;
      if (advancedUrls && advancedUrls[platform]) {
        libraryAsset.push(advancedUrls[platform]);
      } else if (renderUrls) {
        libraryAsset.push(renderUrls);
      } else if (urls) {
        libraryAsset.push(urls);
      }
    });

    const vendors = [assetBundle(libraryAsset, AssetLevel.Library)];

    // TODO asset may cause pollution
    const assetLoader = new AssetLoader();
    try{
      await assetLoader.load(vendors);
    } catch (e) {
      console.warn('[LowcodePreview] load resources failed: ', e);
    }
    const components = buildComponents(libraryMap, componentsMap);

    setData({
      schema,
      components,
    });
  }

  const { schema, components } = data;

  if (!schema || !components) {
    init();
    return <Loading fullScreen />;
  }

  return (
    <div>
      <Renderer
        schema={schema}
        components={components}
      />
    </div>
  );
};

ReactDOM.render(<LowcodePreview />, document.getElementById('container'));
