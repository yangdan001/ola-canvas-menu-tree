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
    isInpainting: '0',
    models: {
      "base_model_name": null,
      "vae_model_name": null,
    },
    lora: [],
    sampler_params: {
      prompts: {
        positive_prompt: "poster of warrior goddess| standing alone on hill| centered| detailed gorgeous face| anime style| key visual| intricate detail| highly detailed| breathtaking| vibrant| panoramic| cinematic| Carne Griffiths| Conrad Roset| Makoto Shinkai",
        negative_prompt: "no words| watermark| bad anatomy| blurry| fuzzy| extra legs| extra arms| extra fingers| poorly drawn hands| poorly drawn feet| disfigured| out of frame| tiling| bad art| deformed| mutated| double face"
      },
      number: 1,
      num_inference_steps: "60",
      cfg: "9.0",
      scheduler_name: null,
      width: "512",
      height: "768",
      seed: "1234",
      denoise:"0.75" //去噪强度 Denoising Strength
    },
    controlnet: [],
    data: [],//图片
    image_names: {
      control_image_name: [],
      custom_image_name: [],
    },//图片名
  };

  textToLoading = false;//展示图片组件loading 上面的
  imageListLoading = false;//历史图片组件loading 下面的
  processHistoryImages = [];//当前展示的处理完成的历史图片列表
  historyImages = [];//当前所有历史图片列表
  targetImages = [];//点击历史图片加载对应的图片列表
  Record = {};//存储当前点击的record
  networkStatus = true;  //正常 不正常
  textToImageDataRes = {}; //文生图socket接收状态
  imageToImageDataRes = {}; //图生图socket接收状态

  constructor() {
    makeObservable(this, {
      status: observable,
      changeStatus: action,
      setStatus: action,
      setLoar: action,
      setLoaritems: action,
      setControlNet: action,
      changeControlnetOptions: action,
      setControlNetitems: action,
      updateLoraModel: action,
      updateControlnetModule: action,
      removeLoraModel: action,
      removeControlnetModel: action,
      resetStatus: action,
      setFile: action,
      textToLoading: observable,
      imageListLoading: observable,
      processHistoryImages: observable,
      deleteTargetImages: observable,
      targetImages: observable,
      historyImages: observable,
      networkStatus: observable,
      textToImageDataRes: observable,
      imageToImageDataRes: observable,
      changetextToLoading: action,
      performPingWithTimeout: action,
      changeImageListLoading: action,
      changeHistoryImages: action,
      ImageGalleryClick: action,
      resetImages: action,
      textToImageSocket: action,
    })
  }
  //文生图
  textToImageSocket = async (backendData, controlnetFiles) => {
    await postImage(backendData, controlnetFiles).then((RES) => {
      try {
        if (!RES || RES.code !== 0) {
          notification.error({
            message: '请求错误',
            description: `${RES && RES.message ? RES.message : ''}`,
          });
          this.changeImageListLoading(false)//视图组件
          this.changetextToLoading(false);//历史图片组件loading
          return false;
        } else {
          if (RES.params.task_id) {
            const socketUrl = `${socketBaseURL}/task/progress/${RES.params.task_id}`;
            const socket = new WebSocket(socketUrl);
            socket.onopen = () => {
              console.log('WebSocket连接已打开');
            };
            socket.onmessage = (event) => {
              console.log('触发', JSON.parse(event.data));
              if (event && JSON.parse(event.data)&&JSON.parse(event.data)!={}) {
                runInAction(() => {
                  this.textToImageDataRes = event && JSON.parse(event.data);
                });
              }
            };
            socket.onclose = async (event) => {
              console.log('close');
              console.log(toJS(this.textToImageDataRes));
              if (toJS(this.textToImageDataRes) && toJS(this.textToImageDataRes).status === 'COMPLETED') {
                const res = await getRecord(RES.params.task_id);
                let tempImagesArr = [];
                var temp = _.clone(toJS(this.historyImages));
                if (res && res.code === 0 && res.params && res.params.images && res.params.images.length !== 0) {
                  //处理历史
                  if (temp.length >= 5) { temp.splice(0, 1) }
                  temp.push(res.params);
                  temp.map(item => {
                    tempImagesArr.push({
                      id: item.record_id,
                      url: item.images && item.images.length !== 0 ? item.images[0] : item.images[0],
                      recorc_id: item.record_id
                    })
                  })
                  //tempImagesArr 处理下方展示所需图片(取每个item中的第一个)
                  //temp 所有历史的record
                  this.changeHistoryImages([...tempImagesArr], temp);
                  this.ImageGalleryClick(res.params, 'again')
                  this.changeImageListLoading(false)//视图组件
                  this.changetextToLoading(false);//历史图片组件loading
                  getRecordTotal().then((res) => {
                    if (res && res.code === 0) {
                      this.total = res.params.total;
                    }
                  })
                } else {
                  notification.error({
                    message: '操作失败',
                    description: `${res && res.message ? res.message : '请求异常'}`,
                  });
                  this.changeImageListLoading(false)//视图组件
                  this.changetextToLoading(false);//历史图片组件loading
                }
              } else {
                notification.error({
                  message: '操作失败',
                  description: `请求失败`,
                });
                this.changeImageListLoading(false)//视图组件
                this.changetextToLoading(false);//历史图片组件loading
              }
            };
          } else {
            notification.error({
              message: '接口错误',
              description: `task_id不存在或发生异常`,
            });
            this.changeImageListLoading(false)//视图组件
            this.changetextToLoading(false);//历史图片组件loading
          }
        }
      } catch (err) {
        this.changeImageListLoading(false)//视图组件
        this.changetextToLoading(false);//历史图片组件loading
      }
    })
  }

  //图生图
  imageToImageSocket = async (backendData, controlnetFiles, files) => {
    await postImageToImage(backendData, controlnetFiles, files).then((RES) => {
      try {
        if (!RES || RES.code !== 0) {
          notification.error({
            message: '请求错误',
            description: `${RES && RES.message ? RES.message : ''}`,
          });
          this.changeImageListLoading(false)//视图组件
          this.changetextToLoading(false);//历史图片组件loading
          return false;
        } else {
          if (RES.params.task_id) {
            const socketUrl = `${socketBaseURL}/task/progress/${RES.params.task_id}`;
            const socket = new WebSocket(socketUrl);
            socket.onopen = () => {
              console.log('WebSocket连接已打开');
            };
            socket.onmessage = (event) => {
              console.log('触发', JSON.parse(event.data));
                if (event && JSON.parse(event.data)&&JSON.parse(event.data)!={}) {
                  runInAction(() => {
                    this.imageToImageDataRes = event && JSON.parse(event.data);
                  });
                }
            };
            socket.onclose = async (event) => {
              console.log(toJS(this.imageToImageDataRes));
              if (toJS(this.imageToImageDataRes) && toJS(this.imageToImageDataRes).status === 'COMPLETED') {
                const res = await getRecord(RES.params.task_id);
                let tempImagesArr = [];
                var temp = _.clone(toJS(this.historyImages));
                if (res && res.code === 0 && res.params && res.params.images && res.params.images.length !== 0) {
                  //处理历史
                  if (temp.length >= 5) { temp.splice(0, 1) }
                  temp.push(res.params);
                  temp.map(item => {
                    tempImagesArr.push({
                      id: item.record_id,
                      url: item.images && item.images.length !== 0 ? item.images[0] : item.images[0],
                      recorc_id: item.record_id
                    })
                  })
                  //tempImagesArr 处理下方展示所需图片(取每个item中的第一个)
                  //temp 所有历史的record
                  this.changeHistoryImages([...tempImagesArr], temp);
                  this.ImageGalleryClick(res.params, 'again')
                  this.changeImageListLoading(false)//视图组件
                  this.changetextToLoading(false);//历史图片组件loading
                  getRecordTotal().then((res) => {
                    if (res && res.code === 0) {
                      this.total = res.params.total;
                    }
                  })
                } else {
                  notification.error({
                    message: '操作失败',
                    description: `${res && res.message ? res.message : '请求异常'}`,
                  });
                  this.changeImageListLoading(false)//视图组件
                  this.changetextToLoading(false);//历史图片组件loading
                }
              } else {
                notification.error({
                  message: '操作失败',
                  description: `请求失败`,
                });
                this.changeImageListLoading(false)//视图组件
                this.changetextToLoading(false);//历史图片组件loading
              }
            };
          } else {
            notification.error({
              message: '接口错误',
              description: `task_id不存在或发生异常`,
            });
            this.changeImageListLoading(false)//视图组件
            this.changetextToLoading(false);//历史图片组件loading
          }
        }
      } catch (err) {
        this.changeImageListLoading(false)//视图组件
        this.changetextToLoading(false);//历史图片组件loading
      }
    })
  }

  //删除后更新数据
  deleteTargetImages = (params) => {
    let temp = toJS(this.targetImages.images);
    let filteredTemp = temp.filter((item) => params.image.id !== item.id);
    // 更新目标图像数组
    let temp2 = toJS(this.historyImages).map((item) => {
      if (params.record.record_id === item.record_id) {
        let images_id = [...item.images_id]; // 复制 images_id 数组
        let filteredImages_id = images_id.filter((id) => id !== params.image.id); // 过滤掉重复的项
        return {
          ...item,
          images: filteredTemp.map((item) => item.url),
          images_id: filteredImages_id
        };
      }
      return item;
    });
    runInAction(() => {
      this.targetImages.images = filteredTemp;
      this.historyImages = temp2;
    });
  }

  resetImages = () => {
    this.processHistoryImages = [];//当前展示的处理完成的历史图片列表
    this.historyImages = [];//当前所有历史图片列表
    this.targetImages = [];//点击历史图片加载对应的图片列表
  }

  //点击ImageGallery下方滑动视图组件时方法
  ImageGalleryClick = (record, type) => {
    let tempHistoryImages = toJS(this.historyImages)[toJS(this.historyImages).length - 1];
    if (type && type === 'again') {
      if (tempHistoryImages && tempHistoryImages.img_files && tempHistoryImages.img_files.length !== 0) {
        this.targetImages = {
          ...tempHistoryImages,
          images: tempHistoryImages.img_files.map((item, index) => {
            return {
              id: tempHistoryImages.images_id[index],
              url: item,
              record_id: record.record_id
            }
          })
        }
      } else if (tempHistoryImages && tempHistoryImages.images.length !== 0) {
        this.targetImages = {
          ...tempHistoryImages,
          images: tempHistoryImages.images.map((item, index) => {
            return {
              id: tempHistoryImages.images_id[index],
              url: item,
              record_id: record.record_id
            }
          })
        }
      } else {
        this.targetImages = { images: [] }
      }
    } else {
      toJS(this.historyImages).map((item) => {
        if (record.id === item.record_id) {
          this.targetImages = {
            ...item,
            images: item.images && item.images.length !== 0 ? item.images.map((image_item, index) => {
              return {
                id: item.images_id[index],
                url: image_item,
                record_id: record.record_id
              }
            }) :
              item.images.map((image_item, index) => {
                return {
                  id: item.images_id[index],
                  url: image_item,
                  record_id: record.record_id
                }
              })
          };
        }
      })
    }
  }

  //存储历史图片和处理后需要渲染的图片列表
  changeHistoryImages = (process, history) => {
    runInAction(() => {
      this.processHistoryImages = process.reverse();
      this.historyImages = history;
    });
  }

  page_size = 5;
  total = 0;
  currentOffset = null;

  //获取所有历史图片
  mobxGetHistoryRecord = async (type, changeType) => {
    this.changetextToLoading(true)
    if (type === 'again') {
      textToImageStore.changeImageListLoading(true)//视图组件
    }
    let tempImagesArr = [];
    await getRecordTotal().then((res) => {
      if (res && res.code === 0) {
        if (res.params && res.params.total === 0) {
          this.changetextToLoading(false);
          return false;
        } else {
          this.total = res.params.total || 0;
          if (this.total <= this.page_size) {
            this.currentOffset = 0
          } else {
            //changeType 翻页按钮才存在这个值
            if (!changeType) {
              this.currentOffset = this.total - this.page_size;
            }
            if (changeType === 'last') {
              let temp = this.currentOffset - this.page_size;
              if (temp <= 0) {
                this.currentOffset = 0
              } else {
                this.currentOffset = temp;
              }
            }
            if (changeType === 'next') {
              let temp = this.currentOffset + this.page_size;
              if (temp >= this.total) {
                this.currentOffset = this.currentOffset;
              } else {
                this.currentOffset = temp;
              }
            }
          }
          getHistoryRecord(
            {
              page_size: this.page_size,
              // offset: res.params.total <= 5 ? 0 : res.params.total - 5
              offset: this.currentOffset
            }

          ).then((res2) => {
            if (res2 && res.code === 0) {
              res2.params.map(item => {
                tempImagesArr.push({
                  id: item.record_id,
                  url: item.images[0],
                  recorc_id: item.record_id
                })
              })
              this.changetextToLoading(false)
              textToImageStore.changeImageListLoading(false)//视图组件
              this.changeHistoryImages([...tempImagesArr], res2.params)
              if (type === 'again') {
                this.ImageGalleryClick(res2.params[res2.params.length - 1], 'again')
              }
            } else {
              this.changetextToLoading(false)
              textToImageStore.changeImageListLoading(false)//视图组件
              notification.error({
                message: '发生错误',
                description: `${res2 && res2.message ? res2.message : '发生未知错误'}`,
              });
            }
          })
        }
      } else {
        this.changetextToLoading(false)
        textToImageStore.changeImageListLoading(false)//视图组件
      }
    })
  }

  changetextToLoading = (value) => {
    runInAction(() => { this.textToLoading = value })
  }

  changeImageListLoading = (value) => {
    this.imageListLoading = value
  }

  changeStatus = (config) => {
    this.status = {
      ...this.status,
      models: {
        base_model_name: config.base_model[0],
        vae_model_name: config.vae_model[0],
      },
      sampler_params: {
        ...this.status.sampler_params,
        scheduler_name: config.scheduler_model[0]
      }
    }
  }

  setRecord = (record) => { this.Record = record }

  // 删除lora下拉选中user不为0的情况
  removeLoraModel = (index) => { 
    this.status.lora.splice(index, 1);
  };

  removeControlnetModel = (index) => { this.status.controlnet.splice(index, 1); };

  setStatus = (data) => { this.status = { ...data }; }

  setLoar = () => {
    this.status.lora.push({
      "model_name": "",
      "unet_weights": 1,
      "te_weights": 1
    },)
  }
  setLoaritems = (data) => {
    runInAction(() => {
      this.status.lora = data
    });
  }

  setControlNet = (data) => {
    this.status.controlnet.push({
      "file_url": null,
      "file": null,
      "file_url": null,
      "target_file": null,
      "target_file_url": null,
      "model_name": "",
      "apply": {
        "strength": "",
      },
      "load_img_index": this.status.controlnet.length,
      "options": data
    },)
  }

  changeControlnetOptions = (data, index) => {
    runInAction(() => {
      this.status.controlnet[index].options = data;
      this.status.controlnet[index].target_file = null;
      this.status.controlnet[index].target_file_url = null;
      this.status.controlnet[index].model_name = "";
    });
  }

  setControlNetitems = (data) => {
    runInAction(() => {
      this.status.controlnet = data
    });
  }

  setFile = (options) => {
    if (options.type === 'first') {
      runInAction(() => {
        this.status.controlnet[options.index].file = options.info.file;
        this.status.controlnet[options.index].file_url = options.fileUrl;
      });
    }
    if (options.type === 'second') {
      runInAction(() => {
        this.status.controlnet[options.index].target_file = options.info.file;
        this.status.controlnet[options.index].target_file_url = options.secondUrl;
      });
    }
    if (options.type === 'image') {
      runInAction(() => {
        const { file, } = options.info;
        this.status.image_names.custom_image_name = {
          file: file,
          file_url: options.imageUrl,
          mask: this.status.image_names.custom_image_name.mask ? this.status.image_names.custom_image_name.mask : undefined,
          mask_url: this.status.image_names.custom_image_name.mask_url ? this.status.image_names.custom_image_name.mask_url : undefined,
        };
      });
      console.log(toJS(this.status.image_names.custom_image_name));
    }



    if (options.type === 'mask') {
      runInAction(() => {
        const { file, } = options.info;
        this.status.image_names.custom_image_name = {
          file: this.status.image_names.custom_image_name.file ? this.status.image_names.custom_image_name.file : undefined,
          file_url: this.status.image_names.custom_image_name.file_url ? this.status.image_names.custom_image_name.file_url : undefined,
          mask: file,
          mask_url: options.imageUrl,
        };
      });
      console.log(toJS(this.status.image_names.custom_image_name));
    }


  }

  updateLoraModel = (index, modelData, type) => {
    runInAction(() => { this.status.lora[index] = modelData; });
  };

  updateControlnetModule = (index, modelData) => {
    runInAction(() => {
      this.status.controlnet[index] = {
        ...this.status.controlnet[index],
        ...modelData
      }
    });
  };

  //预处理替换图片方法
  updateControlnetSecondfile = (data, url, index) => {
    runInAction(() => {
      this.status.controlnet[index].file = null;
      this.status.controlnet[index].file_url = null;
      this.status.controlnet[index].target_file = data;
      this.status.controlnet[index].target_file_url = url;
    });
  }

  //image组件save方法保存编辑后的图片
  updateCustomImageName = (file, file_url, start_file, start_file_url) => {
    runInAction(() => {
      this.status.image_names.custom_image_name = {
        file: file,
        file_url: file_url,
        start_file,
        start_file_url,
        mask: this.status.image_names.custom_image_name.mask ? this.status.image_names.custom_image_name.mask : undefined,
        mask_url: this.status.image_names.custom_image_name.mask_url ? this.status.image_names.custom_image_name.mask_url : undefined,
      };
    });
    console.log(toJS(this.status.image_names));
  }

  removeStart_file = () => {
    runInAction(() => {
      this.status.image_names.custom_image_name = {
        start_file: undefined,
        start_file_url: undefined
      };
    });
  }
  removeMask_file = () => {
    runInAction(() => {
      this.status.image_names.custom_image_name.mask = undefined;
      this.status.image_names.custom_image_name.mask_url = undefined;
    });
  }



  //更新图生文Inpainting字段
  updateInpainting = (value) => {
    runInAction(() => { this.status.isInpainting = value ? '1' : '0'; });
  }

  isPingSuccessful = false;
  pingResponse = false;
  performPingWithTimeout = async (intervalDuration, timeoutDuration) => {
    let isTimeout = false;
    let isPingSuccessful = false;

    const performPing = async () => {
      try {
        const response = await getPing();
        this.setPingResponse(response);
        isPingSuccessful = true;
      } catch (error) {
        console.log('没响应', error.message);
        isPingSuccessful = false;
      }
    };

    const sendPing = async () => {
      await performPing();
      if (!isTimeout) {
        setTimeout(sendPing, intervalDuration);
        if (this.pingResponse === undefined || this.pingResponse.code !== 0) {
          runInAction(() => { this.networkStatus = false });
        } else {
          console.log('没超时');
          runInAction(() => { this.networkStatus = true });
        }
      } else {
        setTimeout(sendPing, intervalDuration);
        if (this.pingResponse === undefined || this.pingResponse.code !== 0) {
          runInAction(() => { this.networkStatus = false });
        } else {
          runInAction(() => { this.networkStatus = true });
        }
      }
    };

    setTimeout(() => {
      isTimeout = true;
    }, timeoutDuration);

    sendPing(); // 只在此处调用一次
  }

  setPingResponse(response) { this.pingResponse = response; }
  setPingStatus(status) { this.isPingSuccessful = status; }

  resetStatus = () => {
    this.status = {
      isInpainting: '0',
      models: {
        "base_model_name": null,
        "vae_model_name": null,
      },
      lora: [],
      sampler_params: {
        prompts: {
          positive_prompt: "poster of warrior goddess| standing alone on hill| centered| detailed gorgeous face| anime style| key visual| intricate detail| highly detailed| breathtaking| vibrant| panoramic| cinematic| Carne Griffiths| Conrad Roset| Makoto Shinkai",
          negative_prompt: "no words| watermark| bad anatomy| blurry| fuzzy| extra legs| extra arms| extra fingers| poorly drawn hands| poorly drawn feet| disfigured| out of frame| tiling| bad art| deformed| mutated| double face"
        },
        number: 1,
        num_inference_steps: "60",
        cfg: "9.0",
        scheduler_name: null,
        width: "512",
        height: "768",
        seed: "1234",
        denoise:"0.75" //去噪强度 Denoising Strength
      },
      controlnet: [],
      data: [],//图片
      image_names: {
        control_image_name: [],
        custom_image_name: [],
      },//图片名
    };
  }
}

const textToImageStore = new TextToImageStore();

export default textToImageStore;

