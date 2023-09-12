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
  // private canvas: HTMLCanvasElement;
  // private context: CanvasRenderingContext2D;
  private isDrawing = false;
  private lineWidth = 2;
  private strokeColor = '#000000';
  private prevX = 0;
  private prevY = 0;
  constructor(options: BrushAttrs) {
    super({ ...options, type: GraphType.Brush });
    this.height = 0;
  }

  private startDrawing(e: MouseEvent,ctx: CanvasRenderingContext2D,canvas: HTMLCanvasElement) {
    this.isDrawing = true;
    this.prevX = e.clientX - canvas.getBoundingClientRect().left;
    this.prevY = e.clientY - canvas.getBoundingClientRect().top;
  }

  private draw(e: MouseEvent,ctx: CanvasRenderingContext2D,canvas: HTMLCanvasElement) {
    if (!this.isDrawing) return;
    const x = e.clientX - canvas.getBoundingClientRect().left;
    const y = e.clientY - canvas.getBoundingClientRect().top;

    ctx.beginPath();
    ctx.strokeStyle = this.strokeColor;
    if (this.strokeWidth) {
    ctx.lineWidth = this.strokeWidth;
    }else{
    ctx.lineWidth = this.lineWidth;
    }
    ctx.moveTo(this.prevX, this.prevY);
    ctx.lineTo(x, y);
    ctx.stroke();
    this.prevX = x;
    this.prevY = y;
  }

  private stopDrawing(e: MouseEvent,ctx: CanvasRenderingContext2D,canvas: HTMLCanvasElement) {
    this.isDrawing = false;
    // canvas.removeEventListener('mousemove', (event) => {
    //   this.draw(event, ctx, canvas);
    // });
    // canvas.removeEventListener('mouseup', (event) => {
    //   this.stopDrawing(event, ctx, canvas);
    // });
    // canvas.removeEventListener('mouseout', (event) => {
    //   this.stopDrawing(event, ctx, canvas);
    // });
  }
  renderFillAndStrokeTexture(
    ctx: CanvasRenderingContext2D,
    imgManager: ImgManager,
    smooth: boolean,
    canvas: HTMLCanvasElement) {
      const { x, y, width, rotation } = this;
      if (rotation) {
        const { x: cx, y: cy } = this.getCenter();
  
        rotateInCanvas(ctx, rotation, cx, cy);
      }

    canvas.addEventListener('mousedown', (event) => {
      this.startDrawing(event, ctx, canvas);
    });
    canvas.addEventListener('mousemove', (event) => {
      this.draw(event, ctx, canvas);
    });
    canvas.addEventListener('mouseup', (event) => {
      this.stopDrawing(event, ctx, canvas);
    });
    canvas.addEventListener('mouseout', (event) => {
      this.stopDrawing(event, ctx, canvas);
    });
  

    
    // const textY = Number(y)-2
    // ctx.fillStyle = '#7F39FB';
    // ctx.strokeStyle = 'black';
    // ctx.lineWidth = 2;
    // ctx.lineJoin = 'round';
    // ctx.lineCap = 'round';
    // ctx.fillText(this.objectName, x, textY);
    // // 标记是否正在绘制
    // // let isDrawing = false;
    // ctx.beginPath();
    // ctx.moveTo(x, y);
    // ctx.lineTo(x + width, y);
    // if (this.strokeWidth) {
    //   ctx.lineWidth = this.strokeWidth;
    //   for (const texture of this.stroke) {
    //     switch (texture.type) {
    //       case TextureType.Solid: {
    //         ctx.strokeStyle = parseRGBAStr(texture.attrs);
    //         ctx.stroke();
    //         break;
    //       }
    //       case TextureType.Image: {
    //         // TODO: stroke image
    //       }
    //     }
    //   }

    //   ctx.closePath();
    // }
  }
}
