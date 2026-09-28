import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { SectionTitle, SegmentedControl, EmptyState, ProgressBar } from '../components/ui'
import { AreaChart, BarChart, DonutChart, HBarList, RadialProgress } from '../components/Charts'
import { useApp } from '../store/context'
import { STATUS_LIST } from '../store/constants'
import {
  categoryDistribution,
  computeStats,
  dailyActivity,
  monthBuckets,
  priorityDistribution,
  projectStats,
  statusDistribution,
  weeklyProductivity,
} from '../lib/taskUtils'
import { cn, percent, toISODate } from '../lib/utils'

const RANGES = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
]

export default function Analytics() {
  const { tasks, projects, settings } = useApp()
  const [range, setRange] = useState('14')

  const days = Number(range)
  const stats = useMemo(() => computeStats(tasks), [tasks])
  const activity = useMemo(() => dailyActivity(tasks, days), [tasks, days])
  const weekly = useMemo(() => weeklyProductivity(tasks, 8, settings.weekStart), [tasks, settings.weekStart])
  const statusData = useMemo(() => statusDistribution(tasks), [tasks])
  const priorityData = useMemo(() => priorityDistribution(tasks), [tasks])
  const categoryData = useMemo(() => categoryDistribution(tasks, settings.categories || []), [tasks, settings.categories])
  const pStats = useMemo(() => projectStats(tasks, projects).filter((p) => p.total > 0), [tasks, projects])
  const months = useMemo(() => monthBuckets(tasks), [tasks])

  const onTime = useMemo(() => {
    const done = tasks.filter((t) => t.status === 'done' && t.completedAt && t.dueDate)
    if (!done.length) return 100
    const on = done.filter((t) => toISODate(t.completedAt) <= t.dueDate).length
    return percent(on, done.length)
  }, [tasks])

  const avgDays = useMemo(() => {
    const done = tasks.filter((t) => t.completedAt)
    if (!done.length) return 0
    const total = done.reduce((sum, t) => sum + (new Date(t.completedAt) - new Date(t.createdAt)) / 86400000, 0)
    return (total / done.length).toFixed(1)
  }, [tasks])

  const weekday = useMemo(() => {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return names.map((name, index) => ({
      id: name,
      label: name,
      value: tasks.filter((t) => t.completedAt && new Date(t.completedAt).getDay() === index).length,
    }))
  }, [tasks])

  const totalCreated = activity.reduce((s, d) => s + d.created, 0)
  const totalCompleted = activity.reduce((s, d) => s + d.completed, 0)
  const bestDay = activity.reduce((best, d) => (d.completed > (best?.completed ?? -1) ? d : best), null)

  return (
    <div className="page analytics-page">
      <div className="page-toolbar">
        <div>
          <h2 className="page-title">Analytics</h2>
          <p className="page-sub">Track completion, workload and productivity trends</p>
        </div>
        <div className="page-toolbar__right">
          <SegmentedControl value={range} onChange={setRange} options={RANGES} size="sm" />
        </div>
      </div>

      <section className="kpi-row">
        <div className="kpi card">
          <span className="kpi__icon kpi__icon--accent">
            <Icon name="trending-up" size={18} />
          </span>
          <div>
            <strong>{totalCompleted}</strong>
            <span>Completed in {days}d</span>
          </div>
        </div>
        <div className="kpi card">
          <span className="kpi__icon kpi__icon--info">
            <Icon name="layers" size={18} />
          </span>
          <div>
            <strong>{totalCreated}</strong>
            <span>Created in {days}d</span>
          </div>
        </div>
        <div className="kpi card">
          <span className="kpi__icon kpi__icon--success">
            <Icon name="target" size={18} />
          </span>
          <div>
            <strong>{onTime}%</strong>
            <span>Completed on time</span>
          </div>
        </div>
        <div className="kpi card">
          <span className="kpi__icon kpi__icon--warning">
            <Icon name="clock" size={18} />
          </span>
          <div>
            <strong>{avgDays}d</strong>
            <span>Avg. time to complete</span>
          </div>
        </div>
        <div className="kpi card kpi--radial">
          <RadialProgress value={stats.completionRate} size={72} thickness={8} label="Done" />
          <div>
            <strong>{stats.completionRate}%</strong>
            <span>All-time completion</span>
          </div>
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <SectionTitle
            title="Completed vs pending"
            subtitle={`Last ${days} days — created and completed tasks`}
            icon="chart"
          />
          <AreaChart
            data={activity}
            series={[
              { key: 'completed', label: 'Completed', color: 'var(--success)' },
              { key: 'created', label: 'Created', color: 'var(--accent)' },
            ]}
            height={280}
          />
          <div className="card__footer">
            <span>
              <Icon name="award" size={14} /> Best day: {bestDay ? `${bestDay.completed} tasks` : '—'}
            </span>
            <span>
              <Icon name="zap" size={14} /> Net: {totalCompleted - totalCreated >= 0 ? '+' : ''}
              {totalCompleted - totalCreated}
            </span>
          </div>
        </section>

        <section className="card">
          <SectionTitle title="Task status" subtitle="Pending vs completed split" icon="columns" />
          <DonutChart
            data={[
              { id: 'done', label: 'Completed', value: statusData[3].value, color: 'var(--success)' },
              { id: 'progress', label: 'In Progress', value: statusData[1].value, color: 'var(--info)' },
              { id: 'review', label: 'Review', value: statusData[2].value, color: 'var(--warning)' },
              { id: 'todo', label: 'Todo', value: statusData[0].value, color: 'var(--muted)' },
            ]}
            size={200}
            thickness={22}
            centerTitle="Total"
          />
        </section>
      </div>

      <div className="grid-2">
        <section className="card">
          <SectionTitle title="Priority distribution" subtitle="How work is prioritised" icon="flag" />
          <BarChart data={priorityData.map((p) => ({ id: p.id, label: p.label, value: p.value, color: p.color }))} height={240} />
        </section>

        <section className="card">
          <SectionTitle title="Daily throughput" subtitle={`Tasks completed per day · last ${days} days`} icon="bar-chart" />
          <BarChart data={activity.map((d) => ({ id: d.date, label: d.label, value: d.completed }))} height={240} showValues={days <= 14} />
        </section>
      </div>

      <div className="grid-2">
        <section className="card">
          <SectionTitle title="Weekly productivity" subtitle="Last 8 weeks — created vs completed" icon="award" />
          <div className="table-wrap">
            <table className="table table--compact">
              <thead>
                <tr>
                  <th>Week of</th>
                  <th>Created</th>
                  <th>Completed</th>
                  <th>Net</th>
                  <th>Output</th>
                </tr>
              </thead>
              <tbody>
                {[...weekly].reverse().map((w) => {
                  const net = w.completed - w.created
                  const max = Math.max(1, ...weekly.map((x) => Math.max(x.created, x.completed)))
                  return (
                    <tr key={w.label}>
                      <td>{new Date(w.label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td>{w.created}</td>
                      <td className="text-success">{w.completed}</td>
                      <td className={cn(net >= 0 ? 'text-success' : 'text-danger')}>
                        {net >= 0 ? '+' : ''}
                        {net}
                      </td>
                      <td>
                        <ProgressBar value={percent(w.completed, max)} height={5} tone={net >= 0 ? 'success' : 'warning'} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <SectionTitle title="Categories" subtitle="Where your effort goes" icon="layers" />
          {categoryData.length === 0 ? (
            <EmptyState icon="layers" title="No categories yet" description="Assign categories to tasks to see the split." />
          ) : (
            <HBarList data={categoryData} />
          )}
        </section>
      </div>

      <div className="grid-2">
        <section className="card">
          <SectionTitle title="Project progress" subtitle="Completion rate per project" icon="folder" />
          <HBarList
            data={pStats.map((p) => ({
              id: p.id,
              label: p.name,
              value: p.percent,
              color: p.color,
              sub: `${p.completed}/${p.total} tasks completed${p.overdue ? ` · ${p.overdue} overdue` : ''}`,
            }))}
            unit="%"
            max={100}
          />
        </section>

        <section className="card">
          <SectionTitle title="Completion by weekday" subtitle="When you finish the most work" icon="calendar" />
          <BarChart data={weekday} height={240} />
        </section>
      </div>

      {months.length > 0 && (
        <section className="card">
          <SectionTitle title="Monthly throughput" subtitle="Tasks completed per month" icon="database" />
          <HBarList data={months.map((m) => ({ id: m.label, label: m.label, value: m.value }))} />
        </section>
      )}

      <section className="card analytics-summary">
        <SectionTitle title="Summary" subtitle="Auto-generated insights" icon="sparkle" />
        <ul className="insight-list">
          <li>
            <Icon name="check-circle" size={16} />
            <span>
              You completed <strong>{stats.completed}</strong> of <strong>{stats.total}</strong> tasks ({stats.completionRate}% completion rate).
            </span>
          </li>
          <li>
            <Icon name="flag" size={16} />
            <span>
              <strong>{stats.urgent}</strong> urgent tasks are still open and <strong>{stats.review}</strong> tasks are waiting for review.
            </span>
          </li>
          <li>
            <Icon name="alert" size={16} />
            <span>
              {stats.overdue === 0
                ? 'No overdue tasks — your schedule is under control.'
                : `${stats.overdue} task(s) are overdue. Consider rescheduling or reassigning them.`}
            </span>
          </li>
          <li>
            <Icon name="trend-up" size={16} />
            <span>
              {STATUS_LIST[1].label}: {stats.inProgress} · {STATUS_LIST[2].label}: {stats.review} · Completed today: {stats.completedToday}
            </span>
          </li>
        </ul>
      </section>
    </div>
  )
}
