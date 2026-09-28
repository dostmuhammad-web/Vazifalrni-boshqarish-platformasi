import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { useApp } from '../store/context'
import { NAV_ITEMS } from '../store/constants'
import { filterTasks } from '../lib/taskUtils'
import { cn } from '../lib/utils'

export default function CommandPalette({ navigate }) {
  const { paletteOpen, setPaletteOpen, openTaskModal, openProjectModal, updateSettings, settings, setQuery, tasks, projectMap, resetFilters } =
    useApp()
  const [query, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
      if (e.key === 'Escape') setPaletteOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [setPaletteOpen])

  useEffect(() => {
    if (paletteOpen) {
      setQ('')
      setCursor(0)
      setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [paletteOpen])

  const actions = useMemo(() => {
    const list = [
      ...NAV_ITEMS.map((n) => ({
        id: `go-${n.id}`,
        icon: n.icon,
        label: `Go to ${n.label}`,
        hint: 'Navigate',
        run: () => navigate(n.id),
      })),
      { id: 'new-task', icon: 'plus', label: 'Create new task', hint: 'Action', run: () => openTaskModal() },
      { id: 'new-project', icon: 'folder', label: 'Create new project', hint: 'Action', run: () => openProjectModal() },
      {
        id: 'theme',
        icon: settings.theme === 'dark' ? 'sun' : 'moon',
        label: `Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} mode`,
        hint: 'Action',
        run: () => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' }),
      },
      { id: 'clear-filters', icon: 'rotate', label: 'Reset all filters', hint: 'Action', run: () => resetFilters() },
      { id: 'clear-search', icon: 'search', label: 'Clear search', hint: 'Action', run: () => setQuery('') },
    ]
    const matchedTasks = query.trim()
      ? filterTasks(tasks, { query }, projectMap)
          .slice(0, 6)
          .map((t) => ({
            id: `task-${t.id}`,
            icon: 'check-square',
            label: t.title,
            hint: projectMap[t.projectId]?.name ?? 'Task',
            run: () => openTaskModal(t),
          }))
      : []
    return [...matchedTasks, ...list]
  }, [query, tasks, projectMap, navigate, openTaskModal, openProjectModal, updateSettings, settings.theme, resetFilters, setQuery])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return actions
    return actions.filter((a) => a.label.toLowerCase().includes(q))
  }, [actions, query])

  useEffect(() => {
    setCursor(0)
  }, [query])

  if (!paletteOpen) return null

  function run(item) {
    if (!item) return
    setPaletteOpen(false)
    item.run()
  }

  return (
    <div className="palette-root" role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="modal__backdrop" onClick={() => setPaletteOpen(false)} />
      <div className="palette">
        <div className="palette__search">
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a command or search tasks…"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setCursor((c) => Math.min(results.length - 1, c + 1))
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                setCursor((c) => Math.max(0, c - 1))
              }
              if (e.key === 'Enter') {
                e.preventDefault()
                run(results[cursor])
              }
            }}
          />
          <kbd>ESC</kbd>
        </div>
        <ul className="palette__list" ref={listRef}>
          {results.map((item, i) => (
            <li key={item.id}>
              <button
                type="button"
                className={cn('palette__item', i === cursor && 'is-active')}
                onMouseEnter={() => setCursor(i)}
                onClick={() => run(item)}
              >
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
                <em>{item.hint}</em>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="palette__empty">No matching commands</li>}
        </ul>
        <div className="palette__foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> select
          </span>
          <span>
            <kbd>esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  )
}
