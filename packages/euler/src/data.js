import { notification } from 'antd';
export const SelectData = [
  { title: '文生图', id: '1' },
  { title: '图生图', id: '2' },
  { title: '模型生成', id: '3' },
  { title: '视频生成', id: '4' },
];


//默认宽高比
export const defaultWidthHeight = [
  {
    title: '1 : 1',
    subtitle: '512 * 512',
    value: '1',
    id: 1
  },
  {
    title: '9 : 16',
    subtitle: '512 * 912',
    value: '2',
    id: 2
  },
  {
    title: '16 : 9',
    subtitle: '912 * 512',
    value: '3',
    id: 3
  },
]

// const tempCheck = (value, store, selectType) => {
//   console.log(store.status);
//   console.log(store.status.image_names.custom_image_name);

//   if (selectType === '2') {
//     if (
//       Object.keys(store.status.image_names.custom_image_name).length !== 0 &&
//       store.status.image_names.custom_image_name.file.name &&
//       store.status.image_names.custom_image_name.start_file &&
//       store.status.image_names.custom_image_name.start_file.name &&
//       store.status.image_names.custom_image_name.mask.name
//     ) {
//       console.log('2');
//       return [
//         store.status.image_names.custom_image_name.file.name,
//         store.status.image_names.custom_image_name.start_file.name,
//         store.status.image_names.custom_image_name.mask.name,
//       ]
//     }

//     //如果上传图片和编辑过的图片都存在
//     if (
//       Object.keys(store.status.image_names.custom_image_name) &&
//       store.status.image_names.custom_image_name.file.name &&
//       store.status.image_names.custom_image_name.start_file &&
//       store.status.image_names.custom_image_name.start_file.name
//     ) {
//       console.log('8');
//       return [
//         store.status.image_names.custom_image_name.file.name,
//         store.status.image_names.custom_image_name.start_file.name
//       ]
//     }

//     //mask图片和上传图片
//     if (
//       Object.keys(store.status.image_names.custom_image_name).length !== 0 &&
//       store.status.image_names.custom_image_name.file.name &&
//       store.status.image_names.custom_image_name.mask
//     ) {
//       console.log('3');
//       return [
//         store.status.image_names.custom_image_name.file.name,
//         store.status.image_names.custom_image_name.mask.name
//       ]
//     }

//     //如果只有上传图片
//     if (
//       Object.keys(store.status.image_names.custom_image_name) &&
//       store.status.image_names.custom_image_name.file.name
//     ) {
//       console.log('4');
//       return [store.status.image_names.custom_image_name.file.name]
//     }


//   } else {
//     return [];
//   }
// }


const tempCheck = (value, store, selectType) => {
  console.log(store.status);
  console.log(store.status.image_names.custom_image_name);

  if (selectType === '2') {
    let imgObj = store.status.image_names.custom_image_name;
    let keysExist = Object.keys(imgObj).length !== 0;

    if (
      keysExist &&
      imgObj.file &&
      imgObj.file.name &&
      imgObj.start_file &&
      imgObj.start_file.name &&
      imgObj.mask && // check if mask exists before accessing its properties
      imgObj.mask.name
    ) {
      console.log('2');
      if (store.status.isInpainting === '0') {
        return [imgObj.file.name,]
      } else {
        return [imgObj.start_file.name, imgObj.file.name, imgObj.mask.name]
      }


    }

    //如果上传图片和编辑过的图片都存在
    if (
      keysExist &&
      imgObj.file &&
      imgObj.file.name &&
      imgObj.start_file &&
      imgObj.start_file.name
    ) {
      console.log('8');
      if (store.status.isInpainting === '0') {
        console.log(store.status.isInpainting);
        return [imgObj.file.name,]
      } else {
        return [imgObj.start_file.name, imgObj.file.name,]
      }

    }

    //mask图片和上传图片
    if (
      keysExist &&
      imgObj.file &&
      imgObj.file.name &&
      imgObj.mask  // check if mask exists before accessing its properties
    ) {
      console.log('3');
      return [imgObj.file.name, imgObj.mask.name]
    }

    //如果只有上传图片
    if (
      keysExist &&
      imgObj.file &&
      imgObj.file.name
    ) {
      console.log('4');
      return [imgObj.file.name]
    }

  } else {
    return [];
  }
}


