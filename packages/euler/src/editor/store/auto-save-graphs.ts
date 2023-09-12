import debounce from 'lodash.debounce';
import { Editor } from '../editor';
import { IEditorPaperData } from '../../type';

const STORE_KEY = 'euler-paper';

export class AutoSaveGraphs {
  listener: () => void;
  constructor(private editor: Editor) {
    this.listener = debounce(() => {
      /* eslint-disable-next-line no-debugger */
  // debugger
      this.save();
    }, 300);
  }

  autoSave() {
    this.editor.commandManager.on('change', this.listener);
  }
  stopAutoSave() {
    this.editor.commandManager.off('change', this.listener);
  }
  save() {
    //画布数据存的位置
    localStorage.setItem(STORE_KEY, this.editor.sceneGraph.toJSON());
  }
  load() {
    //画布数据取的位置
    const dataStr = localStorage.getItem(STORE_KEY);
    if (!dataStr) return null;
    const data = JSON.parse(dataStr) as IEditorPaperData;
    return data;
  }
}
