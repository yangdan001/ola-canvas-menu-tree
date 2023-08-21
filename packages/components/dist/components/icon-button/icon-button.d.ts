import { FC, PropsWithChildren } from 'react';
import './icon-button.scss';
interface IProps extends PropsWithChildren {
    onClick: () => void;
}
export declare const IconButton: FC<IProps>;
export {};
