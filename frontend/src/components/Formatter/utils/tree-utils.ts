import type { TreeNode } from '../types';

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
    text: segment.trim(),
    children: [],
    level: 0
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
