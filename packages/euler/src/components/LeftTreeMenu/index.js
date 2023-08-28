import React, { useState, useContext, useEffect } from 'react';
import { Tree } from 'antd';
import { EditorContext } from '../../context';
import { addEventEmitter } from '../../events';//事件中心

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

const LeftTree = () => {
  const editor = useContext(EditorContext);
  const [gData, setGData] = useState([]);//目录树 数据
  const [addGraphData,setAddgraphData] = useState([])
  const [removeGraphData,setRemoveGraphData] = useState([])
  const [expandedKeys, setExpandedKeys] = useState(['']);
  const [selectedKeys, setSelectedKeys] = useState(['']);
  useEffect(() => {
    if (editor) {
      // 右侧组件获取到的原始数据 -- 进行以下处理
      let ChangeDataStructureBefore = editor.sceneGraph.getObjects()
      let ChangeDataStructureAfter = []
      // 数据处理为树形结构
      if (ChangeDataStructureBefore && ChangeDataStructureBefore.length > 0) {
        ChangeDataStructureBefore.forEach((item, index) => {
          ChangeDataStructureAfter.push({
            "title": item.name,
            "key": item.id
          })
        })
        // 设置树状结构数据
        setGData(ChangeDataStructureAfter);
      }
      // 监听右侧画布变化
      editor.sceneGraph.on('render', () => {
        setSelectedKeys(Array.from(editor.selectedElements.getIdSet()))
      });
      //监听到数据新增
      addEventEmitter.on('addCanvas', (obj)=>{
        /* eslint-disable-next-line no-debugger */
        // 根据字段判断为新增
        if(obj.desc.split(' ')[0] == 'Add'){
          let appendobj = {
            "title": obj.elements[0].objectName,
            "key": obj.elements[0].id
          }
          setAddgraphData(appendobj)
        }
        else if(obj.desc.split(' ')[0] == 'Remove'){
          let removeobj = {
            "title": obj.removedElements[0].objectName,
            "key": obj.removedElements[0].id
          }
          setRemoveGraphData(removeobj)
        }
      });

      
    }
  }, [editor]);
  let treeData = []
  // 新增处理
  useEffect(() => {
    let newdata = JSON.parse(JSON.stringify(gData))
    newdata.push(addGraphData);
    setGData(newdata)
  }, [addGraphData]);
  // 删除处理
  useEffect(() => {
    let newdata = JSON.parse(JSON.stringify(gData))
    // 做删除处理
    const itemRemoved = removeItemByKey(newdata,removeGraphData.key)
    if (itemRemoved) {
      setGData(newdata)
    } else {
      console.log('Item not found.');
      setGData([])
    }
  }, [removeGraphData]);
  
// 递归删除  根据key
const removeItemByKey = (arr, keyToDelete) => {
  for (let i = 0; i < arr.length; i++) {
      if (arr[i].key === keyToDelete) {
          arr.splice(i, 1); // Remove the matching item from the array
          return true; // Indicate that the item was removed
      }
      if (arr[i].children) {
          // If the item has children, recursively search for the key in the children
          if (removeItemByKey(arr[i].children, keyToDelete)) {
              return true; // Indicate that the item was removed
          }
      }
  }
  return false; // Indicate that the item was not found
}


  const onDragEnd = (info) => {
    console.log('info', info, gData);
    // console.log(info);
    // expandedKeys, set it when controlled is needed
    // setExpandedKeys(info.expandedKeys)
  };
  // 拖拽逻辑
  const onDrop = (info) => {
    console.log('拖拽');
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
      ((info.node).props.children || []).length > 0 && // Has children
      (info.node).props.expanded && // Is expanded
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
    // editor.selectedElements.toggleItemById(selectedKeys[0]);
    // 选中右侧画布上的节点
    editor.selectedElements.setItemsById(new Set([selectedKeys[0]]));
    // 重新渲染右侧画布
    editor.sceneGraph.render();
  };
  /**
   * 1、defaultExpandAll  ： 默认展开所有父节点
   * 2、selectedKeys ：设置选中的树节点
   * 3、defaultSelectedKeys ：默认选中的值
   * */
  // eslint-disable-next-line
  return (
    <Tree
      className="draggable-tree"
      style={{ width: 240 }}
      defaultExpandAll={true}
      selectedKeys={selectedKeys}
      // defaultSelectedKeys={selectedKeys}
      draggable
      blockNode
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      onSelect={onSelectTree}
      treeData={gData}
    />
  );
};

export default LeftTree;