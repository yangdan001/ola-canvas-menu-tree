import cloneDeep from 'lodash.clonedeep';
import { noop } from '../../utils/common';
import { Editor } from '../editor';
import { PenGraph } from '../scene/pen';
import { AddShapeCommand } from '../commands/add_shape';
import { IBox, IPoint } from '../../type';


export class PenEditor {
  penCanvas:HTMLCanvasElement
  drawing: boolean;
  lastX: number;
  lastY: number;
  penColor: string;
  penWidth: number;
  penPoints: { x: number; y: number }[];
  private startPoint: IPoint = { x: -1, y: -1 };
  private prevPoint: IPoint = { x: -1, y: -1 };
  private mouseStoppedTimer: NodeJS.Timeout | null;
  _unbindEvent: () => void;
  _bindEvent: () => void;
  constructor(private editor: Editor) {
    /* eslint-disable-next-line no-debugger */
    // debugger
    this.penCanvas = this.editor.canvasElement;
    this.drawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.penPoints = [];
    this.penColor = '#fff'; // Default pen color  black
    this.penWidth = 5; // Default pen width
    // this.bindEvents();
    //画笔卸载监听
    this._unbindEvent = this.bindEvent();
    //画笔添加监听
    this._bindEvent = this.bindEvent;

    this.mouseStoppedTimer = null;
  }
  /**
   * 
   * 绑定监听方法---初始化时执行
  */
  // private bindEvents() {
  //   console.log('绑定监听方法---初始化时执行');
  //   console.log(this.editor,'this.editor')
  //   // const canvas = this.editor.canvasElement;
  //   // const ctx = this.editor.ctx;
  //   this.penCanvas.addEventListener('mousedown', this.startDrawing.bind(this));
  //   this.penCanvas.addEventListener('mousemove', this.moveDraw.bind(this));
  //   this.penCanvas.addEventListener('mouseup', this.stopDrawing.bind(this));
  //   // this.canvas.addEventListener('mouseleave', this.endDrawing.bind(this));
  // }

  //监听画笔功能事件 封装类实现监听卸载同一个方法
  private bindEvent() {

    const startDrawing = (e: MouseEvent) => {
      console.log(this.editor,'this.editor')
      console.log('监听mousedown-startDrawing')
      this.drawing = true;
      //获取起点坐标（视口 转 场景坐标）
      this.startPoint = this.editor.getSceneCursorXY(e);
      this.penPoints.push({ x: this.startPoint.x, y: this.startPoint.y });
    };

    const moveDraw = (e: MouseEvent) => {
      if (!this.drawing) return;
      console.log('监听mousemove - moveDraw')
      //获取起点坐标（视口 转 场景坐标）
      const currentPoint = this.editor.getSceneCursorXY(e);
      this.penPoints.push({ x: currentPoint.x, y: currentPoint.y });
    };
    const stopDrawing = (e: MouseEvent) => {
      console.log('监听mouseup - stopDrawing')
      if (this.penPoints.length > 0) {
        // Create a pen graph using the stored points
        this.createPenGraph();
      }
      this.drawing = false;
    };


    // 获取画布监听move事件
    const canvas = this.editor.canvasElement;
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', moveDraw);
    canvas.addEventListener('mouseup', stopDrawing);
    //卸载监听
    return function unbindEvent() {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', moveDraw);
      canvas.removeEventListener('mouseup', stopDrawing);
    };
  }
  unbindEvent() {
    //添加监听
    this._unbindEvent();
    //卸载监听
    this._unbindEvent = noop;
  }
  
  /**
   * 监听mousedown
  */
  // private startDrawing(e: MouseEvent) {
  //   console.log('监听mousedown-startDrawing')
  //   this.drawing = true;
  //   //获取起点坐标（视口 转 场景坐标）
  //   this.startPoint = this.editor.getSceneCursorXY(e);
  //   this.penPoints.push({ x: this.startPoint.x, y: this.startPoint.y });

  // }
  /**
   * 监听mousemove
  */
  // private moveDraw(e: MouseEvent) {
  //   if (!this.drawing) return;
  //   console.log('监听mousemove - moveDraw')
  //   //获取起点坐标（视口 转 场景坐标）
  //   const currentPoint = this.editor.getSceneCursorXY(e);
  //   this.penPoints.push({ x: currentPoint.x, y: currentPoint.y });
    
  // }

  /**
   * 监听mouseup
  */
  // private stopDrawing(e: MouseEvent) {
  //   console.log('监听mouseup - stopDrawing')
  //   if (this.penPoints.length > 0) {
  //     // Create a pen graph using the stored points
  //     this.createPenGraph();
  //   }
  //   this.drawing = false;
  // }
  
  private createPenGraph() {
    if (this.penPoints.length === 0) return;
    // Use the first point as the x and y coordinate
    const firstPoint = this.penPoints[0];
    /* eslint-disable-next-line no-debugger */
    debugger

    // const canvas = this.editor.canvasElement;
    // const ctx = this.editor.ctx;
    console.log(this.penCanvas,'this.penCanvas')
    if (!this.penCanvas) return;
    const pen = new PenGraph({
      penWidth: this.penWidth,
      points: this.penPoints,
      x: firstPoint.x,
      y: firstPoint.y,
      fill: cloneDeep(this.editor.setting.get('textFill')),
      strokeWidth: this.editor.setting.get('strokeWidth'),
    });
    this.editor.sceneGraph.addItems([pen]);

    this.editor.selectedElements.setItems([pen]);
    this.editor.sceneGraph.render();

    this.editor.commandManager.pushCommand(
      new AddShapeCommand('draw pen', this.editor, [pen]),
    );
    //画笔存数据后卸载监听
    this.unbindEvent();
  }
  visible() {
    const zoom = this.editor.zoomManager.getZoom();
    // const canvas = this.editor.canvasElement;
    // const ctx = this.editor.ctx;

    const fontSize = this.editor.setting.get('defaultFontSize') * zoom + 'px';
    const styles = {
      // left: x + 'px',
      // top: y + 'px',
      // height: fontSize,
      // fontSize,
      display: 'block',
    } as const;
    Object.assign(this.penCanvas.style, styles);
    this.penCanvas.style.display = 'block';
  }

  setPenColor(color: string) {
    this.penColor = color;
  }

  setPenWidth(width: number) {
    this.penWidth = width;
  }

  destroy() {
    console.log('7777')
    // const canvas = this.editor.canvasElement;
    // const ctx = this.editor.ctx;
    // this.penCanvas.remove();
    this.unbindEvent();
  }
 
}

