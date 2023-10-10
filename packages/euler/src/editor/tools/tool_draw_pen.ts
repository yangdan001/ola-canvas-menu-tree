import { Editor } from '../editor';
import { ITool } from './type';
import { IBox, IPoint } from '../../type';
import { PenGraph } from '../scene/pen';
import cloneDeep from 'lodash.clonedeep';


import { AddShapeCommand } from '../commands/add_shape';

export class DrawPenTool implements ITool {
  static readonly type = 'drawPen';
  readonly type = 'drawPen';
  readonly hotkey = 'p';
  private isDrawing = false;
  private startPoint: IPoint = { x: -1, y: -1 };
  private prevPoint: IPoint = { x: -1, y: -1 };
  private brushSize = 5; // Set your desired brush size here
  private prevViewport!: IBox;
  private commandDesc: string;
  private penPoints: { x: number; y: number }[];

  constructor(private editor: Editor) {
    this.commandDesc = 'draw Path';
    this.penPoints = [];

  }
  //清空canvas上的鼠标手势样式
  inactive() {
    this.editor.setCursor('');
  }
  //设置canvas上的鼠标手势样式
  active() {
    this.editor.setCursor('crosshair');
  }

  moveExcludeDrag() {
    
    // do nothing
  }

  start(e: PointerEvent) {
    //开始时 清空数组
    this.penPoints = []
    //画笔实现画的起点
    // this.startPoint = this.editor.sceneCoordsToViewport(e.clientX, e.clientY);         
    this.startPoint = this.editor.getSceneCursorXY(e);         
    this.prevPoint = this.startPoint;
    this.penPoints.push({ x: this.startPoint.x, y: this.startPoint.y });

  }
  // tool_manager.ts中 调用此drag方法
  drag(e: PointerEvent) {
    //画笔实时画的move过程的所有点
    // const currentPoint = this.editor.sceneCoordsToViewport(e.clientX, e.clientY);
    const currentPoint = this.editor.getSceneCursorXY(e);
    // 实时画 功能实现
    this.editor.sceneGraph.drawLine(this.editor.ctx,this.prevPoint, currentPoint, this.brushSize);
    this.prevPoint = currentPoint;
    //将点存进数组
    this.penPoints.push({ x: currentPoint.x, y: currentPoint.y });

  }
  //鼠标抬起 ool_manager.ts中 调用此drag方法
  end(e: PointerEvent) {
    this.editor.ctx.lineWidth=1
    this.visible();

    this.createPenGraph()
    // //画笔添加监听
    //拖动结束后工具栏图标还是选中的画笔图标
    this.editor.toolManager.setActiveTool('drawPen');
    // this.editor.canvasElement.style.cursor = 'crosshair';
  }
  afterEnd() {
    console.log('');
    
  }
  //点的存储与动作结束后的线条绘制
  createPenGraph() {
    if (this.penPoints.length === 0 || this.penPoints.length === 1 ) return;
    const firstPoint = this.penPoints[0];
    if (!this.editor.canvasElement) return;
    const pen = new PenGraph({
      penWidth: 5,
      points: this.penPoints,
      x: firstPoint.x,
      y: firstPoint.y,
      fill: cloneDeep(this.editor.setting.get('textFill')),
      strokeWidth: cloneDeep(this.editor.setting.get('strokeWidth')),
    });
    this.editor.sceneGraph.addItems([pen]);

    this.editor.selectedElements.setItems([pen]);
    this.editor.sceneGraph.render();

    this.editor.commandManager.pushCommand(
      new AddShapeCommand('draw pen', this.editor, [pen]),
    );
   
  }
  visible() {
    const zoom = this.editor.zoomManager.getZoom();
    const fontSize = this.editor.setting.get('defaultFontSize') * zoom + 'px';
    const styles = {
      // left: x + 'px',
      // top: y + 'px',
      // height: fontSize,
      // fontSize,
      display: 'block',
    } as const;
    Object.assign(this.editor.canvasElement.style, styles);
    this.editor.canvasElement.style.display = 'block';
  }
}
