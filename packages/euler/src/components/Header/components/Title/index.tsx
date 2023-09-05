import { FC } from 'react';
import './style.scss';
import { GithubOutlined } from '@euler/icons';

const Title: FC = () => {
  return (
    <div className="euler-header-title">
      <GithubOutlined />
      <a href="#" target="_blank">
        euler
      </a>
    </div>
  );
};

export default Title;
