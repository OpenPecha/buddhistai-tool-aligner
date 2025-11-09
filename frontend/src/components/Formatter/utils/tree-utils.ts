import type { TreeNode, TitleCreationData } from '../types';

/**
 * Find a node by ID in the tree structure
 */
export const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
};

/**
 * Remove a node from the tree structure
 */
export const removeNode = (nodes: TreeNode[], id: string): TreeNode[] => {
  return nodes.filter(node => {
    if (node.id === id) return false;
    node.children = removeNode(node.children, id);
    return true;
  });
};

/**
 * Insert a node at a specific position in the tree
 */
export const insertNode = (
  nodes: TreeNode[], 
  targetId: string, 
  newNode: TreeNode, 
  position: 'before' | 'after' | 'inside'
): TreeNode[] => {
  const result: TreeNode[] = [];
  
  for (const node of nodes) {
    if (node.id === targetId) {
      if (position === 'before') {
        result.push(newNode, node);
      } else if (position === 'after') {
        result.push(node, newNode);
      } else if (position === 'inside') {
        const updatedNode = { ...node };
        updatedNode.children = [...updatedNode.children, { ...newNode, level: node.level + 1 }];
        result.push(updatedNode);
      }
    } else {
      const updatedNode = { ...node };
      updatedNode.children = insertNode(updatedNode.children, targetId, newNode, position);
      result.push(updatedNode);
    }
  }
  
  return result;
};

/**
 * Update node levels recursively
 */
export const updateLevels = (nodes: TreeNode[], level: number = 0): TreeNode[] => {
  return nodes.map(node => ({
    ...node,
    level,
    children: updateLevels(node.children, level + 1)
  }));
};

/**
 * Get all node IDs from the tree structure
 */
export const getAllNodeIds = (nodes: TreeNode[]): string[] => {
  const ids: string[] = [];
  for (const node of nodes) {
    ids.push(node.id);
    const childIds = getAllNodeIds(node.children);
    ids.push(...childIds);
  }
  return ids;
};

/**
 * Generate hierarchical numbering for nodes
 */
export const generateHierarchicalNumbers = (nodes: TreeNode[], parentNumber: string = ''): Map<string, string> => {
  const numberMap = new Map<string, string>();
  
  nodes.forEach((node, index) => {
    const currentNumber = parentNumber 
      ? `${parentNumber}.${index + 1}` 
      : `${index + 1}`;
    
    numberMap.set(node.id, currentNumber);
    
    // Recursively number children
    if (node.children.length > 0) {
      const childNumbers = generateHierarchicalNumbers(node.children, currentNumber);
      childNumbers.forEach((number, id) => {
        numberMap.set(id, number);
      });
    }
  });
  
  return numberMap;
};

/**
 * Initialize tree structure from text
 */
export const initializeTreeFromText = (text: string): TreeNode[] => {
  const segments = text.split('\n').filter(segment => segment.trim() !== '');
  return segments.map((segment, index) => ({
    id: `node-${index}`,
    hierarchicalNumber: '',
    text: segment.trim(),
    level: 0,
    type: 'paragraph' as const,
    textLength: segment.trim().length,
    mappingCount: 0,
    mappings: {
      asSource: [],
      asTarget: [],
    },
    children: [],
    isTitle: false,
  }));
};

/**
 * Add a child node to a parent
 */
export const addChildToNode = (nodes: TreeNode[], parentId: string, newNode: TreeNode): TreeNode[] => {
  return nodes.map(node => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...node.children, newNode]
      };
    }
    return {
      ...node,
      children: addChildToNode(node.children, parentId, newNode)
    };
  });
};

/**
 * Flatten tree to text with indentation
 */
export const flattenTreeToText = (nodes: TreeNode[], level: number = 0): string[] => {
  const result: string[] = [];
  for (const node of nodes) {
    const indent = '  '.repeat(level);
    result.push(`${indent}${node.text}`);
    if (node.children.length > 0) {
      const childResults = flattenTreeToText(node.children, level + 1);
      result.push(...childResults);
    }
  }
  return result;
};

/**
 * Move a node to become a child of another node
 */
