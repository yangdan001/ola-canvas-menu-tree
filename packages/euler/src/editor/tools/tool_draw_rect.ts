import { Rect } from '../scene/rect';
import { Editor } from '../editor';
import { DrawGraphTool } from './tool_draw_graph';
import { ITool } from './type';
import cloneDeep from 'lodash.clonedeep';
import { IRect } from '../../type';
import { normalizeRect } from '../../utils/graphics';
//此类继承自DrawGraphTool  其他方法都在DrawGraphTool类中实现 （类比于画笔类）
export class DrawRectTool extends DrawGraphTool implements ITool {
  static readonly type = 'drawRect';
  readonly type = 'drawRect';
  readonly hotkey = 'r';

  constructor(editor: Editor) {
    super(editor);
    this.commandDesc = 'Add Rect';
  }

  protected createGraph(rect: IRect) {
    rect = normalizeRect(rect);
    return new Rect({
      ...rect,
      fill: [cloneDeep(this.editor.setting.get('firstFill'))],
    });
  }
}
