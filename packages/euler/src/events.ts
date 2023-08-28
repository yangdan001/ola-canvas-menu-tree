// 事件中心
import { SupportedLocale } from './locale/types';
import EventEmitter from './utils/event_emitter';

interface Events {
  localeChange: (locale: SupportedLocale) => void;
}

export const appEventEmitter = new EventEmitter<Events>();

// 监听画布新增
export const addEventEmitter = new EventEmitter();

// 监听右侧tab2 uploadImg 
export const uploadImgEmitter = new EventEmitter();


