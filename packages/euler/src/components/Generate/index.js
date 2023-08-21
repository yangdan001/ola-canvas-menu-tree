import React, { useState, useContext, useEffect } from 'react';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import shortid from 'shortid';
import {
  Input,
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
  postPreprocess, getAllDescription, getHistoryRecord, getRecordTotal,
  getPreprocessRes, putTemplate, getTemplate, deleteEngineTemplate,deleteLora
} from '../../../src/services/api';
import { EditorContext } from '../../context';
import './index.scss';
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
const normFile = (e) => {
  console.log('Upload event:', e);
  if (Array.isArray(e)) {
    return e;
  }
  return e?.fileList;
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
            // let targetVaeModalArray = config.vae_model.filter(item => config.base_model[index].link === item.link);
            // setconfigOptions({
            //   ...config,
            //   vae_model: targetVaeModalArray ? targetVaeModalArray : []
            // });
          } else {
            setBaseModelTips(config.base_model[0]);
          }
        }
        // if (config.vae_model && config.vae_model.length !== 0) {
        //   const index = config.vae_model.findIndex(item => item.title === 'disabled.pt');
        //   if (index !== -1) {
        //     setVaeModelTips(config.vae_model[index]);
        //   } else {
        //     setVaeModelTips(config.vae_model[0]);
        //   }
        // }
      }
  }
  login();
    return () => {
      window.removeEventListener('resize', setVhToState);
    }
  }, []); 

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
    setInpaintingChecked(value)
  }

  const onMultidiffusionChange = (value) => {
    setMultidiffusionChecked(value)
  }
  
  //表单提交逻辑
  // const onFinish = _.debounce(async (values) => {
  //   let selectType = localStorage.getItem("selectType")
  //   if (clipEditStatus) {
  //     message.warning('请先退出CLIP提示词编辑模式，再生成图片');
  //     return false;
  //   }
  //   try {
  //     //校验图生图是否上传了图片
  //     if (selectType === '2' && !toJS(textToImageStore.status.image_names.custom_image_name.file)) {
  //       message.error('请上传图片！');
  //       return false;
  //     }
  //     let value = await form.validateFields();
  //     //处理后端所需字段，用来传递给后端
  //     let backendData = setDatas(value, toJS(textToImageStore), selectType);
  //     //页面渲染所需数据
  //     let storeData = setStoreDatas(value, toJS(textToImageStore), selectType);
  //     //处理所有图片（target_file）
  //     const controlnetFiles = manageControlnetFile(toJS(textToImageStore.status), selectType);
  //     //处理前端页面所需数据
  //     textToImageStore.setStatus(storeData);
  //     //判断controlnet文件是否存在
  //     // return false
  //     console.log(backendData, controlnetFiles);
  //     // return false
  //     if (toJS(textToImageStore.status.controlnet).length !== 0) {
  //       const nullIndexes = toJS(textToImageStore.status.controlnet).filter(obj => obj.target_file === '' || obj.target_file === null || obj.target_file === undefined).map(obj => toJS(textToImageStore.status.controlnet).indexOf(obj));
  //       const newIndexes = nullIndexes.map(index => index + 1);
  //       if (newIndexes.length !== 0) {
  //         return false
  //       } else {
  //         textToImageStore.changetextToLoading(true);//历史图片组件loading
  //         textToImageStore.changeImageListLoading(true)//视图组件
  //         // 更新表单值 

  //         form.setFieldsValue({ lora: textToImageStore.status.lora, });
  //         //文生图逻辑处理
  //         if (selectType === '1') {
  //           textToImageStore.textToImageSocket(backendData, controlnetFiles)
  //         }
  //         if (selectType === '2') {
  //           textToImageStore.imageToImageSocket(backendData, controlnetFiles)
  //         }
  //       }
  //       return false;
  //     } else {
  //       textToImageStore.changetextToLoading(true);//历史图片组件loading
  //       textToImageStore.changeImageListLoading(true)//视图组件
  //       // 更新表单值 
  //       form.setFieldsValue({ lora: textToImageStore.status.lora, });
  //       //文生图逻辑处理
  //       console.log(backendData, controlnetFiles);
  //       if (selectType === '1') {
  //         textToImageStore.textToImageSocket(backendData, controlnetFiles)
  //       }
  //       if (selectType === '2') {
  //         textToImageStore.imageToImageSocket(backendData, controlnetFiles)
  //       }
  //     }
  //   } catch (errorInfo) {
  //     textToImageStore.changeImageListLoading(false)//视图组件
  //     textToImageStore.changetextToLoading(false);//历史图片组件loading
  //   }
  // }, 300)

return(
  <div className="generate">
<Form
    form={form}
    name="validate_other"
    {...formItemLayout}
    onFinish={onFinish}
    initialValues={{
      'input-number': 3,
      'checkbox-group': ['A', 'B'],
      rate: 3.5,
      'color-picker': null,
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
    <Form.Item name="isInpainting" label="Inpainting" >
      <Switch checked={inpaintingChecked} onChange={onInpaintingChange}/>
    </Form.Item>
    <Form.Item name="Multidiffusion" label="Multidiffusion">
      <Switch checked={multidiffusionChecked} onChange={onMultidiffusionChange}/>
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