import React, { useState, useContext, useEffect } from 'react';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import shortid from 'shortid';
import {
  notification,
  Input,
  message, 
  ConfigProvider,
  Button,
  Tooltip,
  Checkbox,
  Col,
  ColorPicker,
  Form,
  InputNumber,
  Radio,
  Rate,
  Row,
  Select,
  Slider,
  Space,
  Switch,
  Upload,
  Icon
} from 'antd';
import _ from 'lodash';
import { EditOutlined, DownOutlined, UpOutlined, MenuOutlined, SettingOutlined, PlusOutlined } from '@ant-design/icons';
import {
  postPreprocess, getAllDescription, getHistoryRecord, getRecordTotal,postImage,getRecord,
  getPreprocessRes, putTemplate, getTemplate, deleteEngineTemplate,deleteLora
} from '../../../src/services/api';
import { EditorContext } from '../../context';
import './index.scss';
import fetchApi from '../../../src/services/fetch';
const socketBaseURL = fetchApi.socketBaseURL;
const { Option } = Select;
const { TextArea } = Input;
// 然后在需要使用这些图标的地方使用它们
// const iconEdit = <EditOutlined />;
// const iconDown = <DownOutlined />;
// const iconUp = <UpOutlined />;
const formItemLayout = {
  labelCol: {
    span: 6,
  },
  wrapperCol: {
    span: 14,
  },
};

