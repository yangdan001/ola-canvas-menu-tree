import { SetElementsAttrs } from '../commands/set_elements_attrs';
import { Editor } from '../editor';
import { IBox, IBox2, GraphType, IPoint } from '../../type';
import { calcCoverScale, genId, objectNameGenerator } from '../../utils/common';
import {
  getAbsoluteCoords,
  getElementRotatedXY,
  getRectCenterPoint,
  isPointInRect,
} from '../../utils/graphics';
import { transformRotate } from '../../utils/transform';
import { DEFAULT_IMAGE, ITexture, TextureCanvas, TextureImage } from '../texture';
import { ImgManager } from '../Img_manager';

export interface GraphAttrs {
  type?: GraphType;
  id?: string;
  objectName?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  // 颜色
  fill?: ITexture[];
  stroke?: ITexture[];
  strokeWidth?: number;
  visible?: boolean;
  disabled?: boolean;
  // transform 相关
  rotation?: number;
  children?: Graph[];
  parent?: Graph | null;
  zIndex?: number;
  brushPath?: Path2D | null
}

export class Graph {
  type = GraphType.Graph;
  id: string;
  objectName: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children: Graph[] = [];
  parent: Graph | null = null;
  // color
  fill: ITexture[] = [];
  stroke: ITexture[] = [];
  strokeWidth?: number;
  visible?: boolean = true; 
  disabled?: boolean = false; 
  // transform
  rotation?: number = 0;
  zIndex?: number;
  brushPath: Path2D | null = null; // 添加这一行来存储画笔路径
  constructor(options: GraphAttrs) {
    this.type = options.type ?? this.type;
    this.id = options.id ?? genId();
    if (options.objectName) {
      this.objectName = options.objectName;
      objectNameGenerator.setMaxIdx(options.objectName);
    } else {
      this.objectName = objectNameGenerator.gen(options.type ?? this.type);
    }
    this.children = options.children ?? this.children;
    this.parent = options.parent ?? this.parent;
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;

    if (options.fill) {
      this.fill = options.fill;
    }
    if (options.stroke) {
      this.stroke = options.stroke;
    }
    if (options.strokeWidth) {
      this.strokeWidth = options.strokeWidth;
    }
    this.rotation = options.rotation ?? 0;
    this.zIndex = options.zIndex ?? 0;
    if (options.brushPath) {
      this.brushPath = options.brushPath;
    }
  }
  getAttrs(): GraphAttrs {
    return {
      children: this.children,
      parent: this.parent,
      type: this.type,
      id: this.id,
      objectName: this.objectName,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      fill: this.fill,
      stroke: this.stroke,
      strokeWidth: this.strokeWidth,
      rotation: this.rotation,
      zIndex: this.zIndex,
      brushPath: this.brushPath
    };
  }
  setAttrs(attrs: Partial<GraphAttrs>) {
    const dx = attrs.x !== undefined ? attrs.x - this.x : 0;
    const dy = attrs.y !== undefined ? attrs.y - this.y : 0;
    const dRotation = attrs.rotation !== undefined ? attrs.rotation - (this.rotation || 0) : 0;

    for (const key in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, key)) {
            const attrKey = key as keyof GraphAttrs;
            (this as any)[attrKey] = attrs[attrKey];
        }
    }

    // 如果位置或旋转发生了变化，应用这些变化到所有子元素上
    // if (dx !== 0 || dy !== 0 || dRotation !== 0) {
    //     this.applyTransformToChildren(dx, dy, dRotation);
    // }
}
move(dx: number, dy: number) {
  this.x += dx;
  this.y += dy;
  for (const child of this.children) {
    if('move' in child){
      child.move(dx, dy);
    }
  }
}
rotate(dRotation: number) {
  this.rotation = (this.rotation || 0) + dRotation;
  for (const child of this.children) {
      child.rotate(dRotation);
  }
}

