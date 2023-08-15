import { FC, PropsWithChildren } from 'react';
import './ActionItem.scss';
import { CheckOutlined } from '@euler/icons';

interface IProps extends PropsWithChildren {
  suffix?: string;
  onClick: () => void;
  check?: boolean;
}

export const ActionItem: FC<IProps> = ({
  onClick,
  children,
  suffix,
  check,
}) => {
  return (
    <div className="euler-action-item-wrap" onClick={onClick}>
      <div className="euler-action-item">
        <div className="euler-icon-box">{check && <CheckOutlined />}</div>
        {children}
      </div>
      {suffix && <span>{suffix}</span>}
    </div>
  );
};
