import { useRef, useState } from 'react'
import Icon from './Icon'
import { useApp } from '../store/context'
import { PRIORITY_LIST, STATUS_LIST } from '../store/constants'
import { activeFilterCount } from '../lib/taskUtils'
import { useClickOutside } from '../hooks/useClickOutside'
import { cn } from '../lib/utils'

const DATE_OPTIONS = [
  { value: 'all', label: 'Any date' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'next7', label: 'Next 7 days' },
  { value: 'next30', label: 'Next 30 days' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'past', label: 'Past' },
  { value: 'none', label: 'No due date' },
]

function Select({ label, value, onChange, children, icon }) {
  return (
    <label className="filter-select" title={label}>
      {icon && <Icon name={icon} size={14} />}
      <select className="input input--sm" value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </label>
  )
}

export function FilterBar({ showStatus = true, right, compact = false }) {
  const { state, filters, setFilters, tags, resetFilters, stats } = useApp()
  const count = activeFilterCount(filters)

  return (
    <div className={cn('filter-bar', compact && 'filter-bar--compact')}>
      <div className="filter-bar__group">
        {showStatus && (
          <Select label="Status" icon="columns" value={filters.status} onChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
            <option value="all">All statuses ({state.tasks.length})</option>
            {STATUS_LIST.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({state.tasks.filter((t) => t.status === s.id).length})
              </option>
            ))}
          </Select>
        )}
        <Select label="Priority" icon="flag" value={filters.priority} onChange={(v) => setFilters((f) => ({ ...f, priority: v }))}>
          <option value="all">All priorities</option>
          {PRIORITY_LIST.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} ({state.tasks.filter((t) => t.priority === p.id).length})
            </option>
          ))}
        </Select>
        <Select label="Project" icon="folder" value={filters.project} onChange={(v) => setFilters((f) => ({ ...f, project: v }))}>
          <option value="all">All projects</option>
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Select label="Tag" icon="hash" value={filters.tag} onChange={(v) => setFilters((f) => ({ ...f, tag: v }))}>
          <option value="all">All tags</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              #{t}
            </option>
          ))}
        </Select>
        <Select label="Date" icon="calendar" value={filters.date} onChange={(v) => setFilters((f) => ({ ...f, date: v }))}>
          {DATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Select
          label="Category"
          icon="layers"
          value={filters.category}
          onChange={(v) => setFilters((f) => ({ ...f, category: v }))}
        >
          <option value="all">All categories</option>
          {(state.settings.categories || []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
      <div className="filter-bar__actions">
        {stats.overdue > 0 && (
          <button
            type="button"
            className={cn('chip chip--danger chip--btn', filters.overdueOnly && 'is-active')}
            onClick={() => setFilters((f) => ({ ...f, overdueOnly: !f.overdueOnly }))}
          >
            <Icon name="alert" size={12} strokeWidth={2} />
            Overdue {stats.overdue}
          </button>
        )}
        {count > 0 && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={resetFilters}>
            <Icon name="rotate" size={14} /> Clear ({count})
          </button>
        )}
        {right}
      </div>
    </div>
  )
}

export function FilterPopover() {
  const { state, filters, setFilters, tags, resetFilters, stats } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useClickOutside(ref, () => setOpen(false), open)
  const count = activeFilterCount(filters) + (filters.overdueOnly ? 1 : 0)

  return (
    <div className="menu" ref={ref}>
      <button
        type="button"
        className={cn('btn btn--ghost btn--sm', count > 0 && 'is-active')}
        onClick={() => setOpen((v) => !v)}
        title="Filters"
      >
        <Icon name="filter" size={15} />
        Filters
        {count > 0 && <span className="pill-count">{count}</span>}
      </button>
      {open && (
        <div className="menu__pop menu__pop--wide">
          <div className="filter-pop">
            <div className="filter-pop__row">
              <span>Status</span>
              <div className="filter-pop__chips">
                {STATUS_LIST.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`chip chip--btn ${filters.status === s.id ? 'is-active' : ''}`}
                    style={{ '--c': s.color }}
                    onClick={() => setFilters((f) => ({ ...f, status: f.status === s.id ? 'all' : s.id }))}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-pop__row">
              <span>Priority</span>
              <div className="filter-pop__chips">
                {PRIORITY_LIST.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`chip chip--btn ${filters.priority === p.id ? 'is-active' : ''}`}
                    style={{ '--c': p.color }}
                    onClick={() => setFilters((f) => ({ ...f, priority: f.priority === p.id ? 'all' : p.id }))}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-pop__row">
              <span>Project</span>
              <div className="filter-pop__chips">
                <button
                  type="button"
                  className={`chip chip--btn ${filters.project === 'all' ? 'is-active' : ''}`}
                  onClick={() => setFilters((f) => ({ ...f, project: 'all' }))}
                >
                  All
                </button>
                {state.projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`chip chip--btn ${filters.project === p.id ? 'is-active' : ''}`}
                    style={{ '--c': p.color }}
                    onClick={() => setFilters((f) => ({ ...f, project: f.project === p.id ? 'all' : p.id }))}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-pop__row">
              <span>Tag</span>
              <div className="filter-pop__chips">
                <button
                  type="button"
                  className={`chip chip--btn ${filters.tag === 'all' ? 'is-active' : ''}`}
                  onClick={() => setFilters((f) => ({ ...f, tag: 'all' }))}
                >
                  All
                </button>
                {tags.slice(0, 10).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`chip chip--btn ${filters.tag === t ? 'is-active' : ''}`}
                    onClick={() => setFilters((f) => ({ ...f, tag: f.tag === t ? 'all' : t }))}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-pop__row">
              <span>Due date</span>
              <div className="filter-pop__chips">
                {DATE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={`chip chip--btn ${filters.date === o.value ? 'is-active' : ''}`}
                    onClick={() => setFilters((f) => ({ ...f, date: o.value }))}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-pop__foot">
              <button
                type="button"
                className="chip chip--btn chip--danger"
                onClick={() => setFilters((f) => ({ ...f, overdueOnly: !f.overdueOnly }))}
              >
                <Icon name="alert" size={12} /> Overdue only ({stats.overdue})
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={resetFilters}>
                Reset all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
