import { IPoint } from '../../../type';
import { getRectByTwoCoord } from '../../../utils/graphics';
import { Editor } from '../../editor';
import { IBaseTool } from '../type';

/**
 * 绘制选区
 */
export class DrawSelectionBox implements IBaseTool {
  private lastPoint: IPoint = { x: -1, y: -1 };
  private isShiftPressingWhenStart = false;//是否按下了 Shift 键

  constructor(private editor: Editor) {}
  active() {
    // do nothing
  }
  inactive() {
    // do nothing
  }
  start(e: PointerEvent) {
    /* eslint-disable-next-line no-debugger */
    // debugger
    this.isShiftPressingWhenStart = false;
    //判断画布事件管理器是否按下了 Shift 键
    if (this.editor.hostEventManager.isShiftPressing) {
      this.isShiftPressingWhenStart = true;
    } else {
      //清空画布的选中元素
      this.editor.selectedElements.clear();
    }
    //获取手势光标坐标
    const pos = this.editor.getCursorXY(e);
    //视口坐标 转 场景坐标
    this.lastPoint = this.editor.viewportCoordsToScene(pos.x, pos.y);
    //刷新画布
    this.editor.sceneGraph.render();
    // 设置选区
    this.editor.sceneGraph.setSelection(this.lastPoint);
  }
  drag(e: PointerEvent) {
    /* eslint-disable-next-line no-debugger */
    // debugger
    //获取场景中 手势光标坐标
    const point = this.editor.getSceneCursorXY(e);
    //根据两个坐标点确定一个矩形
    const box = getRectByTwoCoord(this.lastPoint, point);
    //设置选中元素
    this.editor.sceneGraph.setSelection(box);
    //刷新画布数据
    this.editor.sceneGraph.render();
  }
  end() {
    /* eslint-disable-next-line no-debugger */
    // debugger
    //获取画布的选中元素
    const elements = this.editor.sceneGraph.getElementsInSelection();

    if (this.isShiftPressingWhenStart) {
      /**
       * “追加” 多个元素
       * 如果已选中元素中存在追加元素，将其从已选中元素中取出，否则添加进去
      */
      this.editor.selectedElements.toggleItems(elements);
    } else {
      //设置选中元素
      this.editor.selectedElements.setItems(elements);
    }
  }
  afterEnd() {
    /* eslint-disable-next-line no-debugger */
    // debugger
    this.isShiftPressingWhenStart = false;
    this.editor.sceneGraph.selection = null;
    this.editor.sceneGraph.render();
  }
}
