import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { Badge, EmptyState, PriorityBadge, SegmentedControl } from '../components/ui'
import { useApp } from '../store/context'
import { PRIORITY_MAP } from '../store/constants'
import { isOverdue } from '../lib/taskUtils'
import { addDays, addMonths, cn, formatLongDate, isSameDay, isSameMonth, monthKey, parseDate, startOfWeek, toISODate, todayISO } from '../lib/utils'

const VIEWS = [
  { value: 'month', label: 'Month', icon: 'calendar' },
  { value: 'week', label: 'Week', icon: 'columns' },
  { value: 'agenda', label: 'Agenda', icon: 'list' },
]

export default function CalendarPage() {
  const { tasks, projectMap, settings, openTaskModal } = useApp()
  const weekStart = settings.weekStart ?? 1
  const [view, setView] = useState('month')
  const [cursor, setCursor] = useState(() => new Date())
  const [selected, setSelected] = useState(() => todayISO())

  const byDate = useMemo(() => {
    const map = {}
    tasks.forEach((t) => {
      if (!t.dueDate) return
      if (!map[t.dueDate]) map[t.dueDate] = []
      map[t.dueDate].push(t)
    })
    Object.values(map).forEach((list) => list.sort((a, b) => PRIORITY_MAP[b.priority].weight - PRIORITY_MAP[a.priority].weight))
    return map
  }, [tasks])

  const monthCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const start = startOfWeek(first, weekStart)
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [cursor, weekStart])

  const weekCells = useMemo(() => {
    const start = startOfWeek(cursor, weekStart)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [cursor, weekStart])

  const selectedTasks = byDate[selected] || []
  const monthCount = useMemo(
    () => tasks.filter((t) => t.dueDate && monthKey(t.dueDate) === monthKey(cursor)).length,
    [tasks, cursor],
  )

  const agenda = useMemo(() => {
    const out = []
    for (let i = -7; i < 30; i += 1) {
      const day = addDays(new Date(), i)
      const iso = toISODate(day)
      const list = (byDate[iso] || []).filter((t) => i >= 0 || t.status !== 'done')
      if (list.length) out.push({ iso, date: day, list })
    }
    return out
  }, [byDate])

  function shift(dir) {
    if (view === 'month') setCursor((c) => addMonths(c, dir))
    else setCursor((c) => addDays(c, view === 'week' ? 7 * dir : 1))
  }

  const title =
    view === 'month'
      ? cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : view === 'week'
        ? `${formatLongDate(weekCells[0])} – ${formatLongDate(weekCells[6])}`
        : 'Next 30 days'

  return (
    <div className="page calendar-page">
      <div className="page-toolbar">
        <SegmentedControl value={view} onChange={setView} options={VIEWS} />
        <div className="page-toolbar__right">
          <div className="cal-nav">
            <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Previous">
              <Icon name="chevron-left" size={16} />
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCursor(new Date())}>
              Today
            </button>
            <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Next">
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
          <h2 className="cal-title">{title}</h2>
          <span className="muted">{monthCount} tasks this month</span>
        </div>
      </div>

      <div className="calendar-layout">
        {view === 'month' && (
          <section className="card calendar">
            <div className="calendar__head">
              {Array.from({ length: 7 }, (_, i) => {
                const d = addDays(startOfWeek(new Date(), weekStart), i)
                return (
                  <span key={i} className={cn(i === 0 && 'is-weekend', i === 6 && 'is-weekend')}>
                    {d.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                )
              })}
            </div>
            <div className="calendar__grid">
              {monthCells.map((day) => {
                const iso = toISODate(day)
                const list = byDate[iso] || []
                return (
                  <div
                    key={iso}
                    className={cn(
                      'calendar__day',
                      !isSameMonth(day, cursor) && 'is-outside',
                      isSameDay(day, new Date()) && 'is-today',
                      selected === iso && 'is-selected',
                    )}
                    onClick={() => setSelected(iso)}
                  >
                    <span className="calendar__num">{day.getDate()}</span>
                    <div className="calendar__events">
                      {list.slice(0, 3).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={cn('calendar__event', t.status === 'done' && 'is-done')}
                          style={{ '--c': PRIORITY_MAP[t.priority].color }}
                          onClick={(e) => {
                            e.stopPropagation()
                            openTaskModal(t)
                          }}
                          title={t.title}
                        >
                          <i />
                          <span>{t.title}</span>
                        </button>
                      ))}
                      {list.length > 3 && <span className="calendar__more">+{list.length - 3} more</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {view === 'week' && (
          <section className="card calendar calendar--week">
            <div className="week-grid">
              {weekCells.map((day) => {
                const iso = toISODate(day)
                const list = byDate[iso] || []
                return (
                  <div key={iso} className={cn('week-grid__col', isSameDay(day, new Date()) && 'is-today', selected === iso && 'is-selected')} onClick={() => setSelected(iso)}>
                    <header>
                      <span>{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                      <strong>{day.getDate()}</strong>
                    </header>
                    <div className="week-grid__list">
                      {list.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={cn('week-card', t.status === 'done' && 'is-done')}
                          style={{ '--c': PRIORITY_MAP[t.priority].color }}
                          onClick={(e) => {
                            e.stopPropagation()
                            openTaskModal(t)
                          }}
                        >
                          <i />
                          <strong>{t.title}</strong>
                          <em>{projectMap[t.projectId]?.name ?? 'No project'}</em>
                        </button>
                      ))}
                      {list.length === 0 && <span className="muted week-grid__empty">Free</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {view === 'agenda' && (
          <section className="card agenda">
            {agenda.length === 0 && <EmptyState icon="calendar" title="No upcoming deadlines" description="Add due dates to tasks to see them here." />}
            {agenda.map((group) => (
              <div key={group.iso} className="agenda__group">
                <header className={cn(isSameDay(group.date, new Date()) && 'is-today')}>
                  <span>{group.date.toLocaleDateString('en-US', { weekday: 'long' })}</span>
                  <strong>{group.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong>
                  <em>{group.list.length} task{group.list.length === 1 ? '' : 's'}</em>
                </header>
                <ul>
                  {group.list.map((t) => (
                    <li key={t.id} onClick={() => openTaskModal(t)}>
                      <span className="status-dot" style={{ background: PRIORITY_MAP[t.priority].color }} />
                      <div>
                        <strong className={cn(t.status === 'done' && 'is-struck')}>{t.title}</strong>
                        <span>
                          {projectMap[t.projectId]?.name ?? 'No project'} · {t.category}
                        </span>
                      </div>
                      <PriorityBadge priority={t.priority} size="sm" />
                      <Badge tone={t.status === 'done' ? 'success' : isOverdue(t) ? 'danger' : 'slate'}>{t.status === 'done' ? 'Done' : t.status}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        <aside className="card day-panel">
          <SectionHead iso={selected} count={selectedTasks.length} onAdd={() => openTaskModal(null, { dueDate: selected })} />
          {selectedTasks.length === 0 ? (
            <EmptyState icon="check-circle" title="Nothing due" description="This day is free. Enjoy it." />
          ) : (
            <ul className="day-panel__list">
              {selectedTasks.map((t) => (
                <li key={t.id} onClick={() => openTaskModal(t)}>
                  <div className="day-panel__top">
                    <PriorityBadge priority={t.priority} size="sm" />
                    <span className="status-dot" style={{ background: 'var(--accent)' }} />
                    <em>{t.status}</em>
                  </div>
                  <strong className={cn(t.status === 'done' && 'is-struck')}>{t.title}</strong>
                  <span className="day-panel__project">
                    <i style={{ background: projectMap[t.projectId]?.color ?? 'var(--border)' }} />
                    {projectMap[t.projectId]?.name ?? 'No project'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="day-panel__foot">
            <button type="button" className="btn btn--primary btn--block" onClick={() => openTaskModal(null, { dueDate: selected })}>
              <Icon name="plus" size={15} /> Add task for this day
            </button>
          </div>
        </aside>
      </div>

      {view === 'month' && (
        <section className="card calendar-legend">
          <strong>Legend</strong>
          {Object.values(PRIORITY_MAP).map((p) => (
            <span key={p.id}>
              <i style={{ background: p.color }} /> {p.label}
            </span>
          ))}
          <span className="muted">Click a day to see its tasks · week starts on {weekStart === 1 ? 'Monday' : 'Sunday'}</span>
        </section>
      )}
    </div>
  )
}

function SectionHead({ iso, count, onAdd }) {
  const d = parseDate(iso) || new Date()
  return (
    <header className="day-panel__head">
      <div>
        <span>{d.toLocaleDateString('en-US', { weekday: 'long' })}</span>
        <h3>
          {d.getDate()} {d.toLocaleDateString('en-US', { month: 'long' })}
        </h3>
        <em>{isSameDay(d, new Date()) ? 'Today' : formatLongDate(d)}</em>
      </div>
      <button type="button" className="icon-btn" onClick={onAdd} title="Add task">
        <Icon name="plus" size={16} />
      </button>
      <p className="day-panel__count">{count} task{count === 1 ? '' : 's'}</p>
    </header>
  )
}
