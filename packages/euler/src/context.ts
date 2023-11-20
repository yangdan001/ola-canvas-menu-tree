import { createContext } from 'react';
import { Editor } from './editor/editor';
// 创建上下文
interface MyContextProps {
  basename: string;
}

const EditorContext = createContext<Editor | null>(null);
const MyContext = createContext<MyContextProps | null>(null);

export {
  EditorContext,
  MyContext,
};