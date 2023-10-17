import { GraphType } from '../../type';
import { rotateInCanvas } from '../../utils/canvas';
import { parseRGBAStr } from '../../utils/color';
import { ImgManager } from '../Img_manager';
import { TextureType } from '../texture';
import { Graph, GraphAttrs } from './graph';

export type BrushAttrs = GraphAttrs;

export class Brush extends Graph {
  constructor(options: BrushAttrs) {
    super({ ...options, type: GraphType.Brush });
  }
  getBBoxWithoutRotation() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }

  renderFillAndStrokeTexture(
    ctx: CanvasRenderingContext2D,
    imgManager: ImgManager,
    smooth: boolean,
    canvas: HTMLCanvasElement
  ) {
    if (this.rotation) {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;

      rotateInCanvas(ctx, this.rotation, cx, cy);
    }
    /* eslint-disable-next-line no-debugger */
    debugger
    ctx.beginPath();
    // const textY = Number(this.y)-2
    ctx.fillStyle = '#7F39FB';
    // ctx.fillText(this.objectName, this.x, textY);
    // ctx.rect(this.x, this.y, this.width, this.height);
    for (const texture of this.fill) {
      switch (texture.type) {
        case TextureType.Solid: {
          ctx.fillStyle = parseRGBAStr(texture.attrs);
          ctx.fill();
          break;
        }
        case TextureType.Image: {
          this.fillImage(ctx, texture, imgManager, smooth);
          break;
        }
        case TextureType.Pen: {
          this.fillbrush(ctx, texture, imgManager, smooth, canvas);
        }
      }
    }
    if (this.strokeWidth) {
      ctx.lineWidth = this.strokeWidth;
      /* eslint-disable-next-line no-debugger */
    debugger
      for (const texture of this.stroke) {
        switch (texture.type) {
          case TextureType.Solid: {
            ctx.strokeStyle = parseRGBAStr(texture.attrs);
            ctx.stroke();
            break;
          }
          case TextureType.Image: {
            // TODO: stroke image
            this.fillImage(ctx, texture, imgManager, smooth);
            break;
          }
          case TextureType.Pen: {
            // TODO: stroke image
            this.fillbrush(ctx, texture, imgManager, smooth, canvas);
          }
        }
      }
    }
    ctx.closePath();   
  }
}
