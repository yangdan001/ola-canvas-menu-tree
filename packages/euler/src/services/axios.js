import axios from 'axios';
import { notification, message } from 'antd';

const token = localStorage.getItem('token');
// const baseURL = 'http://43.131.249.66:8886'; // 统一请求地址
const baseURL = 'http://8.213.137.60:8886';//统一请求地址
// const timeout = 240000; // 超时时间，默认120秒
const maxRetries = 3;
const retryDelay = 1000;
axios.defaults.timeout = 2400000;

const api = axios.create({
  baseURL,
  // timeout,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': token ? `${token}` : '',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const { message: errorMessage } = error;

    if (error.response) {
      const { status, statusText } = error.response;
      const errorMessage = `请求错误：${status} ${statusText}`;

      if (status === 401) {
        message.error('身份验证已过期，请重新登录');
        // localStorage.clear();
        localStorage.removeItem('selectType');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } else if (errorMessage === 'Network Error') {
      notification.error({
        message: '请求未响应',
        description: '无法连接请求，请检查网络连接或稍后重试',
      });
    } else if (errorMessage.startsWith('请求超时')) {
      notification.error({
        message: '请求超时',
        description: errorMessage,
      });
    }

    return Promise.reject(error);
  }
);

const request = async (method, endpoint, data = {}, customHeaders = {}, skipTokenCheck = false) => {
  const url = `${baseURL}${endpoint}`;
  console.log(url);
  const headers = {
    ...api.defaults.headers,
    ...customHeaders,
    'Authorization': token ? `${token}` : '',
  };

  const options = {
    method,
    url,
    headers,
    // timeout,
    data: data instanceof FormData ? data : shouldUseFormData(data) ? transformToFormData(data) : data,
  };

  try {
    console.log(options);
    const response = await api.request(options);
    return response;
  } catch (error) {
    console.log(error);
    // if (error.message.startsWith('请求超时') && retries < maxRetries) {
    //   await new Promise((resolve) => setTimeout(resolve, retryDelay));
    //   return request(method, endpoint, data, customHeaders, skipTokenCheck);
    // } else {
    //   throw error;
    // }
  }
};

const shouldUseFormData = (data) => {
  // 根据需要自定义逻辑来判断是否应该使用 FormData
  // 返回 true 表示需要使用 FormData，返回 false 表示不使用 FormData
  return false;
};

const transformToFormData = (data) => {
  const formData = new FormData();
  for (const key in data) {
    formData.append(key, data[key]);
  }
  return formData;
};

const fetchWrapper = {
  get(endpoint, customHeaders = {}, skipTokenCheck) {
    return request('GET', endpoint, null, customHeaders, skipTokenCheck);
  },

  post(endpoint, data, customHeaders = {}, skipTokenCheck) {
    return request('POST', endpoint, data, customHeaders, skipTokenCheck);
  },

  put(endpoint, data, customHeaders = {}, skipTokenCheck) {
    return request('PUT', endpoint, data, customHeaders, skipTokenCheck);
  },

  delete(endpoint, customHeaders = {}, skipTokenCheck) {
    return request('DELETE', endpoint, null, customHeaders, skipTokenCheck);
  },
};

export default fetchWrapper;
