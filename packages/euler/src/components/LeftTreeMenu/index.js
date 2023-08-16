import React, { useState, useContext, useEffect } from 'react';
import { Tree } from 'antd';
import { EditorContext } from '../../context';
import EventEmitter from 'eventemitter3';
const emitter = new EventEmitter();

// const defaultData = [
//   {
//       "title": "标题-1",
//       "key": "标题-1",
//       "children": [
//           {
//               "title": "标题-1-0",
//               "key": "标题-1-0",
//               "children": [
//                   {
//                       "title": "标题-1-0-0",
//                       "key": "标题-1-0-0"
//                   },
//                   {
//                       "title": "标题-1-0-1",
//                       "key": "标题-1-0-1"
//                   },
//                   {
//                       "title": "标题-1-0-2",
//                       "key": "标题-1-0-2"
//                   }
//               ]
//           },
//           {
//               "title": "标题-1-1",
//               "key": "标题-1-1",
//               "children": [
//                   {
//                       "title": "标题-1-1-0",
//                       "key": "标题-1-1-0"
//                   },
//                   {
//                       "title": "标题-1-1-1",
//                       "key": "标题-1-1-1"
//                   },
//                   {
//                       "title": "标题-1-1-2",
//                       "key": "标题-1-1-2"
//                   }
//               ]
//           },
//           {
//               "title": "标题-1-2",
//               "key": "标题-1-2"
//           }
//       ]
//   },
//   {
//       "title": "标题-2",
//       "key": "标题-2",
//       "children": [
//           {
//               "title": "标题-2-0",
//               "key": "标题-2-0",
//               "children": [
//                   {
//                       "title": "标题-2-0-0",
//                       "key": "标题-2-0-0"
//                   },
//                   {
//                       "title": "标题-2-0-1",
//                       "key": "标题-2-0-1"
//                   },
//                   {
//                       "title": "标题-2-0-2",
//                       "key": "标题-2-0-2"
//                   }
//               ]
//           },
//           {
//               "title": "标题-2-1",
//               "key": "标题-2-1",
//               "children": [
//                   {
//                       "title": "标题-2-1-0",
//                       "key": "标题-2-1-0"
//                   },
//                   {
//                       "title": "标题-2-1-1",
//                       "key": "标题-2-1-1"
//                   },
//                   {
//                       "title": "标题-2-1-2",
//                       "key": "标题-2-1-2"
//                   }
//               ]
//           },
//           {
//               "title": "标题-2-2",
//               "key": "标题-2-2"
//           }
//       ]
//   },
//   {
//       "title": "标题-3",
//       "key": "标题-3"
//   },
//   {
//       "title": "标题-4",
//       "key": "标题-4"
//   },
//   {
//       "title": "标题-5",
//       "key": "标题-5"
//   }
// ]

const App = () => {
  const editor = useContext(EditorContext);
  const [objects, setObjects] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [gData, setGData] = useState([]);//目录树 数据
  const [expandedKeys,setExpandedKeys] = useState(['']);
  const [selectedKeys,setSelectedKeys] = useState(['']);
  
  useEffect(() => {
    if (editor) {
      // 右侧组件获取到的原始数据 -- 进行以下处理
      let ChangeDataStructureBefore = editor.sceneGraph.getObjects()
      let ChangeDataStructureAfter = []
      // 数据处理为树形结构
      // setObjects(editor.sceneGraph.getObjects()); // init
      if(ChangeDataStructureBefore&&ChangeDataStructureBefore.length>0){
        ChangeDataStructureBefore.forEach((item,index)=>{
          ChangeDataStructureAfter.push({
            "title": item.name,
            "key": item.id
          })
        })

        // setTreeData(ChangeDataStructureAfter)
        // 设置树状结构数据
        setGData(ChangeDataStructureAfter);
      }
      // 监听到画布新增
      emitter.on('emitCommand', (command)=>{
        console.log('新增',command);
        gData.push({
          title: command.name,
          key: command.id
        })
        setGData(gData);

      });
      // 监听右侧画布变化
      editor.sceneGraph.on('render', () => {

        setSelectedIds(editor.selectedElements.getIdSet());
        setSelectedKeys(Array.from(editor.selectedElements.getIdSet()))
      });
    }
  }, [editor]);
  const onDragEnter = (info) => {
    console.log('info',info);
    // console.log(info);
    // expandedKeys, set it when controlled is needed
    // setExpandedKeys(info.expandedKeys)
  };
  // 拖拽逻辑
  const onDrop = (info) => {
    // console.log(info);
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

    const loop = (
      data,
      key,
      callback,
    ) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
          return callback(data[i], i, data);
        }
        if (data[i].children) {
          loop(data[i].children, key, callback);
        }
      }
    };
    const data = [...gData];

    // Find dragObject
    let dragObj;
    loop(data, dragKey, (item, index, arr) => {
      arr.splice(index, 1);
      dragObj = item;
    });

    if (!info.dropToGap) {
      // Drop on the content
      loop(data, dropKey, (item) => {
        item.children = item.children || [];
        // where to insert. New item was inserted to the start of the array in this example, but can be anywhere
        item.children.unshift(dragObj);
      });
    } else if (
      ((info.node ).props.children || []).length > 0 && // Has children
      (info.node ).props.expanded && // Is expanded
      dropPosition === 1 // On the bottom gap
    ) {
      loop(data, dropKey, (item) => {
        item.children = item.children || [];
        // where to insert. New item was inserted to the start of the array in this example, but can be anywhere
        item.children.unshift(dragObj);
        // in previous version, we use item.children.push(dragObj) to insert the
        // item to the tail of the children
      });
    } else {
      let ar = [];
      let i;
      loop(data, dropKey, (_item, index, arr) => {
        ar = arr;
        i = index;
      });
      if (dropPosition === -1) {
        ar.splice(i, 0, dragObj);
      } else {
        ar.splice(i + 1, 0, dragObj);
      }
    }
    setGData(data);
    // console.log('更改之后的数据结构',defaultData);
  };
  //选中属性item
  const onSelectTree = (selectedKeys, e) => {
    console.log('选中节点的Key',selectedKeys);
    // editor.selectedElements.toggleItemById(selectedKeys[0]);
    editor.selectedElements.setItemsById(new Set([selectedKeys[0]]));
    editor.sceneGraph.render();
    // console.log('e',e);
  };
  /**
   * 1、defaultExpandAll  ： 默认展开所有父节点
   * 2、expandedKeys ：默认选中的值，
   * */ 
// eslint-disable-next-line
  return (
    <Tree
      className="draggable-tree"
      style={{width:240}}
      defaultExpandAll={true}
      selectedKeys={selectedKeys}
      defaultSelectedKeys={expandedKeys}
      draggable
      blockNode
      onDragEnter={onDragEnter}
      onDrop={onDrop}
      onSelect={onSelectTree}
      treeData={gData} 
      />
  );
};

export default App;