const onFinish = (values) => {
  console.log('Received values of form: ', values);
};
const Generate = () => {
  const editor = useContext(EditorContext);
  const [form] = Form.useForm();//表单的form实例
  const [configOptions, setconfigOptions] = useState({});
  const [vh, setVh] = useState(window.innerHeight * 0.01);
  const [baseModelTips, setBaseModelTips] = useState({});
  const [isPromptsOpen, setIsPromptsOpen] = useState(false);
  const [isGenerationParametersOpen, setIsGenerationParametersOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [inpaintingChecked, setInpaintingChecked] = useState(false);
  const [multidiffusionChecked, setMultidiffusionChecked] = useState(false);
  const [stepsVal, setStepsVal] = useState(0);
  const [scaleVal, setScaleVal] = useState(0);
  const [fileObj, setFileObj] = useState({});

  useEffect(() => {
    const setVhToState = () => {
      setVh(window.innerHeight * 0.01);
    };
    window.addEventListener('resize', setVhToState);
    async function login() {
      
      let config;
      const result = await getAllDescription();
      function processJson(result) {
        const categories = [
          "base_model",
          "controlnet_model",
          "lora_model",
          "preprocess",
          "scheduler_model",
          "vae_model",
        ];
        const output = categories.reduce((output, category) => {
          output[category] = Object.entries(result.description[category]).map(([key, item]) => ({
            title: key,
            desc: item.desc,
            image: item.image,
            link: item.link,
            args: item.args,
            user: item.user,
          })).sort((a, b) => a.title.localeCompare(b.title));;
          return output;
        }, {});
        return output;
      }
      if (result && result.description) {
        const output = processJson(result);
        if (result && result.description) {
          config = output;
          console.log(output,'output')
          setconfigOptions(config);
          localStorage.setItem('config', JSON.stringify(config));
        }
        //表单默认值
        form.setFieldsValue({
          base_model_name: 'Base-V1-5.ckpt',
          vae_model_name: 'disabled.pt',
          positive_prompt: "poster of warrior goddess| standing alone on hill| centered| detailed gorgeous face| anime style| key visual| intricate detail| highly detailed| breathtaking| vibrant| panoramic| cinematic| Carne Griffiths| Conrad Roset| Makoto Shinkai",
          negative_prompt: "no words| watermark| bad anatomy| blurry| fuzzy| extra legs| extra arms| extra fingers| poorly drawn hands| poorly drawn feet| disfigured| out of frame| tiling| bad art| deformed| mutated| double face",
          number: 1,
          num_inference_steps: "60",
          cfg: "9.0",
          scheduler_name: 'Euler_a',
          width: "512",
          height: "768",
          seed: "1234",
          denoise:"0.75", //去噪强度 Denoising Strength
          widthHeight: '1'
        });
        //基础模型,Vae模型中的提示 
        if (config.base_model && config.base_model.length !== 0) {
          /* eslint-disable-next-line no-debugger */
      debugger
          const index = config.base_model.findIndex(item => item.title === 'Base-V1-5.ckpt');
          if (index !== -1) {
            setBaseModelTips(config.base_model[index]);
            console.log(config.base_model[index],'config.base_model[index]')
          } else {
            setBaseModelTips(config.base_model[0]);
          }
        }
      }
  }
  login();
    return () => {
      window.removeEventListener('resize', setVhToState);
    }
  }, []); 

  const normFile = (e) => {
    console.log('Upload event:', e);
    if(e&&e.file){
      setFileObj(e.file)
    }
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };
  const checkOptionsType = (model) => {
    console.log(model,'model')
    return model && model.map(item => {
      const { image } = item;
      return <Option value={item.title} key={item.title} item={item}>
        <Tooltip title={
          <div>
            {image && image.length !== 0 ? (
              image.map((itemSrc, index) => {
                if (itemSrc) {
                  return <img key={shortid.generate()} src={itemSrc} alt="itemSrc" style={{ width: 70, height: 70 }} />
                }
              })
            ) : null}
            <div>{item.desc && item.desc}</div>
          </div>
        } placement="right">
          <div>{item.title}</div>
        </Tooltip>
      </Option>
    })
  }

  //
  const onChangeSteps = (value) => {
    console.log('onChange: ', value);
    setStepsVal(value)
  }
  //
  const onAfterChangeSteps = (value) => {
    console.log('onAfterChange: ', value);
    setStepsVal(value)
  }

  //
  const onChangeScale = (value) => {
    console.log('onChange: ', value);
    setScaleVal(value)
  }
  //
  const onAfterChangeScale = (value) => {
    console.log('onAfterChange: ', value);
    setScaleVal(value)

  }
  const onInpaintingChange = (value) => {
    console.log(value,'value888')
    setInpaintingChecked(value)
    // if()
  }

  const onMultidiffusionChange = (value) => {
    setMultidiffusionChecked(value)
  }
  
    //存储历史图片和处理后需要渲染的图片列表
  const changeHistoryImages = (process, history) => {
      // runInAction(() => {
      //   this.processHistoryImages = process.reverse();
      //   this.historyImages = history;
      // });
      localStorage.setItem('processHistoryImages', process.reverse())
      localStorage.setItem('historyImages', history)
    }

  //点击ImageGallery下方滑动视图组件时方法
  const ImageGalleryClick = (record, type) => {
    let tempHistoryImages = localStorage.getItem('historyImages')[localStorage.getItem('historyImages').length - 1];
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
      localStorage.getItem('historyImages').map((item) => {
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
    //文生图
  const textToImageSocket = async (backendData, controlnetFiles) => {
      await postImage(backendData, controlnetFiles).then((RES) => {
        try {
          if (!RES || RES.code !== 0) {
            notification.error({
              message: '请求错误',
              description: `${RES && RES.message ? RES.message : ''}`,
            });
            // this.changeImageListLoading(false)//视图组件
            // this.changetextToLoading(false);//历史图片组件loading
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
                  // runInAction(() => {
                  //   this.textToImageDataRes = event && JSON.parse(event.data);
                  // });
                  let textToImageDataRes = event && JSON.parse(event.data);
                  localStorage.setItem('textToImageDataRes', textToImageDataRes)
                }
              };
              socket.onclose = async (event) => {
                console.log('close');
                console.log(localStorage.getItem('textToImageDataRes'));
                if (localStorage.getItem('textToImageDataRes') && localStorage.getItem('textToImageDataRes').status === 'COMPLETED') {
                  const res = await getRecord(RES.params.task_id);
                  let tempImagesArr = [];
                  var temp = _.clone(localStorage.getItem('historyImages'));
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
                    changeHistoryImages([...tempImagesArr], temp);
                    ImageGalleryClick(res.params, 'again')
                    // this.changeImageListLoading(false)//视图组件
                    // this.changetextToLoading(false);//历史图片组件loading
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
                    // this.changeImageListLoading(false)//视图组件
                    // this.changetextToLoading(false);//历史图片组件loading
                  }
                } else {
                  notification.error({
                    message: '操作失败',
                    description: `请求失败`,
                  });
                  // this.changeImageListLoading(false)//视图组件
                  // this.changetextToLoading(false);//历史图片组件loading
                }
              };
            } else {
              notification.error({
                message: '接口错误',
                description: `task_id不存在或发生异常`,
              });
              // this.changeImageListLoading(false)//视图组件
              // this.changetextToLoading(false);//历史图片组件loading
            }
          }
        } catch (err) {
          this.changeImageListLoading(false)//视图组件
          this.changetextToLoading(false);//历史图片组件loading
        }
      })
    }

  //表单提交逻辑
  const onFinish = _.debounce(async (values) => {
    let frameType = localStorage.getItem("frameType")
    let initValue = {
      "isInpainting": "0",
      "models": {
        "base_model_name": "Base-V1-5.ckpt",
        "vae_model_name": "disabled.pt"
      },
      "lora": [{
        "model_name": "CreamTheRabbit.safetensors",
        "unet_weights": 1,
        "te_weights": 1
      }],
      "controlnet": [{
        "model_name": "Control_V11p_Sd15s2_Lineart_Anime.pth",
        "apply": {
          "strength": 0.2
        },
        "preprocess": [],
        "load_img_index": 1
      }],
      "image_names": {
        "control_image_name": ["117d487c1263439b249a57f281fe6407.jpg"],
        "custom_image_name": ["117d487c1263439b249a57f281fe6407.jpg"]
      },
      "prompts": {
        "positive_prompt": "poster of warrior goddess| standing alone on hill| centered| detailed gorgeous face| anime style| key visual| intricate detail| highly detailed| breathtaking| vibrant| panoramic| cinematic| Carne Griffiths| Conrad Roset| Makoto Shinkai",
        "negative_prompt": "no words| watermark| bad anatomy| blurry| fuzzy| extra legs| extra arms| extra fingers| poorly drawn hands| poorly drawn feet| disfigured| out of frame| tiling| bad art| deformed| mutated| double face"
      },
      "sampler_params": {
        "number": 1,
        "num_inference_steps": "60",
        "cfg": "9.0",
        "scheduler_name": "Euler_a",
        "width": "512",
        "height": "768",
        "seed": "1234",
        "denoise": "0.75"
      }
    }
    // if (clipEditStatus) {
    //   message.warning('请先退出CLIP提示词编辑模式，再生成图片');
    //   return false;
    // }
    try {
      //校验图生图是否上传了图片
      if (frameType != 'meta' && !fileObj) {
        message.error('请上传图片！');
        return false;
      }
      let value = await form.validateFields();
      console.log(value,'value33')
      // let controlnetFiles={
      //   name: '',
      //   lastModified: '1692625729887',
      //   lastModifiedDate: 'Mon Aug 21 2023 21: 48: 49 GMT + 0800(中国标准时间)',
      //   webkitRelativePath: '',
      // }
      // let controlnetFiles=fileObj || {}
      // textToImageSocket(initValue, controlnetFiles)
      //拼接json对象，传递后端
  // let datas = {
  //   models: {
  //     base_model_name: value.base_model_name,
  //     vae_model_name: initValue.models.vae_model_name,
  //   },
  //   lora: value.lora ? value.lora : [],
  //   controlnet: store.status.controlnet.length !== 0 ? controlNetArray : [],
  //   image_names: {
  //     control_image_name: store.status.controlnet.length !== 0 ? imageNamesArray : [],
  //     custom_image_name: tempCheck(value, store, selectType),
  //   },
  //   prompts: {
  //     positive_prompt: value.positive_prompt,
  //     negative_prompt: value.negative_prompt ? value.negative_prompt : null,
  //   },
  //   sampler_params: {
  //     number: value.number,
  //     num_inference_steps: value.num_inference_steps,
  //     cfg: value.cfg,
  //     scheduler_name: value.scheduler_name,
  //     width: value.width,
  //     height: value.height,
  //     seed: value.seed ? value.seed : 'disable',
  //     denoise: value.denoise, //去噪强度 Denoising Strength
  //   }
  // }
      //处理后端所需字段，用来传递给后端
      // let backendData = setDatas(value, toJS(textToImageStore), selectType);
      // //页面渲染所需数据
      // let storeData = setStoreDatas(value, toJS(textToImageStore), selectType);
      // //处理所有图片（target_file）
      // const controlnetFiles = manageControlnetFile(toJS(textToImageStore.status), selectType);
      // //处理前端页面所需数据
      // textToImageStore.setStatus(storeData);
      // //判断controlnet文件是否存在
      // // return false
      // console.log(backendData, controlnetFiles);
      // return false
      // if (toJS(textToImageStore.status.controlnet).length !== 0) {
      //   const nullIndexes = toJS(textToImageStore.status.controlnet).filter(obj => obj.target_file === '' || obj.target_file === null || obj.target_file === undefined).map(obj => toJS(textToImageStore.status.controlnet).indexOf(obj));
      //   const newIndexes = nullIndexes.map(index => index + 1);
      //   if (newIndexes.length !== 0) {
      //     return false
      //   } else {
      //     textToImageStore.changetextToLoading(true);//历史图片组件loading
      //     textToImageStore.changeImageListLoading(true)//视图组件
      //     // 更新表单值 

      //     form.setFieldsValue({ lora: textToImageStore.status.lora, });
      //     //文生图逻辑处理
      //     if (selectType === '1') {
      //       textToImageStore.textToImageSocket(backendData, controlnetFiles)
      //     }
      //     if (selectType === '2') {
      //       textToImageStore.imageToImageSocket(backendData, controlnetFiles)
      //     }
      //   }
      //   return false;
      // } else {
      //   textToImageStore.changetextToLoading(true);//历史图片组件loading
      //   textToImageStore.changeImageListLoading(true)//视图组件
      //   // 更新表单值 
      //   form.setFieldsValue({ lora: textToImageStore.status.lora, });
      //   //文生图逻辑处理
      //   console.log(backendData, controlnetFiles);
      //   if (selectType === '1') {
      //     textToImageStore.textToImageSocket(backendData, controlnetFiles)
      //   }
      //   if (selectType === '2') {
      //     textToImageStore.imageToImageSocket(backendData, controlnetFiles)
      //   }
      // }
    } catch (errorInfo) {
      // textToImageStore.changeImageListLoading(false)//视图组件
      // textToImageStore.changetextToLoading(false);//历史图片组件loading
    }
  }, 300)

return(
  <div className="generate">
<Form
    form={form}
    name="validate_other"
    {...formItemLayout}
    onFinish={onFinish}
    initialValues={{
      // "isInpainting": "0",
      // "models": {
      //   "base_model_name": "Base-V1-5.ckpt",
      //   "vae_model_name": "disabled.pt"
      // },
      // "lora": [{
      //   "model_name": "CreamTheRabbit.safetensors",
      //   "unet_weights": 1,
      //   "te_weights": 1
      // }],
      // "controlnet": [{
      //   "model_name": "Control_V11p_Sd15s2_Lineart_Anime.pth",
      //   "apply": {
      //     "strength": 0.2
      //   },
      //   "preprocess": [],
      //   "load_img_index": 1
      // }],
      // "image_names": {
      //   "control_image_name": ["117d487c1263439b249a57f281fe6407.jpg"],
      //   "custom_image_name": ["117d487c1263439b249a57f281fe6407.jpg"]
      // },
      // "prompts": {
      //   "positive_prompt": "poster of warrior goddess| standing alone on hill| centered| detailed gorgeous face| anime style| key visual| intricate detail| highly detailed| breathtaking| vibrant| panoramic| cinematic| Carne Griffiths| Conrad Roset| Makoto Shinkai",
      //   "negative_prompt": "no words| watermark| bad anatomy| blurry| fuzzy| extra legs| extra arms| extra fingers| poorly drawn hands| poorly drawn feet| disfigured| out of frame| tiling| bad art| deformed| mutated| double face"
      // },
      // "sampler_params": {
      //   "number": 1,
      //   "num_inference_steps": "60",
      //   "cfg": "9.0",
      //   "scheduler_name": "Euler_a",
      //   "width": "512",
      //   "height": "768",
      //   "seed": "1234",
      //   "denoise": "0.75"
      // }
    }}
    style={{
      maxWidth: 600,
    }}
    labelCol={{
      style: { width: 120,textAlign:'left' }
    }}
    
  >
    <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}  >
    <Form.Item
      name="base_model_name"
      // label="Select"
      hasFeedback
      rules={[
        {
          required: true,
          message: '请选择模型',
        },
      ]}
    >
      <div className='model-title'>Model</div>
      {baseModelTips.title&&<Select 
      placeholder="请选择模型"
      defaultValue={baseModelTips.title}
      >
      {checkOptionsType(configOptions.base_model || [])}
      </Select>}
    </Form.Item>
    </ConfigProvider>
    <div>
      <div 
        className="prompts-header" 
        onClick={() => {
        setIsPromptsOpen(!isPromptsOpen)
        }}>
          <div className='prompts-left'>
            <EditOutlined /> 
            <div className='prompts-left-title'>Prompts</div>
          </div>
          {isPromptsOpen?<DownOutlined />:<UpOutlined />}
      </div>
      <div>
      {!isPromptsOpen?
      <div className='prompts-content'>
        <div className='prompts-content-title'>Prompt</div>
        <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}   >
          <Form.Item name="positive_prompt" >
            <TextArea rows={6} className="no-resize" />
          </Form.Item>
        </ConfigProvider>
        <div  className='negative-content-title'>Negative prompt</div>
        <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}   >
          <Form.Item name="negative_prompt" >
            <TextArea rows={6} />
          </Form.Item>
        </ConfigProvider>
        <div className='negative-content-dec' >Concepts specified in the negative prompt won't guide the generation.</div>
      </div>
      :null}
      </div>
    </div>
    <div>
      <div 
        className="prompts-header marT-20" 
        onClick={() => {
        setIsGenerationParametersOpen(!isGenerationParametersOpen)
        }}>
          <div className='prompts-left'>
            <MenuOutlined />
            <div className='prompts-left-title'>Generation Parameters</div>
          </div>
          {isGenerationParametersOpen?<DownOutlined />:<UpOutlined />}
      </div>
      <div>
      {!isGenerationParametersOpen?
      <div className='slider-box'>
        <div className='slider-title'>Steps {stepsVal}</div>
        <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}   >
          <Form.Item name={'num_inference_steps'} style={{marginBottom:0}}>
            <Slider min={0} max={1} step={0.01} trackStyle={{ backgroundColor: '#7F39FB' }} railStyle={{ backgroundColor: '#FFFFFF' }} defaultValue={0.75} onChange={onChangeSteps} onAfterChange={onAfterChangeSteps} />
          </Form.Item>
        </ConfigProvider>
        <div className='slider-dec'>Results are better the more steps you use. If you want faster results you can use a smaller number.</div>
        <div className='slider-title'>Guidance {scaleVal}</div>
        <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}   >
          <Form.Item name={'cfg'} style={{marginBottom:0}}>
            <Slider min={0} max={1} step={0.01} trackStyle={{ backgroundColor: '#7F39FB' }} railStyle={{ backgroundColor: '#FFFFFF' }} defaultValue={0.75} onChange={onChangeScale} onAfterChange={onAfterChangeScale} />
          </Form.Item>
        </ConfigProvider>
        <div className='slider-dec'>Increasing guidance scale forces the generation to better match the prompt.</div>
      </div>
      :null}
      </div>
    </div>
    <div>
      <div 
        className="prompts-header" 
        onClick={() => {
        setIsAdvancedOpen(!isAdvancedOpen)
        }}>
          <div className='prompts-left'>
            <SettingOutlined />
            <div>Advanced</div>
          </div>
          {isAdvancedOpen?<DownOutlined />:<UpOutlined />}
      </div>
      <div>
      {!isAdvancedOpen?
      <div  className='generate-select'>
        <div className='generate-title marT-10 marB-3'>ControlNet</div>
        <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}   >
          <Form.Item name="controlnet" >
          <Select 
          // placeholder="请选择controlnet模型"
          >
          {checkOptionsType(configOptions.preprocess || [])}
          </Select>
          </Form.Item>
        </ConfigProvider>
        <div className='generate-title marT-10 marB-3'>LoRA</div>
        <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}   >
          <Form.Item name="lora" >
            <Select 
            // placeholder="请选择Lora模型"
            >
            {checkOptionsType(configOptions.lora_model || [])}
            </Select>
          </Form.Item>
        </ConfigProvider>
      </div>
      :null}
      </div>
    </div>
    <Form.Item name="isInpainting" label="Inpainting" valuePropName="checked">
      <Switch checked={inpaintingChecked} defaultChecked={false} onChange={onInpaintingChange}/>
    </Form.Item>
    <Form.Item name="Multidiffusion" label="Multidiffusion"  valuePropName="multidiffusionChecked">
      <Switch checked={multidiffusionChecked} defaultChecked={false} onChange={onMultidiffusionChange}/>
    </Form.Item>
    <div className='generate-title  marB-3'>Image Content</div>
    <Form.Item
      name="custom_image_name"
      // label="Upload"
      valuePropName="fileList"
      getValueFromEvent={normFile}
      extra=""
    >
      <Upload name="logo" action="/upload.do" listType="picture">
        <div className='upload-box'>
          <PlusOutlined style={{ fontSize: '24px', color: '#985EFF' }}/>
        </div>
      </Upload>
    </Form.Item>
    <Form.Item
      wrapperCol={{
        span: 12,
        offset: 6,
      }}
    >
      {/* <Space> */}
        <Button type="primary" htmlType="submit" className='generate-btn'>
          Submit
        </Button>
      {/* </Space> */}
    </Form.Item>
  </Form>
  </div>
)
}
export default Generate;