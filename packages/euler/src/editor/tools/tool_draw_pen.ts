import { Editor } from '../editor';
import { ITool } from './type';
import { IBox, IPoint } from '../../type';
import { PenEditor } from '../pen/pen_editor';
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
  }
  moveExcludeDrag() {
    // do nothing
  }

  start(e: PointerEvent) {
    // this.isDrawing = true;
    // this.startPoint = this.editor.getCursorXY(e);
    // this.prevPoint = this.startPoint;
    // this.editor.canvasElement.style.cursor = 'crosshair';
  }
  drag(e: PointerEvent) {
    // if (!this.isDrawing) return;

    // const currentPoint = this.editor.getCursorXY(e);
    // this.editor.sceneGraph.drawLine(this.editor.ctx,this.prevPoint, currentPoint, this.brushSize);
    // this.prevPoint = currentPoint;
  }
  
  end(e: PointerEvent) {
    // this.isDrawing = false;
    // this.editor.ctx.lineWidth=1
    // const penEditorInstance = new PenEditor(this.editor);
    // penEditorInstance.visible(); // This will call the constructor and then the visible method

    this.editor.penEditor.visible();
    // this.editor.penEditor.setPenWidth(1);
    this.editor.toolManager.setActiveTool('select');
    // do nothing
  }
  afterEnd() {
    this.editor.canvasElement.style.cursor = 'crosshair';
  }
}
