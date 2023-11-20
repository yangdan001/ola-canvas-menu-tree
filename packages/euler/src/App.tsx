import { IntlProvider } from 'react-intl';
import './App.css';
import Editor from './components/Editor';
import { MyContext } from './context';
import { zh } from './locale/zh';
import { en } from './locale/en';
import { useEffect, useState } from 'react';
import { appEventEmitter } from './events';
import { SupportedLocale } from './locale/types';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/home'; // 假设你有一个名为 HomePage 的组件
import LoginPage from './pages/login'; // 假设你有一个名为 HomePage 的组件
// FIXME: terrible code
if (process.env.NODE_ENV !== 'development') {
  require('@euler/components/dist/style.css');
}
const messageMap = {
  zh,
  en,
};

const getLocale = (): SupportedLocale => {
  const locale = localStorage.getItem('euler-locale') || navigator.language;
  return locale.startsWith('zh') ? 'zh' : 'en';
};

function App() {
  const [locale, setLocale] = useState(getLocale());

  useEffect(() => {
    const localeChangeHandler = (locale: SupportedLocale) => {
      setLocale(locale);
    };
    appEventEmitter.on('localeChange', localeChangeHandler);
    return () => {
      appEventEmitter.off('localeChange', localeChangeHandler);
    };
  });

  return (
    <IntlProvider locale={locale} messages={messageMap[locale]}>
      <MyContext.Provider value={{ basename: locale }}>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} /> 
            <Route path="/login" element={<LoginPage />} />
            <Route path="/editor" element={
            <div className="euler">
              <Editor />
            </div>
            } />
          </Routes>
        </Router>
      </MyContext.Provider>
    </IntlProvider>
  );
}

export default App;
