import { useCallback, useEffect, useState } from 'react'
import { AppProvider } from './store/AppProvider'
import { useApp } from './store/context'
import { NAV_ITEMS } from './store/constants'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import ModalsHost from './components/ModalsHost'
import Toasts from './components/Toasts'
import CommandPalette from './components/CommandPalette'
import Dashboard from './pages/Dashboard'
import MyTasks from './pages/MyTasks'
import Projects from './pages/Projects'
import Kanban from './pages/Kanban'
import CalendarPage from './pages/CalendarPage'
import Analytics from './pages/Analytics'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/pages.css'

const PAGES = {
  dashboard: Dashboard,
  tasks: MyTasks,
  projects: Projects,
  kanban: Kanban,
  calendar: CalendarPage,
  analytics: Analytics,
  notifications: Notifications,
  settings: Settings,
}

function useHashRoute() {
  const read = () => {
    const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0]
    return NAV_ITEMS.some((n) => n.id === raw) ? raw : 'dashboard'
  }
  const [route, setRoute] = useState(read)

  useEffect(() => {
    const onHash = () => setRoute(read())
    window.addEventListener('hashchange', onHash)
    if (!window.location.hash) window.location.hash = '#/dashboard'
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = useCallback((next) => {
    window.location.hash = `#/${next}`
    setRoute(next)
  }, [])

  return [route, navigate]
}

function Shell() {
  const { sidebarOpen, setSidebarOpen, openTaskModal, setPaletteOpen } = useApp()
  const [route, navigate] = useHashRoute()
  const Page = PAGES[route] || Dashboard

  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      if (typing) return
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        openTaskModal()
      }
      if (e.key >= '1' && e.key <= '8' && !e.ctrlKey && !e.metaKey) {
        navigate(NAV_ITEMS[Number(e.key) - 1].id)
      }
      if (e.key === '/') {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openTaskModal, navigate, setPaletteOpen])

  return (
    <div className={`shell ${sidebarOpen ? 'is-drawer-open' : ''}`}>
      <Sidebar route={route} navigate={navigate} />
      <div className="shell__backdrop" onClick={() => setSidebarOpen(false)} />
      <div className="shell__main">
        <Topbar route={route} navigate={navigate} />
        <main className="shell__content" key={route}>
          <Page navigate={navigate} />
        </main>
      </div>
      <ModalsHost />
      <Toasts />
      <CommandPalette navigate={navigate} />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
