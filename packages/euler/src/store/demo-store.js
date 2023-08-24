import { action, computed, makeObservable, observable, toJS, remove, notification } from "./which";
import { runInAction } from 'mobx';
import { getHistoryRecord, getRecordTotal, getPing, postImage, getRecord, postImageToImage, getResponses } from '../services/api';
import React from 'react';
import fetchApi from '../services/fetch';
import _ from 'lodash';
const socketBaseURL = fetchApi.socketBaseURL;
class TextToImageStore {
  //所有form参数默认值


  status = {
    pageIndex: {
      aaa:'aaa',
      bbb:'bbb'
    },
  }

  updateInpainting = (value) => {
    runInAction(() => { this.status.pageIndex = 2 });
  }

  updateInpainting = (value) => {
    this.status.pageIndex = 2;
  }


  constructor() {
    makeObservable(this, {
      status: observable,
      updateInpainting: action,
    })
  }

}

const textToImageStore = new TextToImageStore();

export default textToImageStore;

