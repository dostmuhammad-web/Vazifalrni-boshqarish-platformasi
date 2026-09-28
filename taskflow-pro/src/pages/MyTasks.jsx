import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import TaskCard from '../components/TaskCard'
import { TaskMenu } from '../components/TaskCard'
import { Avatar, EmptyState, ProgressBar, SegmentedControl } from '../components/ui'
import { FilterBar } from '../components/FilterBar'
import { useApp } from '../store/context'
import { PRIORITY_LIST, STATUS_LIST } from '../store/constants'
import { dueMeta, filterTasks, sortTasks, subtaskProgress } from '../lib/taskUtils'
import { cn, formatDate } from '../lib/utils'

const SORTS = [
  { value: 'due', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'created', label: 'Newest' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'title', label: 'Title A–Z' },
]

const QUICK = [
  { value: 'all', label: 'All' },
  { value: 'today', label: 'Today' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'starred', label: 'Starred' },
  { value: 'done', label: 'Done' },
]

export default function MyTasks({ navigate }) {
  const { tasks, projectMap, settings, filters, setFilters, toggleDone, toggleStar, updateTask, bulkPatch, bulkDelete, openConfirmModal, projects } =
    useApp()
  const [sort, setSort] = useState('due')
  const [view, setView] = useState('list')
  const [quick, setQuick] = useState('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState([])

  const list = useMemo(() => {
    let base = tasks.filter((t) => !t.archived)
    if (quick === 'today') base = base.filter((t) => dueMeta(t) && t.dueDate === new Date().toISOString().slice(0, 10))
    if (quick === 'overdue') base = base.filter((t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date(new Date().toDateString()))
    if (quick === 'starred') base = base.filter((t) => t.starred)
    if (quick === 'done') base = base.filter((t) => t.status === 'done')
    return sortTasks(filterTasks(base, filters, projectMap), sort)
  }, [tasks, filters, projectMap, sort, quick])

  const pageSize = settings.pageSize || 10
  const pageCount = Math.max(1, Math.ceil(list.length / pageSize))
  const current = Math.min(page, pageCount)
  const visible = list.slice((current - 1) * pageSize, current * pageSize)
  const allSelected = visible.length > 0 && visible.every((t) => selected.includes(t.id))

  function toggleSelect(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  function toggleSelectAll() {
    if (allSelected) setSelected((s) => s.filter((id) => !visible.some((t) => t.id === id)))
    else setSelected((s) => Array.from(new Set([...s, ...visible.map((t) => t.id)])))
  }

  const counts = useMemo(() => {
    const base = tasks.filter((t) => !t.archived)
    return {
      all: base.length,
      today: base.filter((t) => t.dueDate === new Date().toISOString().slice(0, 10)).length,
      overdue: base.filter((t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date(new Date().toDateString())).length,
      starred: base.filter((t) => t.starred).length,
      done: base.filter((t) => t.status === 'done').length,
    }
  }, [tasks])

  return (
    <div className="page tasks-page">
      <div className="page-toolbar">
        <SegmentedControl
          value={quick}
          onChange={setQuick}
          options={QUICK.map((q) => ({ ...q, count: counts[q.value] }))}
        />
        <div className="page-toolbar__right">
          <label className="sort-select">
            <Icon name="sliders" size={14} />
            <select className="input input--sm" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  Sort: {s.label}
                </option>
              ))}
            </select>
          </label>
          <div className="view-toggle">
            <button type="button" className={cn(view === 'list' && 'is-active')} onClick={() => setView('list')} title="List view">
              <Icon name="list" size={15} />
            </button>
            <button type="button" className={cn(view === 'grid' && 'is-active')} onClick={() => setView('grid')} title="Grid view">
              <Icon name="grid" size={15} />
            </button>
          </div>
        </div>
      </div>

      <FilterBar />

      {selected.length > 0 && (
        <div className="bulk-bar">
          <span className="bulk-bar__count">
            <strong>{selected.length}</strong> selected
          </span>
          <label className="bulk-bar__select">
            Set status
            <select
              className="input input--sm"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  bulkPatch(selected, { status: e.target.value })
                  setSelected([])
                }
              }}
            >
              <option value="">Choose…</option>
              {STATUS_LIST.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="bulk-bar__select">
            Set priority
            <select
              className="input input--sm"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  bulkPatch(selected, { priority: e.target.value })
                  setSelected([])
                }
              }}
            >
              <option value="">Choose…</option>
              {PRIORITY_LIST.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="bulk-bar__select">
            Move to
            <select
              className="input input--sm"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  bulkPatch(selected, { projectId: e.target.value === 'none' ? null : e.target.value })
                  setSelected([])
                }
              }}
            >
              <option value="">Choose…</option>
              <option value="none">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() =>
              openConfirmModal({
                title: `Delete ${selected.length} tasks?`,
                message: 'This cannot be undone from the list view.',
                confirmLabel: 'Delete',
                tone: 'danger',
                onConfirm: () => {
                  bulkDelete(selected)
                  setSelected([])
                },
              })
            }
          >
            <Icon name="trash" size={14} /> Delete
          </button>
          <button type="button" className="icon-btn icon-btn--sm" onClick={() => setSelected([])} title="Clear selection">
            <Icon name="x" size={15} />
          </button>
        </div>
      )}

      <div className="result-bar">
        <span>
          <strong>{list.length}</strong> task{list.length === 1 ? '' : 's'} found
          {filters.query && ` for “${filters.query}”`}
        </span>
        {list.length > 0 && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('kanban')}>
            <Icon name="columns" size={14} /> Board view
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="inbox"
            title="No tasks match your filters"
            description="Try adjusting the filters, or create a new task to get started."
            action={
              <div className="empty__actions">
                <button type="button" className="btn btn--primary" onClick={() => openTaskModal()}>
                  <Icon name="plus" size={16} /> New task
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setFilters({ query: '', status: 'all', priority: 'all', project: 'all', category: 'all', tag: 'all', date: 'all', overdueOnly: false })}
                >
                  Clear filters
                </button>
              </div>
            }
          />
        </div>
      ) : view === 'grid' ? (
        <div className="task-grid">
          {visible.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              showStatus
              selectable
              checked={selected.includes(t.id)}
              onToggleSelect={toggleSelect}
              onOpen={openTaskModal}
            />
          ))}
        </div>
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th className="table__check">
                  <button type="button" className={cn('checkbox', allSelected && 'is-checked')} onClick={toggleSelectAll}>
                    {allSelected && <Icon name="check" size={12} strokeWidth={3} />}
                  </button>
                </th>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due date</th>
                <th>Progress</th>
                <th className="table__actions" />
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => {
                const project = projectMap[t.projectId]
                const due = dueMeta(t)
                const subs = subtaskProgress(t)
                return (
                  <tr key={t.id} onClick={() => openTaskModal(t)} className={selected.includes(t.id) ? 'is-selected' : ''}>
                    <td className="table__check">
                      <button
                        type="button"
                        className={cn('checkbox', selected.includes(t.id) && 'is-checked')}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSelect(t.id)
                        }}
                      >
                        {selected.includes(t.id) && <Icon name="check" size={12} strokeWidth={3} />}
                      </button>
                    </td>
                    <td>
                      <div className="table__task">
                        <button
                          type="button"
                          className={cn('table__done', t.status === 'done' && 'is-done')}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleDone(t.id)
                          }}
                          title="Toggle done"
                        >
                          <Icon name="check" size={12} strokeWidth={3} />
                        </button>
                        <div>
                          <strong className={cn(t.status === 'done' && 'is-struck')}>{t.title}</strong>
                          <span className="table__tags">
                            {t.category}
                            {(t.tags || []).slice(0, 2).map((tag) => (
                              <em key={tag}>#{tag}</em>
                            ))}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={cn('icon-btn icon-btn--sm', t.starred && 'is-starred')}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleStar(t.id)
                          }}
                        >
                          <Icon name="star" size={14} />
                        </button>
                      </div>
                    </td>
                    <td>
                      {project ? (
                        <span className="chip chip--project">
                          <i style={{ background: project.color }} />
                          {project.name}
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <select
                        className="status-select"
                        style={{ '--c': STATUS_LIST.find((s) => s.id === t.status).color }}
                        value={t.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateTask(t.id, { status: e.target.value })}
                      >
                        {STATUS_LIST.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`prio prio--${t.priority} prio--sm`}>
                        <i className="prio__bars">
                          <i />
                          <i />
                          <i />
                        </i>
                        <span>{t.priority}</span>
                      </span>
                    </td>
                    <td>
                      {due ? (
                        <span className={cn('chip', `chip--${due.tone}`)}>
                          <Icon name={due.icon} size={12} strokeWidth={2} />
                          {due.label}
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      {subs.total > 0 ? (
                        <div className="table__progress">
                          <ProgressBar value={subs.percent} height={4} tone={subs.percent === 100 ? 'success' : 'accent'} />
                          <em>
                            {subs.done}/{subs.total}
                          </em>
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="table__actions" onClick={(e) => e.stopPropagation()}>
                      {settings.showAvatars && <Avatar name={t.assignee || 'Me'} size={24} />}
                      <TaskMenu task={t} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {list.length > pageSize && (
        <div className="pagination">
          <button type="button" className="btn btn--ghost btn--sm" disabled={current === 1} onClick={() => setPage(1)}>
            <Icon name="chevron-left" size={14} /> First
          </button>
          <div className="pagination__pages">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={cn('pagination__page', p === current && 'is-active')}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn--ghost btn--sm" disabled={current === pageCount} onClick={() => setPage(pageCount)}>
            Last <Icon name="chevron-right" size={14} />
          </button>
          <span className="pagination__info">
            Page {current} of {pageCount} · {list.length} tasks
          </span>
        </div>
      )}

      <p className="page-foot">
        Showing {visible.length} of {list.length} tasks · Sorted by {SORTS.find((s) => s.value === sort).label} · Last refreshed{' '}
        {formatDate(new Date())}
      </p>
    </div>
  )
}
