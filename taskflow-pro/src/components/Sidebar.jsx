import Icon from './Icon'
import { Avatar, ProgressBar } from './ui'
import { useApp } from '../store/context'
import { NAV_ITEMS, STATUS_LIST } from '../store/constants'
import { cn } from '../lib/utils'
import { projectStats } from '../lib/taskUtils'

export default function Sidebar({ route, navigate }) {
  const { state, settings, updateSettings, openTaskModal, openProjectModal, setFilters, filters, stats } = useApp()
  const collapsed = settings.compactSidebar
  const projects = projectStats(state.tasks, state.projects)

  return (
    <aside className={cn('sidebar', collapsed && 'is-collapsed', settings.compactSidebar && 'is-compact')}>
      <div className="sidebar__brand">
        <span className="brand-mark">
          <Icon name="layers" size={18} strokeWidth={2} />
        </span>
        {!collapsed && (
          <span className="brand-text">
            <strong>TaskFlow</strong>
            <em>PRO</em>
          </span>
        )}
        <button
          type="button"
          className="icon-btn sidebar__collapse"
          onClick={() => updateSettings({ compactSidebar: !collapsed })}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} size={16} />
        </button>
      </div>

      <button type="button" className="btn btn--primary sidebar__new" onClick={() => openTaskModal()}>
        <Icon name="plus" size={16} strokeWidth={2.4} />
        {!collapsed && 'New task'}
      </button>

      <nav className="sidebar__nav">
        {!collapsed && <span className="sidebar__label">Workspace</span>}
        {NAV_ITEMS.map((item) => {
          const count = item.id === 'notifications' ? state.notifications.filter((n) => !n.read).length : 0
          return (
            <button
              key={item.id}
              type="button"
              className={cn('nav-item', route === item.id && 'is-active')}
              onClick={() => navigate(item.id)}
              title={item.label}
            >
              <Icon name={item.icon} size={18} />
              {!collapsed && <span>{item.label}</span>}
              {count > 0 && <em className="nav-item__badge">{count}</em>}
            </button>
          )
        })}
      </nav>

      <div className="sidebar__section">
        {!collapsed && <span className="sidebar__label">Status</span>}
        {STATUS_LIST.map((s) => {
          const value = state.tasks.filter((t) => t.status === s.id).length
          const active = filters.status === s.id
          return (
            <button
              key={s.id}
              type="button"
              className={cn('nav-item nav-item--sm', active && 'is-active')}
              onClick={() => setFilters((f) => ({ ...f, status: active ? 'all' : s.id }))}
              title={s.label}
            >
              <i className="nav-item__dot" style={{ background: s.color }} />
              {!collapsed && <span>{s.label}</span>}
              {!collapsed && <em className="nav-item__count">{value}</em>}
            </button>
          )
        })}
      </div>

      <div className="sidebar__section sidebar__section--grow">
        <div className="sidebar__label-row">
          {!collapsed && <span className="sidebar__label">Projects</span>}
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            onClick={() => openProjectModal()}
            title="New project"
          >
            <Icon name="plus" size={14} />
          </button>
        </div>
        <div className="sidebar__projects">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              className={cn('nav-item nav-item--sm', filters.project === p.id && 'is-active')}
              onClick={() => setFilters((f) => ({ ...f, project: filters.project === p.id ? 'all' : p.id }))}
              title={p.name}
            >
              <i className="nav-item__dot" style={{ background: p.color }} />
              {!collapsed && (
                <>
                  <span className="nav-item__text">{p.name}</span>
                  <em className="nav-item__count">{p.completed}/{p.total}</em>
                </>
              )}
            </button>
          ))}
          {projects.length === 0 && !collapsed && <p className="sidebar__empty">No projects yet</p>}
        </div>
      </div>

      {!collapsed && (
        <div className="sidebar__goal">
          <div className="sidebar__goal-head">
            <span>
              <Icon name="target" size={14} /> Weekly goal
            </span>
            <strong>
              {stats.completedToday}/{settings.profile.weekGoal || 10}
            </strong>
          </div>
          <ProgressBar value={Math.round((stats.completedToday / (settings.profile.weekGoal || 10)) * 100)} height={5} />
        </div>
      )}

      <button type="button" className="sidebar__user" onClick={() => navigate('settings')} title="Settings">
        <Avatar name={settings.profile.name} size={32} />
        {!collapsed && (
          <span className="sidebar__user-info">
            <strong>{settings.profile.name}</strong>
            <em>{settings.profile.role}</em>
          </span>
        )}
        {!collapsed && <Icon name="sliders" size={16} />}
      </button>
    </aside>
  )
}
