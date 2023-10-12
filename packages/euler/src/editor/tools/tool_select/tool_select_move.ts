import { IPoint, PPoint } from '../../../type';
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
  private pdPoints: PPoint[] = [];
  private dragPoint: IPoint | null = null;
  private dx = 0;
  private dy = 0;
  private prevBBoxPos: IPoint = { x: -1, y: -1 };

  unbindEvents = noop;

  constructor(private editor: Editor) {
    this.pdPoints = []
  }
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
    /**
   * 获取场景中 手势光标坐标
   */
    this.startPoint = this.editor.getSceneCursorXY(e);
    //获取选中的元素集合
    const selectedElements = this.editor.selectedElements.getItems();
    console.log(this.startPoint, 'this.startPoint;;;;;')
    //获取选中的元素的x，y
    this.startPoints = selectedElements.map((element) => ({
      x: element.x,
      y: element.y,
      points: element.points ? element.points : [],//画笔轨迹的坐标点数组对象
    }));
    //选中元素多个矩形组成的包围盒
    const bBox = this.editor.selectedElements.getBBox();
    if (!bBox) {
      console.error(
        //移动时所选元素不为空
        "selected elements should't be empty when moving, please report us issue",
      );
    } else {
      //上次选中元素包围盒的坐标
      this.prevBBoxPos = { x: bBox.x, y: bBox.y };
    }
    //存储包围盒 XY 坐标
    this.editor.refLine.cacheXYToBbox();
  }
  drag(e: PointerEvent) {
    //拖动点
    /**
  * 获取场景中 手势光标坐标
  */
    this.dragPoint = this.editor.getCursorXY(e);
    this.move();
  }

  private move() {
    //是否现实选中元素的外边框
    this.editor.sceneGraph.showOutline = false;
    /**
   * 视口坐标 转 场景坐标
   */
    const { x, y } = this.editor.viewportCoordsToScene(
      this.dragPoint!.x,
      this.dragPoint!.y,
    );
    //视口坐标 转 场景坐标-场景中 手势光标坐标
    let dx = (this.dx = x - this.startPoint.x);
    let dy = (this.dy = y - this.startPoint.y);
    //判断主机事件管理器的shift是否按下
    if (this.editor.hostEventManager.isShiftPressing) {
      if (Math.abs(dx) > Math.abs(dy)) {
        dy = 0;
      } else {
        dx = 0;
      }
    }
    //在移动阶段，AABBox的x和y应该四舍五入为整数（对齐像素网格/是否吸附到像素网格）
    // in the moving phase, AABBox's x and y should round to be integer (snap to pixel grid)
    if (this.editor.setting.get('snapToPixelGrid')) {
      // if dx == 0, we thing it is in vertical moving.垂直移动的
      if (dx !== 0)
        dx = Math.round(this.prevBBoxPos.x + dx) - this.prevBBoxPos.x;
      // similarly dy
      if (dy !== 0)
        dy = Math.round(this.prevBBoxPos.y + dy) - this.prevBBoxPos.y;
    }

    const selectedElements = this.editor.selectedElements.getItems();
    //画笔points轨迹的所有点计算移动的x，y位置
    // const pdPoint: any[] = []
    // selectedElements.forEach((element) => {
    //   if (element.points && element.points.length > 0) {
    //     for (let p = 0, plen = element.points.length; p < plen; p++) {
    //       //视口坐标 转 场景坐标-场景中 手势光标坐标
    //       let pdx = (this.dx = x - element.points[p].x);
    //       let pdy = (this.dy = y - element.points[p].y);
    //       //判断主机事件管理器的shift是否按下
    //       if (this.editor.hostEventManager.isShiftPressing) {
    //         if (Math.abs(pdx) > Math.abs(pdy)) {
    //           pdy = 0;
    //         } else {
    //           pdx = 0;
    //         }
    //       }
    //       //在移动阶段，AABBox的x和y应该四舍五入为整数（对齐像素网格/是否吸附到像素网格）
    //       // in the moving phase, AABBox's x and y should round to be integer (snap to pixel grid)
    //       if (this.editor.setting.get('snapToPixelGrid')) {
    //         // if dx == 0, we thing it is in vertical moving.垂直移动的
    //         if (pdx !== 0)
    //           pdx = Math.round(this.prevBBoxPos.x + pdx) - this.prevBBoxPos.x;
    //         // similarly dy
    //         if (dy !== 0)
    //           pdy = Math.round(this.prevBBoxPos.y + pdy) - this.prevBBoxPos.y;
    //       }
    //       pdPoint.push({
    //         dx: pdx,
    //         dy: pdy,
    //       })
    //       // return pdPoint
    //     }
    //   }
    // },
    //   this.pdPoints = pdPoint
    // );
    const startPoints = this.startPoints;
    //选中元素的所有的起始点move事件
    for (let i = 0, len = selectedElements.length; i < len; i++) {
      // selectedElements[i].x = startPoints[i].x + dx;
      // selectedElements[i].y = startPoints[i].y + dy;
      const element = selectedElements[i];
      const ddx = startPoints[i].x + dx - element.x
      const ddy = startPoints[i].y + dy - element.y
      element.move(ddx, ddy); // 移动元素
      // if (selectedElements[i].points && selectedElements[i].points.length > 0) {
      //   for (let p = 0, pointslen = selectedElements[i].points.length; p < pointslen; p++) {
      //     const startPointPen = startPoints[i];
      //     if (startPointPen && startPointPen.points && startPointPen.points[p]) {
      //       const ddxPen = startPointPen.points[p].x + this.pdPoints[p].dx - element.x;
      //       const ddyPen = startPointPen.points[p].y + this.pdPoints[p].dy - element.y;
      //       console.log(element, 'element2', p)
      //       console.log(element.points, ' element.points2', p)
      //       console.log(ddxPen, 'ddxPen2', p)
      //       console.log(ddyPen, 'ddyPen2', p)
      //       console.log(dx, 'dx2', p)
      //       console.log(dy, 'dy2', p)
      //       console.log(startPoints[i], 'startPoints[i]2', p)
      //       console.log(startPoints, 'startPoints2', p)
      //       console.log(startPointPen.points[p].x, 'startPointPen.points[p].x', p)
      //       console.log(startPointPen.points[p].y, 'startPointPen.points[p].y', p)
      //       element.move(ddxPen, ddyPen);
      //     }
      //   }
      // }
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
    /* eslint-disable-next-line no-debugger */
    // debugger    
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
    // debugger
    this.dragPoint = null;
    this.editor.sceneGraph.showOutline = true;
    this.editor.refLine.clear();
    this.editor.sceneGraph.render();
  }
}