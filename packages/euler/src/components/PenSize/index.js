import React, { useState, useContext, useEffect } from 'react';
import {
  Slider,
  Divider
} from 'antd';
import './index.scss';
import { HighlightOutlined } from '@ant-design/icons';
import { EditorContext } from '../../context';
import { MutateElementsAndRecord } from '../../editor/scene/graph';
import { useIntl } from 'react-intl';

const PenSize = () => {
  const intl = useIntl();
  const MIXED = intl.formatMessage({ id: 'mixed' });
  const editor = useContext(EditorContext);
  const [brushSize, setBrushSize] = useState(0);
  useEffect(() => {
    if (editor) {
      const handler = () => {
        const items = editor.selectedElements.getItems();
        if (items.length > 0) {
          let newBrushSize= items[0].brushSize;
          for (let i = 0, len = items.length; i < len; i++) {
            const element = items[i];
            if (newBrushSize !==  element.brushSize ) {
              newBrushSize = MIXED;
            }
          }
          setBrushSize(newBrushSize);
        }
      };
      editor.sceneGraph.on('render', handler);
      return () => {
        editor.sceneGraph.off('render', handler);
      };
    }
  }, [editor, MIXED]);

  const onSize = (value) => {
    console.log('onChange: ', value);
    setBrushSize(value)
  }

  const onAfterSize = (value) => {
    console.log('onAfterChange: ', value);
    setBrushSize(value)
    // const brushSize = editor.setting.get('brushSize');
    if (editor) {
      const elements = editor.selectedElements.getItems();
      MutateElementsAndRecord.setBrushSize(editor, elements, value);
      // editor.setting.set('brushSize', value);
      editor.selectedElements?.getItems()[0].children.forEach(obj => {
        if (String(obj.type) === 'Pen') {
          obj.brushSize = value;
          // 在箭头函数中直接使用外部的 this 上下文
          if (editor) {
            const elements = editor.selectedElements.getItems();
            MutateElementsAndRecord.setBrushPoints(editor, elements, value);
            editor.sceneGraph.render();
          }
        }
      });
      editor.sceneGraph.render();
    }
  }


return(
   <div className='slider-box pen-box'>
        <div className='pen-box-title'>
            <HighlightOutlined />
            <div>Pen</div>
        </div>
        {/* <Divider style={{marginTop: 10,marginBottom: 0}}/> */}
        <div>Size</div>
        <Slider min={1} max={100} step={1} trackStyle={{ backgroundColor: '#7F39FB' }} defaultValue={1} railStyle={{ backgroundColor: '#FFFFFF' }} value={brushSize} onChange={onSize} onAfterChange={onAfterSize} />
        <Divider style={{marginTop: 5,marginBottom: 0,background:'#EEE'}}/>
   </div>
      )
}
export default PenSize;