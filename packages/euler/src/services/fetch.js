import react from 'react'
import { notification, message } from 'antd';
console.log('fetch----process.env', process.env) // > prod
// // 访问 NODE_ENV 环境变量
// console.log(import.meta.env.NODE_ENV,'环境变量');

// // 访问 API_BASE_URL 环境变量
// console.log(import.meta.env.API_BASE_URL,'环境变量url');
if (process.env.NODE_ENV) {
  console.log('Current environment:', process.env.NODE_ENV);
} else {
  console.log('Environment not defined.');
}

const token = localStorage.getItem('token');

const fetchWrapper = {
  baseURL: 'http://13.212.144.219:8907',
  createModalBaseURL: 'http://13.250.52.38:8885',
  socketBaseURL:'ws://13.212.144.219:8907',
  createModalSocketBaseURL: 'ws://13.250.52.38:8885',
  // baseURL: process.env.BASE_URL,
  // createModalBaseURL: process.env.CREATE_MODAL_BASE_URL,
  // socketBaseURL: process.env.SOCKET_BASE_URL,//socket
  // createModalSocketBaseURL: process.env.CREATE_MODAL_SOCKET_BASE_URL, //模型生成中用到的socket地址
  // socketBaseURL: 'ws://13.250.52.38:8885',//socket统一请求地址/
  timeout: 300000,//超时时间 默认60秒
  headers: {
    'Content-Type': 'application/json',
    'Authorization': token ? `${token}` : '',
  },//默认请求头
  maxRetries: 3,
  retryDelay: 1000,
  // _request 方法用于处理所有类型的 HTTP 请求
  // - method: HTTP 请求方法，例如 'GET', 'POST', 'PUT', 'DELETE' 等
  // - endpoint: 请求的 URL 路径
  // - data: 请求发送的数据，可以是 FormData、JSON 等
  // - customHeaders: 自定义请求头
  // - onUploadProgress: 上传进度的回调函数
  // - onDownloadProgress: 下载进度的回调函数
  async get(endpoint, customHeaders = {}, useTempUrl) {
    return this._requestWithRetry('GET', endpoint, null, customHeaders, useTempUrl);
  },

  async post(endpoint, data, customHeaders = {}, useTempUrl) {
    return this._requestWithRetry('POST', endpoint, data, customHeaders, useTempUrl);
  },

  async put(endpoint, data, customHeaders = {},) {
    return this._requestWithRetry('PUT', endpoint, data, customHeaders,);
  },

  async delete(endpoint, customHeaders = {},) {
    return this._requestWithRetry('DELETE', endpoint, null, customHeaders,);
  },

  async _requestWithRetry(method, endpoint, data, customHeaders, onUploadProgress, onDownloadProgress,) {
    let retries = 0;
    const tryFetch = async () => {
      try {
        const result = await this._request(method, endpoint, data, customHeaders, onUploadProgress, onDownloadProgress,);
        return result;
      } catch (error) {
        if (error.message.startsWith('请求超时') && retries < this.maxRetries) {
          retries++;
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
          return tryFetch();
        } else {
          throw error;
        }
      }
    };
    return tryFetch();
  },

  async _request(
    method,
    endpoint,
    data,
    customHeaders,
    onUploadProgress,
    onDownloadProgress,
    skipTokenCheck = true, // 添加一个新参数skipTokenCheck，默认值为false
    useTempUrl = false, // 新增参数，用于判断是否使用createModalBaseURL，默认值为false
  ) {
    /* eslint-disable-next-line no-debugger */
    debugger
    // const url = `${this.baseURL}${endpoint}`;
    const url = useTempUrl ? `${this.createModalBaseURL}${endpoint}` : `${this.baseURL}${endpoint}`; // 根据useTempUrl判断使用哪个URL
    // const token = localStorage.getItem('token');
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo0MCwiZXhwIjoxNjkyNDI2MzY0fQ.j7OzGNJtBBZpsx7sQP7Mci3StwP-Tgw__Gmy_b8KQfw';
    if (!token && !skipTokenCheck) { // 检查是否需要跳过token检查
      window.location.href = '/login';
      return;
    }

    const headers = {
      ...this.headers,
      ...customHeaders,
      'Authorization': token ? `${token}` : '',

    };

    // 如果 customHeaders 有 'Authorization'，则优先使用 customHeaders 的 'Authorization'
    if (customHeaders && customHeaders['Authorization']) {
      headers['Authorization'] = customHeaders['Authorization'];
    } else {
      headers['Authorization'] = token ? `${token}` : '';
    }

    const options = {
      method,
      headers: data instanceof FormData ? {
        ...customHeaders,
        'Authorization': token ? `${token}` : '',
        keepalive: true, // 添加 keepalive 选项
      } : new Headers(headers),
    };

    if (['POST', 'PUT'].includes(method)) {
      options.body = data instanceof FormData ? data : JSON.stringify(data);

      if (data instanceof FormData && onUploadProgress) {
        options.body = this._uploadProgress(data, onUploadProgress);
      }
    }

    const controller = new AbortController();
    options.signal = controller.signal;
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, options);
      clearTimeout(timeoutId);
      this._handleErrors(response);

      if (onDownloadProgress) {
        return this._downloadProgress(response, onDownloadProgress);
      } else {
        return response.json();
      }
    } catch (error) {
      console.log(error.message);
      //检查是否由于请求超时
      if (error.name === 'AbortError') {
        notification.error({
          message: '请求超时',
          description: `请求超时：${this.timeout} 毫秒`,
        });
        // throw new Error(`请求超时：${ this.timeout } 毫秒`);
      }
      //检查是否是由于后台服务停止导致的错误
      // if (error.message === 'Failed to fetch') {
      //   notification.error({
      //     message: '请求未响应',
      //     description: '无法连接请求，请检查网络连接或稍后重试',
      //   });
      //   // throw new Error(`错误：后台接口服务停止`);
      // }
      // throw error;
    }
  },

  // _uploadProgress 方法用于监听文件上传进度
  // - data: 包含文件数据的 FormData 对象
  // - onUploadProgress: 上传进度的回调函数
  _uploadProgress(data, onUploadProgress) {
    return new ReadableStream({
      async start(controller) {
        for (const [key, value] of data.entries()) {
          await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              const arrayBuffer = event.target.result;
              const chunk = new Uint8Array(arrayBuffer);
              controller.enqueue(chunk);
              resolve();
            };
            reader.readAsArrayBuffer(value);
          });
        }
        controller.close();
        onUploadProgress(100);
      },
    });
  },

  // _downloadProgress 方法用于监听文件下载进度
  // - response: 包含响应数据的 Response 对象
  // - onDownloadProgress: 下载进度的回调函数
  async _downloadProgress(response, onDownloadProgress) {
    const reader = response.body.getReader();
    const contentLength = +response.headers.get('Content-Length');
    let receivedLength = 0;

    let chunks = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
      receivedLength += value.length;
      const progress = (receivedLength / contentLength) * 100;
      onDownloadProgress(progress.toFixed(2));
    }

    const finalBlob = new Blob(chunks);
    return new Response(finalBlob).json();
  },

  //统一错误处理
  _handleErrors(response) {
    if (!response.ok) {
      let errorMessage;
      if (response.status === 502) {
        errorMessage = '错误：状态码 502';
      } else {
        errorMessage = `请求错误：${response.status} ${response.statusText} `;
      }

      if (response.status === 401) {
        console.log(response);
        message.error('身份验证已过期，请重新登陆');
        localStorage.clear();
        localStorage.removeItem('selectType');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      // notification.error({
      //   message: '请求错误',
      //   description: errorMessage,
      // });
    }
  },
};

fetchWrapper.get = function (endpoint, customHeaders, skipTokenCheck, useTempUrl = false) {
  /* eslint-disable-next-line no-debugger */
  debugger
  return this._request('GET', endpoint, null, customHeaders, null, null, skipTokenCheck, useTempUrl);
};
fetchWrapper.post = function (endpoint, data, customHeaders, skipTokenCheck, useTempUrl = false) {
  return this._request('POST', endpoint, data, customHeaders, null, null, skipTokenCheck, useTempUrl);
};
fetchWrapper.put = function (endpoint, data, customHeaders, skipTokenCheck, useTempUrl = false) {
  return this._request('PUT', endpoint, data, customHeaders, null, null, skipTokenCheck, useTempUrl);
};
fetchWrapper.delete = function (endpoint, customHeaders, skipTokenCheck, useTempUrl = false) {
  return this._request('DELETE', endpoint, null, customHeaders, null, null, skipTokenCheck, useTempUrl);
};

export default fetchWrapper;