//拼接后端所需要的数据格式方法
export const setDatas = (value, store, selectType) => {
  //处理Lord模型
  const newArray = [];
  const controlNetArray = [];
  const imageNamesArray = [];
  for (const key in value) {
    if (key.startsWith("model_name")) {
      const index = key.replace("model_name", "");
      const model_name = value[key];
      const teWeights = value["te_weights" + index];
      const unetWeights = value["unet_weights" + index];
      const newObject = {
        model_name: model_name,
        unet_weights: unetWeights,
        te_weights: teWeights,
      };
      newArray.push(newObject);
    }
  }
  if (store.status.controlnet && store.status.controlnet.length !== 0) {
    store.status.controlnet.map((item, index) => {
      controlNetArray.push({
        model_name: item.model_name,
        apply: {
          strength: item.strength
        },
        preprocess: [],
        load_img_index: selectType && selectType === '2' ? index + 1 : index
      })
    })
    const nullIndexes = store.status.controlnet.filter(obj => obj.target_file === '' || obj.target_file === null || obj.target_file === undefined).map(obj => store.status.controlnet.indexOf(obj));
    const newIndexes = nullIndexes.map(index => index + 1);
    //证明target_file有空值 校验未通过
    if (newIndexes.length !== 0) {
      notification.error({
        message: '',
        description: `请传入索引为${newIndexes.join(',')}的ControlNet检测图片`,
      });
      return false;
    } else {
      store.status.controlnet.map((item, index) => {
        if (item.target_file.name) {
          imageNamesArray.push(item.target_file.name);
        }
      })
    }
  }

  //拼接json对象，传递后端
  let datas = {
    models: {
      base_model_name: value.base_model_name,
      vae_model_name: value.vae_model_name,
    },
    lora: value.lora ? value.lora : [],
    controlnet: store.status.controlnet.length !== 0 ? controlNetArray : [],
    image_names: {
      control_image_name: store.status.controlnet.length !== 0 ? imageNamesArray : [],
      custom_image_name: tempCheck(value, store, selectType),
    },
    prompts: {
      positive_prompt: value.positive_prompt,
      negative_prompt: value.negative_prompt ? value.negative_prompt : null,
    },
    sampler_params: {
      number: value.number,
      num_inference_steps: value.num_inference_steps,
      cfg: value.cfg,
      scheduler_name: value.scheduler_name,
      width: value.width,
      height: value.height,
      seed: value.seed ? value.seed : 'disable',
      denoise: value.denoise, //去噪强度 Denoising Strength
    }
  }
  if (selectType === "2") {
    datas = {
      isInpainting: store.status.image_names.custom_image_name && store.status.image_names.custom_image_name.mask ?
        2 : store.status.isInpainting,
      ...datas
    };

  }
  return datas;
}

export const setStoreDatas = (value, store, selectType) => {
  //处理Lord模型
  const newArray = [];
  for (const key in value) {
    if (key.startsWith("model_name")) {
      const index = key.replace("model_name", "");
      const model_name = value[key];
      const teWeights = value["te_weights" + index];
      const unetWeights = value["unet_weights" + index];
      const newObject = {
        model_name: model_name,
        unet_weights: unetWeights,
        te_weights: teWeights,
      };
      newArray.push(newObject);
    }
  }

  //拼接json对象，传递后端
  let datas = {
    models: {
      base_model_name: value.base_model_name,
      vae_model_name: value.vae_model_name,
    },
    lora: value.lora ? value.lora : [],
    controlnet: store.status.controlnet.length !== 0 ? store.status.controlnet : [],
    image_names: value.image_names ? value.image_names : {
      control_image_name: [],
      custom_image_name: store.status.image_names.custom_image_name,
    },
    sampler_params: {
      prompts: {
        positive_prompt: value.positive_prompt,
        negative_prompt: value.negative_prompt ? value.negative_prompt : null,
      },
      number: value.number,
      num_inference_steps: value.num_inference_steps,
      cfg: value.cfg,
      scheduler_name: value.scheduler_name,
      width: value.width,
      height: value.height,
      seed: value.seed && value.seed,
      denoise: value.denoise, //去噪强度 Denoising Strength
    },
  }
  if (selectType === "2") {
    datas = {
      isInpainting: store.status.isInpainting,
      ...datas
    };
  }
  console.log(datas);
  return datas;
}

