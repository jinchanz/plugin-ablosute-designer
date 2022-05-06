import * as React from 'react';
import { PureComponent } from 'react';

import { config as engineConfig, common } from '@alilc/lowcode-engine'
import { Asset } from '@alilc/lowcode-utils';
import DragGhost from './drag-ghost';
import './index.scss';

const { designerCabin, editorCabin } = common;
const { globalContext } = editorCabin;
const { DesignerView, Designer } = designerCabin;

export interface PluginProps {
}

interface DesignerPluginState {
  componentMetadatas?: any[] | null;
  library?: any[] | null;
  extraEnvironment?: any[] | null;
  renderEnv?: string;
  device?: string;
  locale?: string;
  designMode?: string;
  deviceClassName?: string;
  simulatorUrl: Asset | null;
  // @TODO 类型定义
  requestHandlersMap: any;
}

export default class DesignerPlugin extends PureComponent<PluginProps, DesignerPluginState> {
  static displayName: 'LowcodePluginDesigner';

  state: DesignerPluginState = {
    componentMetadatas: null,
    library: null,
    extraEnvironment: null,
    renderEnv: 'default',
    device: 'default',
    locale: '',
    designMode: 'live',
    deviceClassName: '',
    simulatorUrl: null,
    requestHandlersMap: null,
  };

  private _mounted = true;

  constructor(props: any) {
    super(props);
    this.setupAssets();
  }

  private async setupAssets() {
    try {
      const editor = globalContext.get('editor');
      const assets = await editor.onceGot('assets');
      const renderEnv = engineConfig.get('renderEnv') || editor.get('renderEnv');
      const device = engineConfig.get('device') || editor.get('device');
      const locale = engineConfig.get('locale') || editor.get('locale');
      const designMode = engineConfig.get('designMode') || editor.get('designMode');
      const deviceClassName = engineConfig.get('deviceClassName') || editor.get('deviceClassName');
      const simulatorUrl = engineConfig.get('simulatorUrl') || editor.get('simulatorUrl');
      // @TODO setupAssets 里设置 requestHandlersMap 不太合适
      const requestHandlersMap = engineConfig.get('requestHandlersMap') || editor.get('requestHandlersMap');
      if (!this._mounted) {
        return;
      }
      const { components, packages, extraEnvironment, utils } = assets;
      const state = {
        componentMetadatas: components || [],
        library: packages || [],
        utilsMetadata: utils || [],
        extraEnvironment,
        renderEnv,
        device,
        designMode,
        deviceClassName,
        simulatorUrl,
        requestHandlersMap,
        locale,
      };
      this.setState(state);
    } catch (e) {
      console.log(e);
    }
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  private handleDesignerMount = (designer: Designer): void => {
    const editor = globalContext.get('editor');
    editor.set('designer', designer);
    editor.emit('designer.ready', designer);
    editor.onGot('schema', (schema) => {
      designer.project.open(schema);
    });
  };

  render(): React.ReactNode {
    console.log('custom designer');
    const editor = globalContext.get('editor');
    const {
      componentMetadatas,
      utilsMetadata,
      library,
      extraEnvironment,
      renderEnv,
      device,
      designMode,
      deviceClassName,
      simulatorUrl,
      requestHandlersMap,
      locale,
    } = this.state;

    if (!library || !componentMetadatas) {
      // TODO: use a Loading
      return null;
    }
    let deltaX;
    let deltaY;
    return (
      <DesignerView
        dragGhostComponent={DragGhost}
        onMount={this.handleDesignerMount}
        className="lowcode-plugin-designer"
        editor={editor}
        designer={editor.get('designer')}
        onDragstart={(e) => {
          const { dragObject } = e;
          const node = dragObject?.nodes?.[0];
          if (!node) return;
          const domNode: HTMLElement = node.getDOMNode();
          const domRect: DOMRect = domNode.getBoundingClientRect();
          deltaX = e.canvasX - domRect.left;
          deltaY = e.canvasY - domRect.top;
        }}
        onDrag={(e) => {
          const { dragObject } = e;
          const node = dragObject?.nodes?.[0];
          if (!node) return;
          const domNode: HTMLElement = node.getDOMNode();
          domNode.style.position = 'fixed';
          domNode.style.left = `${e.canvasX - deltaX}px`;
          domNode.style.top = `${e.canvasY - deltaY}px`;
          domNode.style.transition = 'none';

          const rects = engineConfig.get('rects');
          if (!rects) return;
          const yLines = [];
          for (let key of rects.keys()) {
            if (key === node.id) {
              continue;
            }
            const item = rects.get(key);
            yLines.push(...[item.left[0], item.right[0]]);
          }
          const x = e.canvasX - deltaX;
          let res = -1;
          yLines.sort((a, b) => {
            return b - a;
          }).forEach(line => {
            if (line > x) return;
            if (res === -1) {
              res = line;
            }
          });
          if (x - res <= 8) {
            domNode.style.left = `${res}px`;
            domNode.dataset.closeX = `${x - res}`;
          } else {
            delete domNode.dataset.closeX;
          }
          console.log('res: ', res);
        }}
        onDragend={(e, loc) => {
          const { dragObject } = e;
          const node = dragObject?.nodes?.[0];
          if (!node) return;

          const domNode: HTMLElement = node.getDOMNode();
          const domRect: DOMRect = domNode.getBoundingClientRect();
          const closeX = domNode.dataset.closeX;
          let left = loc?.event.canvasX - deltaX;
          if (+closeX) {
            left = left - (+closeX);
            delete domNode.dataset.closeX;
          }
          node.setPropValue('style', {
            position: 'fixed',
            left,
            top: loc?.event.canvasY - deltaY,
          });


          const x = domRect.left;
          const y = domRect.top;
          const width = domRect.width;
          const height = domRect.height;

          const rect = {
            left: [x, x, y, y + height],
            right: [x + width, x + width, y, y + height],
            top: [x, x + width, y, y],
            bottom: [x, x + width, y + height, y + height],
          };
          const rects = engineConfig.get('rects') || new Map();
          rects.set(node.id, rect);
          if (!engineConfig.get('rects')) {
            engineConfig.set('rects', rects);
          }
        }}
        componentMetadatas={componentMetadatas}
        simulatorProps={{
          library,
          utilsMetadata,
          extraEnvironment,
          renderEnv,
          device,
          locale,
          designMode,
          deviceClassName,
          simulatorUrl,
          requestHandlersMap,
        }}
      />
    );
  }
}
