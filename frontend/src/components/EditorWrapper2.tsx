import Editor from './Editor'
import {root_text,translation_text} from '../data/text.ts'
function EditorWrapper2() {

  return (
    <div className='flex gap-4 w-full h-full'>
      <Editor
      initialValue={root_text}
      ref={null}
      isEditable={true}
      />
      <Editor
      initialValue={translation_text}
      ref={null}
      isEditable={true}
      />
    </div>
  )
}

export default EditorWrapper2
