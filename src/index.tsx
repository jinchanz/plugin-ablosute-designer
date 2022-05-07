import * as React from 'react';
import { PureComponent } from 'react';

import { config as engineConfig, common } from '@alilc/lowcode-engine'
import DragGhost from './drag-ghost';
import './index.scss';

const { designerCabin } = common;
const { DesignerView } = designerCabin;

export interface PluginProps {
}

export default class DesignerPlugin extends PureComponent<PluginProps> {
  static displayName: 'LowcodePluginDesigner';

  render(): React.ReactNode {
    console.log('custom designer');
    
    let deltaX;
    let deltaY;
    return (
      <DesignerView
        dragGhostComponent={DragGhost}
        className="lowcode-plugin-designer"
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
      />
    );
  }
}
