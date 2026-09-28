export const STATUS_LIST = [
  { id: 'todo', label: 'Todo', short: 'TD', color: '#64748b' },
  { id: 'progress', label: 'In Progress', short: 'IP', color: '#3b82f6' },
  { id: 'review', label: 'Review', short: 'RV', color: '#f59e0b' },
  { id: 'done', label: 'Done', short: 'DN', color: '#10b981' },
]

export const STATUS_MAP = Object.fromEntries(STATUS_LIST.map((s) => [s.id, s]))
export const STATUS_ORDER = STATUS_LIST.map((s) => s.id)
export const OPEN_STATUSES = ['todo', 'progress', 'review']

export const PRIORITY_LIST = [
  { id: 'low', label: 'Low', color: '#10b981', weight: 1 },
  { id: 'medium', label: 'Medium', color: '#3b82f6', weight: 2 },
  { id: 'high', label: 'High', color: '#f59e0b', weight: 3 },
  { id: 'urgent', label: 'Urgent', color: '#ef4444', weight: 4 },
]

export const PRIORITY_MAP = Object.fromEntries(PRIORITY_LIST.map((p) => [p.id, p]))
export const PRIORITY_ORDER = PRIORITY_LIST.map((p) => p.id)
export const PRIORITY_DESC = ['urgent', 'high', 'medium', 'low']

export const DEFAULT_CATEGORIES = [
  'Development',
  'Design',
  'Marketing',
  'Research',
  'Operations',
  'Content',
  'Bug',
  'Meeting',
]

export const DEFAULT_TAGS = [
  'frontend',
  'backend',
  'ux',
  'urgent',
  'q1',
  'q2',
  'internal',
  'client',
]

export const PROJECT_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f59e0b',
  '#10b981',
  '#14b8a6',
  '#0ea5e9',
  '#3b82f6',
  '#a855f7',
]

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'tasks', label: 'My Tasks', icon: 'check-square' },
  { id: 'projects', label: 'Projects', icon: 'folder' },
  { id: 'kanban', label: 'Kanban', icon: 'columns' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'analytics', label: 'Analytics', icon: 'chart' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'settings', label: 'Settings', icon: 'sliders' },
]

export const ACTIVITY_KINDS = {
  created: { label: 'created the task', color: '#6366f1' },
  status: { label: 'changed status', color: '#3b82f6' },
  priority: { label: 'changed priority', color: '#f59e0b' },
  edit: { label: 'updated the task', color: '#64748b' },
  due: { label: 'changed the due date', color: '#ec4899' },
  project: { label: 'moved to another project', color: '#8b5cf6' },
  subtask: { label: 'updated a subtask', color: '#14b8a6' },
  assign: { label: 'updated assignee', color: '#0ea5e9' },
  comment: { label: 'left a comment', color: '#10b981' },
  restore: { label: 'restored the task', color: '#10b981' },
  overdue: { label: 'became overdue', color: '#ef4444' },
}
