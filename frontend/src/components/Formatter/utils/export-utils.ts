import type { TreeNode, SegmentMapping, ExportData } from '../types';
import { generateHierarchicalNumbers, flattenTreeToText } from './tree-utils';

/**
 * Generate comprehensive export data including metadata, segments, and mappings
 */
export const generateExportData = (
  treeData: TreeNode[], 
  segmentMappings: SegmentMapping[]
): ExportData => {
  const numberMap = generateHierarchicalNumbers(treeData);
  
  const exportData: ExportData = {
    metadata: {
      totalNodes: treeData.length,
      totalMappings: segmentMappings.length,
      exportDate: new Date().toISOString(),
      version: "1.0"
    },
    segments: [],
    mappings: segmentMappings.map(mapping => ({
      id: mapping.id,
      source: {
        nodeId: mapping.sourceSelection.nodeId,
        hierarchicalNumber: numberMap.get(mapping.sourceSelection.nodeId) || mapping.sourceSelection.nodeId,
        selectedText: mapping.sourceSelection.selectedText,
        start: mapping.sourceSelection.start,
        end: mapping.sourceSelection.end,
        length: mapping.sourceSelection.selectedText.length
      },
      target: {
        nodeId: mapping.targetSelection.nodeId,
        hierarchicalNumber: numberMap.get(mapping.targetSelection.nodeId) || mapping.targetSelection.nodeId,
        selectedText: mapping.targetSelection.selectedText,
        start: mapping.targetSelection.start,
        end: mapping.targetSelection.end,
        length: mapping.targetSelection.selectedText.length
      }
    }))
  };

  // Recursively process nodes to include all details
  const processNodes = (nodes: TreeNode[]): any[] => {
    return nodes.map((node) => {
      const hierarchicalNumber = numberMap.get(node.id) || node.id;
      const nodeMappings = segmentMappings.filter(m => 
        m.sourceSelection.nodeId === node.id || m.targetSelection.nodeId === node.id
      );
      
      return {
        id: node.id,
        hierarchicalNumber,
        text: node.text,
        level: node.level,
        textLength: node.text.length,
        mappingCount: nodeMappings.length,
        mappings: {
          asSource: nodeMappings.filter(m => m.sourceSelection.nodeId === node.id).map(m => ({
            mappingId: m.id,
            targetNode: m.targetSelection.nodeId,
            targetHierarchicalNumber: numberMap.get(m.targetSelection.nodeId) || m.targetSelection.nodeId,
            sourceText: m.sourceSelection.selectedText,
            sourceStart: m.sourceSelection.start,
            sourceEnd: m.sourceSelection.end,
            targetText: m.targetSelection.selectedText,
            targetStart: m.targetSelection.start,
            targetEnd: m.targetSelection.end
          })),
          asTarget: nodeMappings.filter(m => m.targetSelection.nodeId === node.id).map(m => ({
            mappingId: m.id,
            sourceNode: m.sourceSelection.nodeId,
            sourceHierarchicalNumber: numberMap.get(m.sourceSelection.nodeId) || m.sourceSelection.nodeId,
            sourceText: m.sourceSelection.selectedText,
            sourceStart: m.sourceSelection.start,
            sourceEnd: m.sourceSelection.end,
            targetText: m.targetSelection.selectedText,
            targetStart: m.targetSelection.start,
            targetEnd: m.targetSelection.end
          }))
        },
        children: node.children.length > 0 ? processNodes(node.children) : []
      };
    });
  };

  exportData.segments = processNodes(treeData);
  return exportData;
};

/**
 * Export tree structure as JSON file
 */
export const exportTreeAsJSON = (treeData: TreeNode[], segmentMappings: SegmentMapping[]): void => {
  const exportData = generateExportData(treeData, segmentMappings);
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'text-tree-structure-with-mappings.json';
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Export tree as plain text file
 */
export const exportTreeAsText = (treeData: TreeNode[]): void => {
  const textContent = flattenTreeToText(treeData).join('\n');
  const dataBlob = new Blob([textContent], { type: 'text/plain' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'text-tree-structure.txt';
  link.click();
  URL.revokeObjectURL(url);
};
