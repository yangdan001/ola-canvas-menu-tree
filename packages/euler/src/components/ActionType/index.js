import React, { useState, useContext, useEffect } from 'react';
import {
  Select,
  Divider
} from 'antd';
import './index.scss';
const { Option } = Select;

const ActionType = () => {
  const [defaultType, setDefaultType] = useState('image');
  // useEffect(() => {
    
  // }, []); 

  const handleChange = (value) => {
    console.log(`selected ${value}`);
    setDefaultType(value)
    localStorage.setItem('frameType', value)
  };

return(
   <div className='type-box'>
      <div className='type-box-title'>Type</div>
      <Select
        style={{ width: 120  }}
        dropdownStyle={{ backgroundColor: '#1E2022' }}
        defaultValue={defaultType}
        onChange={handleChange}
        // options={[{ value: 'image', label: 'image' },{ value: 'meta', label: 'meta' },{ value: 'mask', label: 'mask' }]}
      >
      <Option value="image" label="image" style={{ color: '#FFFFFF' }}>
      image
      </Option>
      <Option value="meta" label="meta" style={{ color: '#FFFFFF' }}>
      meta
      </Option>
      <Option value="mask" label="mask" style={{ color: '#FFFFFF' }}>
      mask
      </Option>
      </Select>
      <div className='type-box-dec'>Frame type, image, meta or mask</div>
      <Divider style={{marginTop: 5,marginBottom: 0,background:'#444'}}/>
   </div>
      )
}
export default ActionType;