getAllDescendants(): Graph[] {
  let descendants: Graph[] = [];
  for (const child of this.children) {
      descendants.push(child);
      if('getAllDescendants' in child ){
        descendants = descendants.concat(child.getAllDescendants());
      }
  }
  return descendants;
}

private applyTransformToChildren(dx: number, dy: number, dRotation: number) {
    for (const child of this.children) {
        child.x += dx;
        child.y += dy;
        if (child.rotation) {
            child.rotation += dRotation;
        } else {
            child.rotation = dRotation;
        }
        child.applyTransformToChildren(dx, dy, dRotation);  // 递归地应用到子元素的子元素
    }
}

  /**
   * 计算包围盒（不考虑 strokeWidth）
   * 考虑旋转
   */
  getBBox(): IBox {
    const [x, y, x2, y2, cx, cy] = getAbsoluteCoords(this);
    const rotation = this.rotation;
    if (!rotation) {
      return this.getBBoxWithoutRotation();
    }

    const { x: nwX, y: nwY } = transformRotate(x, y, rotation, cx, cy); // 左上
    const { x: neX, y: neY } = transformRotate(x2, y, rotation, cx, cy); // 右上
    const { x: seX, y: seY } = transformRotate(x2, y2, rotation, cx, cy); // 右下
    const { x: swX, y: swY } = transformRotate(x, y2, rotation, cx, cy); // 右下

    const minX = Math.min(nwX, neX, seX, swX);
    const minY = Math.min(nwY, neY, seY, swY);
    const maxX = Math.max(nwX, neX, seX, swX);
    const maxY = Math.max(nwY, neY, seY, swY);
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
  /**
   * AABB (axis-aligned bounding box)
   */
  getBBox2(): IBox2 {
    const [x, y, x2, y2, cx, cy] = getAbsoluteCoords(this);
    const rotation = this.rotation;
    if (!rotation) {
      const box = this.getBBoxWithoutRotation();
      return {
        minX: box.x,
        minY: box.y,
        maxX: box.x + box.width,
        maxY: box.y + box.height,
      };
    }

    const { x: tlX, y: tlY } = transformRotate(x, y, rotation, cx, cy); // 左上
    const { x: trX, y: trY } = transformRotate(x2, y, rotation, cx, cy); // 右上
    const { x: brX, y: brY } = transformRotate(x2, y2, rotation, cx, cy); // 右下
    const { x: blX, y: blY } = transformRotate(x, y2, rotation, cx, cy); // 右下

    const minX = Math.min(tlX, trX, brX, blX);
    const minY = Math.min(tlY, trY, brY, blY);
    const maxX = Math.max(tlX, trX, brX, blX);
    const maxY = Math.max(tlY, trY, brY, blY);
    return {
      minX,
      minY,
      maxX,
      maxY,
    };
  }
  getBboxVerts(): [IPoint, IPoint, IPoint, IPoint] {
    const [x, y, x2, y2, cx, cy] = getAbsoluteCoords(this);

    const rotation = this.rotation;
    if (!rotation) {
      return [
        { x: x, y: y },
        { x: x2, y: y },
        { x: x2, y: y2 },
        { x: x, y: y2 },
      ];
    }

    const nw = transformRotate(x, y, rotation, cx, cy); // 左上
    const ne = transformRotate(x2, y, rotation, cx, cy); // 右上
    const se = transformRotate(x2, y2, rotation, cx, cy); // 右下
    const sw = transformRotate(x, y2, rotation, cx, cy); // 右下

    return [nw, ne, se, sw];
  }
  getBBoxWithoutRotation() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
  getCenter() {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  }
  setRotateXY(rotatedX: number, rotatedY: number) {
    const { x: cx, y: cy } = this.getCenter();
    const { x, y } = transformRotate(
      rotatedX,
      rotatedY,
      -(this.rotation || 0),
      cx,
      cy,
    );
    this.x = x;
    this.y = y;
  }
  hitTest(x: number, y: number, padding = 0) {
    const bBox = this.getBBoxWithoutRotation();
    const [cx, cy] = getRectCenterPoint(bBox);
    const rotatedHitPoint = this.rotation
      ? transformRotate(x, y, -this.rotation, cx, cy)
      : { x, y };

    return isPointInRect(rotatedHitPoint, bBox, padding);
  }
  setRotatedX(rotatedX: number) {
    const { x: prevRotatedX } = getElementRotatedXY(this);
    this.x = this.x + rotatedX - prevRotatedX;
  }
  setRotatedY(rotatedY: number) {
    const { y: prevRotatedY } = getElementRotatedXY(this);
    this.y = this.y + rotatedY - prevRotatedY;
  }
  resizeAndKeepRotatedXY({
    width,
    height,
  }: {
    width?: number;
    height?: number;
  }) {
    const { x: preRotatedX, y: preRotatedY } = getElementRotatedXY(this);
    if (width) {
      this.width = width;
    }
    if (height) {
      this.height = height;
    }
    const { x: rotatedX, y: rotatedY } = getElementRotatedXY(this);
    const dx = rotatedX - preRotatedX;
    const dy = rotatedY - preRotatedY;
    this.x -= dx;
    this.y -= dy;
  }
  renderFillAndStrokeTexture(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ctx: CanvasRenderingContext2D,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    imgManager: ImgManager,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    smooth: boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    canvas: HTMLCanvasElement
  ) {
    // 如果正在绘制画笔路径，则绘制它
    if (this.brushPath) {
      ctx.stroke(this.brushPath);
    }
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  strokeTexture(ctx: CanvasRenderingContext2D) {
    throw new Error('Method not implemented.');
  }

  protected fillImage(
    ctx: CanvasRenderingContext2D,
    texture: TextureImage,
    imgManager: ImgManager,
    smooth: boolean,
  ) {
    const src = texture.attrs.src;
    const width = this.width;
    const height = this.height;
    let img: CanvasImageSource | undefined = undefined;

    // anti-aliasing
    ctx.imageSmoothingEnabled = smooth;

    if (src) {
      imgManager.addImg(src);
      img = imgManager.getImg(src);
      // TODO: rerender when image loaded, but notice endless loop
    } else {
      ctx.imageSmoothingEnabled = false;
      img = DEFAULT_IMAGE;
    }
    if (!img) {
      return;
    }
    // reference: https://mp.weixin.qq.com/s/TSpZv_0VJtxPTCCzEqDl8Q
    const scale = calcCoverScale(img.width, img.height, width, height);

    const sx = img.width / 2 - width / scale / 2;
    const sy = img.height / 2 - height / scale / 2;

    ctx.drawImage(
      img,
      sx,
      sy,
      width / scale,
      height / scale,
      this.x,
      this.y,
      width,
      height,
    );
  }

  protected fillbrush(
    ctx: CanvasRenderingContext2D,
    texture: TextureCanvas,
    imgManager: ImgManager,
    smooth: boolean,
    canvas:HTMLCanvasElement,
  ) {
    /* eslint-disable-next-line no-debugger */
    debugger
    // ctx.beginPath();
    // ctx.moveTo(startPoint.x, startPoint.y);
    // ctx.lineTo(endPoint.x, endPoint.y);
    // ctx.lineWidth = brushSize * 2; // Brush size affects line thickness
    // ctx.lineCap = 'round'; // Rounded line ends for a brush effect
    // ctx.strokeStyle = 'black'; // Set brush color (you can customize this)
    // ctx.stroke();
    // ctx.closePath();
    // // 1. 获取选中的Canvas元素和上下文
    // const brushPath = texture.attrs.brushPath;
    // const width = this.width;
    // const height = this.height;

    // // 2. 定义画笔属性
    // if (texture.attrs.strokeStyle !== undefined) {
    //   ctx.strokeStyle = texture.attrs.strokeStyle;
    // } else {
    //   ctx.strokeStyle = 'black'; 
    // }
    // if (texture.attrs.lineWidth !== undefined) {
    //   ctx.lineWidth = texture.attrs.lineWidth;
    // } else {
    //   ctx.lineWidth = 2; 
    // }
    // if (texture.attrs.lineJoin !== undefined) {
    //   ctx.lineJoin = texture.attrs.lineJoin as CanvasLineJoin;
    // } else {
    //   ctx.lineJoin = 'round'; 
    // }

    // ctx.beginPath();
    // ctx.moveTo(startPoint.x, startPoint.y);
    // ctx.lineTo(endPoint.x, endPoint.y);
    // ctx.lineWidth = texture.attrs.lineWidth; // Brush size affects line thickness
    // ctx.lineCap = 'round'; // Rounded line ends for a brush effect
    // ctx.strokeStyle = 'black'; // Set brush color (you can customize this)
    // ctx.stroke();
    // ctx.closePath();

    // ctx.strokeStyle = texture.attrs.strokeStyle; // 画笔颜色
    // ctx.lineWidth = texture.attrs.lineWidth; // 画笔线宽
    // ctx.lineJoin = texture.attrs.lineJoin; // 连接线的样式，可选值有'round', 'bevel', 'miter'

    // // 标志是否正在绘制
    // let isDrawing = false;

    // // 存储上一个点的坐标
    // let lastX = 0;
    // let lastY = 0;

    // // 添加鼠标事件监听器
    // canvas.addEventListener('mousedown', (e) => {
    //   isDrawing = true;
    //   [lastX, lastY] = [e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop];
    // });

    // canvas.addEventListener('mousemove', draw);

    // canvas.addEventListener('mouseup', () => isDrawing = false);
    // canvas.addEventListener('mouseout', () => isDrawing = false);

    // // 3. 绘制函数
    // function draw(e:any) {
    //   if (!isDrawing) return;

    //   ctx.beginPath();
    //   ctx.moveTo(lastX, lastY);

    //   const currentX = e.clientX - canvas.offsetLeft;
    //   const currentY = e.clientY - canvas.offsetTop;

    //   ctx.lineTo(currentX, currentY);
    //   ctx.stroke();

    //   [lastX, lastY] = [currentX, currentY];
    // }
  }

  addChild(child: Graph) {
    this.children.push(child);
    child.parent = this;
  }
  
  removeChild(child: Graph) {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
    }
  }
  

  static dMove(graphs: Graph[], dx: number, dy: number) {
    for (const graph of graphs) {
      graph.x += dx;
      graph.y += dy;
    }
  }
}

