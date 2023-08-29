import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../context';
import { IObject } from '../../type';
import LayerItem from './LayerItem/LayerItem';
import './LayerPanel.scss';
import { uploadImgEmitter } from '../../events';//事件中心


export const LayerPanel: FC = () => {
  const editor = useContext(EditorContext);
  const [objects, setObjects] = useState<IObject[]>([]);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());

  useEffect(() => {
    if (editor) {
      
      // 初始化获取数据
      setObjects(editor.sceneGraph.getObjects()); // init

      editor.sceneGraph.on('render', () => {
        setObjects(editor.sceneGraph.getObjects());
        setSelectedIds(editor.selectedElements.getIdSet());
      });
    
    }
  }, [editor]);
  
  const handleClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!editor) return;
    const target = event.target;
    console.log('handleClick');

    if (target instanceof HTMLElement && target.hasAttribute('data-layer-id')) {
      const objId = target.getAttribute('data-layer-id');
      if (objId) {
        if (event.ctrlKey || event.metaKey) {
          editor.selectedElements.toggleItemById(objId);
        } else {
          editor.selectedElements.setItemsById(new Set([objId]));
        }
        editor.sceneGraph.render();
      }
    }
  };
  return (
    <div className="layer-panel" onClick={(e) => handleClick(e)}>
      {objects
        .map((item) => (
          <LayerItem
            active={selectedIds.has(item.id)}
            key={item.id}
            layerId={item.id}
          >
            {' '}
            {item.name}
          </LayerItem>
        ))
        .reverse()}
    </div>
  );
};
