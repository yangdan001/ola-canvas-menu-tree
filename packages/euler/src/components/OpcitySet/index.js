import React, { useState, useContext, useEffect } from 'react';
import {
  Slider,
  Divider
} from 'antd';
import './index.scss';
import { EditorContext } from '../../context';
import { SetElementsAttrs } from '../../editor/commands/set_elements_attrs';
const OpcitySet = () => {
  const editor = useContext(EditorContext);
  const selectedElements = editor.selectedElements;
  const defaultVal = selectedElements.items[0].fill[0].attrs.a
  const [sliderVal, setSliderVal] = useState(defaultVal);
  // useEffect(() => {
    
  // }, []); 
  /**
   * 正在滑动事件
   * */ 
  const onTransparency = (value) => {
    const selectedElements = editor.selectedElements;
    const prevStates = selectedElements.items[0].fill[0].attrs
    selectedElements.items[0].fill[0].attrs.a = value === 0 ? 0.001 : value;
    selectedElements.items[0].fill[0].attrs.opacity = value === 0 ? 0.001 : value;
    const newStates = selectedElements.items[0].fill[0].attrs
    editor.commandManager.pushCommand(
      new SetElementsAttrs(
          'Update Opacity of Elements',
          selectedElements.items[0],
          newStates,
          prevStates,
      ),
  );
    // 重新渲染右侧画布
    editor.sceneGraph.render();
    setSliderVal(value)
  }
return(
   <div className='slider-box'>
       <div className='slider-box-title'>Transparency {sliderVal}</div>
        <Slider min={0} max={1} step={0.01} trackStyle={{ backgroundColor: '#7F39FB' }} railStyle={{ backgroundColor: '#FFFFFF' }} value={sliderVal} onChange={onTransparency} />
        <Divider style={{marginTop: 10,marginBottom: 10,background:'#444'}}/>
   </div>
      )
}
export default OpcitySet;