/**
 * 修改元素并保存到历史记录
 */
function getAllElementsWithChildren(element: Graph): Graph[] {
  let elements = [element];
  for (const child of element.children) {
      elements = elements.concat(getAllElementsWithChildren(child));
  }
  return elements;
}

export const MutateElementsAndRecord = {
  setRotateX(editor: Editor, elements: Graph[], rotatedX: number) {
      if (elements.length === 0) {
          return;
      }

      const allAffectedElements = elements.flatMap(el => getAllElementsWithChildren(el));
      const prevStates = allAffectedElements.map(el => ({ x: el.x }));

      for (const element of elements) {
          element.setRotatedX(rotatedX);
      }

      const newStates = allAffectedElements.map(el => ({ x: el.x }));

      editor.commandManager.pushCommand(
          new SetElementsAttrs(
              'Update X of Elements',
              allAffectedElements,
              newStates,
              prevStates,
          ),
      );
  },

  setRotateY(editor: Editor, elements: Graph[], rotatedY: number) {
      if (elements.length === 0) {
          return;
      }

      const allAffectedElements = elements.flatMap(el => getAllElementsWithChildren(el));
      const prevStates = allAffectedElements.map(el => ({ y: el.y }));

      for (const element of elements) {
          element.setRotatedY(rotatedY);
      }

      const newStates = allAffectedElements.map(el => ({ y: el.y }));

      editor.commandManager.pushCommand(
          new SetElementsAttrs(
              'Update Y of Elements',
              allAffectedElements,
              newStates,
              prevStates,
          ),
      );
  },

  setWidth(editor: Editor, elements: Graph[], width: number) {
      if (elements.length === 0) {
          return;
      }

      const allAffectedElements = elements.flatMap(el => getAllElementsWithChildren(el));
      const prevStates = allAffectedElements.map(el => ({ x: el.x, y: el.y, width: el.width }));

      for (const element of elements) {
          element.resizeAndKeepRotatedXY({ width });
      }

      const newStates = allAffectedElements.map(el => ({ x: el.x, y: el.y, width: el.width }));

      editor.commandManager.pushCommand(
          new SetElementsAttrs(
              'Update Width of Elements',
              allAffectedElements,
              newStates,
              prevStates,
          ),
      );
  },

  setHeight(editor: Editor, elements: Graph[], height: number) {
      if (elements.length === 0) {
          return;
      }

      const allAffectedElements = elements.flatMap(el => getAllElementsWithChildren(el));
      const prevStates = allAffectedElements.map(el => ({ x: el.x, y: el.y, height: el.height }));

      for (const element of elements) {
          element.resizeAndKeepRotatedXY({ height });
      }

      const newStates = allAffectedElements.map(el => ({ x: el.x, y: el.y, height: el.height }));

      editor.commandManager.pushCommand(
          new SetElementsAttrs(
              'Update Height of Elements',
              allAffectedElements,
              newStates,
              prevStates,
          ),
      );
  },

  setRotation(editor: Editor, elements: Graph[], rotation: number) {
      if (elements.length === 0) {
          return;
      }

      const allAffectedElements = elements.flatMap(el => getAllElementsWithChildren(el));
      const prevStates = allAffectedElements.map(el => ({ rotation: el.rotation || 0 }));

      for (const element of elements) {
          element.rotation = rotation;
      }

      const newStates = allAffectedElements.map(el => ({ rotation: el.rotation || 0 }));

      editor.commandManager.pushCommand(
          new SetElementsAttrs(
              'Update Rotation of Elements',
              allAffectedElements,
              newStates,
              prevStates,
          ),
      );
  },
  
//   startDrawingBrush(ctx: CanvasRenderingContext2D, x: number, y: number) {
//     // 创建新的 Path2D 对象来存储画笔路径
//     this.brushPath = new Path2D();
//     this.brushPath.moveTo(x, y);
  
//     // 设置画笔属性，例如颜色和宽度
//     ctx.strokeStyle = this.brushColor;  // 设置画笔颜色
//     ctx.lineWidth = this.brushWidth;    // 设置画笔宽度
//     ctx.lineJoin = 'round';             // 设置线条连接方式为圆角
  
//     // 开始绘制画笔路径
//     ctx.beginPath();
//     // 添加鼠标移动事件监听器，用于实时更新路径
//   document.addEventListener('mousemove', this.handleMouseMove);
//   },
  
//   stopDrawingBrush() {
//     // 停止绘制画笔路径
//     this.brushPath = null;
//   },

//   // 处理鼠标按下事件，开始绘制画笔路径
// handleMouseDown(event: MouseEvent) {
//   if (this.brushPath) {
//     return;
//   }

//   const x = event.clientX - this.canvas.getBoundingClientRect().left;
//   const y = event.clientY - this.canvas.getBoundingClientRect().top;

//   this.startDrawingBrush(this.ctx, x, y);
// },

// // 处理鼠标移动事件，绘制画笔路径
// handleMouseMove(event: MouseEvent) {
//   if (!this.brushPath) {
//     return;
//   }

//   const x = event.clientX - this.canvas.getBoundingClientRect().left;
//   const y = event.clientY - this.canvas.getBoundingClientRect().top;

//   // 绘制画笔路径
//   this.ctx.lineTo(x, y);
//   this.ctx.stroke();
// },

// // 处理鼠标释放事件，停止绘制画笔路径
// handleMouseUp(event: MouseEvent) {
//   if (!this.brushPath) {
//     return;
//   }

//   this.stopDrawingBrush();
// }

  
};

