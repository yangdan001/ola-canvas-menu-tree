import React, { useState, useContext, useEffect } from 'react';
import {
  Divider
} from 'antd';
import './index.scss';
import { ArrowLeftOutlined } from '@ant-design/icons';

const BackToMeta = () => {
  // useEffect(() => {
    
  // }, []); 



return(
   <div>
        <div className='back-box'>
          <ArrowLeftOutlined style={{ fontSize: '16px', color: '#FFFFFF' }}/>
        </div>
       <div>Back to meta</div>
        <Divider style={{marginTop: 10,marginBottom: 0}}/>
   </div>
      )
}
export default BackToMeta;