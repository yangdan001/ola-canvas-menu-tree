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
    /**
     * 1、获取到选中的元素信息 如id、坐标、大小、是否为原形等；
     * 2、删除该元素：左侧目录树与画布均删除，参考右键删除；
     * 3、将图片渲染在原来元素的位置，形状大小要同原来的元素；
     * */ 
      //监听uploadIMG  
      uploadImgEmitter.on('uploadIMG', (str:any)=>{
        console.log("监听图片上传",str);
        /**
         * 第一步：获取到要删除的元素 执行下面两行代码。左侧目录树会自动删除 不用操作左侧目录树
         * */ 
        // TODO 获取到选中的元素信息 如id、坐标、大小、是否为原形等；
        // 在这里写代码


        /**
         * 第二步：获取到要删除的元素 执行下面两行代码即可。左侧目录树会自动删除 不用操作左侧目录树
         * */ 
        // let arr = JSON.parse(JSON.stringify(editor.sceneGraph.getObjects());
        // setSelectedIds(arr)

        /**
         * 第一步：获取到要删除的元素 执行下面两行代码。左侧目录树会自动删除 不用操作左侧目录树
         * */ 
        // TODO 获取到选中的元素信息 如id、坐标、大小、是否为原形等；
        // 在这里写代码

      });
    }
  }, [editor]);
  
  const handleClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!editor) return;
    const target = event.target;

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
