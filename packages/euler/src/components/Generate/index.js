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
  postPreprocess, getAllDescription, getHistoryRecord, getRecordTotal, postImage, getRecord,
  getPreprocessRes, putTemplate, getTemplate, deleteEngineTemplate, deleteLora
} from '../../../src/services/api';
import textToImageStore from '../../../src/store/textToImageStore';
import { SelectData, setDatas, defaultWidthHeight, setStoreDatas, manageControlnetFile, base64ToFile, base64ToFile2, getBase64Image } from '../../../src/data';
import { toJS } from "mobx";
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
  const [imgUrl, setImgUrl] = useState("");
  const [imgData, setImgData] = useState({});

  

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
          denoise: "0.75", //去噪强度 Denoising Strength
          widthHeight: '1'
        });

        let allValue = await form.getFieldsValue(true);
        let value = await form.validateFields();
        //基础模型,Vae模型中的提示 
        if (config.base_model && config.base_model.length !== 0) {
          /* eslint-disable-next-line no-debugger */
          // debugger
          const index = config.base_model.findIndex(item => item.title === 'Base-V1-5.ckpt');
          if (index !== -1) {
            setBaseModelTips(config.base_model[index]);
            console.log(config.base_model[index], 'config.base_model[index]')
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

// 图片上传后逻辑处理
  useEffect(() => {
    if( imgUrl == '' ){
      return
    }
    /**
    * 1、获取到选中的元素信息 如id、坐标、大小、是否为原形等；
    * 2、删除该元素：左侧目录树与画布均删除，参考右键删除；
    * 3、将图片渲染在原来元素的位置，形状大小要同原来的元素；
    * */
    //监听uploadIMG  

      /**
       * 第一步：获取到选中的元素信息 如id、坐标、大小、是否为原形等；
       * */
      const sceneGraph = editor.sceneGraph;
      const selectedElements = editor.selectedElements;
      let width = selectedElements.items[0].width
      let height = selectedElements.items[0].height
      /**
       * 第2步：将图片填充在原来元素上，形状大小要同原来的元素；
       * */
      var image = new Image(); // 创建一个新的Image对象
      image.src = imgUrl // 图片的路径
      // // 在图片加载完成后执行绘制操作
      image.onload = function() {
          selectedElements.items[0].fill[0].type = 'Image'
          selectedElements.items[0].fill[0].attrs = {src:imgUrl,opacity:0.7}
          // 重新渲染右侧画布
          editor.sceneGraph.render();
      };

  }, [imgUrl]);

  const normFile = (e) => {
    // console.log('Upload event:', e);
    if (e && e.file) {
      setFileObj(e.file)
    }
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };
  const checkOptionsType = (model) => {
    // console.log(model,'model')
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
    console.log(value, 'value888')
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

  const SelectComponentOnChange = (value, option, type, index) => {
    console.log(option.item);
    if (type === 'basemodel') {
      setBaseModelTips(option.item);
      let targetVaeModalArray = JSON.parse(localStorage.getItem('config')).vae_model.filter(item => option.item.link === item.link);
      form.setFieldsValue({
        vae_model_name: undefined
      })
      // 设置联动默认值
      if (targetVaeModalArray && targetVaeModalArray.length !== 0) {
        form.setFieldsValue({
          vae_model_name: targetVaeModalArray[0].title
        })
      } else {
        form.setFieldsValue({
          vae_model_name: undefined
        })
      }
      setconfigOptions({
        ...configOptions,
        vae_model: targetVaeModalArray ? targetVaeModalArray : []
      });
    }
    if (type === 'controlnet') {
      textToImageStore.setControlNetitems(value)
      let values = { controlnet: toJS(textToImageStore.status.controlnet), }
      form.setFieldsValue(values);
    }
    if (type === 'lora') {
      //lora的回填
      textToImageStore.setLoaritems(value);
      let values = { lora: toJS(textToImageStore.status.lora), }
      form.setFieldsValue(values);
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
              if (event && JSON.parse(event.data) && JSON.parse(event.data) != {}) {
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
                  let fileUrl = window.URL.createObjectURL(res.params.images[0])
                  setImgUrl(fileUrl)
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
    let allValue = await form.getFieldsValue(true);
    if (fileObj && fileObj.name) {
      if (allValue.controlnet) {
        localStorage.setItem('selectType', '3');
      } else {
        localStorage.setItem('selectType', '2');
      }
    } else {
      localStorage.setItem('selectType', '1');
    }
    let selectType = localStorage.getItem("selectType")
    try {
      //校验图生图是否上传了图片
      /* eslint-disable-next-line no-debugger */
      // debugger
      let controlnetFormValue = [];
      controlnetFormValue.push({
        model_name: allValue.controlnet,
        apply: {
          strength: 0.2
        },
        preprocess: [],
        load_img_index: 0
      })
      let loraFormValue = [];
      loraFormValue.push({
        model_name: allValue.lora,
        unet_weights: 1,
        te_weights: 1
      })
      //拼接json对象，传递后端
      let datas = {
        models: {
          base_model_name: allValue.base_model_name,
          vae_model_name: allValue.vae_model_name,
        },
        lora: allValue.lora ? loraFormValue : [],
        controlnet: allValue.controlnet ? controlnetFormValue : [],
        image_names: {
          control_image_name: selectType == 3 && fileObj && fileObj.name ? [allValue.custom_image_name[0].name] : [],
          custom_image_name: selectType == 2 && fileObj && fileObj.name ? [allValue.custom_image_name[0].name] : [],
        },
        prompts: {
          positive_prompt: allValue.positive_prompt,
          negative_prompt: allValue.negative_prompt,
        },
        sampler_params: {
          number: allValue.number,
          num_inference_steps: allValue.num_inference_steps,
          cfg: allValue.cfg,
          scheduler_name: allValue.scheduler_name,
          width: allValue.width,
          height: allValue.height,
          seed: allValue.seed ? allValue.seed : 'disable',
          denoise: allValue.denoise, //去噪强度 Denoising Strength
        }
      }
      let controlnetFiles = []
      controlnetFiles.push(imgData)
      if (selectType === '1') {
        if (allValue.controlnet) {
          if (fileObj && fileObj.name) {
            textToImageStore.textToImageSocket(datas, controlnetFiles)
          } else {
            message.error('请上传图片！');
            return false;
          }
        } else {
          textToImageStore.textToImageSocket(datas, controlnetFiles)
        }
      }
      if (selectType === '2') {
        datas.isInpainting = 0
        textToImageStore.imageToImageSocket(datas, controlnetFiles)
      }
      if (selectType === '3') {
        if (fileObj && fileObj.name) {
          textToImageStore.textToImageSocket(datas, controlnetFiles)
        } else {
          message.error('请上传图片！');
          return false;
        }
      }
      // }
    } catch (errorInfo) {
      // textToImageStore.changeImageListLoading(false)//视图组件
      // textToImageStore.changetextToLoading(false);//历史图片组件loading
    }
  }, 300)

  const onChangeHandler = (info) => {
    let fileUrl = window.URL.createObjectURL(info.file.originFileObj)
    setImgData(info.file.originFileObj)
    setImgUrl(fileUrl)
    // localStorage.setItem('fileUrl',fileUrl)
    if (info.file.status !== 'uploading') {
      console.log(info.file, info.fileList, 'uploading');
    }
    if (info.file.status === 'done') {
      // let cvs = document.getElementById('cvs');
      // var ctx = cvs!.getContext('2d');
      // let fileUrl = window.URL.createObjectURL(info.file.originFileObj!);
      // var img = document.getElementById('uploadedImg');
      // this.setState({ imgUrl: fileUrl });
      // img!.onload = function() {
      //   console.info('xxx');
      //   ctx.drawImage(img, 0, 0);//this即是imgObj,保持图片的原始大小：470*480
    }
    //   message.success(`${info.file.name} file uploaded successfully`);
    // }
    else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  }

  return (
    <div className="generate">
      <Form
        form={form}
        name="validate_other"
        {...formItemLayout}
        onFinish={onFinish}
        style={{
          maxWidth: 600,
        }}
        labelCol={{
          style: { width: 120, textAlign: 'left' }
        }}

      >
        <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}  >
          <Form.Item
            name="base_model_name"
            hasFeedback
            rules={[
              {
                required: true,
                message: '请选择模型',
              },
            ]}
          >
            <div className='model-title'>Model</div>
            {baseModelTips.title && <Select
              placeholder="请选择模型"
              defaultValue={baseModelTips.title}
              onChange={(value, option) => SelectComponentOnChange(value, option, 'basemodel')}
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
            {isPromptsOpen ? <DownOutlined /> : <UpOutlined />}
          </div>
          <div>
            {!isPromptsOpen ?
              <div className='prompts-content'>
                <div className='prompts-content-title'>Prompt</div>
                <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}   >
                  <Form.Item name="positive_prompt" >
                    <TextArea rows={6} className="no-resize" />
                  </Form.Item>
                </ConfigProvider>
                <div className='negative-content-title'>Negative prompt</div>
                <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}   >
                  <Form.Item name="negative_prompt" >
                    <TextArea rows={6} />
                  </Form.Item>
                </ConfigProvider>
                <div className='negative-content-dec' >Concepts specified in the negative prompt won't guide the generation.</div>
              </div>
              : null}
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
            {isGenerationParametersOpen ? <DownOutlined /> : <UpOutlined />}
          </div>
          <div>
            {!isGenerationParametersOpen ?
              <div className='slider-box'>
                <div className='slider-title'>Steps {stepsVal}</div>
                <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}   >
                  <Form.Item name={'num_inference_steps'} style={{ marginBottom: 0 }}>
                    <Slider min={0} max={1} step={0.01} trackStyle={{ backgroundColor: '#7F39FB' }} railStyle={{ backgroundColor: '#FFFFFF' }} defaultValue={0.75} onChange={onChangeSteps} onAfterChange={onAfterChangeSteps} />
                  </Form.Item>
                </ConfigProvider>
                <div className='slider-dec'>Results are better the more steps you use. If you want faster results you can use a smaller number.</div>
                <div className='slider-title'>Guidance {scaleVal}</div>
                <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}   >
                  <Form.Item name={'cfg'} style={{ marginBottom: 0 }}>
                    <Slider min={0} max={1} step={0.01} trackStyle={{ backgroundColor: '#7F39FB' }} railStyle={{ backgroundColor: '#FFFFFF' }} defaultValue={0.75} onChange={onChangeScale} onAfterChange={onAfterChangeScale} />
                  </Form.Item>
                </ConfigProvider>
                <div className='slider-dec'>Increasing guidance scale forces the generation to better match the prompt.</div>
              </div>
              : null}
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
            {isAdvancedOpen ? <DownOutlined /> : <UpOutlined />}
          </div>
          <div>
            {!isAdvancedOpen ?
              <div className='generate-select'>
                <div className='generate-title marT-10 marB-3'>ControlNet</div>
                <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}   >
                  <Form.Item name="controlnet" >
                    <Select
                    // placeholder="请选择controlnet模型"
                    >
                      {checkOptionsType(configOptions.controlnet_model || [])}
                    </Select>
                  </Form.Item>
                </ConfigProvider>
                <div className='generate-title marT-10 marB-3'>LoRA</div>
                <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}   >
                  <Form.Item name="lora" >
                    <Select
                      onChange={(value, option) => SelectComponentOnChange(value, option, 'lora')}
                    // placeholder="请选择Lora模型"
                    >
                      {checkOptionsType(configOptions.lora_model || [])}
                    </Select>
                  </Form.Item>
                </ConfigProvider>
              </div>
              : null}
          </div>
        </div>
        <Form.Item name="isInpainting" label="Inpainting" valuePropName="checked">
          <Switch
            checked={inpaintingChecked}
            defaultChecked={false}
            onChange={
              (newChecked) => {
                textToImageStore.updateInpainting(newChecked);
              }} />
        </Form.Item>
        <Form.Item name="Multidiffusion" label="Multidiffusion" valuePropName="multidiffusionChecked">
          <Switch checked={multidiffusionChecked} defaultChecked={false} onChange={onMultidiffusionChange} />
        </Form.Item>
        <div className='generate-title  marB-3'>Image Content</div>
        <Form.Item
          name="custom_image_name"
          // label="Upload"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          // extra=""
        >
          <Upload 
          action={""}
          showUploadList={false}
          maxCount={1} 
          multiple={false} 
          onChange={onChangeHandler}>
            <div className='upload-box'>
              <PlusOutlined style={{ fontSize: '24px', color: '#985EFF' }} />
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