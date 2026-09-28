import { useRef, useState } from 'react'
import Icon from './Icon'
import { Avatar } from './ui'
import { FilterPopover } from './FilterBar'
import { useApp } from '../store/context'
import { NAV_ITEMS } from '../store/constants'
import { useClickOutside } from '../hooks/useClickOutside'
import { cn, relTime } from '../lib/utils'

export default function Topbar({ route, navigate }) {
  const { settings, updateSettings, filters, setQuery, unreadCount, notifications, markAllRead, openTaskModal, setSidebarOpen, setPaletteOpen } =
    useApp()
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef(null)
  useClickOutside(bellRef, () => setBellOpen(false), bellOpen)

  const page = NAV_ITEMS.find((n) => n.id === route) || NAV_ITEMS[0]
  const isDark = settings.theme === 'dark'
  const recent = notifications.slice(0, 6)

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button type="button" className="icon-btn topbar__burger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <Icon name="menu" size={20} />
        </button>
        <div className="topbar__title">
          <h1>{page.label}</h1>
          <p>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="topbar__search">
        <Icon name="search" size={17} />
        <input
          value={filters.query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks, projects, tags…"
          aria-label="Search"
        />
        {filters.query ? (
          <button type="button" className="topbar__search-clear" onClick={() => setQuery('')} aria-label="Clear search">
            <Icon name="x" size={14} />
          </button>
        ) : (
          <kbd onClick={() => setPaletteOpen(true)}>Ctrl K</kbd>
        )}
      </div>

      <div className="topbar__right">
        <FilterPopover />
        <button
          type="button"
          className="icon-btn"
          onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          <Icon name={isDark ? 'sun' : 'moon'} size={18} />
        </button>

        <div className="menu" ref={bellRef}>
          <button
            type="button"
            className="icon-btn topbar__bell"
            onClick={() => setBellOpen((v) => !v)}
            title="Notifications"
          >
            <Icon name="bell" size={18} />
            {unreadCount > 0 && <em className="topbar__bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</em>}
          </button>
          {bellOpen && (
            <div className="menu__pop menu__pop--wide menu__pop--right">
              <div className="notif-pop__head">
                <strong>Notifications</strong>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    markAllRead()
                    navigate('notifications')
                  }}
                >
                  Mark all read
                </button>
              </div>
              <ul className="notif-pop__list">
                {recent.map((n) => (
                  <li key={n.id} className={cn(!n.read && 'is-unread')}>
                    <span className={`notif-dot notif-dot--${n.type}`} />
                    <div>
                      <strong>{n.title}</strong>
                      <p>{n.message}</p>
                      <em>{relTime(n.at)}</em>
                    </div>
                  </li>
                ))}
                {recent.length === 0 && <li className="notif-pop__empty">No notifications yet</li>}
              </ul>
              <button
                type="button"
                className="notif-pop__foot"
                onClick={() => {
                  setBellOpen(false)
                  navigate('notifications')
                }}
              >
                View all notifications
                <Icon name="arrow-right" size={15} />
              </button>
            </div>
          )}
        </div>

        <button type="button" className="btn btn--primary topbar__cta" onClick={() => openTaskModal()}>
          <Icon name="plus" size={16} strokeWidth={2.4} />
          New task
        </button>

        <button
          type="button"
          className="topbar__avatar"
          onClick={() => navigate('settings')}
          title="Profile & settings"
        >
          <Avatar name={settings.profile.name} size={32} />
        </button>
      </div>
    </header>
  )
}
