import { Graph, GraphAttrs } from './graph';
import { Optional } from '../../type';
import { rotateInCanvas } from '../../utils/canvas';
import { GraphType } from '../../type';
import { TextureType } from '../texture';
import { parseRGBAStr } from '../../utils/color';
//画笔默认宽高
const DEFAULT_TEXT_WIDTH = 80;
const DEFAULT_TEXT_WEIGHT = 30;
export interface PenAttrs extends GraphAttrs {
  points: { x: number; y: number }[];  // Points for the pen path
  strokeWidth: number;
  penWidth: number;
}

export class PenGraph extends Graph {
  points: { x: number; y: number }[];
  strokeWidth: number;
  penWidth: number;
  constructor(options: Optional<PenAttrs, 'width' | 'height'>) {
    /* eslint-disable-next-line no-debugger */
    // debugger
    super({
      ...options,
      type: GraphType.Pen,
      width: options.width || DEFAULT_TEXT_WIDTH, // 画笔有宽高可以移动
      height: options.height || DEFAULT_TEXT_WEIGHT, // 画笔有宽高可以移动
    });
  
    this.points = options.points || [];
    this.strokeWidth = options.strokeWidth || 2;
    this.penWidth = options.penWidth || 1;
  }
  
  getAttrs() {
    return {
      ...super.getAttrs(),
      points: this.points,
      strokeWidth: this.strokeWidth,
    };
  }
  //绘制
  renderFillAndStrokeTexture(ctx: CanvasRenderingContext2D) {

    if (this.rotation) {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;
      // ctx.save();
      // ctx.translate(cx, cy);
      // ctx.rotate((this.rotation * Math.PI) / 180);
      // ctx.translate(-cx, -cy);
      rotateInCanvas(ctx, this.rotation, cx, cy);
    }

    const textY = Number(this.y) - 2
    ctx.fillStyle = '#7F39FB';
    ctx.fillText(this.objectName, this.x, textY);
    
    if (this.points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);

      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x, this.points[i].y);
      }
      ctx.lineWidth = this.penWidth;
      ctx.stroke();
    }

    if (this.rotation) {
      ctx.restore();
    }
    // ctx.closePath();

  }
}
