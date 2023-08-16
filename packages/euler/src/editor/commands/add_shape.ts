import { Graph } from '../scene/graph';
import { Editor } from '../editor';
import { ICommand } from './type';

/**
 * add elements
 */
export class AddShapeCommand implements ICommand {
  constructor(
    public desc: string,
    private editor: Editor,
    private elements: Graph[],
  ) {}
  redo() {
    console.log(1,'新增');
    this.editor.sceneGraph.addItems(this.elements);
    this.editor.selectedElements.setItems(this.elements);
  }
  undo() {
    console.log(2,'删除');
    this.editor.sceneGraph.removeItems(this.elements);
    this.editor.selectedElements.clear();
  }
}
