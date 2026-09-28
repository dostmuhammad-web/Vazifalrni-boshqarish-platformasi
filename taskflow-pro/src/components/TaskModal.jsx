import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { Field, Modal } from './ui'
import { useApp } from '../store/context'
import { PRIORITY_LIST, STATUS_LIST } from '../store/constants'
import { addDays, formatLongDate, relTime, toISODate, todayISO, unique } from '../lib/utils'
import { subtaskProgress } from '../lib/taskUtils'

const EMPTY = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  category: 'Development',
  projectId: '',
  dueDate: '',
  tags: [],
  estimate: 2,
  assignee: 'Me',
  starred: false,
  subtasks: [],
}

function taskToForm(task) {
  if (!task) return { ...EMPTY }
  return {
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    category: task.category,
    projectId: task.projectId || '',
    dueDate: task.dueDate || '',
    tags: [...(task.tags || [])],
    estimate: task.estimate ?? 2,
    assignee: task.assignee || 'Me',
    starred: Boolean(task.starred),
    subtasks: (task.subtasks || []).map((s) => ({ ...s })),
  }
}

export default function TaskModal({ open, onClose, task, defaults = {} }) {
  const { state, settings, addTask, updateTask, deleteTask, toggleSubtask, addSubtask, removeSubtask, addComment, openConfirmModal, tags: knownTags } =
    useApp()
  const [form, setForm] = useState(() => taskToForm(task))
  const [tagInput, setTagInput] = useState('')
  const [subInput, setSubInput] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const titleRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const base = taskToForm(task)
    setForm({
      ...base,
      status: defaults.status ?? task?.status ?? settings.defaultStatus,
      priority: defaults.priority ?? task?.priority ?? settings.defaultPriority,
      projectId: defaults.projectId ?? task?.projectId ?? settings.defaultProject ?? '',
      category: defaults.category ?? task?.category ?? settings.categories?.[0] ?? 'General',
      dueDate: defaults.dueDate ?? task?.dueDate ?? '',
    })
    setTagInput('')
    setSubInput('')
    setComment('')
    setError('')
    setTimeout(() => titleRef.current?.focus(), 60)
  }, [open, task, defaults, settings])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const suggestions = useMemo(
    () => knownTags.filter((t) => !form.tags.includes(t)).slice(0, 8),
    [knownTags, form.tags],
  )

  const subs = subtaskProgress(form)

  function addTag(value) {
    const clean = value.trim().replace(/^#/, '')
    if (!clean) return
    set({ tags: unique([...form.tags, clean]) })
    setTagInput('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Task title is required.')
      titleRef.current?.focus()
      return
    }
    const payload = {
      ...form,
      projectId: form.projectId || null,
      dueDate: form.dueDate || '',
      title: form.title.trim(),
    }
    if (task) updateTask(task.id, payload)
    else addTask(payload)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={task ? 'edit' : 'plus'}
      title={task ? 'Edit task' : 'Create new task'}
      subtitle={task ? `Created ${relTime(task.createdAt)} · ID ${task.id.slice(-6)}` : 'Add a task to your workspace'}
      footer={
        <>
          <div className="modal__foot-left">
            {task && (
              <>
                <button
                  type="button"
                  className="btn btn--ghost btn--danger"
                  onClick={() =>
                    openConfirmModal({
                      title: 'Delete task?',
                      message: `"${task.title}" will be removed permanently.`,
                      confirmLabel: 'Delete',
                      tone: 'danger',
                      onConfirm: () => {
                        deleteTask(task.id)
                        onClose()
                      },
                    })
                  }
                >
                  <Icon name="trash" size={16} /> Delete
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => updateTask(task.id, { starred: !task.starred })}
                >
                  <Icon name="star" size={16} /> {task.starred ? 'Unstar' : 'Star'}
                </button>
              </>
            )}
          </div>
          <div className="modal__foot-right">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" form="task-form" className="btn btn--primary">
              <Icon name="check" size={16} /> {task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="task-form">
        <div className="task-form__main">
          <input
            ref={titleRef}
            className="task-form__title"
            placeholder="What needs to be done?"
            value={form.title}
            onChange={(e) => {
              set({ title: e.target.value })
              if (error) setError('')
            }}
            maxLength={120}
          />
          {error && <span className="field__error task-form__error">{error}</span>}
          <textarea
            className="task-form__desc"
            rows={4}
            placeholder="Add a description, notes or acceptance criteria…"
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
          />

          <div className="task-form__row task-form__row--2">
            <Field label="Project">
              <select className="input" value={form.projectId} onChange={(e) => set({ projectId: e.target.value })}>
                <option value="">No project</option>
                {state.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select className="input" value={form.category} onChange={(e) => set({ category: e.target.value })}>
                {(settings.categories || []).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Tags" hint="Press Enter to add a tag">
            <div className="tag-input">
              {form.tags.map((tag) => (
                <span key={tag} className="tag tag--active">
                  <Icon name="hash" size={10} strokeWidth={2.2} />
                  {tag}
                  <button type="button" onClick={() => set({ tags: form.tags.filter((t) => t !== tag) })} aria-label={`Remove ${tag}`}>
                    <Icon name="x" size={11} strokeWidth={2.4} />
                  </button>
                </span>
              ))}
              <input
                className="tag-input__field"
                value={tagInput}
                placeholder="Add tag…"
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addTag(tagInput)
                  }
                  if (e.key === 'Backspace' && !tagInput && form.tags.length) {
                    set({ tags: form.tags.slice(0, -1) })
                  }
                }}
              />
            </div>
            {suggestions.length > 0 && (
              <div className="tag-suggest">
                {suggestions.map((tag) => (
                  <button key={tag} type="button" className="tag" onClick={() => addTag(tag)}>
                    + {tag}
                  </button>
                ))}
              </div>
            )}
          </Field>

          {task && (
            <Field label="Add a comment or note">
              <div className="comment-input">
                <input
                  className="input"
                  placeholder="Write an update…"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && comment.trim()) {
                      addComment(task.id, comment.trim())
                      setComment('')
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={!comment.trim()}
                  onClick={() => {
                    addComment(task.id, comment.trim())
                    setComment('')
                  }}
                >
                  Post
                </button>
              </div>
            </Field>
          )}

          {task && task.activity?.length > 0 && (
            <div className="activity">
              <span className="activity__title">Activity</span>
              <ul>
                {task.activity.slice(0, 8).map((a) => (
                  <li key={a.id}>
                    <i className={`activity__dot kind-${a.kind}`} />
                    <span>{a.text}</span>
                    <em>{relTime(a.at)}</em>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="task-form__side">
          <Field label="Status">
            <div className="status-options">
              {STATUS_LIST.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`status-option ${form.status === s.id ? 'is-active' : ''}`}
                  style={{ '--c': s.color }}
                  onClick={() => set({ status: s.id })}
                >
                  <i /> {s.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Priority">
            <div className="status-options">
              {PRIORITY_LIST.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`status-option ${form.priority === p.id ? 'is-active' : ''}`}
                  style={{ '--c': p.color }}
                  onClick={() => set({ priority: p.id })}
                >
                  <i /> {p.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Due date">
            <input className="input" type="date" value={form.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
            <div className="date-quick">
              <button type="button" onClick={() => set({ dueDate: todayISO() })}>
                Today
              </button>
              <button type="button" onClick={() => set({ dueDate: toISODate(addDays(new Date(), 1)) })}>
                Tomorrow
              </button>
              <button type="button" onClick={() => set({ dueDate: toISODate(addDays(new Date(), 7)) })}>
                +7d
              </button>
              <button type="button" onClick={() => set({ dueDate: '' })}>
                None
              </button>
            </div>
            {form.dueDate && <span className="field__hint">{formatLongDate(form.dueDate)}</span>}
          </Field>

          <div className="task-form__row task-form__row--2">
            <Field label="Estimate (h)">
              <input
                className="input"
                type="number"
                min="0"
                max="200"
                value={form.estimate}
                onChange={(e) => set({ estimate: e.target.value })}
              />
            </Field>
            <Field label="Assignee">
              <input className="input" value={form.assignee} onChange={(e) => set({ assignee: e.target.value })} />
            </Field>
          </div>

          <Field label={`Subtasks ${subs.total ? `(${subs.done}/${subs.total})` : ''}`}>
            <ul className="subtask-list">
              {(form.subtasks || []).map((s) => (
                <li key={s.id} className={s.done ? 'is-done' : ''}>
                  <button
                    type="button"
                    className={`checkbox ${s.done ? 'is-checked' : ''}`}
                    onClick={() =>
                      task
                        ? toggleSubtask(task.id, s.id)
                        : set({ subtasks: form.subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) })
                    }
                  >
                    {s.done && <Icon name="check" size={11} strokeWidth={3} />}
                  </button>
                  <input
                    className="subtask-list__title"
                    value={s.title}
                    onChange={(e) =>
                      set({ subtasks: form.subtasks.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)) })
                    }
                  />
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    onClick={() =>
                      task
                        ? removeSubtask(task.id, s.id)
                        : set({ subtasks: form.subtasks.filter((x) => x.id !== s.id) })
                    }
                    aria-label="Remove subtask"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="subtask-add">
              <input
                className="input"
                placeholder="Add a subtask…"
                value={subInput}
                onChange={(e) => setSubInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && subInput.trim()) {
                    e.preventDefault()
                    if (task) addSubtask(task.id, subInput.trim())
                    else set({ subtasks: [...form.subtasks, { id: `tmp_${Date.now()}`, title: subInput.trim(), done: false }] })
                    setSubInput('')
                  }
                }}
              />
              <button
                type="button"
                className="btn btn--ghost"
                disabled={!subInput.trim()}
                onClick={() => {
                  if (task) addSubtask(task.id, subInput.trim())
                  else set({ subtasks: [...form.subtasks, { id: `tmp_${Date.now()}`, title: subInput.trim(), done: false }] })
                  setSubInput('')
                }}
              >
                <Icon name="plus" size={15} />
              </button>
            </div>
          </Field>
        </aside>
      </form>
    </Modal>
  )
}
