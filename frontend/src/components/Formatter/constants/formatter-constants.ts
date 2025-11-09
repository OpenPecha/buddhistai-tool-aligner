/**
 * UI Configuration Constants
 */
export const UI_CONFIG = {
  MAX_TEXT_DISPLAY_LENGTH: 20,
  MAX_TREE_HEIGHT: 'calc(100vh-100px)',
  BUTTON_CLASSES: {
    PRIMARY: 'px-3 py-1 text-xs rounded transition-colors',
    SEARCH_TOGGLE_ACTIVE: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    SEARCH_TOGGLE_INACTIVE: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    CLEAR_MAPPINGS: 'bg-red-100 text-red-700 hover:bg-red-200',
    EXPAND_ALL: 'bg-green-100 text-green-700 hover:bg-green-200',
    COLLAPSE_ALL: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    EXPORT_TEXT: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    EXPORT_JSON: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  }
} as const;

/**
 * Component Text Constants
 */
export const TEXT_CONSTANTS = {
  TITLE: 'Text Formatter',
  BUTTONS: {
    HIDE_SEARCH: 'Hide Search',
    SHOW_SEARCH: 'Show Search',
    CLEAR_MAPPINGS: 'Clear Mappings',
    EXPAND_ALL: 'Expand All',
    COLLAPSE_ALL: 'Collapse All',
    EXPORT_TEXT: 'Export Text',
    EXPORT_JSON: 'Export JSON',
    ADD_ROOT: '+ Add Root',
  },
  LABELS: {
    TOTAL_NODES: 'Total Nodes:',
    SELECTED: 'Selected:',
    TEXT: 'Text:',
    MAPPINGS: 'Mappings:',
    TOTAL: 'Total:',
  },
  MESSAGES: {
    DELETE_CONFIRMATION: 'Are you sure you want to delete this node and all its children?',
    SELECT_TEXT_FIRST: 'Please select text in the current segment first',
  }
} as const;

/**
 * Default Node Configuration
 */
export const NODE_CONFIG = {
  DEFAULT_NEW_CHILD_TEXT: 'New text segment',
  DEFAULT_NEW_ROOT_TEXT: 'New root segment',
  ID_PREFIX: 'node-',
} as const;

/**
 * Layout Configuration
 */
export const LAYOUT_CONFIG = {
  CONTAINER_CLASSES: 'p-4 container mx-auto',
  HEADER_CLASSES: 'mb-4 flex items-center justify-between',
  TITLE_CLASSES: 'text-xl font-semibold text-gray-800',
  STATS_CLASSES: 'text-sm text-gray-600',
  SELECTED_INFO_CLASSES: 'text-sm text-blue-600',
  TEXT_HIGHLIGHT_CLASSES: 'text-yellow-600',
  BUTTON_GROUP_CLASSES: 'flex gap-2',
  TREE_CONTAINER_CLASSES: 'space-y-1 rounded-lg overflow-y-auto',
  ADD_ROOT_BUTTON_CLASSES: 'flex justify-center items-center px-4 py-2 rounded-lg w-full',
} as const;
