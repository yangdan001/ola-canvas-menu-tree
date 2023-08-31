import { Editor } from '../editor';
import {
  GraphType,
  IBox,
  IEditorPaperData,
  IObject,
  IPoint,
  IRect,
} from '../../type';
import { rotateInCanvas } from '../../utils/canvas';
import EventEmitter from '../../utils/event_emitter';
import {
  getRectCenterPoint,
  getRectsBBox,
  isPointInRect,
  isRectContain,
  isRectIntersect,
} from '../../utils/graphics';
import rafThrottle from '../../utils/raf_throttle';
import { transformRotate } from '../../utils/transform';
import { Ellipse } from './ellipse';
import { Graph, GraphAttrs } from './graph';
import { Rect } from './rect';
import { TransformHandle } from './transform_handle';
import { forEach } from '../../utils/array_util';
import Grid from '../grid';
import { getDevicePixelRatio } from '../../utils/common';
import { TextGraph } from './text';
import { HALF_PI } from '../../constant';
import { Line } from './line';
import { TextureType } from '../texture';
import { parseRGBAStr } from '../../utils/color';
interface Events {
  render(): void;
}

interface ElementWithLevel {
  element: Graph;
  level: number;
}
/**
 * 图形树
 */

export class SceneGraph {
  children: Graph[] = [];
  selection: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;
  // private handle: { rotation: IPoint } | null = null;
  private eventEmitter = new EventEmitter<Events>();
  transformHandle: TransformHandle;
  grid: Grid;
  showOutline = true;

  constructor(private editor: Editor) {
    this.transformHandle = new TransformHandle(editor);
    this.grid = new Grid(editor);
  }

  getAllElements(): ElementWithLevel[] {
    const result: ElementWithLevel[] = [];

    function traverse(elements: Graph[], currentLevel: number) {
        for (const element of elements) {
            result.push({ element, level: currentLevel });
            if (element.children && element.children.length > 0) {
                traverse(element.children, currentLevel + 1);
            }
        }
    }

    traverse(this.children, 0);
    return result;
}
addItems(elements: Graph[], parent?: Graph, idx?: number) {
  if (parent) {
    // 如果有指定父元素，将元素添加为父元素的子元素
    if (idx === undefined) {
      parent.children.push(...elements);
    } else {
      parent.children.splice(idx, 0, ...elements);
    }
    elements.forEach(element => {
      element.parent = parent;
    });
  } else {
    // 否则，将元素添加为顶层元素
    if (idx === undefined) {
      this.children.push(...elements);
    } else {
      this.children.splice(idx, 0, ...elements);
    }
  }
}
moveElement(element: Graph, parent?: Graph) {
  /* eslint-disable-next-line no-debugger */
  debugger
  // 1. 首先从当前位置移除元素
  this.removeElementFromItsParent(element);

  // 2. 然后将元素添加到新的位置
  if (parent) {
      if (!parent.children) {
          parent.children = [];
      }
      parent.children.push(element);
      element.parent = parent;  // 设置子元素的parent属性
  } else {
      this.children.push(element);
      element.parent = null;  // 如果没有父元素，设置子元素的parent属性为null
  }
}


private removeElementFromItsParent(element: Graph) {
  const removeFromList = (list: Graph[]) => {
      const index = list.indexOf(element);
      if (index !== -1) {
          list.splice(index, 1);
          return true;
      }
      return false;
  };

  if (!removeFromList(this.children)) {
      // 如果元素不在顶层元素列表中，我们需要递归查找它
      const searchInChildren = (elements: Graph[]): boolean => {
          for (const el of elements) {
              if (el.children && removeFromList(el.children)) {
                  return true;
              }
              if (el.children && searchInChildren(el.children)) {
                  return true;
              }
          }
          return false;
      };
      searchInChildren(this.children);
  }
}

removeItems(elements: Graph[]) {
  elements.forEach(element => {
    // 递归移除子元素
    if (element.children.length > 0) {
      this.removeItems(element.children);
    }

    // 从父元素的子元素列表中移除
    if (element.parent) {
      const idx = element.parent.children.indexOf(element);
      if (idx !== -1) {
        element.parent.children.splice(idx, 1);
      }
    } else {
      // 如果没有父元素，从顶层元素列表中移除
      const idx = this.children.indexOf(element);
      if (idx !== -1) {
        this.children.splice(idx, 1);
      }
    }
  });
}
  getElementById(id: string) {
    return this.children.find((item) => item.id === id);
  }
     
