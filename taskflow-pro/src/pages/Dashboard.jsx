import { useMemo } from 'react'
import Icon from '../components/Icon'
import TaskCard from '../components/TaskCard'
import { Avatar, Badge, EmptyState, PriorityBadge, ProgressBar, SectionTitle } from '../components/ui'
import { AreaChart, BarChart, DonutChart, HBarList, RadialProgress, Sparkline } from '../components/Charts'
import { useApp } from '../store/context'
import { STATUS_LIST } from '../store/constants'
import {
  collectTags,
  dailyActivity,
  priorityDistribution,
  projectStats,
  recentCompleted,
  statusDistribution,
  upcomingTasks,
  workloadByDay,
} from '../lib/taskUtils'
import { cn, greeting, relTime } from '../lib/utils'

const STAT_CARDS = [
  { key: 'total', label: 'Total tasks', icon: 'layers', tone: 'accent' },
  { key: 'completed', label: 'Completed', icon: 'check-circle', tone: 'success' },
  { key: 'pending', label: 'Pending', icon: 'clock', tone: 'info' },
  { key: 'overdue', label: 'Overdue', icon: 'alert', tone: 'danger' },
  { key: 'today', label: "Today's tasks", icon: 'calendar', tone: 'warning' },
  { key: 'completionRate', label: 'Completion rate', icon: 'trending-up', tone: 'violet' },
]

