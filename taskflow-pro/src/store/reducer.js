import { A } from './actions'
import { STATUS_MAP, STATUS_ORDER } from './constants'
import { dayDiff, nowISO, toISODate, uid } from '../lib/utils'

function makeNotification(type, title, message, taskId = null) {
  return { id: uid('ntf'), type, title, message, taskId, at: nowISO(), read: false }
}

function withActivity(task, kind, text) {
  return {
    ...task,
    updatedAt: nowISO(),
    activity: [{ id: uid('act'), kind, text, at: nowISO() }, ...(task.activity || [])].slice(0, 60),
  }
}

function reindexAll(tasks) {
  const orderMap = new Map()
  STATUS_ORDER.forEach((status) => {
    tasks
      .filter((t) => t.status === status)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((t, i) => orderMap.set(t.id, i))
  })
  return tasks.map((t) => (orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id) } : t))
}

function deepMerge(base, patch) {
  const out = { ...base }
  Object.entries(patch).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && base?.[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      out[key] = { ...base[key], ...value }
    } else {
      out[key] = value
    }
  })
  return out
}

export function appReducer(state, action) {
  const notify = state.settings.notify || {}

  switch (action.type) {
    case A.TASK_ADD: {
      const task = action.payload.task
      const tasks = reindexAll([task, ...state.tasks.map((t) => ({ ...t, order: (t.order ?? 0) + 1 }))])
      const notifications = notify.taskCreated
        ? [makeNotification('created', 'Task created', `"${task.title}" was added to ${STATUS_MAP[task.status].label}.`, task.id), ...state.notifications]
        : state.notifications
      return { ...state, tasks, notifications }
    }

    case A.TASK_UPDATE: {
      const { id, patch, kind = 'edit', text = 'Task updated' } = action.payload
      let changed = null
      const tasks = state.tasks.map((t) => {
        if (t.id !== id) return t
        const next = { ...t, ...patch, updatedAt: nowISO() }
        if (patch.status === 'done' && t.status !== 'done') next.completedAt = nowISO()
        if (patch.status && patch.status !== 'done' && t.status === 'done') next.completedAt = null
        changed = next
        return withActivity(next, kind, text)
      })
      if (!changed) return state
      let notifications = state.notifications
      if (patch.status && patch.status !== 'done' && notify.statusChanged) {
        notifications = [
          makeNotification('status', `Moved to ${STATUS_MAP[patch.status].label}`, `"${changed.title}" is now in ${STATUS_MAP[patch.status].label}.`, id),
          ...notifications,
        ]
      }
      if (patch.status === 'done' && notify.taskCompleted) {
        notifications = [makeNotification('done', 'Task completed', `"${changed.title}" was marked as done.`, id), ...notifications]
      }
      return { ...state, tasks: reindexAll(tasks), notifications }
    }

    case A.TASK_DELETE: {
      const id = action.payload.id
      const task = state.tasks.find((t) => t.id === id)
      if (!task) return state
      return {
        ...state,
        tasks: reindexAll(state.tasks.filter((t) => t.id !== id)),
        notifications: state.notifications.filter((n) => n.taskId !== id),
      }
    }

    case A.TASK_RESTORE: {
      const task = action.payload.task
      if (state.tasks.some((t) => t.id === task.id)) return state
      return { ...state, tasks: reindexAll([task, ...state.tasks]) }
    }

    case A.TASK_DUPLICATE: {
      const source = state.tasks.find((t) => t.id === action.payload.id)
      if (!source) return state
      const copy = {
        ...source,
        id: uid('tsk'),
        title: `${source.title} (copy)`,
        status: 'todo',
        completedAt: null,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        order: 0,
        subtasks: (source.subtasks || []).map((s) => ({ ...s, id: uid('sub'), done: false })),
        activity: [{ id: uid('act'), kind: 'created', text: 'Duplicated task', at: nowISO() }],
      }
      return { ...state, tasks: reindexAll([copy, ...state.tasks]) }
    }

    case A.TASK_TOGGLE_DONE: {
      const id = action.payload.id
      const task = state.tasks.find((t) => t.id === id)
      if (!task) return state
      const done = task.status === 'done'
      const status = done ? 'todo' : 'done'
      const tasks = reindexAll(
        state.tasks.map((t) =>
          t.id === id
            ? withActivity(
                { ...t, status, completedAt: done ? null : nowISO(), updatedAt: nowISO() },
                'status',
                `Status changed to ${STATUS_MAP[status].label}`,
              )
            : t,
        ),
      )
      const notifications = !done && notify.taskCompleted
        ? [makeNotification('done', 'Task completed', `"${task.title}" was marked as done.`, id), ...state.notifications]
        : state.notifications
      return { ...state, tasks, notifications }
    }

    case A.TASK_TOGGLE_STAR:
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? { ...t, starred: !t.starred } : t)),
      }

    case A.TASK_ARCHIVE:
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? { ...t, archived: !t.archived } : t)),
      }

    case A.TASK_MOVE: {
      const { id, status, index } = action.payload
      const task = state.tasks.find((t) => t.id === id)
      if (!task || !STATUS_ORDER.includes(status)) return state
      const rest = state.tasks
        .filter((t) => t.status === status && t.id !== id)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      const target = Math.max(0, Math.min(index ?? rest.length, rest.length))
      const column = [...rest]
      column.splice(target, 0, task)
      const orderMap = new Map(column.map((t, i) => [t.id, i]))
      const finalTasks = reindexAll(
        state.tasks.map((t) => {
          if (t.id === id) {
            return withActivity(
              { ...t, status, order: orderMap.get(id), updatedAt: nowISO() },
              'status',
              `Status changed to ${STATUS_MAP[status].label}`,
            )
          }
          return orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id) } : t
        }),
      )
      const notifications = notify.statusChanged && task.status !== status
        ? [
            makeNotification('status', `Moved to ${STATUS_MAP[status].label}`, `"${task.title}" is now in ${STATUS_MAP[status].label}.`, id),
            ...state.notifications,
          ]
        : state.notifications
      return { ...state, tasks: finalTasks, notifications }
    }

    case A.TASK_BULK_PATCH: {
      const { ids, patch } = action.payload
      const idSet = new Set(ids)
      const tasks = reindexAll(
        state.tasks.map((t) => {
          if (!idSet.has(t.id)) return t
          const next = { ...t, ...patch, updatedAt: nowISO() }
          if (patch.status === 'done' && t.status !== 'done') next.completedAt = nowISO()
          if (patch.status && patch.status !== 'done' && t.status === 'done') next.completedAt = null
          return withActivity(next, 'status', `Bulk update → ${STATUS_MAP[t.status]?.label ?? t.status}`)
        }),
      )
      return { ...state, tasks }
    }

    case A.TASK_BULK_DELETE: {
      const idSet = new Set(action.payload.ids)
      return {
        ...state,
        tasks: reindexAll(state.tasks.filter((t) => !idSet.has(t.id))),
        notifications: state.notifications.filter((n) => !n.taskId || !idSet.has(n.taskId)),
      }
    }

    case A.TASK_SUBTASK_TOGGLE:
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id
            ? withActivity(
                {
                  ...t,
                  subtasks: (t.subtasks || []).map((s) => (s.id === action.payload.subId ? { ...s, done: !s.done } : s)),
                },
                'subtask',
                'Subtask updated',
              )
            : t,
        ),
      }

    case A.TASK_SUBTASK_ADD:
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id
            ? withActivity({ ...t, subtasks: [...(t.subtasks || []), { id: uid('sub'), title: action.payload.title, done: false }] }, 'subtask', 'Subtask added')
            : t,
        ),
      }

    case A.TASK_SUBTASK_REMOVE:
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id
            ? withActivity({ ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== action.payload.subId) }, 'subtask', 'Subtask removed')
            : t,
        ),
      }

    case A.TASK_COMMENT:
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? withActivity({ ...t }, 'comment', action.payload.text) : t,
        ),
      }

    case A.PROJECT_ADD: {
      const project = action.payload.project
      return { ...state, projects: [...state.projects, project] }
    }

    case A.PROJECT_UPDATE:
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.payload.id ? { ...p, ...action.payload.patch } : p)),
      }

    case A.PROJECT_DELETE: {
      const id = action.payload.id
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== id),
        tasks: state.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
      }
    }

    case A.NOTIF_PUSH:
      return { ...state, notifications: [action.payload, ...state.notifications].slice(0, 120) }

    case A.NOTIF_READ:
      return { ...state, notifications: state.notifications.map((n) => (n.id === action.payload.id ? { ...n, read: true } : n)) }

    case A.NOTIF_READ_ALL:
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) }

    case A.NOTIF_DELETE:
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.payload.id) }

    case A.NOTIF_CLEAR:
      return { ...state, notifications: action.payload.keepUnread ? state.notifications.filter((n) => !n.read) : [] }

    case A.SETTINGS_PATCH:
      return { ...state, settings: deepMerge(state.settings, action.payload.patch) }

    case A.DATA_REPLACE:
      return { ...state, ...action.payload.state }

    case A.DATA_MERGE: {
      const incoming = action.payload.state
      return {
        ...state,
        tasks: [...state.tasks, ...(incoming.tasks || [])],
        projects: [...state.projects, ...(incoming.projects || [])],
        notifications: [...(incoming.notifications || []), ...state.notifications],
      }
    }

    case A.SCAN_DUE: {
      const today = toISODate(new Date())
      const fresh = []
      const tasks = state.tasks.map((t) => {
        if (t.status === 'done' || !t.dueDate) return t
        let notified = t.notified || { due: false, overdue: false }
        const diff = dayDiff(t.dueDate)
        if (diff < 0 && !notified.overdue) {
          fresh.push(makeNotification('overdue', 'Task overdue', `"${t.title}" is ${Math.abs(diff)} day(s) overdue.`, t.id))
          notified = { ...notified, overdue: true }
        }
        if ((diff === 0 || diff === 1) && !notified.due) {
          fresh.push(makeNotification('due', diff === 0 ? 'Due today' : 'Due tomorrow', `"${t.title}" is due ${diff === 0 ? 'today' : 'tomorrow'}.`, t.id))
          notified = { ...notified, due: true }
        }
        if (t.dueDate !== today && notified.due && diff > 1) notified = { ...notified, due: false }
        return { ...t, notified }
      })
      if (!fresh.length) return state
      const enabled = []
      if (notify.overdue) enabled.push(...fresh.filter((n) => n.type === 'overdue'))
      if (notify.dueSoon) enabled.push(...fresh.filter((n) => n.type === 'due'))
      if (!enabled.length) return { ...state, tasks }
      return { ...state, tasks, notifications: [...enabled, ...state.notifications].slice(0, 120) }
    }

    default:
      return state
  }
}