  render = rafThrottle(() => {
    console.log('zoule')
    // 获取视口区域
    const {
      viewportManager,
      canvasElement: canvas,
      ctx,
      setting,
    } = this.editor;
    const viewport = viewportManager.getViewport();
    const zoom = this.editor.zoomManager.getZoom();
    const viewportBoxInScene = this.editor.viewportManager.getBbox();
    /* eslint-disable-next-line no-debugger */
  debugger
    const visibleElements: Graph[] = [];
    // 1. 找出视口下所有元素
    this.findVisibleElements(this.children, viewportBoxInScene, visibleElements);
  
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  
    // 2. 清空画布，然后绘制所有可见元素
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    // 绘制背景色
    ctx.save();
    ctx.fillStyle = setting.get('canvasBgColor');
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  
    // 场景坐标转换为视口坐标
    const dpr = getDevicePixelRatio();
  
    const dx = -viewport.x;
    const dy = -viewport.y;
    ctx.scale(dpr * zoom, dpr * zoom);
    ctx.translate(dx, dy);
  
    for (const element of visibleElements) {
        this.renderElement(element, ctx, zoom);
    }
  
    /******************* 绘制辅助线层 ********************/
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  
    const selectedElementsBBox = this.editor.selectedElements.getBBox();
  
    // 1. draw pixel grid
    if (
      setting.get('enablePixelGrid') &&
      zoom >= this.editor.setting.get('minPixelGridZoom')
    ) {
      this.grid.draw();
    }
  
    // 2. draw selected elements bbox
    if (this.showOutline) {
      this.highLightSelectedBox(selectedElementsBBox);
    }
  
    // 3. draw selectionBox
    if (this.selection) {
      ctx.save();
      ctx.strokeStyle = setting.get('selectionStroke');
      ctx.fillStyle = setting.get('selectionFill');
      const { x, y, width, height } = this.selection;
  
      const { x: xInViewport, y: yInViewport } =
        this.editor.sceneCoordsToViewport(x, y);
  
      const widthInViewport = width * zoom;
      const heightInViewport = height * zoom;
  
      ctx.fillRect(xInViewport, yInViewport, widthInViewport, heightInViewport);
      ctx.strokeRect(
        xInViewport,
        yInViewport,
        widthInViewport,
        heightInViewport,
      );
      ctx.restore();
    }
  
    // 4. draw transform handle
    if (this.showOutline) {
      this.transformHandle.draw(selectedElementsBBox);
    }
  
    this.editor.refLine.drawRefLine(ctx);
  
    // 5. drawing rulers
    if (setting.get('enableRuler')) {
      this.editor.ruler.draw();
    }
  
    ctx.restore();
  
    this.eventEmitter.emit('render');
  });
  

findVisibleElements(elements: Graph[], viewportBoxInScene: IBox, visibleElements: Graph[]) {
  for (const element of elements) {
    if(!("getBBox" in element)){ continue}
      if ( isRectIntersect(element.getBBox(), viewportBoxInScene)) {
          visibleElements.push(element);
          if (element.children && element.children.length > 0) {
              this.findVisibleElements(element.children, viewportBoxInScene, visibleElements);
          }
      }
  }
}


renderFillAndStrokeTextureChild(element: Graph, ctx: CanvasRenderingContext2D, smooth: boolean) {
  if (element.rotation) {
    const cx = element.x + element.width / 2;
    const cy = element.y + element.height / 2;

    rotateInCanvas(ctx, element.rotation, cx, cy);
  }
  ctx.beginPath();
  const textY = Number(element.y)-2
  ctx.fillText(element.objectName, element.x, textY);
  ctx.rect(element.x, element.y, element.width, element.height);
  for (const texture of element.fill) {
    switch (texture.type) {
      case TextureType.Solid: {
        ctx.fillStyle = parseRGBAStr(texture.attrs);
        ctx.fill();
        break;
      }
      case TextureType.Image: {
        'fillImage' in element && element.fillImage(ctx, texture, smooth);
      }
    }
  }
  if (element.strokeWidth) {
    ctx.lineWidth = element.strokeWidth;
    for (const texture of element.stroke) {
      switch (texture.type) {
        case TextureType.Solid: {
          ctx.strokeStyle = parseRGBAStr(texture.attrs);
          ctx.stroke();
          break;
        }
        case TextureType.Image: {
          // TODO: stroke image
        }
      }
    }
  }
  ctx.closePath();   
}

renderElement(element: Graph, ctx: CanvasRenderingContext2D, zoom: number) {
  ctx.save();
  
  // // 如果元素有子元素，设置裁剪区域
  // if (element.children && element.children.length > 0 && ("getBBox" in element)) {

  //     const bbox = element.getBBox();
  //     ctx.beginPath();
  //     ctx.rect(bbox.x, bbox.y, bbox.width, bbox.height);
  //     ctx.clip();
  // }

  // 抗锯齿
  const smooth = zoom <= 1;

  if(element.children && element.children.length > 0){
    for (const el of element.children ) {
      this.renderElement(el, ctx, zoom);
  }
  }
    if(element.renderFillAndStrokeTexture){
      element.renderFillAndStrokeTexture(ctx, smooth);
    }else{
      // this.renderFillAndStrokeTextureChild(element,ctx, smooth)
    }
  ctx.restore();
  
}

