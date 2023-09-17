import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../context';
import { GraphAttrs } from '../../editor/scene/graph';
import { AlignCard } from '../Cards/AlignCard';
import ElementsInfoCards from '../Cards/ElementsInfoCard';
import { FillCard } from '../Cards/FillCard';
import './style.scss';
import { FormattedMessage } from 'react-intl';
import { StrokeCard } from '../Cards/StrokeCard';
import Generate from '../Generate/index';
import { Tabs, Divider, Select, Slider } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import ActionType from '../Cards/ActionType';
import OpcitySet from '../OpcitySet';
import BackToMeta from '../BackToMeta';
import PenSize from '../PenSize';

const { TabPane } = Tabs;
enum PanelType {
  Global = 'Global',
  SelectedElements = 'SelectedElements',
}
import { useIntl } from 'react-intl';
export const InfoPanel: FC = () => {
  const editor = useContext(EditorContext);
  const intl = useIntl();
  const MIXED = intl.formatMessage({ id: 'mixed' });
  const [type, setType] = useState(PanelType.Global);
  const [key, setKey] = useState('1');
  const [frameType, setIframeType] = useState('image');
  // 根据是否选中元素，来决定面板类型
  useEffect(() => {
    if (editor) {
      const handler = (items: GraphAttrs[]) => {
        setType(items.length ? PanelType.SelectedElements : PanelType.Global);
        if (items.length > 0) {
          // 处理当type为Meta时 才可以点击tab2
          const Element = editor.selectedElements.getItems();
          const newIframeType: string | typeof MIXED = Element[0].iframeType;
          setIframeType(newIframeType);
        }
      };
      editor.selectedElements.on('itemsChange', handler);
      return () => {
        editor.selectedElements.off('itemsChange', handler);
      };
    }
  }, [editor]);
     
  return (
    <div className="info-panel">
        <Tabs 
        defaultActiveKey={'1'}
        activeKey={key} 
        onChange={(key:string)=>{
          setKey(key)
        }}
        >
          <TabPane key="1" tab="Tab 1">
           <div className="left-tab" onKeyDown={(e) => e.stopPropagation()}>
            {type === PanelType.SelectedElements && (
                <>
                  <div className='property-title'>Property</div>
                  <Divider style={{marginTop: 10,marginBottom: 0,background:'#444'}}/>
                  <ActionType/>
                  {/* <AlignCard /> */}
                  <ElementsInfoCards />
                  {/* <Divider style={{marginTop: 10,marginBottom: 0}}/> */}
                  <OpcitySet/>
                  <BackToMeta/>
                  <PenSize/>
                  {/* <FillCard key="fill" /> */}
                  {/* <StrokeCard key="stroke" /> */}
                </>
              )}
              {type === PanelType.Global && (
                <div className="empty-text">
                  <FormattedMessage id="noSelectedShapes" />
                </div>
              )}
            </div>
          </TabPane>
          <TabPane key="2" tab="Tab 2"  disabled={frameType !== "Meta"}> 
            <div className="right-tab" onKeyDown={(e) => e.stopPropagation()} style={{overflowY:'scroll',height:'calc(100vh - 150px)'}}>
            {type === PanelType.SelectedElements && (
                <>
              <Generate/>
              </>
              )}
            </div>
          </TabPane>
        </Tabs>
    </div>
  );
};
