import React, { useState, useEffect } from 'react';
import { notification, message, Spin } from 'antd';
import './reset-login.css';
import { useNavigate } from 'react-router-dom';
import _ from 'lodash';
import { signup, login, getUserInfo } from '../../services/api';
import Cookies from 'js-cookie';
import CryptoJS from 'crypto-js';
const SECRET_KEY = 'my_key';
const LoginPage = () => {

  const [passwordType, setPasswordType] = useState('password');
  const [checkPasswordType, setCheckPasswordType] = useState('password');
  const [loginTypes, setLoginTypes] = useState('login');
  const [remember, setRemember] = useState(false);

  const [loading, setLoading] = useState(false);//loading
  const navigate = useNavigate();


  const [fields, setFields] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const cookieUsername = Cookies.get('username');
    const cookiePassword = Cookies.get('password');

    if (cookieUsername && cookiePassword) {
      // 使用MD5解密用户名和密码
      const decryptedUsername = CryptoJS.AES.decrypt(cookieUsername, SECRET_KEY).toString(CryptoJS.enc.Utf8);
      const decryptedPassword = CryptoJS.AES.decrypt(cookiePassword, SECRET_KEY).toString(CryptoJS.enc.Utf8);
      setFields(
        {
          username: decryptedUsername,
          password: decryptedPassword,
          email: '',
          confirmPassword: '',
        }
      );
      setRemember(true);
    }
  }, []);

  const handleChangeTypes = () => {
    setLoginTypes('register');
    setFields({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
    setErrors({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
  }

  const alreadyLog = () => {
    setLoginTypes('login');
    setFields({
      // username: '',
      email: '',
      // password: '',
      confirmPassword: '',
    })
    setErrors({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
  }

  const changePasswordType = () => {
    if (passwordType === 'password') {
      setPasswordType('text');
    }
    if (passwordType === 'text') {
      setPasswordType('password');
    }
  }

  const changeCheckPasswordType = () => {
    if (checkPasswordType === 'password') {
      setCheckPasswordType('text');
    }
    if (checkPasswordType === 'text') {
      setCheckPasswordType('password');
    }
  }

  const validateInput = (value, type) => {
    let error = '';
    switch (type) {
      case 'username':
        if (value) {
          if (/\s/.test(value) || value.length < 6 || value.length > 30 || !(/^[a-zA-Z0-9_@]+$/).test(value)) {
            error = '长度必须为6-30位的数字、字母、下划线、@符';
          }
        } else {
          error = '请输入用户名';
        }
        break;
      case 'email':
        if (value) {
          if (/\s/.test(value) || !/^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(value)) {
            error = '请提供有效的电子邮件地址';
          }
        } else {
          error = '请输入邮箱';
        }
        break;
      case 'password':
        if (value) {
          if (/\s/.test(value) || value.length < 6) {
            error = '密码长度必须大于6位';
          }
        } else {
          error = '请输入密码';
        }
        break;
      case 'confirmPassword':
        if (!fields.password || value !== fields.password) {
          error = '两次密码输入不一致，请重新输入';
        }
        break;
      default:
        break;
    }

    return new Promise((resolve) => {
      setErrors((prevState) => {
        const newState = {
          ...prevState,
          [type]: error,
        };
        resolve(newState);  // 解决 Promise 并返回新的状态
        return newState;
      });
    });
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (/\s/.test(value)) {
      // 如果包含空格，则不做任何事情，直接返回
      return;
    }
    setFields({
      ...fields,
      [name]: value
    });
    // validateInput(value, name);
    // 如果用户修改了用户名或密码，取消记住我
    if (remember && (name === 'username' || name === 'password')) {
      setRemember(false);
    }
  }

  const handleRememberChange = (e) => {
    setRemember(e.target.checked);
    if (!e.target.checked) {
      // 如果用户取消记住我，我们需要删除cookie中的用户名和密码
      Cookies.remove('username');
      Cookies.remove('password');
    }
  }

  const handleLoginClick = async () => {
    const { username, password } = fields;
    const newErrors = await Promise.all([
      validateInput(username, 'username'),
      validateInput(password, 'password'),
    ]);
    const hasErrors = newErrors.some(errors => Object.values(errors).some(error => error));
    // 检查是否有错误存在
    if (!hasErrors) {
      // 所有校验都通过
      try {
        setLoading(true);
        let temp = JSON.stringify({ username: username, password: password });
        const customHeaders = `Basic ${btoa(`${username}:${password}`)}`;
        await login(temp, customHeaders).then(async (res) => {
          setLoading(false);
          if (res && !res.code && res.token) {
            localStorage.setItem('token', res.token);
            //设置默认选中文生图
            localStorage.setItem('selectType', '1');
            message.success("登录成功");
            const result = await getUserInfo();
            if (result && result.code === 0 && result.user_info.user_id) {
              localStorage.setItem('user_info', JSON.stringify(result.user_info));
            }
            if (remember) {
              const encryptedUsername = CryptoJS.AES.encrypt(username, SECRET_KEY).toString();
              const encryptedPassword = CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
              // 如果remember为true，将用户名和密码保存到cookie中，有效期7天
              Cookies.set('username', encryptedUsername, { expires: 7 });
              Cookies.set('password', encryptedPassword, { expires: 7 });
            } else {
              // 如果remember为false，删除cookie中的用户名和密码
              Cookies.remove('username');
              Cookies.remove('password');
            }
            navigate('/editor');
            setPasswordType('text');
            setCheckPasswordType('text');
          } else {
            notification.error({
              message: `发生错误-code${res && res.code ? res.code : '登陆失败'}`,
              description: `${res && res.message ? res.message : '登陆失败'}`,
            });
          }
        })
      } catch (err) {
        console.log(err);
        setLoading(false);
      }
    } else {
      // 至少有一个校验未通过
    }
    // 登录的逻辑
  }

  const handleRegister = async () => {
    const { username, email, password, confirmPassword } = fields;
    const newErrors = await Promise.all([
      validateInput(username, 'username'),
      validateInput(email, 'email'),
      validateInput(password, 'password'),
      validateInput(confirmPassword, 'confirmPassword'),
    ]);
    const hasErrors = newErrors.some(errors => Object.values(errors).some(error => error));

    // 检查是否有错误存在
    if (!hasErrors) {
      // 所有校验都通过
      setLoading(true);
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('email', email);
      formData.append('first_name', '自定义');
      formData.append('last_name', '自定义');
      formData.append('date_of_birth', '2000-01-01');
      try {
        await signup(formData).then((res) => {
          setLoading(false);
          if (res.code === 0) {
            try {
              message.success('注册成功')
              setPasswordType('password');
              setCheckPasswordType('password');
              setLoginTypes('login');
              setFields({
                username: username,
                password: password,
              })
            } catch (err) {
              console.log(err);
            }
          } else {
            notification.error({
              message: `发生错误 - code${res && res.code ? res.code : 'null'}`,
              description: `${res && res.message ? res.message : '未知错误'}`,
            });
          }
        })
        // 之后的代码
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    } else {
      // 至少有一个校验未通过
    }
  }

  return (
    <div className="container"  >
      <Spin tip="Loading" spinning={loading} className="loginForm" >
        <div className="formStyle">
          <div className="logo">
            <img src="https://dom79wdncc7wd.cloudfront.net/icon/black_logo.png" alt="logo" />
          </div>
          <div className="title"> 欧拉AI - 石墨引擎 </div>
          <div className="user">
            <label>用户名</label>
            <input
              type="text"
              name="username"
              value={fields.username}
              onChange={handleInputChange}
            />
            <div className="errorText" >{errors.username}</div>
          </div>
          {
            loginTypes === "register" && <div className="email">
              <label>Email</label>
              <input type="text" name="email" value={fields.email} onChange={handleInputChange} />
              <div className="errorText" >{errors.email}</div>
            </div>
          }
          <div className="password">
            <label>密码</label>
            <input type={passwordType} name="password" value={fields.password} onChange={handleInputChange} />
            <img onClick={changePasswordType} src="https://sagemaker-us-west-2-227263203486.s3.us-west-2.amazonaws.com/sd-front/icons/eyes.png" alt="eyes" />
            <div className="errorText" >{errors.password}</div>
          </div>
          {
            loginTypes === "register" && <div className="password">
              <label>确认密码</label>
              <input type={checkPasswordType} name="confirmPassword" value={fields.confirmPassword} onChange={handleInputChange} />
              <img onClick={changeCheckPasswordType} src="https://sagemaker-us-west-2-227263203486.s3.us-west-2.amazonaws.com/sd-front/icons/eyes.png" alt="eyes" />
              <div className="errorText" >{errors.confirmPassword}</div>
            </div>
          }
          {
            loginTypes === "login" &&
            <div className="remember">
              <input id={'remember'} type="checkbox" className="checkbox_styles" checked={remember} onChange={handleRememberChange} />
              <label className="label_styles" htmlFor="remember">记住我</label>
            </div>
          }
          {
            loginTypes === "login" && <div className="login">
              <button onClick={handleLoginClick}>登陆</button>
              <button onClick={handleChangeTypes}>注册</button>
            </div>
          }
          {
            loginTypes === "register" &&
            <div className="register">
              <button onClick={handleRegister}>注册</button>
              <div className="already">
                <span onClick={alreadyLog}>已有账户？登陆</span>
              </div>
            </div>
          }
        </div>
      </Spin>
    </div >
  );
};

export default LoginPage;