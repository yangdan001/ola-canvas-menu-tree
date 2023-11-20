import React from 'react';
import './WelcomePage.css';
import { Link } from 'react-router-dom';
const WelcomePage: React.FC = () => {
  return (
    <div className="welcome-container">
      <h1 className="welcome-heading">欢迎来到欧拉服务平台3.0！</h1>
      <p className="welcome-text">
        我们很高兴您能来访问我们的网站。请浏览我们的页面，了解我们的产品和服务。
      </p>

      <Link to="/login" className="welcome-button">
        canvas
      </Link>
    </div>
  );
};

export default WelcomePage;
