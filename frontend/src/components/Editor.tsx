import React from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';

type EditorPropsType={
    initialValue:string,
    ref: React.RefObject<ReactCodeMirrorRef | null> | null,
    isEditable:boolean
}


function Editor({initialValue,ref,isEditable}: EditorPropsType) {
  const [value, setValue] = React.useState(initialValue);
  
  // Update value when initialValue changes
  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);
  
  const onChange = React.useCallback((val: string) => {
    console.log('val:', val);
    setValue(val);
  }, []);

  // Only allow Enter key when isEditable is true
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (isEditable && event.key !== 'Enter') {
      event.preventDefault();
      event.stopPropagation();
    }
  }, [isEditable]);

  return <CodeMirror 
    value={value}  
    height="100%" 
    ref={ref}
    className="w-full h-full text-lg" 
    onChange={onChange}  
    editable={isEditable}
    onKeyDown={handleKeyDown}
  />;
}
export default Editor;