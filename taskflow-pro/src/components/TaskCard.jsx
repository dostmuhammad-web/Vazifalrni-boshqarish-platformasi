import { useRef, useState } from 'react'
import Icon from './Icon'
import { Avatar, PriorityBadge, ProgressBar } from './ui'
import { useClickOutside } from '../hooks/useClickOutside'
import { useApp } from '../store/context'
import { STATUS_MAP } from '../store/constants'
import { dueMeta, subtaskProgress } from '../lib/taskUtils'
import { cn, formatDate } from '../lib/utils'

export function TaskMenu({ task, align = 'right' }) {
  const { openTaskModal, deleteTask, duplicateTask, toggleArchive, toggleDone, openConfirmModal } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useClickOutside(ref, () => setOpen(false), open)

  const items = [
    { icon: 'edit', label: 'Edit task', onClick: () => openTaskModal(task) },
    { icon: 'play', label: task.status === 'done' ? 'Mark as todo' : 'Mark as done', onClick: () => toggleDone(task.id) },
    { icon: 'copy', label: 'Duplicate', onClick: () => duplicateTask(task.id) },
    { icon: 'archive', label: task.archived ? 'Unarchive' : 'Archive', onClick: () => toggleArchive(task.id) },
    {
      icon: 'trash',
      label: 'Delete',
      danger: true,
      onClick: () =>
        openConfirmModal({
          title: 'Delete task?',
          message: `"${task.title}" will be removed permanently. You can undo right after.`,
          confirmLabel: 'Delete',
          tone: 'danger',
          onConfirm: () => deleteTask(task.id),
        }),
    },
  ]

  return (
    <div className="menu" ref={ref}>
      <button
        type="button"
        className="icon-btn icon-btn--sm"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        aria-label="Task actions"
      >
        <Icon name="more-vertical" size={16} />
      </button>
      {open && (
        <div className={cn('menu__pop', `menu__pop--${align}`)} onClick={(e) => e.stopPropagation()}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={cn('menu__item', item.danger && 'menu__item--danger')}
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
            >
              <Icon name={item.icon} size={15} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TaskCard({
  task,
  selectable = false,
  checked = false,
  onToggleSelect,
  onOpen,
  draggable = false,
  onDragStart,
  onDragEnd,
  compact = false,
  showStatus = false,
  isDragging = false,
}) {
  const { projectMap, settings, toggleDone, toggleStar } = useApp()
  const project = projectMap[task.projectId]
  const due = dueMeta(task)
  const subs = subtaskProgress(task)
  const status = STATUS_MAP[task.status]

  return (
    <article
      className={cn('task-card', compact && 'task-card--compact', isDragging && 'is-dragging', task.archived && 'is-archived')}
      style={{ '--status-color': status.color }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onOpen?.(task)}
    >
      <div className="task-card__top">
        {selectable ? (
          <button
            type="button"
            className={cn('checkbox', checked && 'is-checked')}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelect?.(task.id)
            }}
            aria-label="Select task"
          >
            {checked && <Icon name="check" size={12} strokeWidth={3} />}
          </button>
        ) : (
          <span className={cn('status-dot', `status-dot--${task.status}`)} title={status.label} />
        )}
        <PriorityBadge priority={task.priority} size="sm" />
        {showStatus && (
          <span className="status-chip" style={{ color: status.color, background: `${status.color}1a` }}>
            {status.label}
          </span>
        )}
        <div className="task-card__actions">
          <button
            type="button"
            className={cn('icon-btn icon-btn--sm', task.starred && 'is-starred')}
            onClick={(e) => {
              e.stopPropagation()
              toggleStar(task.id)
            }}
            aria-label="Star task"
          >
            <Icon name="star" size={15} />
          </button>
          <TaskMenu task={task} />
        </div>
      </div>

      <h4 className="task-card__title">{task.title}</h4>
      {!compact && task.description && <p className="task-card__desc">{task.description}</p>}

      <div className="task-card__meta">
        {project && (
          <span className="chip chip--project">
            <i style={{ background: project.color }} />
            {project.name}
          </span>
        )}
        {due && (
          <span className={cn('chip', `chip--${due.tone}`)}>
            <Icon name={due.icon} size={12} strokeWidth={2} />
            {due.label}
          </span>
        )}
        {task.category && <span className="chip chip--ghost">{task.category}</span>}
      </div>

      {subs.total > 0 && (
        <div className="task-card__subs">
          <div className="task-card__subs-label">
            <Icon name="check-square" size={12} />
            {subs.done}/{subs.total} subtasks
            <span className="task-card__subs-pct">{subs.percent}%</span>
          </div>
          <ProgressBar value={subs.percent} tone={subs.percent === 100 ? 'success' : 'accent'} height={4} />
        </div>
      )}

      {!compact && (task.tags || []).length > 0 && (
        <div className="task-card__tags">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              <Icon name="hash" size={10} strokeWidth={2.2} />
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && <span className="tag tag--more">+{task.tags.length - 3}</span>}
        </div>
      )}

      <footer className="task-card__foot">
        {settings.showAvatars && <Avatar name={task.assignee || 'Me'} size={22} />}
        {task.estimate > 0 && (
          <span className="task-card__estimate" title="Estimate">
            <Icon name="clock" size={12} /> {task.estimate}h
          </span>
        )}
        <span className="task-card__date">Created {formatDate(task.createdAt)}</span>
        <button
          type="button"
          className={cn('task-card__check', task.status === 'done' && 'is-done')}
          onClick={(e) => {
            e.stopPropagation()
            toggleDone(task.id)
          }}
          title={task.status === 'done' ? 'Mark as todo' : 'Mark as done'}
        >
          <Icon name="check" size={14} strokeWidth={2.6} />
        </button>
      </footer>
    </article>
  )
}
