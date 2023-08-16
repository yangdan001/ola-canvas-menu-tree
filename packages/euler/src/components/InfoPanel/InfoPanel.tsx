import { FC, useContext, useEffect, useState } from 'react';
import { EditorContext } from '../../context';
import { GraphAttrs } from '../../editor/scene/graph';
import { AlignCard } from '../Cards/AlignCard';
import ElementsInfoCards from '../Cards/ElementsInfoCard';
import { FillCard } from '../Cards/FillCard';
import './style.scss';
import { FormattedMessage } from 'react-intl';
import { StrokeCard } from '../Cards/StrokeCard';
import { Tabs } from 'antd';
const { TabPane } = Tabs;
enum PanelType {
  Global = 'Global',
  SelectedElements = 'SelectedElements',
}

export const InfoPanel: FC = () => {
  const editor = useContext(EditorContext);
  const [type, setType] = useState(PanelType.Global);
  const [key, setKey] = useState('1');
  // 根据是否选中元素，来决定面板类型

  useEffect(() => {
    if (editor) {
      const handler = (items: GraphAttrs[]) => {
        setType(items.length ? PanelType.SelectedElements : PanelType.Global);
      };
      editor.selectedElements.on('itemsChange', handler);

      return () => {
        editor.selectedElements.off('itemsChange', handler);
      };
    }
  }, [editor]);

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
           <div className="" onKeyDown={(e) => e.stopPropagation()}>
            {type === PanelType.SelectedElements && (
                <>
                  <AlignCard />
                  <ElementsInfoCards />
                  <FillCard key="fill" />
                  <StrokeCard key="stroke" />
                </>
              )}
              {type === PanelType.Global && (
                <div className="empty-text">
                  <FormattedMessage id="noSelectedShapes" />
                </div>
              )}
            </div>
          </TabPane>
          <TabPane key="2" tab="Tab 2">
          <div className="" onKeyDown={(e) => e.stopPropagation()}>
            {type === PanelType.SelectedElements && (
                <>
                  <AlignCard />
                  <ElementsInfoCards />
                  <FillCard key="fill" />
                  <StrokeCard key="stroke" />
                </>
              )}
              {type === PanelType.Global && (
                <div className="empty-text">
                  <FormattedMessage id="noSelectedShapes" />
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>
    </div>
  );
};
