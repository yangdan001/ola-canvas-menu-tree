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
   <div className='back-box'>
        <div className='back-box-btn'>
          <ArrowLeftOutlined style={{ fontSize: '16px', color: '#FFFFFF' }}/>
        </div>
       <div className='back-box-title'>Back to meta</div>
        <Divider style={{marginTop: 7,marginBottom: 0,background:'#444'}}/>
   </div>
      )
}
export default BackToMeta;