import React, { FC } from 'react';
import './select.scss';
type ValueType = string;
interface OptionType {
    label: string;
    value: ValueType;
}
interface SelectProps {
    defaultValue?: string;
    value?: ValueType;
    placeholder?: string;
    options?: OptionType[];
    /**
     * whether to show border
     */
    bordered?: boolean;
    style?: React.CSSProperties;
    /**
     * width of dropdown
     */
    dropdownWidth?: number;
    onSelect?: (value: ValueType) => void;
}
export declare const Select: FC<SelectProps>;
export {};
