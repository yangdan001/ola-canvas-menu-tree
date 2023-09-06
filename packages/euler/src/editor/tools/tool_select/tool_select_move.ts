import { IPoint } from '../../../type';
import { noop } from '../../../utils/common';
import { MoveElementsCommand } from '../../commands/move_elements';
import { Editor } from '../../editor';
import { Graph } from '../../scene/graph';
import { IBaseTool } from '../type';

/**
 * select tool
 *
 * move selected elements
 */
export class SelectMoveTool implements IBaseTool {
  private startPoint: IPoint = { x: -1, y: -1 };
  private startPoints: IPoint[] = [];
  private dragPoint: IPoint | null = null;
  private dx = 0;
  private dy = 0;
  private prevBBoxPos: IPoint = { x: -1, y: -1 };

  unbindEvents = noop;

  constructor(private editor: Editor) {}
  active() {
    const hotkeysManager = this.editor.hostEventManager;
    const moveWhenToggleShift = () => {
      if (this.dragPoint) {
        this.move();
      }
    };
    hotkeysManager.on('shiftToggle', moveWhenToggleShift);
    this.unbindEvents = () => {
      hotkeysManager.off('shiftToggle', moveWhenToggleShift);
    };
  }
  inactive() {
    this.unbindEvents();
  }
  start(e: PointerEvent) {
    this.startPoint = this.editor.getSceneCursorXY(e);
    const selectedElements = this.editor.selectedElements.getItems();
    this.startPoints = selectedElements.map((element) => ({
      x: element.x,
      y: element.y,
    }));
    const bBox = this.editor.selectedElements.getBBox();
    if (!bBox) {
      console.error(
        "selected elements should't be empty when moving, please report us issue",
      );
    } else {
      this.prevBBoxPos = { x: bBox.x, y: bBox.y };
    }

    this.editor.refLine.cacheXYToBbox();
  }
  drag(e: PointerEvent) {
    this.dragPoint = this.editor.getCursorXY(e);
    this.move();
  }
  
  private move() {
    this.editor.sceneGraph.showOutline = false;
    
    const { x, y } = this.editor.viewportCoordsToScene(
      this.dragPoint!.x,
      this.dragPoint!.y,
    );

    let dx = (this.dx = x - this.startPoint.x);
    let dy = (this.dy = y - this.startPoint.y);

    if (this.editor.hostEventManager.isShiftPressing) {
      if (Math.abs(dx) > Math.abs(dy)) {
        dy = 0;
      } else {
        dx = 0;
      }
    }

    // in the moving phase, AABBox's x and y should round to be integer (snap to pixel grid)
    if (this.editor.setting.get('snapToPixelGrid')) {
      // if dx == 0, we thing it is in vertical moving.
      if (dx !== 0)
        dx = Math.round(this.prevBBoxPos.x + dx) - this.prevBBoxPos.x;
      // similarly dy
      if (dy !== 0)
        dy = Math.round(this.prevBBoxPos.y + dy) - this.prevBBoxPos.y;
    }

    const selectedElements = this.editor.selectedElements.getItems();
    const startPoints = this.startPoints;
    for (let i = 0, len = selectedElements.length; i < len; i++) {
      // selectedElements[i].x = startPoints[i].x + dx;
      // selectedElements[i].y = startPoints[i].y + dy;
      const element = selectedElements[i];
      const ddx = startPoints[i].x + dx - element.x
      const ddy = startPoints[i].y + dy - element.y
      element.move(ddx, ddy); // 移动元素
    }

    // 参照线处理（目前不处理 “吸附到像素网格的情况” 的特殊情况） TODO:修复吸附和偏移

    const { offsetX, offsetY } = this.editor.refLine.updateRefLine();

    // for (let i = 0, len = selectedElements.length; i < len; i++) {
    //   selectedElements[i].x = startPoints[i].x + dx + offsetX;
    //   selectedElements[i].y = startPoints[i].y + dy + offsetY;
    // }

    this.editor.sceneGraph.render();
  }

  end(e: PointerEvent, isEnableDrag: boolean) {
    const selectedElements = this.editor.selectedElements.getItems();
    if (selectedElements.length === 0 || !isEnableDrag) {
        // 移动的时候元素被删除了，或者撤销导致为空
        // TODO: 属性复原
        return;
    }

    for (const draggedElement of selectedElements) {
        const potentialParent = this.editor.sceneGraph.getTopHitElement(draggedElement.x, draggedElement.y, draggedElement);

        if (potentialParent && potentialParent !== draggedElement && potentialParent !== draggedElement.parent) {
            // 如果被拖拽的元素现在位于另一个元素的范围内，且这个元素不是被拖拽的元素自己

            // 从旧的父元素中移除
            this.editor.sceneGraph.moveElement(draggedElement, potentialParent);
        } else if (!potentialParent && draggedElement.parent) {
            // 如果被拖拽的元素不再位于其父元素的范围内

            this.editor.sceneGraph.moveElement(draggedElement);
        }
    }
    const allElementsToMove: Graph[] = [...selectedElements];  // 先将selectedElements添加到allElementsToMove中

    for (const element of selectedElements) {
        allElementsToMove.push(...element.getAllDescendants());  // 使用扩展运算符来平坦化数组
    }

    if (this.dx !== 0 || this.dy !== 0) {
        this.editor.commandManager.pushCommand(
            new MoveElementsCommand(
                'Move Elements',
                allElementsToMove,
                this.dx,
                this.dy,
            ),
        );
    }
    
}

  afterEnd() {
    /* eslint-disable-next-line no-debugger */
    debugger
    this.dragPoint = null;
    this.editor.sceneGraph.showOutline = true;
    this.editor.refLine.clear();
    this.editor.sceneGraph.render();
  }
}