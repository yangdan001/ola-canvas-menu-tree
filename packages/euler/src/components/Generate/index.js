import React, { useState, useContext, useEffect } from 'react';
// import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import shortid from 'shortid';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
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
  getAllDescription, postImage, getRecord, postImageToImage,
} from '../../../src/services/api';
import textToImageStore from '../../../src/store/textToImageStore';
import { toJS } from "mobx";
import { EditorContext } from '../../context';
import { SetElementsAttrs } from '../../editor/commands/set_elements_attrs';
import './index.scss';
import { MutateElementsAndRecord } from '../../editor/scene/graph';
import fetchApi from '../../../src/services/fetch';
const socketBaseURL = fetchApi.socketBaseURL;
const { Option } = Select;
const { TextArea } = Input;
let globalData = {}
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

//进度条按钮
const ProgressBarButton = styled(Button)`
  background: linear-gradient(
    90deg,
    #985EFF ${(props) => props.percent || 0}%,
    #6200EE ${(props) => props.percent || 0}%,
    #6200EE 100%
  )
  no-repeat;
  width: 274px;
  height: 46px;
  border-radius: 4px;
  border: 1px solid #5858E6;
  background: var(--400, #7F39FB);
  box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.07);
`;

const ProgressButton = ({ percent, children, ...rest }) => {
  return (
    <div style={{ width: '274px', position: 'relative', marginTop: 10 }}>
      <ProgressBarButton percent={percent} {...rest}>
        {/* {children} */}
      </ProgressBarButton>
      <div style={{ position: 'absolute', zIndex: 1, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#FFFFFF', width: 100 }}>{children}</div>
    </div>

  );
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
  const [inpaintingchecked, setinpaintingchecked] = useState(false);
  const [multidiffusionChecked, setMultidiffusionChecked] = useState(false);
  const [stepsVal, setStepsVal] = useState(0);
  const [scaleVal, setScaleVal] = useState(0);
  const [fileObj, setFileObj] = useState({});
  const [imgUrl, setImgUrl] = useState("");
  const [imgData, setImgData] = useState({});
  const [imageToImageDataRes, setImageToImageDataRes] = useState({});
  const [textToImageDataRes, setTextToImageDataRes] = useState({});
  const [soketData, setSoketData] = useState({});
  const [formData, setFormData] = useState({});
  const intl = useIntl();
  const MIXED = intl.formatMessage({ id: 'mixed' });
  useEffect(() => {
    const handler = () => {
        getFormData()
    };
    editor.sceneGraph.on('render', handler);
    return () => {
      editor.sceneGraph.off('render', handler);
    };
  }, [editor, MIXED]);
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
        getFormData()
        // let allValue = await form.getFieldsValue(true);
        // let value = await form.validateFields();
        //基础模型,Vae模型中的提示 
        if (config.base_model && config.base_model.length !== 0) {
          const index = config.base_model.findIndex(item => item.title === 'Base-V1-5.ckpt');
          if (index !== -1) {
            setBaseModelTips(config.base_model[index]);
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

  //取formdata数据
  const getFormData = () => {
    const items = editor.selectedElements.getItems();
    if (items.length > 0) {
      let newFormData = items[0].formData;
      for (let i = 0, len = items.length; i < len; i++) {
        const element = items[i];
        if (newFormData !== element.formData) {
          newFormData = MIXED;
        }
      }
      setFormData(newFormData);
      setForm(newFormData)
    }
  }

  const setForm = (val) => {
    if (val) {
      //表单默认值
      form.setFieldsValue({
        base_model_name: val.base_model_name,
        vae_model_name: val.vae_model_name,
        positive_prompt: val.positive_prompt,
        negative_prompt: val.negative_prompt,
        number: val.number,
        num_inference_steps: val.num_inference_steps,
        cfg: val.cfg,
        scheduler_name: val.scheduler_name,
        width: val.width,
        height: val.height,
        seed: val.seed,
        denoise: val.denoise, //去噪强度 Denoising Strength
        widthHeight: val.widthHeight
      });
    } else {
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
    }
  }

  // 图片上传后逻辑处理
  useEffect(() => {
    if (imgUrl == '') {
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
    const prevStates = selectedElements.items[0].fill[0].attrs
    /**
     * 第2步：将图片填充在原来元素上，形状大小要同原来的元素；
     * */
    var image = new Image(); // 创建一个新的Image对象
    image.src = imgUrl // 图片的路径
    // // 在图片加载完成后执行绘制操作
    image.onload = function () {
      // editor.sceneGraph.children.forEach((item)=>{
      //   if(item.objectName == selectedElements.items[0].objectName){
      //     item.fill[0].type = 'Image'
      //     item.fill[0].attrs = {src:imgUrl,opacity:0.7}
      //   }
      // })
      selectedElements.items[0].fill[0].type = 'Image'
      selectedElements.items[0].fill[0].attrs = { src: imgUrl, opacity: 0.7 }
      const newStates = selectedElements.items[0].fill[0].attrs
      editor.commandManager.pushCommand(
        new SetElementsAttrs(
          'Update Type of Elements',
          selectedElements.items[0],
          newStates,
          prevStates,
        ),
      );
      // 重新渲染右侧画布
      editor.sceneGraph.render();
    };

  }, [imgUrl]);

  const normFile = (e) => {
    if (e && e.file) {
      setFileObj(e.file)
    }
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };
  const checkOptionsType = (model) => {
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
    setStepsVal(value)
  }
  //
  const onAfterChangeSteps = (value) => {
    setStepsVal(value)
  }

  //
  const onChangeScale = (value) => {
    setScaleVal(value)
  }
  //
  const onAfterChangeScale = (value) => {
    setScaleVal(value)

  }
  //获取mask图
  // const onInpaintingChange = (value) => {
  //   console.log(value, 'value888')
  //   /* eslint-disable-next-line no-debugger */
  //    debugger
  //   if(value==true) {
  //   const sceneGraph = editor.sceneGraph;
  //   const selectedElements = editor.selectedElements;
  //   const selectedWidth = selectedElements.items[0].width
  //   const selectedHeight = selectedElements.items[0].height
  //   const selectedX = selectedElements.items[0].x
  //   const selectedY = selectedElements.items[0].y
  //   const originalCtx = editor.sceneGraph.editor.ctx;
  //   // 获取选中矩形区域的像素数据
  //   const selectedImageData = originalCtx.getImageData(selectedX, selectedY, selectedWidth, selectedHeight);
  //   for (let i = 0; i < selectedImageData.data.length; i += 4) {
  //     // Set the alpha (transparency) value to 0
  //     selectedImageData.data[i + 3] = 0;
  //   }

  //   // 创建新Canvas元素来显示选中区域
  //   const resultCanvas = document.createElement('canvas');
  //   resultCanvas.width = selectedWidth;
  //   resultCanvas.height = selectedHeight;
  //   const resultCtx = resultCanvas.getContext('2d');
  //   // 清空Canvas，使背景透明
  //   resultCtx.clearRect(0, 0, selectedWidth, selectedHeight);
  //   // 将选中区域的像素数据放置在新Canvas上
  //   resultCtx.putImageData(selectedImageData, 0, 0);
  //   // 遍历每个矩形元素并绘制到新 Canvas 上
  //   // 将选中元素的子元素绘制到Canvas上
  //   const children = selectedElements.items[0].children;
  //   for (let i = 0; i < children.length; i++) {
  //       const child = children[i];
  //       const rectX = child.x;
  //       const rectY = child.y;
  //       const rectWidth = child.width;
  //       const rectHeight = child.height;
  //       console.log(rectWidth,rectWidth,'子元素的大小')
  //       console.log(rectX,rectY,'子元素的位置')
  //       // 根据两个坐标位置计算出两个矩形在像素数据中的位置
  //       const rectXInImageData = rectX - selectedX;
  //       const rectYInImageData = rectY - selectedY;
  //        // 绘制矩形
  //       resultCtx.globalCompositeOperation = 'source-over'; // 设置合成模式为覆盖源图像
  //       resultCtx.fillStyle = `rgba(${child.fill[0].attrs.r},${child.fill[0].attrs.g},${child.fill[0].attrs.b},${child.fill[0].attrs.a})`;
  //       resultCtx.fillRect(rectXInImageData, rectYInImageData, rectWidth, rectHeight);
  //   }

  //   // 将新Canvas转化为数据URL
  //   const dataURL = resultCanvas.toDataURL('image/png');

  //   // 创建一个新的图像元素，并设置其src属性为数据URL
  //   const resultImage = new Image();
  //   resultImage.src = dataURL;

  //   // 将图像元素添加到页面上
  //   document.body.appendChild(resultImage);
  //   setinpaintingchecked(value)
  //   }
  // }
  //获取嵌套图
  const onInpaintingChange = (value) => {
    if (value == true) {
      const sceneGraph = editor.sceneGraph;
      const selectedElements = editor.selectedElements;
      const selectedWidth = selectedElements.items[0].width
      const selectedHeight = selectedElements.items[0].height
      const selectedX = selectedElements.items[0].x
      const selectedY = selectedElements.items[0].y
      const originalCtx = editor.sceneGraph.editor.ctx;
      // 获取选中矩形区域的像素数据
      const selectedImageData = originalCtx.getImageData(selectedX, selectedY, selectedWidth, selectedHeight);
      for (let i = 0; i < selectedImageData.data.length; i += 4) {
        selectedImageData.data[i + 3] = 0;
      }

      // 创建新Canvas元素来显示选中区域
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = selectedWidth;
      resultCanvas.height = selectedHeight;
      const resultCtx = resultCanvas.getContext('2d');
      // 清空Canvas，使背景透明
      resultCtx.clearRect(0, 0, selectedWidth, selectedHeight);
      // 将选中区域的像素数据放置在新Canvas上
      resultCtx.putImageData(selectedImageData, 0, 0);
      // 遍历每个矩形元素并绘制到新 Canvas 上
      // 将选中元素的子元素绘制到Canvas上
      const children = selectedElements.items[0].children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const rectX = child.x;
        const rectY = child.y;
        const rectWidth = child.width;
        const rectHeight = child.height;
        // 根据两个坐标位置计算出两个矩形在像素数据中的位置
        const rectXInImageData = rectX - selectedX;
        const rectYInImageData = rectY - selectedY;
        // 绘制矩形
        resultCtx.globalCompositeOperation = 'source-over'; // 设置合成模式为覆盖源图像
        resultCtx.fillStyle = `rgba(${child.fill[0].attrs.r},${child.fill[0].attrs.g},${child.fill[0].attrs.b},${child.fill[0].attrs.a})`;
        resultCtx.fillRect(rectXInImageData, rectYInImageData, rectWidth, rectHeight);
      }

      // 将新Canvas转化为数据URL
      const dataURL = resultCanvas.toDataURL('image/png');

      // 创建一个新的图像元素，并设置其src属性为数据URL
      const resultImage = new Image();
      resultImage.src = dataURL;

      // 将图像元素添加到页面上
      document.body.appendChild(resultImage);
      setinpaintingchecked(value)
    }
  }
  const onMultidiffusionChange = (value) => {
    setMultidiffusionChecked(value)
  }


  const SelectComponentOnChange = (value, option, type, index) => {
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
          return false;
        } else {
          if (RES.params.task_id && RES.params.status != 'FAILED') {
            const socketUrl = `${socketBaseURL}/task/progress/${RES.params.task_id}`;
            const socket = new WebSocket(socketUrl);
            socket.onopen = () => {
              console.log('WebSocket连接已打开');
            };
            socket.onmessage = (event) => {
              console.log('触发', JSON.parse(event.data));
              if (event && JSON.parse(event.data) && JSON.parse(event.data) != {}) {
                event && setTextToImageDataRes(JSON.parse(event.data))
                globalData = JSON.parse(event.data)
                setSoketData(globalData)
              }
            };
            socket.onclose = async (event) => {
              console.log('close');
              if (globalData && globalData.status === 'COMPLETED') {
                const res = await getRecord(RES.params.task_id);
                if (res && res.code === 0 && res.params && res.params.images && Array.isArray(res.params.images) && res.params.images.length > 0 && res.params.images.every(item => item !== '') && res.params.status != 'FAILED') {
                  let fileUrl = res.params.images[0]
                  setImgUrl(fileUrl)
                  localStorage.setItem('fileUrl', fileUrl)
                } else {
                  notification.error({
                    message: '操作失败',
                    description: `${res && res.message ? res.message : '请求异常'}`,
                  });
                }
              } else {
                notification.error({
                  message: '操作失败',
                  description: `请求失败`,
                });
              }
            };
          } else {
            notification.error({
              message: '接口错误',
              description: `task_id不存在或发生异常`,
            });
          }
        }
      } catch (err) {
        console.log(err);
      }
    })
  }

  //图生图
  const imageToImageSocket = async (backendData, controlnetFiles, files) => {
    await postImageToImage(backendData, controlnetFiles, files).then((RES) => {
      try {
        if (!RES || RES.code !== 0) {
          notification.error({
            message: '请求错误',
            description: `${RES && RES.message ? RES.message : ''}`,
          });
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
                event && setImageToImageDataRes(JSON.parse(event.data))
                globalData = JSON.parse(event.data)
                setSoketData(globalData)
              }
            };
            socket.onclose = async (event) => {
              if (globalData && globalData.status === 'COMPLETED') {
                const res = await getRecord(RES.params.task_id);
                if (res && res.code === 0 && res.params && res.params.images && Array.isArray(res.params.images) && res.params.images.length > 0 && res.params.images.every(item => item !== '') && res.params.status != 'FAILED') {
                  let fileUrl = res.params.images[0]
                  setImgUrl(fileUrl)
                  localStorage.setItem('fileUrl', fileUrl)
                } else {
                  notification.error({
                    message: '操作失败',
                    description: `${res && res.message ? res.message : '请求异常'}`,
                  });
                }
              } else {
                notification.error({
                  message: '操作失败',
                  description: `请求失败`,
                });
              }
            };
          } else {
            notification.error({
              message: '接口错误',
              description: `task_id不存在或发生异常`,
            });
          }
        }
      } catch (err) {
        console.log(err);
      }
    })
  }

  //表单提交逻辑
  const onFinish = _.debounce(async (values) => {
    const sceneGraph = editor.sceneGraph;
    const selectedElements = editor.selectedElements;
    const selectedWidth = selectedElements.items[0].width
    const selectedHeight = selectedElements.items[0].height
    form.setFieldsValue({
      width: selectedWidth,
      height: selectedHeight,
    })
    let allValue = await form.getFieldsValue(true);
    if (editor) {
      const elements = editor.selectedElements.getItems();
      MutateElementsAndRecord.setFormdata(editor, elements, allValue);
      editor.sceneGraph.render();
    }
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
      if (Object.keys(imgData).length !== 0) {
        controlnetFiles.push(imgData)
      }
      if (selectType === '1') {
        if (allValue.controlnet) {
          if (fileObj && fileObj.name) {
            textToImageSocket(datas, controlnetFiles)
          } else {
            message.error('请上传图片！');
            return false;
          }
        } else {
          textToImageSocket(datas, controlnetFiles)
        }
      }
      if (selectType === '2') {
        datas.isInpainting = '0'
        imageToImageSocket(datas, controlnetFiles)
      }
      if (selectType === '3') {
        if (fileObj && fileObj.name) {
          textToImageSocket(datas, controlnetFiles)
        } else {
          message.error('请上传图片！');
          return false;
        }
      }
    } catch (errorInfo) {
      console.error(errorInfo)
    }
  }, 300)

  const onChangeHandler = (info) => {
    let fileUrl = window.URL.createObjectURL(info.file.originFileObj)
    setImgData(info.file.originFileObj)
    setImgUrl(fileUrl)
    //读取base64图
    const reader = new FileReader();
    reader.readAsDataURL(info.file.originFileObj);
    if (info.file.status !== 'uploading') {
      console.log(info.file, info.fileList, 'uploading');
    }
    if (info.file.status === 'done') {
      console.log(info.file, info.fileList, 'done');
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
            checked={inpaintingchecked}
            defaultChecked={false}
            onChange={onInpaintingChange}
          // onChange={
          //   (newChecked) => {
          //     textToImageStore.updateInpainting(newChecked);
          //   }} 
          />
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
          {(soketData &&
            soketData.status === 'RUNNING') ? (
            <div>
              <ProgressButton percent={soketData && soketData.progress && soketData.progress.progress}>Progress {soketData && soketData.progress && Math.round(Number(soketData.progress.progress))}%</ProgressButton>
            </div>
          ) : <Button type="primary" htmlType="submit" className='generate-btn'>
            Submit
          </Button>}
        </Form.Item>
      </Form>
    </div>
  )
}
export default Generate;