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


//isInpainting
//1.isInpainting只是图生图的参数逻辑
//2.isInpainting开与不开，上传mask图片，isInpainting就传2，custom_image_name数组第一张是图片、数组第二张是mask图片 
//3.isInpainting开了，没有上传mask图片，isInpainting就传1，custom_image_name数组之传一张是图片
//4.isInpainting没开，没有上传mask图片，isInpainting就传0，custom_image_name数组之传一张是图片
//5.controlnet第一考虑条件，isInpainting的值不影响controlnet的逻辑
//6.判断图片是否包含子集图片 包含的话上传的图片需要重新生成包含子集的图片
//7.判断图片是否包含mask子集图片 包含的上传的mask图片就是子集的mask重新生成的图片
//8.画笔轨迹默认是mask子集，如果有画笔轨迹和mask矩形，两个mask需要合并生成最后的mask图片
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

//图片存储
//1.接口获取初始化的值，暂时存储到localstrage 1
//2.文生图逻辑梳理，数据调整 1
//3.图生图逻辑梳理，数据调整 1
//4.数据要求备份到本地，保留历史记录 1
//5.文生图生成的图片不可以执行图生图逻辑 1
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
  const [stepsVal, setStepsVal] = useState(0.75);
  const [scaleVal, setScaleVal] = useState(0.75);
  const [baseModelVal, setBaseModelVal] = useState('');
  const [loraVal, setLoraVal] = useState('');
  const [controlnetVal, setControlnetVal] = useState(0.75);
  const [fileObj, setFileObj] = useState({});
  const [imgUrl, setImgUrl] = useState("");
  const [imgData, setImgData] = useState({});
  // const [imageToImageDataRes, setImageToImageDataRes] = useState({});
  // const [textToImageDataRes, setTextToImageDataRes] = useState({});
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
        widthHeight: val.widthHeight,
        isInpainting: val.isInpainting,
        controlnet: val.controlnet,
        lora: val.lora,
        Multidiffusion: val.Multidiffusion,
      });
      setBaseModelVal(val.base_model_name)
      setLoraVal(val.lora)
      setControlnetVal(val.controlnet)
      setStepsVal(val.num_inference_steps)
      setScaleVal(val.cfg)
      setMultidiffusionChecked(val.Multidiffusion)
      setinpaintingchecked(val.isInpainting)
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
        widthHeight: '1',
        isInpainting: false,
        controlnet: '',
        lora: '',
        Multidiffusion:false,
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
  const onChangeSteps = (value, type) => {
    setStepsVal(value)
    updateFormData(type,value)
  }
  //
  const onChangeScale = (value, type) => {
    setScaleVal(value)
    updateFormData(type,value)
  }
  //获取mask图
  // const onInpaintingChange = (value) => {
  //   console.log(value, 'value888')
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


  //要实现在 Canvas 上绘制一张图片，选中该图片并检查其内部是否包含嵌套的子元素图片，然后将选中的图片和子元素图片合成一张新图片
  const mergeImages = (mainImageSrc) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const sceneGraph = editor.sceneGraph;
    const selectedElements = editor.selectedElements;
    const selectedWidth = selectedElements.items[0].width
    const selectedHeight = selectedElements.items[0].height
    const selectedX = selectedElements.items[0].x
    const selectedY = selectedElements.items[0].y
    const selectedType =  selectedElements.items[0].fill[0].type //'Image'
    // if()
    const originalCtx = editor.sceneGraph.editor.ctx;
  
    // 创建主图片对象
    const mainImage = new Image();
    mainImage.src = mainImageSrc;
  
    mainImage.onload = function () {
      // 设置 Canvas 大小为主图片的大小
      canvas.width = mainImage.width;
      canvas.height = mainImage.height;
  
      // 绘制主图片
      ctx.drawImage(mainImage, 0, 0);
  
      // 遍历主图片内的所有子元素
      const childElements = document.querySelectorAll('img');
      for (const childImage of childElements) {
        // 检查子元素是否在主图片内部
        const isInsideMainImage = (
          childImage.offsetLeft >= 0 &&
          childImage.offsetTop >= 0 &&
          childImage.offsetLeft + childImage.width <= mainImage.width &&
          childImage.offsetTop + childImage.height <= mainImage.height
        );
  
        // 绘制在主图片内的子元素图片
        if (isInsideMainImage) {
          ctx.drawImage(childImage, childImage.offsetLeft, childImage.offsetTop);
        }
      }
  
      // 导出合成后的图片
      const mergedImageSrc = canvas.toDataURL();
      const mergedImage = new Image();
      mergedImage.src = mergedImageSrc;
  
      // 将合成后的图片添加到页面
      document.body.appendChild(mergedImage);
    };
  }
  
  // // 调用合成函数，传入主图片的 URL
  // mergeImages('path/to/your/mainImage.jpg');
  
  //获取嵌套图
  const onInpaintingChange = (value,type) => {
      const sceneGraph = editor.sceneGraph;
      const selectedElements = editor.selectedElements;
      const selectedWidth = selectedElements.items[0].width
      const selectedHeight = selectedElements.items[0].height
      const selectedX = selectedElements.items[0].x
      const selectedY = selectedElements.items[0].y
      const originalCtx = editor.sceneGraph.editor.ctx;
      const originalCanvas = editor.sceneGraph.editor.canvasElement;
      const selectedUrl =  selectedElements.items[0].fill[0].attrs.src

    if (value == true) {
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
        if(child.iframeType=='Mask'){
          resultCtx.globalCompositeOperation = 'source-over'; // 设置合成模式为覆盖源图像
          resultCtx.fillStyle = `rgba(${child.fill[0].attrs.r},${child.fill[0].attrs.g},${child.fill[0].attrs.b},${child.fill[0].attrs.a})`;
          resultCtx.fillRect(rectXInImageData, rectYInImageData, rectWidth, rectHeight);
        }
      }

      // 将新Canvas转化为数据URL
      const dataURL = resultCanvas.toDataURL('image/png');

      // 创建一个新的图像元素，并设置其src属性为数据URL
      const resultImage = new Image();
      resultImage.crossOrigin = 'anonymous'; // 如果需要，确保允许跨来源访问
      resultImage.src = dataURL;

      // 将图像元素添加到页面上
      document.body.appendChild(resultImage);
    }
    //合成的图片大小是画布的大小
    // else{
    //   // 加载主图片
    //   const mainImage = new Image();
    //   mainImage.src = selectedUrl;
    //   mainImage.onload = () => {
    //     // 绘制主图片
    //     originalCtx.drawImage(mainImage, selectedX, selectedY, selectedWidth, selectedHeight);
    //     let imageCount = 0;  // 用于计数已加载的小图片数量
    //     // 将选中元素的子元素绘制到Canvas上
    //     const children = selectedElements.items[0].children;
    //     for (let i = 0; i < children.length; i++) {
    //       const child = children[i];
    //       const rectX = child.x;
    //       const rectY = child.y;
    //       const rectWidth = child.width;
    //       const rectHeight = child.height;
    //       const rectUrl = child.fill[0].attrs.src
    //       // 根据两个坐标位置计算出两个矩形在像素数据中的位置
    //       const rectXInImageData = rectX - selectedX;
    //       const rectYInImageData = rectY - selectedY;
    //       // 绘制矩形
    //       if(child.iframeType=='Image'){
    //         originalCtx.globalCompositeOperation = 'source-over'; // 设置合成模式为覆盖源图像
    //         const subImage = new Image();
    //           subImage.src = rectUrl;
    //           subImage.onload = () => {
    //             console.log(subImage, 0, 0, rectWidth, rectHeight,'合成图片')
    //             // 绘制子图片
    //             originalCtx.drawImage(subImage, rectX, rectY, rectWidth, rectHeight);
    //             // 将Canvas内容转换为Blob对象
    //             originalCanvas.toBlob((blob) => {
    //               const mergedImage = new Image();
    //               mergedImage.src = URL.createObjectURL(blob);

    //               // 可以将新图片显示在页面上或进行其他操作
    //               document.body.appendChild(mergedImage);
    //             });
    //             // if (++imageCount === children.length) {
    //             //   // 将合成后的Canvas内容保存为新图片
    //             //   const mergedImage = new Image();
    //             //   mergedImage.src = resultCanvas.toDataURL('image/png');
      
    //             //   // 可以将新图片显示在页面上或进行其他操作
    //             //   document.body.appendChild(mergedImage);
    //             // }
    //           };
    //       }
    //     }
    //   //   // 可以将合成的图片保存为新图片或进行其他操作
    //   // const mergedImage = resultCanvas.toDataURL('image/png');
    //   // const resultImage = new Image();
    //   // resultImage.crossOrigin = 'anonymous'; // 如果需要，确保允许跨来源访问
    //   // resultImage.src = mergedImage;

    //   // console.log(mergedImage);
    //   };
    // }
    //合成的图片大小是选中元素的大小
    else{
      // 创建新Canvas元素来显示选中区域
      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = selectedWidth;
      resultCanvas.height = selectedHeight;
      const resultCtx = resultCanvas.getContext('2d');
      // 清空Canvas，使背景透明
      resultCtx.clearRect(0, 0, selectedWidth, selectedHeight);
      // 加载主图片
      const mainImage = new Image();
      mainImage.src = selectedUrl;
      mainImage.onload = () => {
        // 绘制主图片
        resultCtx.drawImage(mainImage, 0, 0, selectedWidth, selectedHeight);
        let imageCount = 0;  // 用于计数已加载的小图片数量
        // 将选中元素的子元素绘制到Canvas上
        const children = selectedElements.items[0].children;
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const rectX = child.x;
          const rectY = child.y;
          const rectWidth = child.width;
          const rectHeight = child.height;
          const rectUrl = child.fill[0].attrs.src
          // 根据两个坐标位置计算出两个矩形在像素数据中的位置
          const rectXInImageData = rectX - selectedX;
          const rectYInImageData = rectY - selectedY;
          // 绘制矩形
          if(child.iframeType=='Image'){
            resultCtx.globalCompositeOperation = 'source-over'; // 设置合成模式为覆盖源图像
            const subImage = new Image();
              subImage.src = rectUrl;
              subImage.onload = () => {
                console.log(subImage, 0, 0, rectWidth, rectHeight,'合成图片')
                // 绘制子图片
                resultCtx.drawImage(subImage, rectXInImageData, rectYInImageData, rectWidth, rectHeight);
                // 将Canvas内容转换为Blob对象
                resultCanvas.toBlob((blob) => {
                  const mergedImage = new Image();
                  mergedImage.src = URL.createObjectURL(blob);

                  // 可以将新图片显示在页面上或进行其他操作
                  document.body.appendChild(mergedImage);
                });
                // if (++imageCount === children.length) {
                //   // 将合成后的Canvas内容保存为新图片
                //   const mergedImage = new Image();
                //   mergedImage.src = resultCanvas.toDataURL('image/png');
      
                //   // 可以将新图片显示在页面上或进行其他操作
                //   document.body.appendChild(mergedImage);
                // }
              };
          }
        }
      //   // 可以将合成的图片保存为新图片或进行其他操作
      // const mergedImage = resultCanvas.toDataURL('image/png');
      // const resultImage = new Image();
      // resultImage.crossOrigin = 'anonymous'; // 如果需要，确保允许跨来源访问
      // resultImage.src = mergedImage;

      // console.log(mergedImage);
      };
    }
    setinpaintingchecked(value)
    updateFormData(type,value)
  }
  const onMultidiffusionChange = (value,type) => {
    setMultidiffusionChecked(value)
    console.log(value,'onMultidiffusionChange')
    updateFormData(type,value)
  }

  const updateFormData = (key,value) => {
    const sceneGraph = editor.sceneGraph;
    const selectedElements = editor.selectedElements;
    if (editor) {
      const elements = editor.selectedElements.getItems();
      const prevData = elements[0].formData
      const newData = {...prevData,[key]:value}
      MutateElementsAndRecord.setFormdata(editor, elements, newData);
      editor.sceneGraph.render();
    }
  }

  const handleBlur= (event, type) => {
    let changeVal = event.target.value
    updateFormData(type,changeVal)
  }

  const TextAreaChange= (event, type) => {
    let changeVal = event.target.value
    updateFormData(type,changeVal)
  }

  const SelectComponentOnChange = (value, option, type, index) => {
    if (type === 'base_model_name') {
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
      // textToImageStore.setControlNetitems(value)
      // let values = { controlnet: toJS(textToImageStore.status.controlnet), }
      // form.setFieldsValue(values);
    }
    if (type === 'lora') {
      //lora的回填
      // textToImageStore.setLoaritems(value);
      // let values = { lora: toJS(textToImageStore.status.lora), }
      // form.setFieldsValue(values);
    }
    updateFormData(type,value)
    
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
                // event && setTextToImageDataRes(JSON.parse(event.data))
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
                // event && setImageToImageDataRes(JSON.parse(event.data))
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
          control_image_name: (selectType == 3 || selectType == 1 )&& fileObj && fileObj.name ? [allValue.custom_image_name[0].name] : [],
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
        },
        isInpainting: allValue.isInpainting?'1':'0',

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
              // defaultValue={baseModelTips.title}
              value={baseModelVal}
              onChange={(value, option) => SelectComponentOnChange(value, option, 'base_model_name')}
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
                    <TextArea rows={6} className="no-resize" onChange={(value) => TextAreaChange(value, 'positive_prompt')} onBlur={(value) => handleBlur(value, 'positive_prompt')}/>
                  </Form.Item>
                </ConfigProvider>
                <div className='negative-content-title'>Negative prompt</div>
                <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}   >
                  <Form.Item name="negative_prompt" >
                    <TextArea rows={6} onChange={(value) => TextAreaChange(value, 'negative_prompt')} onBlur={(value) => handleBlur(value, 'negative_prompt')}/>
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
                    <Slider min={0} max={1} step={0.01} trackStyle={{ backgroundColor: '#7F39FB' }} railStyle={{ backgroundColor: '#FFFFFF' }} value={stepsVal} onChange={(value) => onChangeSteps(value, 'num_inference_steps')}  />
                  </Form.Item>
                </ConfigProvider>
                <div className='slider-dec'>Results are better the more steps you use. If you want faster results you can use a smaller number.</div>
                <div className='slider-title'>Guidance {scaleVal}</div>
                <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}   >
                  <Form.Item name={'cfg'} style={{ marginBottom: 0 }}>
                    <Slider min={0} max={1} step={0.01} trackStyle={{ backgroundColor: '#7F39FB' }} railStyle={{ backgroundColor: '#FFFFFF' }} value={scaleVal}  onChange={(value) => onChangeScale(value, 'cfg')}  />
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
                    value={controlnetVal}
                    onChange={(value, option) => SelectComponentOnChange(value, option, 'controlnet')}
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
                      value={loraVal}
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
            onChange={(value) => onInpaintingChange(value, 'isInpainting')}
          />
        </Form.Item>
        <Form.Item name="Multidiffusion" label="Multidiffusion" valuePropName="multidiffusionChecked">
          <Switch checked={multidiffusionChecked}  onChange={(value) => onMultidiffusionChange(value, 'Multidiffusion')} />
        </Form.Item>
        <div className='generate-title  marB-3'>Image Content</div>
        <Form.Item
          name="custom_image_name"
          // label="Upload"
          valuePropName="fileList"
          getValueFromEvent={normFile}
        >
          <Upload
            action={"http://localhost:8000/module"}
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




