import React, { FC } from 'react';
import './popover.scss';
import { Placement } from '@floating-ui/react';
interface PopoverProps {
    placement?: Placement;
    content: React.ReactNode;
    children: React.ReactElement;
    offset?: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}
export declare const Popover: FC<PopoverProps>;
export {};
