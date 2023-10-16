import { GraphType } from '../../type';
import { rotateInCanvas } from '../../utils/canvas';
import { parseRGBAStr } from '../../utils/color';
import { ImgManager } from '../Img_manager';
import { TextureType } from '../texture';
import { Graph, GraphAttrs } from './graph';
//画笔默认宽高
// const DEFAULT_TEXT_WIDTH = 80;
// const DEFAULT_TEXT_WEIGHT = 30;
// export interface PenAttrs extends GraphAttrs {
//   points: { x: number; y: number }[];  // Points for the pen path
//   strokeWidth: number;
//   brushSize: number;
// }

export type RectAttrs = GraphAttrs;

export class Rect extends Graph {
  // points: { x: number; y: number }[];
  // brushSize: number;
  constructor(options: RectAttrs) {
    super({
      ...options,
      type: GraphType.Rect,
      // width: options.width || DEFAULT_TEXT_WIDTH, // 画笔有宽高可以移动
      // height: options.height || DEFAULT_TEXT_WEIGHT, // 画笔有宽高可以移动
    });
    console.log('...Rectoptions', options);
    // this.points = options.points || [];
    // this.brushSize = options.brushSize || 1;
  }
  
  // 获取没有旋转时候的坐标及宽高
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
    // 如果有旋转
    if (this.rotation) {
      // 中心点
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;

      rotateInCanvas(ctx, this.rotation, cx, cy);
    }

    ctx.beginPath();
    const textY = Number(this.y) - 2
    ctx.fillStyle = '#7F39FB';
    ctx.fillText(this.objectName, this.x, textY);
    //绘制矩形
    ctx.rect(this.x, this.y, this.width, this.height);
      //绘制内部填充颜色
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
      //   case TextureType.Pen: {
      //     if (this.points.length > 0) {
      //       ctx.moveTo(this.points[0].x, this.points[0].y);
      
      //       for (let i = 1; i < this.points.length; i++) {
      //         ctx.lineTo(this.points[i].x, this.points[i].y);
      //       }
      //       ctx.lineWidth = this.brushSize;
      //       ctx.stroke();
      //     }
      
      //     if (this.rotation) {
      //       ctx.restore();
      //     }
      // }
    }
    if (this.strokeWidth) {
      ctx.lineWidth = this.strokeWidth;
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
        //   case TextureType.Pen: {
        //     if (this.points.length > 0) {
        //       ctx.moveTo(this.points[0].x, this.points[0].y);
        
        //       for (let i = 1; i < this.points.length; i++) {
        //         ctx.lineTo(this.points[i].x, this.points[i].y);
        //       }
        //       ctx.lineWidth = this.brushSize;
        //       ctx.stroke();
        //     }
        
        //     if (this.rotation) {
        //       ctx.restore();
        //     }
        // }
      }
    }
  }
    ctx.closePath();   
  }
}
  }
