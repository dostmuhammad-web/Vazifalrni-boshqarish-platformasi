import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { EmptyState, SegmentedControl } from '../components/ui'
import { useApp } from '../store/context'
import { cn, groupBy, relTime } from '../lib/utils'

const TYPE_META = {
  created: { icon: 'plus', tone: 'accent', label: 'Created' },
  status: { icon: 'columns', tone: 'info', label: 'Status' },
  done: { icon: 'check-circle', tone: 'success', label: 'Completed' },
  due: { icon: 'clock', tone: 'warning', label: 'Due' },
  overdue: { icon: 'alert', tone: 'danger', label: 'Overdue' },
  team: { icon: 'users', tone: 'violet', label: 'Team' },
}

export default function Notifications({ navigate }) {
  const { notifications, tasks, unreadCount, markNotificationRead, markAllRead, deleteNotification, clearNotifications, openConfirmModal, openTaskModal } =
    useApp()
  const [tab, setTab] = useState('all')

  const list = useMemo(() => {
    const base = tab === 'unread' ? notifications.filter((n) => !n.read) : notifications
    return base
  }, [notifications, tab])

  const grouped = useMemo(() => {
    const groups = groupBy(list, (n) => {
      const d = new Date(n.at)
      const today = new Date()
      if (d.toDateString() === today.toDateString()) return 'Today'
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
      if (d.getFullYear() === today.getFullYear()) return d.toLocaleDateString('en-US', { month: 'long' })
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    })
    return Object.entries(groups)
  }, [list])

  function openNotification(n) {
    markNotificationRead(n.id)
    if (n.taskId) {
      const task = tasks.find((t) => t.id === n.taskId)
      if (task) openTaskModal(task)
    }
  }

  return (
    <div className="page notif-page">
      <div className="page-toolbar">
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'all', label: 'All', count: notifications.length },
            { value: 'unread', label: 'Unread', count: unreadCount },
          ]}
        />
        <div className="page-toolbar__right">
          <button type="button" className="btn btn--ghost btn--sm" onClick={markAllRead} disabled={unreadCount === 0}>
            <Icon name="check" size={15} /> Mark all as read
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={notifications.length === 0}
            onClick={() =>
              openConfirmModal({
                title: 'Clear notifications?',
                message: 'All notifications will be removed from your inbox.',
                confirmLabel: 'Clear all',
                tone: 'danger',
                extra: (
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => clearNotifications(true)}>
                    Clear read only
                  </button>
                ),
                onConfirm: () => clearNotifications(false),
              })
            }
          >
            <Icon name="trash" size={15} /> Clear
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="bell"
            title="You are all caught up"
            description="Task updates, deadlines and reminders will appear here."
            action={
              <button type="button" className="btn btn--primary" onClick={() => navigate('tasks')}>
                <Icon name="list" size={16} /> Go to my tasks
              </button>
            }
          />
        </div>
      ) : list.length === 0 ? (
        <div className="card">
          <EmptyState icon="check-circle" title="No unread notifications" description="Everything has been read." />
        </div>
      ) : (
        <div className="notif-groups">
          {grouped.map(([label, items]) => (
            <section key={label} className="card notif-group">
              <header className="notif-group__head">
                <span>{label}</span>
                <em>{items.length}</em>
              </header>
              <ul>
                {items.map((n) => {
                  const meta = TYPE_META[n.type] || TYPE_META.status
                  return (
                    <li key={n.id} className={cn('notif-row', !n.read && 'is-unread')} onClick={() => openNotification(n)}>
                      <span className={cn('notif-row__icon', `notif-row__icon--${meta.tone}`)}>
                        <Icon name={meta.icon} size={16} />
                      </span>
                      <div className="notif-row__body">
                        <strong>{n.title}</strong>
                        <p>{n.message}</p>
                        <span className="notif-row__time">
                          <Icon name="clock" size={12} /> {relTime(n.at)}
                          {n.taskId && ' · opens the task'}
                        </span>
                      </div>
                      <div className="notif-row__actions" onClick={(e) => e.stopPropagation()}>
                        {!n.read && (
                          <button type="button" className="icon-btn icon-btn--sm" title="Mark as read" onClick={() => markNotificationRead(n.id)}>
                            <Icon name="check" size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="icon-btn icon-btn--sm"
                          title="Delete"
                          onClick={() => deleteNotification(n.id)}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                      {!n.read && <i className="notif-row__dot" />}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
