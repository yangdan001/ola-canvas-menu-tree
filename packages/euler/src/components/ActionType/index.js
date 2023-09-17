import React, { useState, useContext, useEffect } from 'react';
import {
  Select,
  ConfigProvider,
  Form,
  Divider
} from 'antd';
import './index.scss';
import { EditorContext } from '../../context';
import { MutateElementsAndRecord } from '../../editor/scene/graph';
const { Option } = Select;

const ActionType = () => {
  const editor = useContext(EditorContext);
  const [defaultType, setDefaultType] = useState('Meta');
  // useEffect(() => {
    
  // }, []); 

  const handleChange = (value) => {
    console.log(`selected ${value}`);
    setDefaultType(value)
    const elements = editor.selectedElements.getItems();
    MutateElementsAndRecord.setIframeType(editor, elements, value);
    // if(value){
    //   localStorage.setItem('frameType', value)
    //   if(value == 'meta'){
    //     localStorage.setItem('isHide', false)
    //   }else{
    //     localStorage.setItem('isHide', true)
    //   }
    // }else{
    //   localStorage.setItem('frameType', 'image')
    //   localStorage.setItem('isHide', true)
    // }
  };

return(
   <div className='type-box'>
      <div className='type-box-title'>Type</div>
      <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}  >
      {/* <Form.Item name={'frame-type'} rules={[{ required: true, message: '请选择类型' }]}> */}
      <Select
        style={{ width: 120  }}
        // dropdownStyle={{ backgroundColor: '#1E2022' }}
        defaultValue={defaultType}
        onChange={handleChange}
        options={[{ value: 'Image', label: 'image' },{ value: 'Meta', label: 'meta' },{ value: 'Mask', label: 'mask' }]}
      >
      {/* <Option value="image" label="image" style={{ color: '#FFFFFF' }}>
      image
      </Option>
      <Option value="meta" label="meta" style={{ color: '#FFFFFF' }}>
      meta
      </Option>
      <Option value="mask" label="mask" style={{ color: '#FFFFFF' }}>
      mask
      </Option> */}
      </Select>
      {/* </Form.Item> */}
    </ConfigProvider>
      <div className='type-box-dec'>Frame type, image, meta or mask</div>
      <Divider style={{marginTop: 5,marginBottom: 0,background:'#444'}}/>
   </div>
      )
}
export default ActionType;