//抠图1支持获取抠图部分的像素数据getImageData方法，且图片路径解决了请求头跨域问题
  // const init =()=>{
  //   // 创建原始图片
  //   const originalImage = new Image();
  //   originalImage.crossOrigin = 'anonymous';
  //   // originalImage.src = 'https://sagemaker-us-west-2-227263203486.s3.us-west-2.amazonaws.com/sd_engine_staging/cloud_data/output_imgs/8c04c0d8d880ee7042b92003ac0ae55a.jpg';
  //   // originalImage.src = 'http://web.cdn.olfk.top/user_icon.png';
  //   originalImage.src = 'http://web.cdn.olfk.top/1e317b55ae86edafbc06ee135f558a42%20%281%29.jpeg';
  //   originalImage.onload = function() {
  //       // 创建Canvas元素
  //       const canvas = document.createElement('canvas');
  //       const ctx = canvas.getContext('2d');

  //       // 设置Canvas大小
  //       canvas.width = 200; // 设置Canvas的宽度
  //       canvas.height = 200; // 设置Canvas的高度

  //       // 绘制原始图片
  //       ctx.drawImage(originalImage, 0, 0);

  //       // 定义抠图的坐标和大小
  //       const x = 50; // 左上角X坐标
  //       const y = 50; // 左上角Y坐标
  //       const width = 100; // 宽度
  //       const height = 100; // 高度

  //       // 获取抠图部分的像素数据
  //       const imageData = ctx.getImageData(x, y, width, height);

  //       // 创建一个新Canvas元素
  //       const resultCanvas = document.createElement('canvas');
  //       const resultCtx = resultCanvas.getContext('2d');

  //       // 设置新Canvas的大小
  //       resultCanvas.width = width;
  //       resultCanvas.height = height;

  //       // 将抠图的像素数据绘制到新Canvas上
  //       resultCtx.putImageData(imageData, 0, 0);

  //       // 将新Canvas转换为图片
  //       const resultImage = new Image();
  //       resultImage.src = resultCanvas.toDataURL('image/png');
  //       console.log(resultImage,'resultImage9999')
  //       console.log(resultImage.src ,'resultImage.src9999')
  //       // 添加到页面中或进行其他操作
  //       document.body.appendChild(resultImage);
  //   };

  // }

  //抠子元素mask，只抠mask
  // const init = ()=>{
  //   // 获取原始Canvas和上下文
  //   const originalCanvas = document.getElementById('myCanvas');
  //   const originalCtx = originalCanvas.getContext('2d');

  //   //   // 绘制一个矩形
  //   originalCtx.fillStyle = 'red';
  //   // 设置填充颜色为透明
  //   // originalCtx.fillStyle = 'rgba(255,0,0,0.3)';
  //   originalCtx.fillRect(50, 50, 200, 150);
  //   // 定义选中矩形的位置和尺寸
  //   const selectedX = 50; // 选中矩形的起始点 x 坐标
  //   const selectedY = 50; // 选中矩形的起始点 y 坐标
  //   const selectedWidth = 200; // 选中矩形的宽度
  //   const selectedHeight = 150; // 选中矩形的高度

  //   // 定义两个矩形的位置和尺寸
  //   const x1 = 60; // 第一个矩形的起始点 x 坐标
  //   const y1 = 60; // 第一个矩形的起始点 y 坐标
  //   const width1 = 80; // 第一个矩形的宽度
  //   const height1 = 60; // 第一个矩形的高度

  //   const x2 = 120; // 第二个矩形的起始点 x 坐标
  //   const y2 = 80; // 第二个矩形的起始点 y 坐标
  //   const width2 = 60; // 第二个矩形的宽度
  //   const height2 = 40; // 第二个矩形的高度

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
  //   // // 设置生成图片的背景色
  //   // resultCtx.fillStyle = 'rgba(0, 0, 0, 0)'; // 使用透明色作为背景色
  //   // originalCtx.fillStyle = 'rgba(0, 0, 0, 0)';
  //   // resultCtx.fillRect(0, 0, selectedWidth, selectedHeight);
  //   // 将选中区域的像素数据放置在新Canvas上
  //   resultCtx.putImageData(selectedImageData, 0, 0);



  //   // 根据两个坐标位置计算出两个矩形在像素数据中的位置
  //   const x1InImageData = x1 - selectedX;
  //   const y1InImageData = y1 - selectedY;
  //   const x2InImageData = x2 - selectedX;
  //   const y2InImageData = y2 - selectedY;


  //   // 绘制两个矩形
  //   resultCtx.globalCompositeOperation = 'source-over'; // 设置合成模式为覆盖源图像
  //   resultCtx.fillStyle = 'blue'; // 第一个矩形的颜色
  //   resultCtx.fillRect(x1InImageData, y1InImageData, width1, height1);

  //   resultCtx.fillStyle = 'green'; // 第二个矩形的颜色
  //   resultCtx.fillRect(x2InImageData, y2InImageData, width2, height2);

  //   // 将新Canvas转化为数据URL
  //   const dataURL = resultCanvas.toDataURL('image/png');

  //   // 创建一个新的图像元素，并设置其src属性为数据URL
  //   const resultImage = new Image();
  //   resultImage.src = dataURL;

  //   // 将图像元素添加到页面上
  //   document.body.appendChild(resultImage);

  // }

  //抠图2不完善
  // const init =()=>{
  //   // 创建原始图片
  //   const originalImage = new Image();
  //   originalImage.crossOrigin = 'anonymous';
  //   originalImage.src = 'https://sagemaker-us-west-2-227263203486.s3.us-west-2.amazonaws.com/sd_engine_staging/cloud_data/output_imgs/8c04c0d8d880ee7042b92003ac0ae55a.jpg';
  //   // originalImage.src = 'http://web.cdn.olfk.top/user_icon.png';
  //   // originalImage.src = 'http://web.cdn.olfk.top/1e317b55ae86edafbc06ee135f558a42%20%281%29.jpeg';
  //   originalImage.onload = function() {
  //       // 创建Canvas元素
  //       const canvas = document.createElement('canvas');
  //       const ctx = canvas.getContext('2d');

  //       // 设置Canvas大小
  //       canvas.width = 200; // 设置Canvas的宽度
  //       canvas.height = 200; // 设置Canvas的高度

  //       // 绘制原始图片
  //       ctx.drawImage(originalImage, 50, 50,100,100);

  //       // 将新Canvas转换为图片
  //       const resultImage = new Image();
  //       // 设置Canvas大小
  //       canvas.width = 100; // 设置Canvas的宽度
  //       canvas.height = 100; // 设置Canvas的高度
  //       resultImage.src = canvas.toDataURL('image/png');

  //       // 添加到页面中或进行其他操作
  //       document.body.appendChild(resultImage);
  //   };

  // }
  //抠图3不支持获取抠图部分的像素数据getImageData方法，且图片路径未解决请求头跨域问题
  // const init =()=>{
  //   // 为原始图像创建图像对象
  //   const originalImage = new Image();
  //   originalImage.crossOrigin = 'anonymous'; // 如果需要，确保允许跨来源访问
  //   originalImage.src = 'https://sagemaker-us-west-2-227263203486.s3.us-west-2.amazonaws.com/sd_engine_staging/cloud_data/output_imgs/8c04c0d8d880ee7042b92003ac0ae55a.jpg';

  //   originalImage.onload = function() {
  //     // 创建画布元素及其2D渲染上下文
  //     const canvas = document.createElement('canvas');
  //     const ctx = canvas.getContext('2d');

  //     // 定义要提取的部分的坐标和大小
  //     const sourceX = 100; // 源区域左上角的X坐标
  //     const sourceY = 100; // 源区域左上角的Y坐标
  //     const sourceWidth = 100; // 源区域的宽度
  //     const sourceHeight = 100; // 源区域的高度

  //     // 定义目标画布的大小
  //     const destinationWidth = 200; // 目标画布的宽度
  //     const destinationHeight = 200; // 目标画布的高度

  //     // 设置画布大小以匹配目标大小
  //     canvas.width = destinationWidth;
  //     canvas.height = destinationHeight;

  //     // 将提取的部分按指定大小绘制到画布上
  //     ctx.drawImage(
  //       originalImage,
  //       sourceX, sourceY, sourceWidth, sourceHeight, // 源坐标和大小
  //       0, 0, destinationWidth, destinationHeight    // 目的地坐标和大小
  //     );

  //     // 创建新的Image对象
  //     const resultImage = new Image();
  //     resultImage.src = canvas.toDataURL('image/png');

  //     // 将结果图像添加到DOM或执行其他操作
  //     document.body.appendChild(resultImage);
  //   };
  // }

  //抠子元素mask不完善
  // const init =()=>{
  //   // 获取Canvas元素和上下文
  //   const canvas = document.getElementById('myCanvas');
  //   const ctx = canvas.getContext('2d');

  //   // 绘制一个矩形
  //   ctx.fillStyle = 'blue';
  //   ctx.fillRect(50, 50, 200, 150);

  //   // 选中矩形
  //   ctx.beginPath();
  //   ctx.rect(50, 50, 200, 150);

  //   // 获取整个Canvas的像素数据
  //   const imageData = ctx.getImageData(50, 50, 200, 150)
  //   // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  //   // const data = imageData.data;

  //   // // 遍历像素数据，抠出矩形内的像素区域（示例中以透明颜色表示抠出）
  //   // for (let y = 50; y < 200; y++) {
  //   //   for (let x = 50; x < 250; x++) {
  //   //     const index = (y * imageData.width + x) * 4;
  //   //     data[index + 3] = 0; // 设置像素的 alpha 通道为0，表示透明
  //   //   }
  //   // }

  //   // 将修改后的像素数据放回Canvas
  //   ctx.putImageData(imageData, 0, 0);

  //   // 将Canvas内容导出为数据URL
  //   const dataURL = canvas.toDataURL('image/png');

  //   // 创建一个新的Image元素，将数据URL设置为src
  //   const resultImage = new Image();
  //   resultImage.src = dataURL;

  //   // 将图片添加到页面上
  //   document.body.appendChild(resultImage);

  // }

  //抠子元素image，只抠image
  // const init = ()=>{
  //   // 获取原始Canvas和上下文
  //   const originalCanvas = document.getElementById('myCanvas');
  //   const originalCtx = originalCanvas.getContext('2d');

  //   //   // 绘制一个矩形
  //   originalCtx.fillStyle = 'red';
  //   // 设置填充颜色为透明
  //   // originalCtx.fillStyle = 'rgba(255,0,0,0.3)';
  //   originalCtx.fillRect(50, 50, 200, 150);
  //   // 定义选中矩形的位置和尺寸
  //   const selectedX = 50; // 选中矩形的起始点 x 坐标
  //   const selectedY = 50; // 选中矩形的起始点 y 坐标
  //   const selectedWidth = 200; // 选中矩形的宽度
  //   const selectedHeight = 150; // 选中矩形的高度

  //   // 定义两个矩形的位置和尺寸
  //   const x1 = 60; // 第一个矩形的起始点 x 坐标
  //   const y1 = 60; // 第一个矩形的起始点 y 坐标
  //   const width1 = 80; // 第一个矩形的宽度
  //   const height1 = 60; // 第一个矩形的高度

  //   const x2 = 120; // 第二个矩形的起始点 x 坐标
  //   const y2 = 80; // 第二个矩形的起始点 y 坐标
  //   const width2 = 60; // 第二个矩形的宽度
  //   const height2 = 40; // 第二个矩形的高度

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
  //   // // 设置生成图片的背景色
  //   // resultCtx.fillStyle = 'rgba(0, 0, 0, 0)'; // 使用透明色作为背景色
  //   // originalCtx.fillStyle = 'rgba(0, 0, 0, 0)';
  //   // resultCtx.fillRect(0, 0, selectedWidth, selectedHeight);
  //   // 将选中区域的像素数据放置在新Canvas上
  //   resultCtx.putImageData(selectedImageData, 0, 0);



  //   // 根据两个坐标位置计算出两个矩形在像素数据中的位置
  //   const x1InImageData = x1 - selectedX;
  //   const y1InImageData = y1 - selectedY;
  //   const x2InImageData = x2 - selectedX;
  //   const y2InImageData = y2 - selectedY;


  //   // 绘制两个矩形
  //   resultCtx.globalCompositeOperation = 'source-over'; // 设置合成模式为覆盖源图像
  //   resultCtx.fillStyle = 'blue'; // 第一个矩形的颜色
  //   resultCtx.fillRect(x1InImageData, y1InImageData, width1, height1);

  //   resultCtx.fillStyle = 'green'; // 第二个矩形的颜色
  //   resultCtx.fillRect(x2InImageData, y2InImageData, width2, height2);

  //   // 将新Canvas转化为数据URL
  //   const dataURL = resultCanvas.toDataURL('image/png');

  //   // 创建一个新的图像元素，并设置其src属性为数据URL
  //   const resultImage = new Image();
  //   resultImage.src = dataURL;

  //   // 将图像元素添加到页面上
  //   document.body.appendChild(resultImage);

  // }