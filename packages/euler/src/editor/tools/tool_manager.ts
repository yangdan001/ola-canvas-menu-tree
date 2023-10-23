import { noop } from '../../utils/common';
import EventEmitter from '../../utils/event_emitter';
import { Editor } from '../editor';
import { DragCanvasTool } from './tool_drag_canvas';
import { DrawEllipseTool } from './tool_draw_ellipse';
import { DrawRectTool } from './tool_draw_rect';
import { DrawBrushTool } from './tool_draw_brush';
import { SelectTool } from './tool_select';
import { ITool } from './type';
import { DrawTextTool } from './tool_draw_text';
import { DrawPenTool } from './tool_draw_pen';
import { DrawLineTool } from './tool_draw_line';

interface Events {
  change(type: string): void;
}

//项目初始化立即执行此类 在editor.ts中new()
export class ToolManager {
  toolMap = new Map<string, ITool>();
  /**
   * hotkey => tool type
   */
  hotkeyMap = new Map<string, string>();

  currentTool: ITool | null = null;
  eventEmitter = new EventEmitter<Events>();

  enableSwitchTool = true;

  isDragging = false;
  _unbindEvent: () => void; //卸载
  constructor(private editor: Editor) {
    // 初始化
  // 注册事件 ：分别为 选中事件/画矩形/画圆形/画椭圆/画线/画文本/拖拽事件
    this.registerToolAndHotKey(new SelectTool(editor));
    this.registerToolAndHotKey(new DrawRectTool(editor));
    this.registerToolAndHotKey(new DrawBrushTool(editor));
    this.registerToolAndHotKey(new DrawEllipseTool(editor));
    this.registerToolAndHotKey(new DrawLineTool(editor));
    this.registerToolAndHotKey(new DrawTextTool(editor));
    this.registerToolAndHotKey(new DrawPenTool(editor));
    this.registerToolAndHotKey(new DragCanvasTool(editor));
    //设置默认
    this.setActiveTool(SelectTool.type);
    // 先调用bindEvent，然后将函数返回值（卸载事件）赋给_unbindEvent
    this._unbindEvent = this.bindEvent();
    this.editor = editor
  }


  // 定义通用注册方法
  registerToolAndHotKey(tool: ITool) {
    if (this.toolMap.has(tool.type)) {
      console.warn(`tool "${tool.type}" had exit, replace it!`);
    }
    this.toolMap.set(tool.type, tool);

    if (this.hotkeyMap.has(tool.hotkey)) {
      console.warn(`hotkey "${tool.type}" had exit, replace it!`);
    }
    //将上面每次函数调用 赋值给 this.hotkeyMap
    this.hotkeyMap.set(tool.hotkey, tool.type);
  }
  // 获取当前菜单的name值
  getActiveToolName() {
    return this.currentTool?.type;
  }
  // 绑定事件
  private bindEvent() {
    // (1) drag block strategy
    let isPressing = false;
    let startPos: [x: number, y: number] = [0, 0];
    let startWithLeftMouse = false;
    //鼠标按下
    const handleDown = (e: PointerEvent) => {
      isPressing = true;
      this.isDragging = false;
      startWithLeftMouse = false;
      if (e.button !== 0) {
        // must be left mouse button
        return;
      }
      if (this.editor.textEditor.isEditing()) {
        return;
      }

      startWithLeftMouse = true;
      if (!this.currentTool) {
        throw new Error('there is no active tool');
      }
      startPos = [e.clientX, e.clientY];
      this.currentTool.start(e);
    };
    //鼠标移动
    const handleMove = (e: PointerEvent) => {
      
      if (!this.currentTool) {
        throw new Error('未设置当前使用工具');
      }
      //按下左键
      if (isPressing) {
        if (!startWithLeftMouse) {
          return;  //只有左键按下 才执行下面的代码，否则退出
        }
        
        const dx = e.clientX - startPos[0];
        const dy = e.clientY - startPos[1];
        const dragBlockStep = this.editor.setting.get('dragBlockStep'); // 4
        // console.log("dragBlockStep",dragBlockStep);
        // 打印得之 为4像素
        
        if (
          !this.isDragging &&
          (Math.abs(dx) > dragBlockStep || Math.abs(dy) > dragBlockStep)
        ) {
          //当按下鼠标后且x,y坐标移动超过4像素，则记为拖拽
          this.isDragging = true;
        }

        if (this.isDragging) {
          this.enableSwitchTool = false; //此时禁止切换工具
          this.editor.hostEventManager.disableDragBySpace(); //此时禁止拖拽画布
          // 调用当前工具文件的drag方法 如tool_draw_pen.ts中的drag方法
          this.currentTool.drag(e);
        }
      } 
      // 不按下左键走此方法
      else {
        this.currentTool.moveExcludeDrag(e);
      }
    };
    //鼠标抬起
    const handleUp = (e: PointerEvent) => {
      this.enableSwitchTool = true;
      //只有点击过 startWithLeftMouse 为 1 ；才不会return
      if (!startWithLeftMouse) {
        return;
      }
      if (!this.currentTool) {
        throw new Error('未设置当前使用工具');
      }
      if (isPressing) {
        //开启画布拖动
        this.editor.hostEventManager.enableDragBySpace();
        isPressing = false;
        this.currentTool.end(e, this.isDragging);
        this.currentTool.afterEnd();
      }
      this.isDragging = false;
    };


    // 获取画布 监听
    const canvas = this.editor.canvasElement;
    canvas.addEventListener('pointerdown', handleDown);
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    // (2) tool hotkey binding
    this.hotkeyMap.forEach((type, key) => {
      key = `Key${key.toUpperCase()}`;
      this.editor.keybindingManager.register({
        key: { keyCode: key },
        actionName: type,
        action: () => {
          this.setActiveTool(type);
        },
      });
    });
    // 将卸载方法 返回出去
    return function unbindEvent() {
      canvas.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }
  //定义卸载函数
  unbindEvent() {
    this._unbindEvent();
    this._unbindEvent = noop;
  }
  //工具栏切换方法
  setActiveTool(toolName: string) {
    if (!this.enableSwitchTool || this.getActiveToolName() === toolName) {
      return;
    }
    const prevTool = this.currentTool;

    // 将点击工具项数据赋给this.currentTool
    const currentTool = (this.currentTool = this.toolMap.get(toolName) || null);
    if (!currentTool) {
      throw new Error(`没有 ${toolName} 对应的工具对象`);
    }
    //  清空上一个工具项的 canvas上的选中样式
    if(toolName!='drawPen'){
    prevTool && prevTool.inactive();
    }
    //设置新cursor手标
    currentTool.active();
    //设置被点击图标的高亮
    this.eventEmitter.emit('change', currentTool.type);
    this._unbindEvent;
  }

  on<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.on(eventName, handler);
  }
  off<K extends keyof Events>(eventName: K, handler: Events[K]) {
    this.eventEmitter.off(eventName, handler);
  }
  destroy() {
    this.currentTool?.inactive();
  }
}
