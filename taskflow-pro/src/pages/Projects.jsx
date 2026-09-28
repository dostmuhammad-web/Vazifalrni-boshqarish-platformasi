import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { Avatar, EmptyState, ProgressBar } from '../components/ui'
import { useApp } from '../store/context'
import { projectStats } from '../lib/taskUtils'
import { cn, formatDate } from '../lib/utils'

export default function Projects({ navigate }) {
  const { tasks, projects, settings, openProjectModal, deleteProject, setFilters, openTaskModal, openConfirmModal } = useApp()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('activity')

  const rows = useMemo(() => {
    const list = projectStats(tasks, projects)
      .filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name)
        if (sort === 'progress') return b.percent - a.percent
        if (sort === 'tasks') return b.total - a.total
        return new Date(b.createdAt) - new Date(a.createdAt)
      })
    return list
  }, [tasks, projects, query, sort])

  function openProjectTasks(projectId) {
    setFilters((f) => ({ ...f, project: projectId, status: 'all' }))
    navigate('tasks')
  }

  function openProjectBoard(projectId) {
    setFilters((f) => ({ ...f, project: projectId }))
    navigate('kanban')
  }

  return (
    <div className="page projects-page">
      <div className="page-toolbar">
        <div className="search-inline">
          <Icon name="search" size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects…" />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear">
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
        <div className="page-toolbar__right">
          <label className="sort-select">
            <Icon name="sliders" size={14} />
            <select className="input input--sm" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="activity">Sort: recent</option>
              <option value="name">Sort: name</option>
              <option value="tasks">Sort: task count</option>
              <option value="progress">Sort: progress</option>
            </select>
          </label>
          <button type="button" className="btn btn--primary" onClick={() => openProjectModal()}>
            <Icon name="plus" size={16} strokeWidth={2.4} /> New project
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="folder"
            title={query ? 'No projects match your search' : 'No projects yet'}
            description={query ? 'Try a different keyword.' : 'Create your first project to organise tasks.'}
            action={
              <button type="button" className="btn btn--primary" onClick={() => openProjectModal()}>
                <Icon name="plus" size={16} /> New project
              </button>
            }
          />
        </div>
      ) : (
        <div className="project-grid">
          {rows.map((p) => {
            const members = Array.from(new Set(tasks.filter((t) => t.projectId === p.id).map((t) => t.assignee || 'Me'))).slice(0, 4)
            return (
              <article key={p.id} className="project-card" style={{ '--c': p.color }}>
                <div className="project-card__head">
                  <span className="project-card__icon">
                    <Icon name="folder" size={18} />
                  </span>
                  <div className="project-card__actions">
                    <button type="button" className="icon-btn icon-btn--sm" onClick={() => openProjectModal(p)} title="Edit project">
                      <Icon name="edit" size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn--sm"
                      onClick={() =>
                        openConfirmModal({
                          title: 'Delete project?',
                          message: `"${p.name}" will be deleted. ${p.total} task(s) will become unassigned.`,
                          confirmLabel: 'Delete project',
                          tone: 'danger',
                          onConfirm: () => deleteProject(p.id),
                        })
                      }
                      title="Delete project"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                </div>
                <h3>{p.name}</h3>
                <p className="project-card__desc">{p.description || 'No description provided.'}</p>

                <div className="project-card__progress">
                  <div>
                    <span>Progress</span>
                    <strong>{p.percent}%</strong>
                  </div>
                  <ProgressBar value={p.percent} tone={p.percent === 100 ? 'success' : 'accent'} height={6} />
                </div>

                <div className="project-card__stats">
                  <div>
                    <strong>{p.total}</strong>
                    <span>Total</span>
                  </div>
                  <div>
                    <strong className="text-success">{p.completed}</strong>
                    <span>Done</span>
                  </div>
                  <div>
                    <strong>{p.pending}</strong>
                    <span>Open</span>
                  </div>
                  <div>
                    <strong className={cn(p.overdue > 0 && 'text-danger')}>{p.overdue}</strong>
                    <span>Overdue</span>
                  </div>
                </div>

                <footer className="project-card__foot">
                  <div className="project-card__members">
                    {settings.showAvatars &&
                      (members.length ? (
                        members.map((m) => <Avatar key={m} name={m} size={24} />)
                      ) : (
                        <span className="muted">No members</span>
                      ))}
                    <span className="muted">· created {formatDate(p.createdAt)}</span>
                  </div>
                  <div className="project-card__links">
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => openProjectTasks(p.id)}>
                      <Icon name="list" size={14} /> Tasks
                    </button>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => openProjectBoard(p.id)}>
                      <Icon name="columns" size={14} /> Board
                    </button>
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => openTaskModal(null, { projectId: p.id })}>
                      <Icon name="plus" size={14} /> Add
                    </button>
                  </div>
                </footer>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
