import type { SegmentMapping, TreeNode } from '../types'
import {  generateExportData } from '../utils/export-utils'

type submitFormatProps = {
   readonly treeData: TreeNode[],
   readonly segmentMappings: SegmentMapping[],
}

function SubmitFormat({treeData, segmentMappings}: submitFormatProps) {
  const handleSubmitFormat = () => {
    const formatted_data = generateExportData(treeData, segmentMappings)
    console.log(formatted_data)
  }

  return (
    <button
      onClick={handleSubmitFormat}
      className="px-4 py-2 w-full bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 text-sm font-medium"
    >
      Publish
    </button>
  )
}


export default SubmitFormat