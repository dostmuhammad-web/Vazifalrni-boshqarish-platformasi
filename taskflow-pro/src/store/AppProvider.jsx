import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { A } from './actions'
import { appReducer } from './reducer'
import { buildSeedState } from './seed'
import { AppContext } from './context'
import { STATUS_MAP, PRIORITY_MAP } from './constants'
import { DEFAULT_FILTERS, collectTags, computeStats, isOverdue } from '../lib/taskUtils'
import { nowISO, todayISO, uid, unique } from '../lib/utils'

const STORAGE_KEY = 'taskflow-pro:v1'

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const int = parseInt(full, 16)
  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`
}

function loadState() {
  const seed = buildSeedState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return seed
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : seed.tasks,
      projects: Array.isArray(parsed.projects) ? parsed.projects : seed.projects,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      settings: {
        ...seed.settings,
        ...(parsed.settings || {}),
        notify: { ...seed.settings.notify, ...(parsed.settings?.notify || {}) },
        profile: { ...seed.settings.profile, ...(parsed.settings?.profile || {}) },
      },
    }
  } catch {
    return seed
  }
}

function createTask(input, settings) {
  const now = nowISO()
  return {
    id: uid('tsk'),
    title: (input.title || 'Untitled task').trim() || 'Untitled task',
    description: input.description || '',
    status: input.status || 'todo',
    priority: input.priority || 'medium',
    category: input.category || settings.categories?.[0] || 'General',
    projectId: input.projectId || null,
    dueDate: input.dueDate || '',
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    tags: unique((input.tags || []).map((t) => String(t).trim()).filter(Boolean)),
    starred: Boolean(input.starred),
    estimate: Number(input.estimate) || 0,
    assignee: input.assignee || 'Me',
    order: 0,
    archived: false,
    notified: { due: false, overdue: false },
    activity: [{ id: uid('act'), kind: 'created', text: 'Task created', at: now }],
    subtasks: (input.subtasks || [])
      .filter((s) => s && s.title && String(s.title).trim())
      .map((s) => ({ id: uid('sub'), title: String(s.title).trim(), done: Boolean(s.done) })),
  }
}

function describePatch(patch, projectMap) {
  if (patch.status) return { kind: 'status', text: `Status changed to ${STATUS_MAP[patch.status]?.label ?? patch.status}` }
  if (patch.priority) return { kind: 'priority', text: `Priority changed to ${PRIORITY_MAP[patch.priority]?.label ?? patch.priority}` }
  if ('dueDate' in patch) return { kind: 'due', text: 'Due date updated' }
  if ('projectId' in patch) {
    const name = projectMap[patch.projectId]?.name ?? 'No project'
    return { kind: 'project', text: `Moved to ${name}` }
  }
  if ('assignee' in patch) return { kind: 'assign', text: `Assignee set to ${patch.assignee || 'Unassigned'}` }
  return { kind: 'edit', text: 'Task details updated' }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, null, loadState)
  const [toasts, setToasts] = useState([])
  const [modal, setModal] = useState(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        /* storage full or unavailable */
      }
    }, 250)
    return () => clearTimeout(id)
  }, [state])

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = state.settings.theme
    root.style.setProperty('--accent', state.settings.accent)
    root.style.setProperty('--accent-rgb', hexToRgb(state.settings.accent))
  }, [state.settings.theme, state.settings.accent])

  useEffect(() => {
    dispatch({ type: A.SCAN_DUE })
    const id = setInterval(() => dispatch({ type: A.SCAN_DUE }), 300000)
    return () => clearInterval(id)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback(
    (toast) => {
      const id = uid('tst')
      setToasts((list) => [...list.slice(-3), { id, tone: 'success', ...toast }])
      if (toast.duration !== 0) {
        setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), toast.duration ?? 4000)
      }
      return id
    },
    [],
  )

  const projectMap = useMemo(
    () => Object.fromEntries(state.projects.map((p) => [p.id, p])),
    [state.projects],
  )

  const tags = useMemo(() => collectTags(state.tasks, state.settings.tags), [state.tasks, state.settings.tags])
  const stats = useMemo(() => computeStats(state.tasks), [state.tasks])
  const unreadCount = useMemo(() => state.notifications.filter((n) => !n.read).length, [state.notifications])
  const overdueTasks = useMemo(() => state.tasks.filter(isOverdue), [state.tasks])

  const addTask = useCallback(
    (input) => {
      const task = createTask(input, state.settings)
      dispatch({ type: A.TASK_ADD, payload: { task } })
      return task
    },
    [state.settings],
  )

  const updateTask = useCallback(
    (id, patch) => {
      dispatch({
        type: A.TASK_UPDATE,
        payload: { id, patch, ...describePatch(patch, projectMap) },
      })
    },
    [projectMap],
  )

  const deleteTask = useCallback(
    (id) => {
      const task = state.tasks.find((t) => t.id === id)
      if (!task) return
      dispatch({ type: A.TASK_DELETE, payload: { id } })
      pushToast({
        tone: 'danger',
        title: 'Task deleted',
        message: `"${task.title}" was removed.`,
        action: { label: 'Undo', onClick: () => dispatch({ type: A.TASK_RESTORE, payload: { task } }) },
      })
    },
    [state.tasks, pushToast],
  )

  const moveTask = useCallback((id, status, index) => {
    dispatch({ type: A.TASK_MOVE, payload: { id, status, index } })
  }, [])

  const toggleDone = useCallback((id) => {
    dispatch({ type: A.TASK_TOGGLE_DONE, payload: { id } })
  }, [])

  const value = useMemo(
    () => ({
      state,
      dispatch,
      tasks: state.tasks,
      projects: state.projects,
      settings: state.settings,
      notifications: state.notifications,
      projectMap,
      tags,
      stats,
      unreadCount,
      overdueTasks,
      toasts,
      pushToast,
      dismissToast,
      modal,
      openModal: setModal,
      closeModal: () => setModal(null),
      openTaskModal: (task = null, defaults = {}) => setModal({ type: 'task', task, defaults }),
      openProjectModal: (project = null) => setModal({ type: 'project', project }),
      openConfirmModal: (config) => setModal({ type: 'confirm', config }),
      paletteOpen,
      setPaletteOpen,
      sidebarOpen,
      setSidebarOpen,
      filters,
      setFilters,
      resetFilters: () => setFilters(DEFAULT_FILTERS),
      setQuery: (query) => setFilters((f) => ({ ...f, query })),
      addTask,
      updateTask,
      deleteTask,
      moveTask,
      toggleDone,
      duplicateTask: (id) => dispatch({ type: A.TASK_DUPLICATE, payload: { id } }),
      toggleStar: (id) => dispatch({ type: A.TASK_TOGGLE_STAR, payload: { id } }),
      toggleArchive: (id) => dispatch({ type: A.TASK_ARCHIVE, payload: { id } }),
      bulkPatch: (ids, patch) => dispatch({ type: A.TASK_BULK_PATCH, payload: { ids, patch } }),
      bulkDelete: (ids) => dispatch({ type: A.TASK_BULK_DELETE, payload: { ids } }),
      toggleSubtask: (id, subId) => dispatch({ type: A.TASK_SUBTASK_TOGGLE, payload: { id, subId } }),
      addSubtask: (id, title) => dispatch({ type: A.TASK_SUBTASK_ADD, payload: { id, title } }),
      removeSubtask: (id, subId) => dispatch({ type: A.TASK_SUBTASK_REMOVE, payload: { id, subId } }),
      addComment: (id, text) => dispatch({ type: A.TASK_COMMENT, payload: { id, text } }),
      addProject: (input) => {
        const project = {
          id: uid('prj'),
          name: input.name,
          description: input.description || '',
          color: input.color || '#6366f1',
          createdAt: nowISO(),
          archived: false,
        }
        dispatch({ type: A.PROJECT_ADD, payload: { project } })
        return project
      },
      updateProject: (id, patch) => dispatch({ type: A.PROJECT_UPDATE, payload: { id, patch } }),
      deleteProject: (id) => dispatch({ type: A.PROJECT_DELETE, payload: { id } }),
      markNotificationRead: (id) => dispatch({ type: A.NOTIF_READ, payload: { id } }),
      markAllRead: () => dispatch({ type: A.NOTIF_READ_ALL }),
      deleteNotification: (id) => dispatch({ type: A.NOTIF_DELETE, payload: { id } }),
      clearNotifications: (keepUnread) => dispatch({ type: A.NOTIF_CLEAR, payload: { keepUnread } }),
      updateSettings: (patch) => dispatch({ type: A.SETTINGS_PATCH, payload: { patch } }),
      resetDemoData: () => dispatch({ type: A.DATA_REPLACE, payload: { state: buildSeedState() } }),
      clearAllData: () =>
        dispatch({
          type: A.DATA_REPLACE,
          payload: {
            state: {
              tasks: [],
              projects: [],
              notifications: [],
              settings: state.settings,
            },
          },
        }),
      importData: (incoming) => dispatch({ type: A.DATA_MERGE, payload: { state: incoming } }),
      replaceData: (incoming) => dispatch({ type: A.DATA_REPLACE, payload: { state: incoming } }),
      todayISO,
    }),
    [state, toasts, modal, paletteOpen, sidebarOpen, filters, projectMap, tags, stats, unreadCount, overdueTasks, pushToast, dismissToast, addTask, updateTask, deleteTask, moveTask, toggleDone],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
