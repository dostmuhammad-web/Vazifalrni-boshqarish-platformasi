import { useEffect, useState } from 'react'
import { Field, Modal } from './ui'
import Icon from './Icon'
import { useApp } from '../store/context'
import { PROJECT_COLORS } from '../store/constants'
import { computeStats } from '../lib/taskUtils'

export default function ProjectModal({ open, onClose, project }) {
  const { state, addProject, updateProject, deleteProject, openConfirmModal, tasks } = useApp()
  const [form, setForm] = useState({ name: '', description: '', color: PROJECT_COLORS[0] })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(
      project
        ? { name: project.name, description: project.description || '', color: project.color }
        : { name: '', description: '', color: PROJECT_COLORS[state.projects.length % PROJECT_COLORS.length] },
    )
    setError('')
  }, [open, project, state.projects.length])

  const stats = project ? computeStats(tasks.filter((t) => t.projectId === project.id)) : null

  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Project name is required.')
      return
    }
    if (project) updateProject(project.id, { ...form, name: form.name.trim() })
    else addProject({ ...form, name: form.name.trim() })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      icon="folder"
      title={project ? 'Edit project' : 'New project'}
      subtitle={project ? 'Update project details' : 'Group tasks into a project'}
      footer={
        <>
          <div className="modal__foot-left">
            {project && (
              <button
                type="button"
                className="btn btn--ghost btn--danger"
                onClick={() =>
                  openConfirmModal({
                    title: 'Delete project?',
                    message: `"${project.name}" will be deleted. Its ${stats.total} tasks will be kept but unassigned.`,
                    confirmLabel: 'Delete project',
                    tone: 'danger',
                    onConfirm: () => {
                      deleteProject(project.id)
                      onClose()
                    },
                  })
                }
              >
                <Icon name="trash" size={16} /> Delete
              </button>
            )}
          </div>
          <div className="modal__foot-right">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" form="project-form" className="btn btn--primary">
              <Icon name="check" size={16} /> {project ? 'Save' : 'Create project'}
            </button>
          </div>
        </>
      }
    >
      <form id="project-form" className="project-form" onSubmit={submit}>
        <Field label="Project name" required error={error}>
          <input
            className="input"
            autoFocus
            value={form.name}
            placeholder="e.g. Atlas Web Platform"
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }))
              if (error) setError('')
            }}
          />
        </Field>
        <Field label="Description">
          <textarea
            className="input"
            rows={3}
            value={form.description}
            placeholder="What is this project about?"
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Field>
        <Field label="Colour">
          <div className="color-grid">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-dot ${form.color === c ? 'is-active' : ''}`}
                style={{ background: c }}
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                aria-label={`Colour ${c}`}
              >
                {form.color === c && <Icon name="check" size={13} strokeWidth={3} />}
              </button>
            ))}
          </div>
        </Field>
        {project && stats && (
          <div className="project-form__stats">
            <div>
              <strong>{stats.total}</strong>
              <span>Tasks</span>
            </div>
            <div>
              <strong>{stats.completed}</strong>
              <span>Done</span>
            </div>
            <div>
              <strong>{stats.pending}</strong>
              <span>Open</span>
            </div>
            <div>
              <strong>{stats.overdue}</strong>
              <span>Overdue</span>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
