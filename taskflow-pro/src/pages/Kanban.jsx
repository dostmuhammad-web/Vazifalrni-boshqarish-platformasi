import { useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon'
import { FilterBar } from '../components/FilterBar'
import { useApp } from '../store/context'
import { PRIORITY_MAP, STATUS_LIST } from '../store/constants'
import { filterTasks, isOverdue } from '../lib/taskUtils'
import { cn } from '../lib/utils'

export default function Kanban() {
  const { tasks, projectMap, filters, openTaskModal, moveTask, updateTask, settings } = useApp()
  const [dragId, setDragId] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [cardSort, setCardSort] = useState('order')
  const columnsRef = useRef({})

  const filtered = useMemo(() => tasks.filter((t) => !t.archived), [tasks])
  const visible = useMemo(() => filterTasks(filtered, { ...filters, status: 'all' }, projectMap), [filtered, filters, projectMap])

  const columns = useMemo(() => {
    const sorters = {
      order: (a, b) => (a.order ?? 0) - (b.order ?? 0),
      priority: (a, b) => PRIORITY_MAP[b.priority].weight - PRIORITY_MAP[a.priority].weight || (a.order ?? 0) - (b.order ?? 0),
      due: (a, b) => (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99'),
      project: (a, b) => (projectMap[a.projectId]?.name ?? '').localeCompare(projectMap[b.projectId]?.name ?? ''),
      created: (a, b) => b.createdAt.localeCompare(a.createdAt),
    }
    const sorter = sorters[cardSort]
    const map = {}
    STATUS_LIST.forEach((s) => {
      map[s.id] = visible.filter((t) => t.status === s.id).sort(sorter)
    })
    return map
  }, [visible, cardSort, projectMap])

  function handleDragStart(e, task) {
    setDragId(task.id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id)
  }

  function handleDragOver(e, status) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const container = columnsRef.current[status]
    if (!container) return
    const cards = Array.from(container.querySelectorAll('.kanban-item:not(.is-dragging)'))
    let index = cards.length
    for (let i = 0; i < cards.length; i += 1) {
      const rect = cards[i].getBoundingClientRect()
      if (e.clientY < rect.top + rect.height / 2) {
        index = i
        break
      }
    }
    setDragOver((prev) => (prev && prev.status === status && prev.index === index ? prev : { status, index }))
  }

  function handleDrop(e, status) {
    e.preventDefault()
    const id = dragId || e.dataTransfer.getData('text/plain')
    const index = dragOver && dragOver.status === status ? dragOver.index : undefined
    if (id) moveTask(id, status, index)
    setDragId(null)
    setDragOver(null)
  }

  function endDrag() {
    setDragId(null)
    setDragOver(null)
  }

  return (
    <div className="page kanban-page">
      <div className="page-toolbar">
        <div className="kanban-legend">
          <span className="muted">Drag cards between columns to update status</span>
        </div>
        <div className="page-toolbar__right">
          <label className="sort-select">
            <Icon name="sliders" size={14} />
            <select className="input input--sm" value={cardSort} onChange={(e) => setCardSort(e.target.value)}>
              <option value="order">Sort: manual</option>
              <option value="priority">Sort: priority</option>
              <option value="due">Sort: due date</option>
              <option value="project">Sort: project</option>
              <option value="created">Sort: newest</option>
            </select>
          </label>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => {
              STATUS_LIST.forEach((s) => columns[s.id].forEach((t, i) => moveTask(t.id, s.id, i)))
            }}
          >
            <Icon name="rotate" size={14} /> Reset order
          </button>
        </div>
      </div>

      <FilterBar showStatus={false} />

      <div className="kanban">
        {STATUS_LIST.map((status) => {
          const items = columns[status.id]
          const overdue = items.filter(isOverdue).length
          return (
            <section
              key={status.id}
              className={cn('kanban-col', dragOver?.status === status.id && 'is-over', settings.density === 'compact' && 'is-compact')}
              style={{ '--c': status.color }}
              onDragOver={(e) => handleDragOver(e, status.id)}
              onDrop={(e) => handleDrop(e, status.id)}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null)
              }}
            >
              <header className="kanban-col__head">
                <div className="kanban-col__title">
                  <i className="kanban-col__dot" />
                  <strong>{status.label}</strong>
                  <span className="kanban-col__count">{items.length}</span>
                </div>
                <div className="kanban-col__actions">
                  {overdue > 0 && (
                    <span className="kanban-col__overdue" title="Overdue tasks">
                      <Icon name="alert" size={12} strokeWidth={2.2} /> {overdue}
                    </span>
                  )}
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    onClick={() => openTaskModal(null, { status: status.id })}
                    title={`Add task to ${status.label}`}
                  >
                    <Icon name="plus" size={15} />
                  </button>
                </div>
              </header>

              <div className="kanban-col__body" ref={(el) => (columnsRef.current[status.id] = el)}>
                {items.map((task, i) => (
                  <div key={task.id}>
                    {dragOver?.status === status.id && dragOver.index === i && <div className="kanban-placeholder" />}
                    <KanbanCard
                      task={task}
                      dragging={dragId === task.id}
                      onDragStart={handleDragStart}
                      onDragEnd={endDrag}
                      onOpen={openTaskModal}
                      onToggleDone={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })}
                    />
                  </div>
                ))}
                {dragOver?.status === status.id && dragOver.index >= items.length && <div className="kanban-placeholder" />}
                {items.length === 0 && !(dragOver?.status === status.id) && (
                  <div className="kanban-col__empty">
                    <Icon name="inbox" size={18} />
                    <span>Drop a task here</span>
                  </div>
                )}
              </div>

              <footer className="kanban-col__foot">
                <button type="button" onClick={() => openTaskModal(null, { status: status.id })}>
                  <Icon name="plus" size={14} /> Add task
                </button>
                <span>
                  {items.filter((t) => t.status === 'done').length}/{items.length} complete
                </span>
              </footer>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function KanbanCard({ task, dragging, onDragStart, onDragEnd, onOpen, onToggleDone }) {
  const { projectMap, toggleStar, openTaskModal } = useApp()
  const project = projectMap[task.projectId]
  const overdue = isOverdue(task)
  const subs = task.subtasks || []

  return (
    <article
      className={cn('kanban-item', dragging && 'is-dragging')}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(task)}
    >
      <div className="kanban-item__top">
        <span className={`prio prio--${task.priority} prio--sm`}>
          <i className="prio__bars">
            <i />
            <i />
            <i />
          </i>
          <span>{task.priority}</span>
        </span>
        <div className="kanban-item__tools">
          <button
            type="button"
            className={cn('icon-btn icon-btn--sm', task.starred && 'is-starred')}
            onClick={(e) => {
              e.stopPropagation()
              toggleStar(task.id)
            }}
            aria-label="Star"
          >
            <Icon name="star" size={14} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            onClick={(e) => {
              e.stopPropagation()
              openTaskModal(task)
            }}
            aria-label="Edit"
          >
            <Icon name="edit" size={14} />
          </button>
        </div>
      </div>
      <h4>{task.title}</h4>
      {task.description && <p className="kanban-item__desc">{task.description}</p>}
      <div className="kanban-item__meta">
        {project && (
          <span className="chip chip--project">
            <i style={{ background: project.color }} />
            {project.name}
          </span>
        )}
        {task.dueDate && (
          <span className={cn('chip', overdue ? 'chip--danger' : 'chip--neutral')} title="Due date">
            <Icon name="calendar" size={11} strokeWidth={2} />
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        <span className="chip chip--ghost">{task.category}</span>
      </div>
      {subs.length > 0 && (
        <div className="kanban-item__subs">
          <Icon name="check-square" size={12} />
          {subs.filter((s) => s.done).length}/{subs.length}
          <div className="kanban-item__subbar">
            <i style={{ width: `${(subs.filter((s) => s.done).length / subs.length) * 100}%` }} />
          </div>
        </div>
      )}
      <footer className="kanban-item__foot">
        <span className="kanban-item__id">#{task.id.slice(-4)}</span>
        <button
          type="button"
          className={cn('kanban-item__done', task.status === 'done' && 'is-done')}
          onClick={(e) => {
            e.stopPropagation()
            onToggleDone()
          }}
          title="Toggle done"
        >
          <Icon name="check" size={12} strokeWidth={3} />
        </button>
      </footer>
    </article>
  )
}
