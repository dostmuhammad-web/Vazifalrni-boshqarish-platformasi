export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function percent(part, total) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

export function toISODate(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function todayISO() {
  return toISODate(new Date())
}

export function nowISO() {
  return new Date().toISOString()
}

export function parseDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'string' && value.length === 10) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, (m || 1) - 1, d || 1)
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date) {
  const d = startOfDay(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function addDays(date, amount) {
  const d = new Date(date)
  d.setDate(d.getDate() + amount)
  return d
}

export function addMonths(date, amount) {
  const d = new Date(date)
  d.setDate(1)
  d.setMonth(d.getMonth() + amount)
  return d
}

export function startOfWeek(date, weekStart = 1) {
  const d = startOfDay(date)
  const diff = (d.getDay() - weekStart + 7) % 7
  d.setDate(d.getDate() - diff)
  return d
}

export function endOfWeek(date, weekStart = 1) {
  const d = addDays(startOfWeek(date, weekStart), 6)
  return endOfDay(d)
}

export function isSameDay(a, b) {
  const da = parseDate(a)
  const db = parseDate(b)
  if (!da || !db) return false
  return toISODate(da) === toISODate(db)
}

export function isToday(value) {
  return isSameDay(value, new Date())
}

export function isSameMonth(a, b) {
  const da = parseDate(a)
  const db = parseDate(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth()
}

export function dayDiff(value, base = new Date()) {
  const target = startOfDay(parseDate(value))
  if (!target) return null
  return Math.round((target - startOfDay(base)) / 86400000)
}

export function monthKey(value = new Date()) {
  const d = parseDate(value) || new Date()
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}`
}

export function formatDate(value) {
  const d = parseDate(value)
  if (!d) return 'No date'
  const diff = dayDiff(d)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString('en-US', sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatLongDate(value) {
  const d = parseDate(value)
  if (!d) return 'No date'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(value) {
  const d = parseDate(value)
  if (!d) return '—'
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
}

export function formatTime(value) {
  const d = parseDate(value)
  if (!d) return '—'
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function relTime(value) {
  const d = parseDate(value)
  if (!d) return '—'
  const diff = Date.now() - d.getTime()
  const abs = Math.abs(diff)
  const min = 60000
  const hour = 3600000
  const day = 86400000
  if (abs < min) return 'just now'
  if (abs < hour) return `${Math.floor(abs / min)}m ago`
  if (abs < day) return `${Math.floor(abs / hour)}h ago`
  if (abs < day * 7) return `${Math.floor(abs / day)}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function groupBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item)
    if (key === undefined || key === null) return acc
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
}

export function unique(list) {
  return Array.from(new Set(list.filter(Boolean)))
}

export function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Working late'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
