import { PRIORITY_MAP, STATUS_MAP, PRIORITY_DESC } from '../store/constants'
import {
  addDays,
  dayDiff,
  formatDate,
  monthKey,
  startOfWeek,
  toISODate,
  unique,
} from './utils'

export function isOverdue(task) {
  if (!task.dueDate || task.status === 'done') return false
  return dayDiff(task.dueDate) < 0
}

export function isDueToday(task) {
  if (!task.dueDate || task.status === 'done') return false
  return dayDiff(task.dueDate) === 0
}

export function isDueSoon(task) {
  if (!task.dueDate || task.status === 'done') return false
  const d = dayDiff(task.dueDate)
  return d !== null && d >= 0 && d <= 3
}

export function dueMeta(task) {
  if (!task.dueDate) return null
  if (isOverdue(task)) return { tone: 'danger', label: `Overdue · ${formatDate(task.dueDate)}`, icon: 'alert' }
  if (isDueToday(task)) return { tone: 'warning', label: 'Due today', icon: 'clock' }
  if (isDueSoon(task)) return { tone: 'info', label: formatDate(task.dueDate), icon: 'clock' }
  return { tone: 'neutral', label: formatDate(task.dueDate), icon: 'calendar' }
}

export function subtaskProgress(task) {  const list = task.subtasks || []
  const done = list.filter((s) => s.done).length
  return { done, total: list.length, percent: list.length ? Math.round((done / list.length) * 100) : 0 }
}

export const DEFAULT_FILTERS = {
  query: '',
  status: 'all',
  priority: 'all',
  project: 'all',
  category: 'all',
  tag: 'all',
  date: 'all',
  overdueOnly: false,
}

export function activeFilterCount(filters) {
  return Object.entries(DEFAULT_FILTERS).filter(([key, def]) => key !== 'query' && filters[key] !== def).length
}

export function taskMatchesQuery(task, query, projectMap) {
  if (!query) return true
  const q = query.trim().toLowerCase()
  if (!q) return true
  const words = q.split(/\s+/)
  const project = projectMap[task.projectId]
  const haystack = [
    task.title,
    task.description,
    task.category,
    (task.tags || []).join(' '),
    project ? project.name : '',
    STATUS_MAP[task.status]?.label,
    PRIORITY_MAP[task.priority]?.label,
    ...(task.subtasks || []).map((s) => s.title),
  ]
    .join(' ')
    .toLowerCase()
  return words.every((w) => haystack.includes(w))
}

export function matchDateFilter(task, date) {
  if (!date || date === 'all') return true
  const diff = dayDiff(task.dueDate)
  if (task.dueDate === '') {
    return date === 'none'
  }
  switch (date) {
    case 'today':
      return diff === 0
    case 'tomorrow':
      return diff === 1
    case 'week':
      return diff !== null && diff >= 0 && diff <= 7
    case 'next7':
      return diff !== null && diff >= 0 && diff <= 7
    case 'next30':
      return diff !== null && diff >= 0 && diff <= 30
    case 'past':
      return diff !== null && diff < 0
    case 'overdue':
      return isOverdue(task)
    case 'none':
      return !task.dueDate
    default:
      return true
  }
}

export function filterTasks(tasks, filters = {}, projectMap = {}) {
  const f = { ...DEFAULT_FILTERS, ...filters }
  return tasks.filter((task) => {
    if (!taskMatchesQuery(task, f.query, projectMap)) return false
    if (f.status !== 'all' && task.status !== f.status) return false
    if (f.priority !== 'all' && task.priority !== f.priority) return false
    if (f.project !== 'all' && task.projectId !== f.project) return false
    if (f.category !== 'all' && task.category !== f.category) return false
    if (f.tag !== 'all' && !(task.tags || []).includes(f.tag)) return false
    if (f.overdueOnly && !isOverdue(task)) return false
    if (!matchDateFilter(task, f.date)) return false
    return true
  })
}

export function sortTasks(tasks, sort = 'due') {
  const list = [...tasks]
  const byPriority = (a, b) => PRIORITY_MAP[b].weight - PRIORITY_MAP[a].weight
  switch (sort) {
    case 'priority':
      return list.sort(
        (a, b) =>
          byPriority(a, b) ||
          (a.dueDate || '9999').localeCompare(b.dueDate || '9999') ||
          a.title.localeCompare(b.title),
      )
    case 'title':
      return list.sort((a, b) => a.title.localeCompare(b.title))
    case 'created':
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'updated':
      return list.sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))
    case 'status':
      return list.sort((a, b) => a.status.localeCompare(b.status) || byPriority(a, b))
    case 'due':
    default:
      return list.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return byPriority(a, b)
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.localeCompare(b.dueDate) || byPriority(a, b)
      })
  }
}