  /**
   * 光标是否落在旋转控制点上
   */

  /**
   * 绘制每个元素的轮廓，以及包围它们的包围盒
   */
  private highLightSelectedBox(selectedElementsBBox: IBox | null) {
    /******* 绘制每个元素的包围盒（FIXME: 改为绘制轮廓） *******/
    if (selectedElementsBBox === null) {
      return;
    }
    const selectedElements = this.editor.selectedElements.getItems();

    const bBoxes = selectedElements.map((element) =>
      element.getBBoxWithoutRotation(),
    );

    const zoom = this.editor.zoomManager.getZoom();
    const ctx = this.editor.ctx;

    ctx.save();
    // TODO: 椭圆图形，要绘制圆形轮廓
    for (let i = 0, len = bBoxes.length; i < len; i++) {
      ctx.save();
      const bBox = bBoxes[i];
      ctx.strokeStyle = this.editor.setting.get('guideBBoxStroke');

      const currElement = selectedElements[i];
      if (currElement.rotation) {
        const [cx, cy] = getRectCenterPoint(bBox);
        const { x: cxInViewport, y: cyInViewport } =
          this.editor.sceneCoordsToViewport(cx, cy);
        rotateInCanvas(ctx, currElement.rotation, cxInViewport, cyInViewport);
      }
      const { x: xInViewport, y: yInViewport } =
        this.editor.sceneCoordsToViewport(bBox.x, bBox.y);
      ctx.strokeRect(
        xInViewport,
        yInViewport,
        bBox.width * zoom,
        bBox.height * zoom,
      );
      ctx.restore();
    }

    /********** 绘制多个图形组成的包围盒 *********/
    // 只有单个选中元素，不绘制选中盒

    // 多个选中元素时，才绘制选中盒
    if (selectedElements.length > 1) {
      ctx.strokeStyle = this.editor.setting.get('guideBBoxStroke');
      const { x: xInViewport, y: yInViewport } =
        this.editor.sceneCoordsToViewport(
          selectedElementsBBox.x,
          selectedElementsBBox.y,
        );
      ctx.strokeRect(
        xInViewport,
        yInViewport,
        selectedElementsBBox.width * zoom,
        selectedElementsBBox.height * zoom,
      );
    }
    ctx.restore();
  }
  
  /**
   * 点是否在选中框（selectedBox）中
   */
  isPointInSelectedBox(point: IPoint) {
    const selectedElements = this.editor.selectedElements.getItems();
    if (selectedElements.length === 0) {
      return false;
    }

    let bBoxes: IBox[];
    // 【单个元素被选中】求不考虑旋转的 bBox，将其和旋转后的角度比较
    if (selectedElements.length === 1) {
      bBoxes = selectedElements.map((element) =>
        element.getBBoxWithoutRotation(),
      );
      // 单个元素，要考虑旋转
      const element = selectedElements[0];
      const [cx, cy] = getRectCenterPoint(element);
      if (element.rotation) {
        point = transformRotate(point.x, point.y, -element.rotation, cx, cy);
      }
    }
    // 【多个元素被选中】
    else {
      bBoxes = selectedElements.map((element) => element.getBBox());
    }
    const composedBBox = getRectsBBox(...bBoxes);
    return isPointInRect(point, composedBBox);
  }
  getTopHitElement(x: number, y: number, excludeElement?: Graph): Graph | null {
    const allElementsWithLevel = this.getAllElements();
    allElementsWithLevel.sort((a, b) => {
        // 根据层级和z方向排序
        if (a.level !== b.level) {
          return b.level - a.level;  // 优先级高的元素在前
      }
      const zIndexA = a.element.zIndex ?? 0;
      const zIndexB = b.element.zIndex ?? 0;
      return zIndexB - zIndexA;  // z方向上在上的元素在前
        
    });

    for (const { element } of allElementsWithLevel) {
        if (excludeElement && element === excludeElement) {
            continue;  // 如果元素是要排除的元素，则跳过
        }
        if (("hitTest" in element ) && element.hitTest(x, y)) {
            return element;
        }
    }
    return null;
}
getPointElements(point: IPoint): Graph[] {
  const hitElements: Graph[] = [];

  const traverse = (elements: Graph[]) => {
      for (const element of elements) {
          if (element.hitTest(point.x, point.y)) {
              hitElements.push(element);
          }
          if (element.children && element.children.length > 0) {
              traverse(element.children);
          }
      }
  };

  traverse(this.children);
  return hitElements;
}

