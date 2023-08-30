import { Editor } from "../../editor";
import { IBaseTool } from "../type";

export class DoubleClickStrategy implements IBaseTool {
    constructor(private editor: Editor) {
        // constructor
    }
  
    active() {
        // active
    }
    inactive() {
        // inactive
    }
    start(event: PointerEvent) {
        const selectedElements = this.editor.selectedElements.getItems();

    if (selectedElements.length === 1) {
        const selectedElement = selectedElements[0];
        const { x, y } = this.editor.getSceneCursorXY(event);

        if (selectedElement.children && selectedElement.children.length > 0 ) {
            const childUnderCursor = selectedElement.children.find(child =>  ('hitTest' in child) && child.hitTest(x, y));
            if (childUnderCursor) {
                // 选择子元素
                this.editor.selectedElements.setItems([childUnderCursor]);
            }
        }
    }
    }
    drag(event: PointerEvent) {
        // drag
    }
    end(event: PointerEvent, isEnableDrag: boolean) {
        // end
    }
    afterEnd() {
        // after end
    }
  }
  