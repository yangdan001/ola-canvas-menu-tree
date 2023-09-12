import { Brush } from '../scene/brush';
import { Editor } from '../editor';
import { DrawGraphTool } from './tool_draw_graph';
import { ITool } from './type';
import cloneDeep from 'lodash.clonedeep';
import { IBrush,IRect } from '../../type';
import { calcVectorRadian, normalizeRadian } from '../../utils/graphics';
import { transformRotate } from '../../utils/transform';
import { HALF_PI } from '../../constant';

export class DrawBrushTool extends DrawGraphTool implements ITool {
  static readonly type = 'drawBrush';
  readonly type = 'drawBrush';
  readonly hotkey = 'b';
  private path: Path2D;
  private isDrawing = false;

  constructor(editor: Editor) {
    super(editor);
    this.commandDesc = 'Draw with Brush';
    this.path = new Path2D();
  }

  protected createGraph(rect: IRect, noMove: boolean) {
    /* eslint-disable-next-line no-debugger */  
  // debugger
    // do not create line if no drag
    if (noMove) {
      return null;
    }
    const attrs = this.calcAttrs(rect);
    console.log(attrs,'attrs')
    return new Brush({
      ...attrs,
      height: 0,
      stroke: [cloneDeep(this.editor.setting.get('firstStroke'))],
      strokeWidth: this.editor.setting.get('strokeWidth'),
    });
    // 不需要创建图形
    return null;
  }

  protected adjustSizeWhenShiftPressing(rect: IRect) {
    /* eslint-disable-next-line no-debugger */  
  // debugger
    const radian = calcVectorRadian(
      rect.x,
      rect.y,
      rect.x + rect.width,
      rect.y + rect.height,
    );

    const { width, height } = rect;
    const remainder = radian % HALF_PI;
    if (remainder < Math.PI / 8 || remainder > (Math.PI * 3) / 8) {
      if (Math.abs(width) > Math.abs(height)) {
        rect.height = 0;
      } else {
        rect.width = 0;
      }
    } else {
      const min = Math.min(Math.abs(width), Math.abs(height));
      const max = Math.max(Math.abs(width), Math.abs(height));
      const size = min + (max - min) / 2;

      rect.height = (Math.sign(height) || 1) * size;
      rect.width = (Math.sign(width) || 1) * size;
    }
  }

  protected updateGraph(rect: IRect) {
    /* eslint-disable-next-line no-debugger */  
  debugger
    const attrs = this.calcAttrs(rect);
    Object.assign(this.drawingGraph!, attrs);
  }

  private calcAttrs({ x, y, width, height }: IRect) {
    const rotation = normalizeRadian(Math.atan2(height, width));
    const cx = x + width / 2;
    const cy = y + height / 2;
    const p = transformRotate(x, y, -rotation, cx, cy);
    width = Math.sqrt(width * width + height * height);
    return {
      x: p.x,
      y: p.y,
      width,
      rotation,
    };
  }

  protected onMouseDown(e: MouseEvent) {
    this.isDrawing = true;
    this.path.moveTo(e.clientX, e.clientY);
    this.editor.canvasElement.addEventListener('mousemove', this.onMouseMove);
    this.editor.canvasElement.addEventListener('mouseup', this.onMouseUp);
  }

  protected onMouseMove(e: MouseEvent) {
    if (this.isDrawing) {
      this.path.lineTo(e.clientX, e.clientY);
      this.editor.ctx.stroke(this.path);
    }
  }

  protected onMouseUp() {
    this.isDrawing = false;
    this.editor.canvasElement.removeEventListener('mousemove', this.onMouseMove);
    this.editor.canvasElement.removeEventListener('mouseup', this.onMouseUp);
  }

  protected onKeyDown(event: KeyboardEvent) {
    // 添加清除画布的功能，你可以根据需要来实现
    if (event.key === 'c') {
      this.clearCanvas();
    }
  }

  private clearCanvas() {
    this.editor.ctx.clearRect(0, 0, this.editor.canvasElement.width, this.editor.canvasElement.height);
  }

}