  setSelection(partialRect: Partial<IRect>) {
    this.selection = Object.assign({}, this.selection, partialRect);
  }
  getElementsInSelection() {
    const selection = this.selection;
    if (selection === null) {
      console.warn('selection 为 null，请确认在正确的时机调用当前方法');
      return [];
    }

    const selectionMode = this.editor.setting.get('selectionMode');
    const elements = this.children;
    const containedElements: Graph[] = [];
    // TODO: optimize, use r-tree to reduce time complexity
    for (const el of elements) {
      let isSelected = false;
      if (selectionMode === 'contain') {
        isSelected = isRectContain(selection, el.getBBox());
      } else {
        // intersect mode
        // if selection mode is invalid, rollback to intersect mode

        // AABB intersect
        if (!isRectIntersect(selection, el.getBBox())) {
          isSelected = false;
        } else {
          if (!el.rotation || el.rotation % HALF_PI == 0) {
            isSelected = true;
          } else {
            // OBB intersect
            // use SAT algorithm to check intersect
            const { x: cx, y: cy } = el.getCenter();
            const r = -el.rotation;
            const s1 = transformRotate(selection.x, selection.y, r, cx, cy);
            const s2 = transformRotate(
              selection.x + selection.width,
              selection.y + selection.height,
              r,
              cx,
              cy,
            );
            const s3 = transformRotate(
              selection.x + selection.width,
              selection.y,
              r,
              cx,
              cy,
            );
            const s4 = transformRotate(
              selection.x,
              selection.y + selection.height,
              r,
              cx,
              cy,
            );

            const rotatedSelectionX = Math.min(s1.x, s2.x, s3.x, s4.x);
            const rotatedSelectionY = Math.min(s1.y, s2.y, s3.y, s4.y);
            const rotatedSelectionWidth =
              Math.max(s1.x, s2.x, s3.x, s4.x) - rotatedSelectionX;
            const rotatedSelectionHeight =
              Math.max(s1.y, s2.y, s3.y, s4.y) - rotatedSelectionY;

            const rotatedSelection = {
              x: rotatedSelectionX,
              y: rotatedSelectionY,
              width: rotatedSelectionWidth,
              height: rotatedSelectionHeight,
            };

            isSelected = isRectIntersect(rotatedSelection, {
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
            });
          }
        }
      }
      if (isSelected) {
        containedElements.push(el);
      }
    }
    return containedElements;
  }
  
  /**
   * get simple info (for layer panel)
   */
  getObjects() {
    const children = this.children;
    const objects: IObject[] = [];
    forEach(children, (item) => {
      objects.push({ id: item.id, name: item.objectName });
    });
    return objects;
  }

  
  toJSON() {
    // 深度复制函数
    function deepCopy(obj: any, seen: any[] = []): any {
        if (!obj || typeof obj !== 'object') {
            return obj;
        }
        if (seen.includes(obj)) {
            return undefined;
        }
        seen.push(obj);
        
        if (Array.isArray(obj)) {
            return obj.map(item => deepCopy(item, seen));
        }
        
        const copy: any = {};
        for (const key in obj) {
            if (key !== 'parent') {
                copy[key] = deepCopy(obj[key], seen);
            }
        }
        return copy;
    }

    const paperData: IEditorPaperData = {
        appVersion: 'euler-editor_0.0.1',
        paperId: this.editor.paperId,
        data: JSON.stringify(deepCopy(this.children)),
    };
    return JSON.stringify(paperData);
}


  

  addGraphsByStr(str: string) {
    const ctorMap = {
      [GraphType.Graph]: Graph,
      [GraphType.Rect]: Rect,
      [GraphType.Ellipse]: Ellipse,
      [GraphType.Line]: Line,
      [GraphType.Text]: TextGraph,
    };

    const data: GraphAttrs[] = JSON.parse(str);
    const newChildren = data.map((attrs) => {
      const type = attrs.type;
      const Ctor = ctorMap[type!];

      if (!Ctor) {
        throw new Error('found wrong type of graph');
      }

      return new Ctor(attrs as any);
    });

    this.children.push(...newChildren);
    return newChildren;
  }

  load(str: string) {
    this.children = [];
    this.addGraphsByStr(str);
  }

  // TODO: update tree by patch obj and id
  updateElements() {
    /**
     * {
     *   update: { id: '123', attrs: { width: 1 }  }
     *   removed: new Set(['8', '9'])
     *   create: { type: rect, }
     * }
     */
  }

  on(eventName: 'render', handler: () => void) {
    this.eventEmitter.on(eventName, handler);
  }
  off(eventName: 'render', handler: () => void) {
    this.eventEmitter.off(eventName, handler);
  }
}
