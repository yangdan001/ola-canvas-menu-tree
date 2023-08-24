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
import ActionType from '../ActionType';
import OpcitySet from '../OpcitySet';
import BackToMeta from '../BackToMeta';
import PenSize from '../PenSize';

const { TabPane } = Tabs;
enum PanelType {
  Global = 'Global',
  SelectedElements = 'SelectedElements',
}

export const InfoPanel: FC = () => {
  const editor = useContext(EditorContext);
  const [type, setType] = useState(PanelType.Global);
  const [key, setKey] = useState('1');
  const [frameType, setFrameType] = useState('image');
  const [isHide, setIsHide] = useState(false);
  // 根据是否选中元素，来决定面板类型
  useEffect(() => {
    if (editor) {
      const handler = (items: GraphAttrs[]) => {
        setType(items.length ? PanelType.SelectedElements : PanelType.Global);
      };type
      editor.selectedElements.on('itemsChange', handler);
      setFrameType(type)
      return () => {
        editor.selectedElements.off('itemsChange', handler);
      };
    }
  }, [editor]);
  useEffect(() => {
    const localFrameType = localStorage.getItem('frameType') || 'image'
    const localIsHide = Boolean(localStorage.getItem('isHide')) || true
    setFrameType(localFrameType)
    setIsHide(localIsHide)
    console.log(localFrameType,localIsHide,33)
  }, [editor]);
  useEffect(() => {
    const localFrameType  = localStorage.getItem('frameType')
    console.log(localFrameType,333)
    if(localFrameType=='meta'){
      setIsHide(false)
    console.log(isHide,localFrameType,44)
    }else{
      setIsHide(true)
    console.log(isHide,localFrameType,55)
    }
  }, [frameType]);
     
  return (
    // <div className="info-panel" onKeyDown={(e) => e.stopPropagation()}>
    //   {type === PanelType.SelectedElements && (
    //     <>
    //       <AlignCard />
    //       <ElementsInfoCards />
    //       <FillCard key="fill" />
    //       <StrokeCard key="stroke" />
    //     </>
    //   )}
    //   {type === PanelType.Global && (
    //     <div className="empty-text">
    //       <FormattedMessage id="noSelectedShapes" />
    //     </div>
    //   )}
    // </div>
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
          <TabPane key="2" tab="Tab 2"  disabled={!isHide}> 
            <div className="right-tab" onKeyDown={(e) => e.stopPropagation()} style={{overflowY:'scroll',height:'500px'}}>
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