export default function Dashboard({ navigate }) {
  const { tasks, projects, stats, settings, projectMap, openTaskModal, setFilters, filters } = useApp()

  const activity = useMemo(() => dailyActivity(tasks, 14), [tasks])
  const workload = useMemo(() => workloadByDay(tasks, 7), [tasks])
  const statusData = useMemo(() => statusDistribution(tasks), [tasks])
  const priorityData = useMemo(() => priorityDistribution(tasks), [tasks])
  const upcoming = useMemo(() => upcomingTasks(tasks, 6), [tasks])
  const doneRecent = useMemo(() => recentCompleted(tasks, 5), [tasks])
  const pStats = useMemo(() => projectStats(tasks, projects), [tasks, projects])
  const activeProjects = pStats.filter((p) => p.total > 0).sort((a, b) => b.total - a.total).slice(0, 5)
  const lastWeekCompleted = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return tasks.filter((t) => t.completedAt && new Date(t.completedAt) >= weekAgo).length
  }, [tasks])

  const sparks = {
    total: activity.map((d) => d.created),
    completed: activity.map((d) => d.completed),
    pending: activity.map((d) => d.created - d.completed),
    overdue: workload.map((w) => w.total),
    today: workload.map((w) => w.total),
    completionRate: activity.map((d) => d.completed),
  }

  const sparkColors = {
    total: 'var(--accent)',
    completed: 'var(--success)',
    pending: 'var(--info)',
    overdue: 'var(--danger)',
    today: 'var(--warning)',
    completionRate: 'var(--accent-2)',
  }

  return (
    <div className="page dashboard">
      <section className="hero card">
        <div className="hero__main">
          <span className="hero__eyebrow">
            <Icon name="sparkle" size={14} /> {greeting()}, {settings.profile.name.split(' ')[0]}
          </span>
          <h2>
            You have <strong>{stats.today}</strong> task{stats.today === 1 ? '' : 's'} due today
            {stats.overdue > 0 && (
              <>
                {' '}
                and <strong className="text-danger">{stats.overdue} overdue</strong>
              </>
            )}
            .
          </h2>
          <p>
            {lastWeekCompleted} task{lastWeekCompleted === 1 ? '' : 's'} completed over the last 7 days. Keep the momentum going — your
            completion rate is <strong>{stats.completionRate}%</strong>.
          </p>
          <div className="hero__actions">
            <button type="button" className="btn btn--primary" onClick={() => openTaskModal()}>
              <Icon name="plus" size={16} strokeWidth={2.4} /> New task
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => navigate('kanban')}>
              <Icon name="columns" size={16} /> Open board
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setFilters((f) => ({ ...f, date: 'today', status: 'all' }))
                navigate('tasks')
              }}
            >
              <Icon name="calendar" size={16} /> Plan today
            </button>
          </div>
        </div>
        <div className="hero__side">
          <RadialProgress value={stats.completionRate} size={116} thickness={11} label="Complete" />
          <div className="hero__legend">
            {STATUS_LIST.map((s) => (
              <span key={s.id}>
                <i style={{ background: s.color }} /> {s.label}
                <strong>{statusData.find((d) => d.id === s.id).value}</strong>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="stat-grid">
        {STAT_CARDS.map((card) => (
          <button
            key={card.key}
            type="button"
            className={cn('stat-card', `stat-card--${card.tone}`)}
            onClick={() => {
              if (card.key === 'overdue') setFilters((f) => ({ ...f, overdueOnly: !f.overdueOnly, date: 'all' }))
              else if (card.key === 'today') setFilters((f) => ({ ...f, date: 'today', overdueOnly: false }))
              else if (card.key === 'completed') setFilters((f) => ({ ...f, status: 'done' }))
              else if (card.key === 'pending') setFilters((f) => ({ ...f, status: 'progress' }))
              if (['overdue', 'today', 'completed', 'pending'].includes(card.key)) navigate('tasks')
            }}
          >
            <div className="stat-card__head">
              <span className="stat-card__icon">
                <Icon name={card.icon} size={18} />
              </span>
              <span className="stat-card__label">{card.label}</span>
            </div>
            <div className="stat-card__body">
              <strong>{stats[card.key]}{card.key === 'completionRate' && '%'}</strong>
              <Sparkline data={sparks[card.key]} color={sparkColors[card.key]} />
            </div>
            <span className="stat-card__hint">
              {card.key === 'total' && `${projects.length} projects`}
              {card.key === 'completed' && `${stats.completedToday} today`}
              {card.key === 'pending' && `${stats.inProgress} in progress`}
              {card.key === 'overdue' && (stats.overdue ? 'Needs attention' : 'All clear')}
              {card.key === 'today' && `${stats.urgent} urgent open`}
              {card.key === 'completionRate' && `${stats.pending} tasks left`}
            </span>
          </button>
        ))}
      </section>

      <div className="grid-2">
        <section className="card">
          <SectionTitle
            title="Productivity trend"
            subtitle="Tasks created vs completed — last 14 days"
            icon="trending-up"
            actions={
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('analytics')}>
                Full analytics <Icon name="arrow-right" size={14} />
              </button>
            }
          />
          <AreaChart
            data={activity}
            series={[
              { key: 'completed', label: 'Completed', color: 'var(--success)' },
              { key: 'created', label: 'Created', color: 'var(--accent)' },
            ]}
            height={250}
          />
        </section>

        <section className="card">
          <SectionTitle title="Status breakdown" subtitle="Where your tasks are right now" icon="columns" />
          <DonutChart data={statusData} size={186} thickness={20} centerTitle="All tasks" />
        </section>
      </div>

      <div className="grid-3">
        <section className="card">
          <SectionTitle title="This week" subtitle="Task load for the next 7 days" icon="calendar" />
          <BarChart
            data={workload.map((w) => ({ id: w.date, label: w.label, value: w.total, color: w.urgent ? 'var(--danger)' : 'var(--accent)' }))}
            height={200}
          />
        </section>

        <section className="card">
          <SectionTitle title="Priority mix" subtitle="All tasks by priority" icon="flag" />
          <HBarList data={priorityData} />
          <div className="card__footer">
            <span>
              <Icon name="zap" size={14} /> {stats.urgent} urgent open
            </span>
            <span>
              <Icon name="layers" size={14} /> {collectTags(tasks, []).length} tags
            </span>
          </div>
        </section>

        <section className="card">
          <SectionTitle title="Project health" subtitle="Completion by project" icon="folder" />
          <ul className="mini-projects">
            {activeProjects.map((p) => (
              <li key={p.id}>
                <div className="mini-projects__head">
                  <span>
                    <i style={{ background: p.color }} /> {p.name}
                  </span>
                  <strong>{p.percent}%</strong>
                </div>
                <ProgressBar value={p.percent} tone={p.percent === 100 ? 'success' : 'accent'} height={5} />
                <em>
                  {p.completed}/{p.total} done{p.overdue ? ` · ${p.overdue} overdue` : ''}
                </em>
              </li>
            ))}
            {activeProjects.length === 0 && <EmptyState icon="folder" title="No projects yet" description="Create a project to group tasks." />}
          </ul>
        </section>
      </div>

      <div className="grid-2">
        <section className="card">
          <SectionTitle
            title="Upcoming deadlines"
            subtitle="Next tasks that need your attention"
            icon="clock"
            actions={
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setFilters((f) => ({ ...f, date: 'next7' }))
                  navigate('tasks')
                }}
              >
                View all
              </button>
            }
          />
          {upcoming.length === 0 ? (
            <EmptyState icon="check-circle" title="Nothing scheduled" description="Add a due date to see upcoming deadlines." />
          ) : (
            <ul className="deadline-list">
              {upcoming.map((t) => (
                <li key={t.id} onClick={() => openTaskModal(t)}>
                  <span className={`deadline-list__flag deadline-list__flag--${t.status}`} />
                  <div className="deadline-list__main">
                    <strong>{t.title}</strong>
                    <span>
                      {projectMap[t.projectId]?.name ?? 'No project'} · {t.category}
                    </span>
                  </div>
                  <PriorityBadge priority={t.priority} size="sm" />
                  <Badge tone={t.dueDate === new Date().toISOString().slice(0, 10) ? 'warning' : 'slate'} icon="calendar">
                    {relTime(t.dueDate).includes('ago') ? relTime(t.dueDate) : new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <SectionTitle
            title="Recently completed"
            subtitle="Your latest wins"
            icon="award"
            actions={
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => {
                  setFilters((f) => ({ ...f, status: 'done' }))
                  navigate('tasks')
                }}
              >
                View all
              </button>
            }
          />
          {doneRecent.length === 0 ? (
            <EmptyState icon="award" title="No completed tasks yet" description="Finish a task to see it here." />
          ) : (
            <ul className="done-list">
              {doneRecent.map((t) => (
                <li key={t.id} onClick={() => openTaskModal(t)}>
                  <span className="done-list__check">
                    <Icon name="check" size={13} strokeWidth={3} />
                  </span>
                  <div>
                    <strong>{t.title}</strong>
                    <span>
                      {projectMap[t.projectId]?.name ?? 'No project'} · completed {relTime(t.completedAt)}
                    </span>
                  </div>
                  {settings.showAvatars && <Avatar name={t.assignee || 'Me'} size={24} />}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card">
        <SectionTitle
          title="Starred & urgent"
          subtitle="Focus on what matters most"
          icon="star"
          actions={
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                setFilters((f) => ({ ...f, priority: 'urgent' }))
                navigate('tasks')
              }}
            >
              All urgent
            </button>
          }
        />
        <div className="task-grid">
          {tasks
            .filter((t) => t.status !== 'done' && (t.starred || t.priority === 'urgent'))
            .slice(0, 4)
            .map((t) => (
              <TaskCard key={t.id} task={t} showStatus onOpen={openTaskModal} compact />
            ))}
          {tasks.filter((t) => t.status !== 'done' && (t.starred || t.priority === 'urgent')).length === 0 && (
            <EmptyState icon="star" title="No starred tasks" description="Star a task to pin it here for quick access." />
          )}
        </div>
      </section>
      {filters.query && <p className="search-note">Active search: “{filters.query}”</p>}
    </div>
  )
}
