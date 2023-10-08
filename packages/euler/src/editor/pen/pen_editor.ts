import cloneDeep from 'lodash.clonedeep';
import { Editor } from '../editor';
import { PenGraph } from '../scene/pen';
import { AddShapeCommand } from '../commands/add_shape';
import { IBox, IPoint } from '../../type';


export class PenEditor {
  drawing: boolean;
  lastX: number;
  lastY: number;
  penColor: string;
  penWidth: number;
  penPoints: { x: number; y: number }[];
  private startPoint: IPoint = { x: -1, y: -1 };
  private prevPoint: IPoint = { x: -1, y: -1 };
  private mouseStoppedTimer: NodeJS.Timeout | null;
  constructor(private editor: Editor) {
    /* eslint-disable-next-line no-debugger */
    // debugger
    
    this.drawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.penPoints = [];
    this.penColor = '#fff'; // Default pen color  black
    this.penWidth = 5; // Default pen width
    this.bindEvents();
    this.mouseStoppedTimer = null;
  }
  /**
   * 
   * 绑定监听方法---初始化时执行
  */
  private bindEvents() {
    console.log('绑定监听方法---初始化时执行');
    const canvas = this.editor.canvasElement;
    const ctx = this.editor.ctx;
    canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    canvas.addEventListener('mousemove', this.moveDraw.bind(this));
    canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    // this.canvas.addEventListener('mouseleave', this.endDrawing.bind(this));
  }
  
  /**
   * 监听mousedown
  */
  private startDrawing(e: MouseEvent) {
    console.log('监听mousedown-startDrawing')
    this.drawing = true;
    //获取起点坐标（视口 转 场景坐标）
    this.startPoint = this.editor.getSceneCursorXY(e);
    this.penPoints.push({ x: this.startPoint.x, y: this.startPoint.y });

  }
  /**
   * 监听mousemove
  */
  private moveDraw(e: MouseEvent) {
    if (!this.drawing) return;
    console.log('监听mousemove - moveDraw')
    //获取起点坐标（视口 转 场景坐标）
    const currentPoint = this.editor.getSceneCursorXY(e);
    this.penPoints.push({ x: currentPoint.x, y: currentPoint.y });
    
  }

  /**
   * 监听mouseup
  */
  private stopDrawing(e: MouseEvent) {
    console.log('监听mouseup - stopDrawing')
    this.drawing = false;
    if (this.penPoints.length > 0) {
      // Create a pen graph using the stored points
      this.createPenGraph();
    }
  }
  /**
   * 监听mouseleave
  */
  private endDrawing() {
    console.log('监听mouseleave - endDrawing',this.penPoints)
    this.drawing = false;
    if (this.penPoints.length > 0) {
      this.createPenGraph();
    }
  }
  
  private createPenGraph() {
    if (this.penPoints.length === 0) return;
    // Use the first point as the x and y coordinate
    const firstPoint = this.penPoints[0];
    /* eslint-disable-next-line no-debugger */
    // debugger

    const canvas = this.editor.canvasElement;
    const ctx = this.editor.ctx;
    if (!canvas) return;
    const pen = new PenGraph({
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
    this.penPoints = [];
  }
  visible() {
    const zoom = this.editor.zoomManager.getZoom();
    const canvas = this.editor.canvasElement;
    const ctx = this.editor.ctx;

    const fontSize = this.editor.setting.get('defaultFontSize') * zoom + 'px';
    const styles = {
      // left: x + 'px',
      // top: y + 'px',
      // height: fontSize,
      // fontSize,
      display: 'block',
    } as const;
    Object.assign(canvas.style, styles);
    canvas.style.display = 'block';
  }

 

 

  

  setPenColor(color: string) {
    this.penColor = color;
  }

  setPenWidth(width: number) {
    this.penWidth = width;
  }

 
}

