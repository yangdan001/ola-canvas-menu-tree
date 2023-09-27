import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../../context';
import { MutateElementsAndRecord } from '../../../editor/scene/graph';
import { remainDecimal } from '../../../utils/common';
import {
  getElementRotatedXY,
} from '../../../utils/graphics';
import {
  Select,
  ConfigProvider,
  Form,
  Divider,
  notification
} from 'antd';
import { BaseCard } from '../BaseCard';
import './style.scss';
import { useIntl } from 'react-intl';
interface ChildProps {
  onData: (data: string) => void;
}

const ElementsInfoCards: FC<ChildProps> = (props) => {
  const editor = useContext(EditorContext);
  const intl = useIntl();
  const MIXED = intl.formatMessage({ id: 'mixed' });
  const [iframeType, setIframeType] = useState<string | typeof MIXED>(MIXED);
  useEffect(() => {
    if (editor) {
      const handler = () => {
        const items = editor.selectedElements.getItems();
        if (items.length > 0) {
          let newIframeType: string | typeof MIXED = items[0].iframeType;
          for (let i = 0, len = items.length; i < len; i++) {
            const element = items[i];
            if (newIframeType !==  element.iframeType ) {
              newIframeType = MIXED;
            }
          }
          setIframeType(newIframeType);
        }
      };
      editor.sceneGraph.on('render', handler);
      return () => {
        editor.sceneGraph.off('render', handler);
      };
    }
  }, [editor, MIXED]);

  return (
    <BaseCard>
    <div className='type-box'>
      <div className='base-card-title'>type</div>
      <div className="element-info-attrs-row">
        <AttrSelect
          label=""
          value={iframeType}
          options={[{ value: 'Image', label: 'image' },{ value: 'Meta', label: 'meta' },{ value: 'Mask', label: 'mask' }]}
          onChange={(newIframeType) => {
            if (editor) {
              const elements = editor.selectedElements.getItems();
              const elementsType =  elements[0].fill[0].type //'Image' 
              if(elementsType == 'Image' && newIframeType == 'Mask') {
                notification.warning({
                  message: '提示',
                  description: `image类型不能修改成mask类型`,
                });
                return
              }
              MutateElementsAndRecord.setIframeType(editor, elements, newIframeType);
              editor.sceneGraph.render();
            }
            //子组件给父组件传参数
            props.onData(newIframeType);
          }}
        />
      </div>
    </div>

    </BaseCard>
  );
};
const AttrSelect: FC<{
  label: string;
  value: string | number;
  onChange: (newValue: string) => void;
  options: { value: string | number; label: string }[]; // 添加选项数组
}> = (props) => {
  return (
    <div>
      <label htmlFor={props.label}>{props.label}</label>
      <ConfigProvider theme={{ token: { colorPrimary: '#BB93F8', }, }}   >
      <Select
        id={props.label}
        value={props.value}
        onChange={(value:any) => {
          props.onChange(value);
        }}
      >
        {props.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      </ConfigProvider>
    </div>
  );
};

export default ElementsInfoCards;