export const moveNodeAsChild = (nodes: TreeNode[], nodeId: string, targetId: string): TreeNode[] => {
  // Find the node to move
  let nodeToMove: TreeNode | null = null;
  
  // First, extract the node
  const findAndExtract = (items: TreeNode[]): TreeNode[] => {
    return items.filter(item => {
      if (item.id === nodeId) {
        nodeToMove = { ...item };
        return false;
      }
      item.children = findAndExtract(item.children);
      return true;
    });
  };
  
  let newTree = findAndExtract([...nodes]);
  
  if (!nodeToMove) return nodes;
  
  // Now insert it as a child of the target
  const insertAsChild = (items: TreeNode[]): TreeNode[] => {
    return items.map(item => {
      if (item.id === targetId) {
        return {
          ...item,
          children: [...item.children, { ...nodeToMove!, level: item.level + 1 }]
        };
      }
      return {
        ...item,
        children: insertAsChild(item.children)
      };
    });
  };
  
  newTree = insertAsChild(newTree);
  
  // Update levels recursively
  return updateLevels(newTree);
};

/**
 * Create a new title node
 */
export const createTitleNode = (titleData: TitleCreationData): TreeNode => {
  const nodeId = `title-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: nodeId,
    hierarchicalNumber: '',
    text: titleData.title,
    title: titleData.title,
    isTitle: true,
    level: 0,
    type: 'heading',
    textLength: titleData.title.length,
    mappingCount: 0,
    mappings: {
      asSource: [],
      asTarget: [],
    },
    children: [],
  };
};

/**
 * Get all title nodes from the tree
 */
export const getAllTitleNodes = (nodes: TreeNode[]): TreeNode[] => {
  const titles: TreeNode[] = [];
  
  const traverse = (items: TreeNode[]) => {
    for (const node of items) {
      if (node.isTitle) {
        titles.push(node);
      }
      traverse(node.children);
    }
  };
  
  traverse(nodes);
  return titles;
};

/**
 * Assign segments to a title node (move them as children)
 */
export const assignSegmentsToTitle = (
  nodes: TreeNode[], 
  titleId: string, 
  segmentIds: string[]
): TreeNode[] => {
  let updatedTree = [...nodes];
  
  // For each segment, move it as a child of the title
  for (const segmentId of segmentIds) {
    updatedTree = moveNodeAsChild(updatedTree, segmentId, titleId);
  }
  
  return updatedTree;
};

/**
 * Create segments from text range and assign to title
 */
export const createSegmentsFromRange = (
  nodes: TreeNode[],
  titleId: string,
  startLine: number,
  endLine: number,
  textLines: string[]
): TreeNode[] => {
  const titleNode = findNode(nodes, titleId);
  if (!titleNode) return nodes;
  
  // Create new segment nodes for the selected range
  const newSegments: TreeNode[] = [];
  for (let i = startLine; i <= endLine; i++) {
    const lineText = textLines[i - 1]; // Convert to 0-based index
    if (lineText && lineText.trim()) {
      const segmentId = `segment-${Date.now()}-${i}`;
      const segment: TreeNode = {
        id: segmentId,
        hierarchicalNumber: '',
        text: lineText.trim(),
        isTitle: false,
        level: titleNode.level + 1,
        type: 'paragraph',
        lineNumber: i,
        textLength: lineText.trim().length,
        mappingCount: 0,
        mappings: {
          asSource: [],
          asTarget: [],
        },
        children: [],
      };
      newSegments.push(segment);
    }
  }
  
  // Add the segments as children of the title
  return nodes.map(node => {
    if (node.id === titleId) {
      return {
        ...node,
        children: [...node.children, ...newSegments]
      };
    }
    return {
      ...node,
      children: createSegmentsFromRange(node.children, titleId, startLine, endLine, textLines)
    };
  });
};

/**
 * Remove segments from title (move them back to root level)
 */
export const removeSegmentsFromTitle = (
  nodes: TreeNode[],
  titleId: string,
  segmentIds: string[]
): TreeNode[] => {
  // Extract segments from title
  const extractedSegments: TreeNode[] = [];
  
  const extractFromTitle = (items: TreeNode[]): TreeNode[] => {
    return items.map(node => {
      if (node.id === titleId) {
        const remainingChildren = node.children.filter(child => {
          if (segmentIds.includes(child.id)) {
            extractedSegments.push({ ...child, level: 0 });
            return false;
          }
          return true;
        });
        
        return {
          ...node,
          children: remainingChildren
        };
      }
      
      return {
        ...node,
        children: extractFromTitle(node.children)
      };
    });
  };
  
  const updatedTree = extractFromTitle(nodes);
  
  // Add extracted segments back to root level
  return [...updatedTree, ...extractedSegments];
};