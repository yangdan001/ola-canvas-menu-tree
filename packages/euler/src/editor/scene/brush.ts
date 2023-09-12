import { GraphType } from '../../type';
import { rotateInCanvas } from '../../utils/canvas';
import { parseRGBAStr } from '../../utils/color';
import { TextureType } from '../texture';
import { ImgManager } from '../Img_manager';
import { Graph, GraphAttrs } from './graph';
import { Editor } from '../editor';
export type BrushAttrs = GraphAttrs;

/**
 * x
 * y
 * width
 * 没有 height（面板上不可编辑，并显示为 0）
 *
 */

export class Brush extends Graph {
  private path: Path2D;
  private isDrawing = false;
  private strokeColor = '#000000';

  constructor(options: BrushAttrs) {
    super({ ...options, type: GraphType.Brush });
    this.path = new Path2D();
  }

  onMouseDown(x: number, y: number) {
    this.isDrawing = true;
    this.path.moveTo(x, y);
  }

  onMouseMove(x: number, y: number) {
    if (this.isDrawing) {
      this.path.lineTo(x, y);
    }
  }

  onMouseUp() {
    this.isDrawing = false;
    this.path = new Path2D();
  }

  setStrokeColor(color: string) {
    this.strokeColor = color; // 设置画笔颜色
  }

  renderFillAndStrokeTexture(
    ctx: CanvasRenderingContext2D,
    imgManager: ImgManager,
    smooth: boolean,
    canvas: HTMLCanvasElement) {
      if (this.isDrawing) {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除整个 Canvas
      ctx.strokeStyle = this.strokeColor || '#000000';
      ctx.lineWidth = this.strokeWidth || 2;
      ctx.stroke(this.path);
    }
  
  }
}
