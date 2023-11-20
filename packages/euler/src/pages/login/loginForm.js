import React, { useState } from 'react';
import { Button, DatePicker, Form, Input, ConfigProvider, notification, message, Spin } from 'antd';
import styles from './index.css';
import BackgroundAnimation from './BackgroundAnimation';
import 'dayjs/locale/zh-cn';
import locale from 'antd/es/date-picker/locale/zh_CN';
import { signup, login } from '../../services/api';
import moment from 'moment';
import _ from 'lodash';
import { useNavigate } from 'react-router-dom';

const AuthForm = () => {
  const [showSignup, setShowSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinishLogin = _.debounce(async (values) => {
    try {
      setLoading(true);
      let temp = JSON.stringify({ username: values.username, password: values.password });
      const customHeaders = `Basic ${btoa(`${values.username}:${values.password}`)}`;
      await login(temp, customHeaders).then((res) => {
        setLoading(false);
        if (res && !res.code && res.token) {
          localStorage.setItem('token', res.token);
          //设置默认选中文生图
          localStorage.setItem('selectType', '1');
          message.success("登录成功");
          navigate('/module');
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
  })

  const onFinishSignup = _.debounce(async (values) => {

    setLoading(true);
    const formData = new FormData();
    formData.append('username', values.username);
    formData.append('password', values.password);
    formData.append('email', values.email);
    formData.append('first_name', values.first_name);
    formData.append('last_name', values.last_name);
    formData.append('date_of_birth', values.date_of_birth.format('YYYY-MM-DD'));
    try {
      await signup(formData).then((res) => {
        setLoading(false);
        if (res.code === 0) {
          try {
            message.success('注册成功')
            setShowSignup(!showSignup);
            console.log(res, '123');
          } catch (err) {
            console.log(err);
          }

        } else {
          console.log('失败失败');
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
  }, 300)

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  const toggleForm = () => {
    form.resetFields();
    setShowSignup(!showSignup);
  };

  return (
    <div className={styles.container}>

      <BackgroundAnimation />
      <div className={styles.formWrapper}>
        <Spin tip="Loading" spinning={loading}>
          <div className={styles.formTitle}>{showSignup ? '注册' : '登录'}</div>
          <Form
            form={form}
            name={showSignup ? 'signup' : 'login'}
            onFinish={showSignup ? onFinishSignup : onFinishLogin}
            autoComplete="off"
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[
                { required: true, min: 6, max: 30, message: '请输入用户名!长度为6-30位。' },
                { pattern: new RegExp('^[0-9a-zA-Z_@.]{1,}$', 'g'), message: '只允许包含数字、字母、下划线、@符' }
              ]}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Input />
            </Form.Item>
            {showSignup && (
              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱!' },
                  {
                    type: 'email',
                    message: '请输入正确的邮箱地址',
                  },
                ]}
                labelCol={{ span: 24 }}
                wrapperCol={{ span: 24 }}
              >
                <Input />
              </Form.Item>
            )}

            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码!' },
                {
                  pattern: /^[A-Za-z0-9_]{6,15}$/,
                  message: '长度应在6-15位之间',
                },
              ]}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Input.Password />
            </Form.Item>
            {showSignup && (
              <>
                <Form.Item
                  label="名字"
                  name="first_name"
                  rules={[
                    { required: true, min: 1, max: 10, message: '请输入名字!长度为1-10' },
                    {
                      pattern: /^[\u4e00-\u9fa5a-zA-Z]{1,5}$/,
                      message: '请输入正确的名字',
                    },
                  ]}
                  labelCol={{ span: 24 }}
                  wrapperCol={{ span: 24 }}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="姓"
                  name="last_name"
                  rules={[
                    { required: true, min: 1, max: 10, message: '请输入姓氏!长度为1-10' },
                    {
                      pattern: /^[\u4e00-\u9fa5a-zA-Z]{1,5}$/,
                      message: '请输入正确的姓氏',
                    },
                  ]}
                  labelCol={{ span: 24 }}
                  wrapperCol={{ span: 24 }}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="生日"
                  name="date_of_birth"
                  rules={[{ required: true, message: '请选择生日!' }]}
                  labelCol={{ span: 24 }}
                  wrapperCol={{ span: 24 }}
                >
                  <DatePicker locale={locale} />
                </Form.Item>
              </>
            )}

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className={styles.submitButton}
              >
                {showSignup ? '注册' : '登录'}
              </Button>
            </Form.Item>
          </Form>
        </Spin>
        {!showSignup && (
          <Button
            type="primary"
            htmlType="submit"
            onClick={() => toggleForm()}
            className={styles.toggleFormButton}
          >
            注册
          </Button>
        )}
        {showSignup && (
          <Button
            onClick={() => toggleForm()}
            className={styles.toggleFormButton}
          >
            返回登录
          </Button>
        )}
      </div>

    </div >
  );
};

export default AuthForm;
