import { ICommand } from './type';
import { Graph } from '../scene/graph';

/**
 * move elements
 */
export class MoveElementsCommand implements ICommand {
  constructor(
    public desc: string,
    private elements: Graph[],
    private dx: number,
    private dy: number,
  ) {}
  redo() {
    console.log(1,'moveredo');
    const { dx, dy } = this;
    for (let i = 0, len = this.elements.length; i < len; i++) {
      const element = this.elements[i];
      element.x = element.x + dx;
      element.y = element.y + dy;
    }
  }
  undo() {
    console.log(2,'moveundo');
    const { dx, dy } = this;
    for (let i = 0, len = this.elements.length; i < len; i++) {
      const element = this.elements[i];
      element.x = element.x - dx;
      element.y = element.y - dy;
    }
  }
}
