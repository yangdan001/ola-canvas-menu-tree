import { Editor } from '../editor';
import { ITool } from './type';
import { IBox, IPoint } from '../../type';
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
  constructor(private editor: Editor) {
    this.commandDesc = 'draw Path';
  }
  active() {
    this.editor.setCursor('crosshair');
  }
  inactive() {
    this.editor.setCursor('');
    // this.editor.penEditor.unbindEvent();
  }
  moveExcludeDrag() {
    // do nothing
  }

  start(e: PointerEvent) {
    // this.isDrawing = true;
    //画笔实现画的起点
    this.startPoint = this.editor.getCursorXY(e);
    this.prevPoint = this.startPoint;
    // this.editor.canvasElement.style.cursor = 'crosshair';
  }
  drag(e: PointerEvent) {
    // if (!this.isDrawing) return;
    //画笔实时画的move过程的所有点
    const currentPoint = this.editor.getCursorXY(e);
    //画笔实时画的功能实现
    this.editor.sceneGraph.drawLine(this.editor.ctx,this.prevPoint, currentPoint, this.brushSize);
    this.prevPoint = currentPoint;
  }
  
  end(e: PointerEvent) {
    // this.isDrawing = false;
    this.editor.ctx.lineWidth=1
    // const penEditorInstance = new PenEditor(this.editor);
    // penEditorInstance.visible(); // This will call the constructor and then the visible method

    this.editor.penEditor.visible();
    //画笔添加监听
    this.editor.penEditor._bindEvent();
    this.editor.penEditor.setPenWidth(this.brushSize);
    //拖动结束后工具栏图标还是选中的画笔图标
    this.editor.toolManager.setActiveTool('drawPen');
    // do nothing
  }
  afterEnd() {
    this.editor.canvasElement.style.cursor = 'crosshair';
  }
}
