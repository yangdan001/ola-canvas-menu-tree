export interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IBrush {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export type IBox = IRect;

export interface IBox2 {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface IBoxWithMid extends IBox2 {
  midX: number;
  midY: number;
}

export interface ICircle {
  x: number;
  y: number;
  radius: number;
}

/**
 * 数组长度必须大于等于 1 的数组
 */
export type INoEmptyArray<T> = [T, ...T[]];

export interface IPoint {
  x: number;
  y: number;
}

export interface IObject {
  id: string;
  name: string;
}

export enum GraphType {
  Graph = 'Graph',
  Rect = 'Rect',
  Ellipse = 'Ellipse',
  Text = 'Text',
  Line = 'Line',
  Brush = 'Brush',
}

export enum SelectType {
  Meta = 'Meta',
  Mask = 'Mask',
  Image = 'Image',
}

/**
 * set some optional property
 *
 * @example
 * type Foo = { a: string; b: number; c: boolean };
 * type FooWithOptionalB = Optional<Foo, 'b'>;
 * // { a: string; b?: number; c: boolean }
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface IEditorPaperData {
  appVersion: string;
  paperId: string;
  data: string;
}

export interface IVerticalLine {
  x: number;
  ys: number[];
}

export interface IHorizontalLine {
  y: number;
  xs: number[];
}

export interface IFormData {
  base_model_name: string,
  vae_model_name: string,
  positive_prompt: string,
  negative_prompt: string,
  number: number,
  num_inference_steps:string,
  cfg: string,
  scheduler_name: string,
  width: string,
  height: string,
  seed: string,
  denoise: string, //去噪强度 Denoising Strength
  widthHeight: string,
  isInpainting: boolean,
  Multidiffusion: boolean,
  controlnet: string,
  lora: string,
}