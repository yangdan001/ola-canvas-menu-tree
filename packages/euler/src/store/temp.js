import { action, computed, makeObservable, observable, toJS, remove, notification } from "./which";
import { runInAction } from 'mobx';
import { getHistoryRecord, getRecordTotal, getPing, postImage, getRecord, postImageToImage, getResponses } from '../services/api';
import React from 'react';


class Text {
  //所有form参数默认值


  status = {
    
    state:{

    },
  }


  
  tempchange = (num )=>{
   
    console.log( toJS( this.status.state ))
  }

  constructor() {
    makeObservable(this, {
      status: observable,
      tempchange: action,
    })
  }

}

const text1 = new Text();

export default text1;

