import fetchApi from "./fetch";
import queryString from 'query-string';

//获取用户信息
export const getUserInfo = async (params) => {
  // const jsonResponse = await fetchApi.get(`/text_to_image/config`,);
  const jsonResponse = await fetchApi.get(`/user/info`,);
  return jsonResponse;
};

//文生图
export const postImage = async (data, storeData) => {
  if (storeData.length === 0) {
    const file = new File([{}], '');
    const formData = new FormData();
    formData.append("params", JSON.stringify(data));
    formData.append("data", file);
    const jsonResponse = await fetchApi.post(`/engine/text_to_image?source=aigc_ui_service`, formData);
    return jsonResponse;
  } else {
    const formData = new FormData();
    formData.append("params", JSON.stringify(data));
    storeData.forEach((item, index) => {
      const file = item.originFileObj ? item.originFileObj : item;
      formData.append("data", file);
    });
    const jsonResponse = await fetchApi.post(`/engine/text_to_image?source=aigc_ui_service`, formData);
    return jsonResponse;
  }
};

//图生图
export const postImageToImage = async (data, storeData, files) => {
  console.log(data);
  if (storeData.length === 0) {
    const file = new File([{}], '');
    const formData = new FormData();
    formData.append("params", JSON.stringify(data));
    formData.append("data", file);
    const jsonResponse = await fetchApi.post(`/engine/image_to_image?source=aigc_ui_service`, formData);
    return jsonResponse;
  } else {
    console.log(storeData);
    const formData = new FormData();
    formData.append("params", JSON.stringify(data));
    //处理controlNet file文件
    storeData.forEach((item, index) => {
      const file = item.originFileObj ? item.originFileObj : item;
      console.log(file);
      formData.append("data", file);
    });
    console.log(formData);
    // return false;
    const jsonResponse = await fetchApi.post(`/engine/image_to_image?source=aigc_ui_service`, formData);
    return jsonResponse;
  }
};

//登陆 
export const userLogin = async (params) => {
  const temp = queryString.stringify(params)
  const jsonResponse = await fetchApi.get(`/text_to_image/user?${temp}`,);
  return jsonResponse;
};

//全部选项
export const description = async (params) => {
  // const jsonResponse = await fetchApi.get(`/text_to_image/config`,);
  const jsonResponse = await fetchApi.get(`/text_to_image/config`,);
  return jsonResponse;
};

//预处理
export const postPreprocess = async (data, storeData) => {
  const formData = new FormData();
  formData.append("params", JSON.stringify(data));
  const file = storeData.file.originFileObj;
  formData.append("data", file);

  const jsonResponse = await fetchApi.post(`/engine/preprocess?source=aigc_ui_service`, formData);
  return jsonResponse;
};

//单张图片参数 
export const imageInfo = async (data) => {
  let tempuuid = '6d22cea388574492b21213ad50bdb1f7';
  const jsonResponse = await fetchApi.get(`/text_to_image/query/image_params?source=aigc_ui_service&uid=${tempuuid}`, data);
  return jsonResponse;
};

//模型描述 
export const getDescription = async (params) => {
  const temp = queryString.stringify(params)
  const jsonResponse = await fetchApi.get(`/text_to_image/description?${temp}`,);
  return jsonResponse;
};

//用户注册  /user/signup  post
export const signup = async (formdata, headers) => {
  const jsonResponse = await fetchApi.post(`/user/signup`, formdata, null, true);
  return jsonResponse;
};

//用户登录 /user/login  post
export const login = async (data, headers) => {
  let customHeaders = {
    'Authorization': `${headers}`
  }
  const jsonResponse = await fetchApi.post(`/user/login`, data, customHeaders, true);
  return jsonResponse;
};

//登录后全部用户信息 配置信息
export const getAllDescription = async () => {
  const jsonResponse = await fetchApi.get(`/config/description`,);
  return jsonResponse;
};

//======模型生成 config
export const getLoraConfig = async () => {
  let user_info = JSON.parse(localStorage.getItem('user_info'));
  console.log(user_info);
  const formData = new FormData();
  const jsonResponse = await fetchApi.get(`/lora/config?uid=${user_info.user_id}`, null, false, true,)
  return jsonResponse;
};

//用于用户存储图片数据 
export const postUpload = async (params, options) => {
  let user_info = JSON.parse(localStorage.getItem('user_info'));
  const formData = new FormData();
  formData.append("params", JSON.stringify(params));
  options.forEach((item, index) => {
    console.log(item);
    const file = item.originFileObj ? item.originFileObj : item;
    formData.append("data", file);
  });
  const res = await fetchApi.post(`/lora/upload?uid=${user_info.user_id}`, formData, false, true, true);
  return res;
}

//用于lora训练
export const postTrain = async (params, options) => {
  let user_info = JSON.parse(localStorage.getItem('user_info'));
  const formData = new FormData();
  formData.append("params", JSON.stringify(params));
  const res = await fetchApi.post(`/lora/train?uid=${user_info.user_id}`, formData, false, true, true);
  return res;
}

//用于用户图片生成标签
export const postInterrogate = async (params,) => {
  let user_info = JSON.parse(localStorage.getItem('user_info'));
  const formData = new FormData();
  formData.append("params", JSON.stringify(params));
  const res = await fetchApi.post(`/lora/interrogate?uid=${user_info.user_id}`, formData, false, true, true);
  return res;
}
//==============

//全部历史请求图片
export const getHistoryRecord = async (params) => {
  const temp = queryString.stringify(params)
  const res = await fetchApi.get(`/record/history_record?${temp}`,);
  return res;
}

//获取全部数量 
export const getRecordTotal = async (params) => {
  const temp = queryString.stringify(params)
  const res = await fetchApi.get(`/record/record_total`,);
  return res;
}

//删除用户图片
export const deleteImage = async (params) => {
  const temp = queryString.stringify(params)
  const res = await fetchApi.delete(`/image?${temp}`,);
  return res;
}

//lora下拉选中user不为0的情况的删除接口
export const deleteLora = async (params) => {
  const temp = queryString.stringify(params)
  const res = await fetchApi.delete(`/config/description?${temp}`,);
  return res;
}

//查看服务器状态是否正常
export const getPing = async () => {
  const res = await fetchApi.get(`/common/ping`);
  return res;
}

//create简历socket成功后 调取请求结果 http://8.213.137.60:8886/engine/record/{record_id}
export const getRecord = async (params) => {
  const temp = queryString.stringify(params)
  const res = await fetchApi.get(`/record/?record_id=${params}`,);
  return res;
}

//Get Preprocess结果 http://8.213.137.60:8886/engine/preprocess/{process_id}
export const getPreprocessRes = async (params) => {
  const temp = queryString.stringify(params)
  const res = await fetchApi.get(`/task/preprocess/${params}`,);
  return res;
}

//图生图 socket后查看结果
export const getResponses = async (params) => {
  const temp = queryString.stringify(params)
  const res = await fetchApi.get(`/engine/response/${params}`,);
  return res;
}

//存储模版
export const putTemplate = async (params) => {
  const formData = new FormData();
  formData.append("template_info", JSON.stringify(params));
  const res = await fetchApi.post(`/template`, formData);
  return res;
}
//获取模版
export const getTemplate = async (params) => {
  const formData = new FormData();
  formData.append("template_info", JSON.stringify(params));
  const res = await fetchApi.get(`/template`);
  return res;
}
//删除用户模版
export const deleteEngineTemplate = async (params) => {
  const temp = queryString.stringify(params)
  const res = await fetchApi.delete(`/template?${temp}`);
  return res;
}

