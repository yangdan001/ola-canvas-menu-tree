// import { Brush } from '../scene/brush';
// import { Editor } from '../editor';
import { DrawGraphTool } from './tool_draw_graph';
// import { ITool } from './type';
// import cloneDeep from 'lodash.clonedeep';
// import { IRect } from '../../type';
// import { normalizeRect } from '../../utils/graphics';

// export class DrawBrushTool extends DrawGraphTool implements ITool {
//   static readonly type = 'drawBrush';
//   readonly type = 'drawBrush';
//   readonly hotkey = 'b';

//   constructor(editor: Editor) {
//     super(editor);
//     this.commandDesc = 'draw Path';
//   }

//   protected createGraph(rect: IRect) {
//     rect = normalizeRect(rect);
//     return new Brush({
//       ...rect,
//       fill: [cloneDeep(this.editor.setting.get('drawPathFill'))],
//     });
//   }
// }



import { IBox, IPoint } from '../../type';
import { Editor } from '../editor';
import { ITool } from './type';

/**
 * drag canvas
 */
export class DrawBrushTool implements ITool  {
  static type = 'drawBrush';
  readonly type = 'drawBrush';
  readonly hotkey = 'b';
  private isDrawing = false;
  private startPoint: IPoint = { x: -1, y: -1 };
  private prevPoint: IPoint = { x: -1, y: -1 };
  private brushSize = 5; // Set your desired brush size here
  private prevViewport!: IBox;
  private commandDesc: string;
  constructor(private editor: Editor) {
    // super(editor);
    this.commandDesc = 'draw Path';
  }
  active() {
    this.editor.setCursor('crosshair'); //crosshair：十字准线
  }
  inactive() {
    this.editor.setCursor('');
  }
  moveExcludeDrag() {
    // do nothing;
  }
  start(e: PointerEvent) {
    // this.editor.canvasElement.style.cursor = 'grabbing';
    // this.startPoint = this.editor.getCursorXY(e);
    // this.prevViewport = this.editor.viewportManager.getViewport();
    this.isDrawing = true;
    this.startPoint = this.editor.getCursorXY(e);
    this.prevPoint = this.startPoint;
    this.editor.canvasElement.style.cursor = 'crosshair';//crosshair：十字准线
  }
  drag(e: PointerEvent) {
    if (!this.isDrawing) return;

    const currentPoint = this.editor.getCursorXY(e);
console.log(this.editor.sceneGraph,'999')
    // Draw a line segment between the previous point and the current point
    this.editor.sceneGraph.drawLine(this.editor.ctx,this.prevPoint, currentPoint, this.brushSize);

    // Update the previous point to the current point
    this.prevPoint = currentPoint;
  }
  
  end() {
    this.isDrawing = false;
    this.editor.ctx.lineWidth=1
    this.editor.toolManager.setActiveTool('select');
    console.log(222)
    // do nothing
  }
  afterEnd() {
    this.editor.canvasElement.style.cursor = 'crosshair';//crosshair：十字准线
  }
}