export function computeStats(tasks) {
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'done').length
  const pending = total - completed
  const overdue = tasks.filter(isOverdue).length
  const today = tasks.filter(isDueToday).length
  const urgent = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length
  const inProgress = tasks.filter((t) => t.status === 'progress').length
  const review = tasks.filter((t) => t.status === 'review').length
  const todo = tasks.filter((t) => t.status === 'todo').length
  const completedToday = tasks.filter(
    (t) => t.status === 'done' && t.completedAt && toISODate(t.completedAt) === toISODate(new Date()),
  ).length
  return {
    total,
    completed,
    pending,
    overdue,
    today,
    urgent,
    inProgress,
    review,
    todo,
    completedToday,
    completionRate: total ? Math.round((completed / total) * 100) : 0,
  }
}

export function statusDistribution(tasks) {
  return ['todo', 'progress', 'review', 'done'].map((id) => ({
    id,
    label: STATUS_MAP[id].label,
    color: STATUS_MAP[id].color,
    value: tasks.filter((t) => t.status === id).length,
  }))
}

export function priorityDistribution(tasks) {
  return PRIORITY_DESC.map((id) => ({
    id,
    label: PRIORITY_MAP[id].label,
    color: PRIORITY_MAP[id].color,
    value: tasks.filter((t) => t.priority === id).length,
  }))
}

export function categoryDistribution(tasks, categories) {
  return categories
    .map((name) => ({
      id: name,
      label: name,
      value: tasks.filter((t) => t.category === name).length,
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
}

export function projectStats(tasks, projects) {
  return projects.map((project) => {
    const list = tasks.filter((t) => t.projectId === project.id)
    const completed = list.filter((t) => t.status === 'done').length
    return {
      ...project,
      total: list.length,
      completed,
      pending: list.length - completed,
      overdue: list.filter(isOverdue).length,
      percent: list.length ? Math.round((completed / list.length) * 100) : 0,
    }
  })
}

export function weeklyProductivity(tasks, weeks = 8, weekStart = 1) {
  const today = new Date()
  const thisWeek = startOfWeek(today, weekStart)
  const buckets = []
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = addDays(thisWeek, -7 * i)
    const end = addDays(start, 7)
    const created = tasks.filter((t) => {
      const d = new Date(t.createdAt)
      return d >= start && d < end
    }).length
    const completed = tasks.filter((t) => {
      if (!t.completedAt) return false
      const d = new Date(t.completedAt)
      return d >= start && d < end
    }).length
    buckets.push({
      label: toISODate(start),
      short: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      created,
      completed,
    })
  }
  return buckets
}

export function dailyActivity(tasks, days = 14) {
  const today = new Date()
  const out = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = addDays(today, -i)
    const iso = toISODate(day)
    const created = tasks.filter((t) => toISODate(t.createdAt) === iso).length
    const completed = tasks.filter((t) => t.completedAt && toISODate(t.completedAt) === iso).length
    out.push({ date: iso, label: day.toLocaleDateString('en-US', { weekday: 'narrow' }), created, completed })
  }
  return out
}

export function collectTags(tasks, settingsTags) {
  return unique([...settingsTags, ...tasks.flatMap((t) => t.tags || [])]).sort()
}

export function upcomingTasks(tasks, limit = 6) {
  return tasks
    .filter((t) => t.status !== 'done' && t.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, limit)
}

export function recentCompleted(tasks, limit = 5) {
  return tasks
    .filter((t) => t.status === 'done')
    .sort((a, b) => (b.completedAt || b.updatedAt || '').localeCompare(a.completedAt || a.updatedAt || ''))
    .slice(0, limit)
}

export function workloadByDay(tasks, days = 7, from = new Date()) {
  const out = []
  for (let i = 0; i < days; i += 1) {
    const day = addDays(from, i)
    const iso = toISODate(day)
    const list = tasks.filter((t) => t.dueDate === iso && t.status !== 'done')
    out.push({
      date: iso,
      label: day.toLocaleDateString('en-US', { weekday: 'short' }),
      total: list.length,
      urgent: list.filter((t) => t.priority === 'urgent').length,
    })
  }
  return out
}

export function monthBuckets(tasks) {
  const map = new Map()
  tasks.forEach((t) => {
    if (t.status !== 'done' || !t.completedAt) return
    const key = monthKey(t.completedAt)
    map.set(key, (map.get(key) || 0) + 1)
  })
  return Array.from(map.entries())
    .map(([key, value]) => ({ label: key, value }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
