import { Editor } from '../editor';
import { ITool } from './type';
import { IBox, IPoint } from '../../type';
import { PenGraph } from '../scene/pen';
import cloneDeep from 'lodash.clonedeep';
// import { Graph } from '../scene/graph';


import { AddShapeCommand } from '../commands/add_shape';

export class DrawPenTool implements ITool {
  static readonly type = 'drawPen';
  readonly type = 'drawPen';
  readonly hotkey = 'p';
  private isDrawing = false;
  private startPoint: IPoint = { x: -1, y: -1 }; //开始点位
  private prevPoint!: IPoint; //记录上一个点位
  private lastDragPoint!: IPoint;//记录上一个点位
  private brushSize = 5; // Set your desired brush size here
  private prevViewport!: IBox;
  private commandDesc: string;
  private penPoints: { x: number; y: number }[];

  constructor(private editor: Editor) {
    this.commandDesc = 'draw Path';
    this.penPoints = [];

  }
  //清空canvas上的鼠标手势样式
  inactive() {
    this.editor.setCursor('');
  }
  //设置canvas上的鼠标手势样式
  active() {
    this.editor.setCursor('crosshair');
  }

  moveExcludeDrag() {
    
    // do nothing
  }

  start(e: PointerEvent) {
    //开始时 清空数组
    this.penPoints = []
    //画笔实现画的起点
    this.startPoint = this.editor.getCursorXY(e);
    this.prevPoint = this.startPoint;
    //将坐标转为场景坐标存起来；在场景中绘制线条时使用的点坐标
    const storePoint = this.editor.getSceneCursorXY(
      e,
      this.editor.setting.get('snapToPixelGrid'),
    );
    this.penPoints.push({ x: storePoint.x, y: storePoint.y });
  }
  // tool_manager.ts中 调用此drag方法
  drag(e: PointerEvent) {
    //画笔实时画的move过程的所有点  鼠标在视口内划过的坐标 用于实时绘制线条
    const currentPoint = this.editor.getCursorXY(e);
    // 实时画 功能实现 每一次都是从上个点画起
    this.editor.sceneGraph.drawLine(this.editor.ctx, this.prevPoint, currentPoint, this.brushSize);
    this.prevPoint = currentPoint;
    //将点存进数组
    //将坐标转为场景坐标存起来；在场景中绘制线条时使用的点坐标
    const storePoint = this.editor.getSceneCursorXY(
      e,
      this.editor.setting.get('snapToPixelGrid'),
    );
    this.penPoints.push({ x: storePoint.x, y: storePoint.y });
  }
  //鼠标抬起 ool_manager.ts中 调用此drag方法
  end(e: PointerEvent) {
    this.editor.ctx.lineWidth=1
    this.visible();
    //
    this.createPenGraph()
    // //画笔添加监听
    //拖动结束后工具栏图标还是选中的画笔图标
    this.editor.toolManager.setActiveTool('drawPen');
    // this.editor.canvasElement.style.cursor = 'crosshair';
  }
  afterEnd() {
    console.log('');
    
  }
  //点的存储与动作结束后的线条绘制
  createPenGraph() {
    if (this.penPoints.length === 0) return;
    const firstPoint = this.penPoints[0];
    if (!this.editor.canvasElement) return;
    const pen = new PenGraph({
      penWidth: this.brushSize,
      points: this.penPoints,
      x: firstPoint.x,
      y: firstPoint.y,
      fill: cloneDeep(this.editor.setting.get('textFill')),
      strokeWidth: 2,
    });
    console.log('pen',pen);
    
/**
 * todo
 * 1、获取选中的图片格式的矩形
 * 2、获取矩形的四点坐标
 * 3、根据四点坐标 限制画笔动作
 * 4、超出后需要处理：
 *    超出部分不显示在画布上（实时画与数据轨迹）
 *    方法：超出的点不走实时画方法和存数据方法
 * 5、起笔画时必须有一个选中元素矩形
 * 6、生成一个new pen时机：
 *    当选择的矩形中没有追加过线条，并切本次选中的矩形与上次选中的矩形不同
 *    同理：当选中的矩形跟上次相同或者选中的矩形中含有线条 则不新增 pen，只做push线条进矩形
*/ 







    this.editor.sceneGraph.addItems([pen]);

    //选中当前元素
    this.editor.selectedElements.setItems([pen]);

    this.editor.sceneGraph.render();

    this.editor.commandManager.pushCommand(
      new AddShapeCommand('draw pen', this.editor, [pen]),
    );
    //todo 需要将画笔的pen对象放到选中元素的children中
    // console.log([pen],pen,'[pen]')
    // this.editor.sceneGraph.children[0].children.push(pen);
  }
  visible() {
    const zoom = this.editor.zoomManager.getZoom();
    const fontSize = this.editor.setting.get('defaultFontSize') * zoom + 'px';
    const styles = {
      // left: x + 'px',
      // top: y + 'px',
      // height: fontSize,
      // fontSize,
      display: 'block',
    } as const;
    Object.assign(this.editor.canvasElement.style, styles);
    this.editor.canvasElement.style.display = 'block';
  }
}
