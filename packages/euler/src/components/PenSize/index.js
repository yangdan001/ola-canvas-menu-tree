import React, { useState, useContext, useEffect } from 'react';
import {
  Slider,
  Divider
} from 'antd';
import './index.scss';
import { HighlightOutlined } from '@ant-design/icons';

const PenSize = () => {
  const [penVal, setPenVal] = useState(0);
  // useEffect(() => {
    
  // }, []); 

  const onSize = (value) => {
    console.log('onChange: ', value);
    setPenVal(value)
  }

  const onAfterSize = (value) => {
    console.log('onAfterChange: ', value);
    setPenVal(value)
  }


return(
   <div className='slider-box pen-box'>
        <div className='pen-box-title'>
            <HighlightOutlined />
            <div>Pen</div>
        </div>
        {/* <Divider style={{marginTop: 10,marginBottom: 0}}/> */}
        <div>Size</div>
        <Slider min={1} max={100} step={1} trackStyle={{ backgroundColor: '#7F39FB' }} railStyle={{ backgroundColor: '#FFFFFF' }} defaultValue={10} onChange={onSize} onAfterChange={onAfterSize} />
        <Divider style={{marginTop: 5,marginBottom: 0,background:'#EEE'}}/>
   </div>
      )
}
export default PenSize;