export const manageControlnetFile = (data, type) => {
  console.log(data);
  const files = [];
  if (type && type === '2' && data && data.image_names.custom_image_name.length !== 0) {

    //如果上传图存在 mask图不存在 Edit图片不存在
    if (
      data.image_names.custom_image_name.file &&
      !data.image_names.custom_image_name.mask &&
      !data.image_names.custom_image_name.start_file
    ) {
      files.push(data.image_names.custom_image_name.file)
    }

    //如果上传图和mask图存在 Edit图片不存在
    if (
      data.image_names.custom_image_name.file &&
      data.image_names.custom_image_name.mask &&
      !data.image_names.custom_image_name.start_file
    ) {
      console.log('如果上传图和mask图存在 Edit图片不存在');
      files.push(data.image_names.custom_image_name.file)
      if (data.image_names.custom_image_name.start_file) {
        files.push(data.image_names.custom_image_name.start_file)
      }
      if (data.image_names.custom_image_name.mask) {
        files.push(data.image_names.custom_image_name.mask)
      }
    }

    //如果上传图 mask图 edit图都存在
    if (
      data.image_names.custom_image_name.file &&
      data.image_names.custom_image_name.mask &&
      data.image_names.custom_image_name.start_file
    ) {
      console.log('如果上传图 mask图 edit图都存在');
      if (data.isInpainting === '0') {
        files.push(data.image_names.custom_image_name.file)
      } else {
        if (data.image_names.custom_image_name.start_file) {
          files.push(data.image_names.custom_image_name.start_file)
        }
        files.push(data.image_names.custom_image_name.file)
        if (data.image_names.custom_image_name.mask) {
          files.push(data.image_names.custom_image_name.mask)
        }
      }
    }

    //如果上传图存在 mask图不存在 edit图存在
    if (
      data.image_names.custom_image_name.file &&
      !data.image_names.custom_image_name.mask &&
      data.image_names.custom_image_name.start_file
    ) {
      console.log('如果上传图存在 mask图不存在 edit图存在');

      if (data.isInpainting === '0') {
        files.push(data.image_names.custom_image_name.file)
      } else {
        if (data.image_names.custom_image_name.start_file) {
          files.push(data.image_names.custom_image_name.start_file)
        }
        files.push(data.image_names.custom_image_name.file)
      }


    }
  }
  if (data && data.controlnet.length !== 0) {
    data.controlnet.map((item) => {
      files.push(item.target_file)
    })
  }
  console.log(files);
  return files;
}

function convertImgToBase64(url, callback, outputFormat) {
  var img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function () {
    var canvas = document.createElement('CANVAS');
    var ctx = canvas.getContext('2d');
    var dataURL;
    canvas.height = this.height;
    canvas.width = this.width;
    ctx.drawImage(this, 0, 0);
    dataURL = canvas.toDataURL(outputFormat);
    callback(dataURL);
    canvas = null;
  };
  img.src = url;
}

//base64转file格式
export async function base64ToFile(url, filename, mimeType = 'image/png') {
  return new Promise((resolve) => {
    convertImgToBase64(url, async (base64Img) => {
      base64Img = base64Img.replace(/^data:image\/[a-z]+;base64,/, '');

      const base64ToArrayBuffer = (base64Img) => {
        const binary_string = atob(base64Img);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
      };

      const base64ToBlob = (base64Img, mimeType) => {
        const arrayBuffer = base64ToArrayBuffer(base64Img);
        return new Blob([arrayBuffer], { type: mimeType });
      };

      const blob = base64ToBlob(base64Img, mimeType);
      resolve(new File([blob], filename, { type: mimeType, lastModified: Date.now() }));
    }, mimeType);
  });
}

export function getBase64Image(imgUrl, callback) {
  const timestamp = Date.now(); // 获取当前时间戳
  // 在请求的 URL 中添加随机参数
  const urlWithRandomParam = `${imgUrl}?_=${timestamp}`;
  fetch(urlWithRandomParam)
    .then(response => {
      console.log(response);
      if (response.ok) {
        return response.blob();
      } else {
        throw new Error('Network response was not ok');
      }
    })
    .then(blob => {
      let reader = new FileReader();
      reader.onloadend = function () {
        callback(reader.result); // "data:image/jpeg;base64,iVBORw0KG..."
        console.log(reader.result);
      };
      reader.readAsDataURL(blob);
    })
    .catch(error => {
      console.error('There has been a problem with your fetch operation:', error);
    });
}

function guessImageType(base64) {
  const prefix = base64.substr(0, 5);
  switch (prefix) {
    case '/9j/4':
      return 'image/jpeg';
    case 'iVBOR':
      return 'image/png';
    case 'R0lGO':
      return 'image/gif';
    case 'UklGR':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

export async function base64ToFile2(base64Img, filename) {
  // console.log(base64Img, filename);
  return new Promise((resolve) => {
    // const mimeType = guessImageType(base64Img);
    let firstSplit = base64Img.split(";")[0];
    let secondSplit = firstSplit.split(":")[1];
    let tempBase64 = base64Img.split(",")[1];
    // console.log(base64Img);
    const base64ToArrayBuffer = (tempBase64) => {
      const binary_string = atob(tempBase64);
      const len = binary_string.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes.buffer;
    };

    const base64ToBlob = (tempBase64, secondSplit) => {
      const arrayBuffer = base64ToArrayBuffer(tempBase64);
      return new Blob([arrayBuffer], { type: secondSplit });
    };

    const blob = base64ToBlob(tempBase64, secondSplit);
    resolve(new File([blob], filename, { type: secondSplit, lastModified: Date.now() }));
  });
}


//base64转换为file文件
export const dataURLtoFile = (dataurl, filename, type) => {
  var arr = dataurl.split(','),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  var lastModified = Date.now();
  var file = new File([u8arr], filename, { type: mime, lastModified: lastModified });
  return file;
}

