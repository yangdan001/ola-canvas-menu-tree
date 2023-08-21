import React, { useState, useContext, useEffect } from 'react';
import {
  Slider,
  Divider
} from 'antd';
import './index.scss';

const OpcitySet = () => {
  const [sliderVal, setSliderVal] = useState(0);
  // useEffect(() => {
    
  // }, []); 

  const onTransparency = (value) => {
    console.log('onChange: ', value);
    setSliderVal(value)
  }

  const onAfterTransparency = (value) => {
    console.log('onAfterChange: ', value);
    setSliderVal(value)
  }


return(
   <div className='slider-box'>
       <div className='slider-box-title'>Transparency {sliderVal}</div>
        <Slider min={0} max={1} step={0.01} trackStyle={{ backgroundColor: '#7F39FB' }} railStyle={{ backgroundColor: '#FFFFFF' }} defaultValue={0.75} onChange={onTransparency} onAfterChange={onAfterTransparency} />
        <Divider style={{marginTop: 10,marginBottom: 10,background:'#444'}}/>
   </div>
      )
}
export default OpcitySet;