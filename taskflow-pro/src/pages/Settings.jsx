import { useRef, useState } from 'react'
import Icon from '../components/Icon'
import { Avatar, Field, SectionTitle, SegmentedControl } from '../components/ui'
import { useApp } from '../store/context'
import { PRIORITY_LIST, PROJECT_COLORS, STATUS_LIST } from '../store/constants'
import { computeStats } from '../lib/taskUtils'
import { cn, downloadJSON, readFileAsText } from '../lib/utils'

const TABS = [
  { value: 'profile', label: 'Profile', icon: 'user' },
  { value: 'appearance', label: 'Appearance', icon: 'palette' },
  { value: 'defaults', label: 'Task defaults', icon: 'sliders' },
  { value: 'notifications', label: 'Notifications', icon: 'bell' },
  { value: 'taxonomy', label: 'Categories & tags', icon: 'hash' },
  { value: 'data', label: 'Data', icon: 'database' },
]

const NOTIFY_OPTIONS = [
  { key: 'taskCreated', label: 'Task created', desc: 'Notify when a new task is added' },
  { key: 'taskCompleted', label: 'Task completed', desc: 'Notify when a task is marked done' },
  { key: 'statusChanged', label: 'Status changed', desc: 'Notify when a task moves between columns' },
  { key: 'dueSoon', label: 'Due today / tomorrow', desc: 'Remind before a deadline arrives' },
  { key: 'overdue', label: 'Overdue tasks', desc: 'Alert when a task passes its due date' },
  { key: 'dailyDigest', label: 'Daily digest', desc: 'A morning summary of your workload' },
]

export default function Settings() {
  const { state, settings, updateSettings, tasks, projects, resetDemoData, clearAllData, importData, replaceData, pushToast, openConfirmModal } = useApp()
  const [tab, setTab] = useState('profile')
  const [newCategory, setNewCategory] = useState('')
  const [newTag, setNewTag] = useState('')
  const fileRef = useRef(null)
  const restoreRef = useRef(null)
  const stats = computeStats(tasks)

  function exportData() {
    downloadJSON(`taskflow-backup-${new Date().toISOString().slice(0, 10)}.json`, {
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      projects,
      settings,
      notifications: state.notifications,
    })
    pushToast({ tone: 'success', title: 'Export complete', message: 'Your data was downloaded as JSON.' })
  }

  async function onImport(file) {
    try {
      const text = await readFileAsText(file)
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed.tasks)) throw new Error('Invalid file')
      importData(parsed)
      pushToast({ tone: 'success', title: 'Import complete', message: `Added ${parsed.tasks.length} task(s) from the backup.` })
    } catch {
      pushToast({ tone: 'danger', title: 'Import failed', message: 'The file is not a valid TaskFlow backup.' })
    }
  }

  return (
    <div className="page settings-page">
      <div className="page-toolbar">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="page-sub">Personalise TaskFlow and manage your data</p>
        </div>
        <div className="page-toolbar__right">
          <span className="saved-note">
            <Icon name="check-circle" size={14} /> Changes save automatically
          </span>
        </div>
      </div>

      <div className="settings-layout">
        <nav className="settings-nav">
          {TABS.map((t) => (
            <button key={t.value} type="button" className={cn('settings-nav__item', tab === t.value && 'is-active')} onClick={() => setTab(t.value)}>
              <Icon name={t.icon} size={16} />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {tab === 'profile' && (
            <section className="card">
              <SectionTitle title="Profile" subtitle="How you appear inside TaskFlow" icon="user" />
              <div className="profile-head">
                <Avatar name={settings.profile.name} size={64} />
                <div>
                  <strong>{settings.profile.name}</strong>
                  <span>{settings.profile.role}</span>
                </div>
              </div>
              <div className="grid-2">
                <Field label="Full name">
                  <input
                    className="input"
                    value={settings.profile.name}
                    onChange={(e) => updateSettings({ profile: { name: e.target.value } })}
                  />
                </Field>
                <Field label="Email">
                  <input
                    className="input"
                    type="email"
                    value={settings.profile.email}
                    onChange={(e) => updateSettings({ profile: { email: e.target.value } })}
                  />
                </Field>
                <Field label="Role">
                  <input
                    className="input"
                    value={settings.profile.role}
                    onChange={(e) => updateSettings({ profile: { role: e.target.value } })}
                  />
                </Field>
                <Field label="Weekly goal (tasks)">
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="200"
                    value={settings.profile.weekGoal}
                    onChange={(e) => updateSettings({ profile: { weekGoal: Number(e.target.value) || 1 } })}
                  />
                </Field>
                <Field label="Timezone">
                  <select
                    className="input"
                    value={settings.profile.timezone}
                    onChange={(e) => updateSettings({ profile: { timezone: e.target.value } })}
                  >
                    {['Asia/Tashkent', 'Asia/Almaty', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'UTC'].map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Week starts on">
                  <select
                    className="input"
                    value={String(settings.weekStart)}
                    onChange={(e) => updateSettings({ weekStart: Number(e.target.value) })}
                  >
                    <option value="1">Monday</option>
                    <option value="0">Sunday</option>
                  </select>
                </Field>
              </div>
            </section>
          )}

          {tab === 'appearance' && (
            <section className="card">
              <SectionTitle title="Appearance" subtitle="Theme, accent colour and density" icon="palette" />
              <Field label="Theme">
                <SegmentedControl
                  value={settings.theme}
                  onChange={(theme) => updateSettings({ theme })}
                  options={[
                    { value: 'light', label: 'Light', icon: 'sun' },
                    { value: 'dark', label: 'Dark', icon: 'moon' },
                  ]}
                />
              </Field>

              <Field label="Accent colour">
                <div className="color-grid">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={cn('color-dot', settings.accent === c && 'is-active')}
                      style={{ background: c }}
                      onClick={() => updateSettings({ accent: c })}
                      aria-label={`Accent ${c}`}
                    >
                      {settings.accent === c && <Icon name="check" size={13} strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Layout density">
                <SegmentedControl
                  value={settings.density}
                  onChange={(density) => updateSettings({ density })}
                  options={[
                    { value: 'comfortable', label: 'Comfortable' },
                    { value: 'compact', label: 'Compact' },
                  ]}
                />
              </Field>

              <div className="toggle-list">
                <Toggle
                  label="Collapse sidebar"
                  desc="Show icons only to maximise screen space"
                  checked={settings.compactSidebar}
                  onChange={(v) => updateSettings({ compactSidebar: v })}
                />
                <Toggle
                  label="Show avatars"
                  desc="Display assignee avatars on cards and tables"
                  checked={settings.showAvatars}
                  onChange={(v) => updateSettings({ showAvatars: v })}
                />
                <Toggle
                  label="Animations"
                  desc="Enable chart and card animations"
                  checked={settings.animate}
                  onChange={(v) => updateSettings({ animate: v })}
                />
              </div>
            </section>
          )}

          {tab === 'defaults' && (
            <section className="card">
              <SectionTitle title="Task defaults" subtitle="Pre-filled values for new tasks" icon="sliders" />
              <div className="grid-2">
                <Field label="Default project">
                  <select
                    className="input"
                    value={settings.defaultProject || ''}
                    onChange={(e) => updateSettings({ defaultProject: e.target.value })}
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Default status">
                  <select
                    className="input"
                    value={settings.defaultStatus}
                    onChange={(e) => updateSettings({ defaultStatus: e.target.value })}
                  >
                    {STATUS_LIST.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Default priority">
                  <select
                    className="input"
                    value={settings.defaultPriority}
                    onChange={(e) => updateSettings({ defaultPriority: e.target.value })}
                  >
                    {PRIORITY_LIST.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tasks per page">
                  <select
                    className="input"
                    value={String(settings.pageSize)}
                    onChange={(e) => updateSettings({ pageSize: Number(e.target.value) })}
                  >
                    {[5, 10, 15, 25, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <p className="hint-block">
                <Icon name="info" size={14} /> These values are applied automatically whenever you create a new task.
              </p>
            </section>
          )}

          {tab === 'notifications' && (
            <section className="card">
              <SectionTitle title="Notification preferences" subtitle="Choose which events create a notification" icon="bell" />
              <div className="toggle-list">
                {NOTIFY_OPTIONS.map((opt) => (
                  <Toggle
                    key={opt.key}
                    label={opt.label}
                    desc={opt.desc}
                    checked={Boolean(settings.notify[opt.key])}
                    onChange={(v) => updateSettings({ notify: { [opt.key]: v } })}
                  />
                ))}
              </div>
            </section>
          )}

          {tab === 'taxonomy' && (
            <>
              <section className="card">
                <SectionTitle title="Categories" subtitle="Used to group and filter tasks" icon="layers" />
                <div className="tag-editor">
                  {settings.categories.map((c) => (
                    <span key={c} className="tag tag--active">
                      {c}
                      <button
                        type="button"
                        onClick={() => updateSettings({ categories: settings.categories.filter((x) => x !== c) })}
                        aria-label={`Remove ${c}`}
                      >
                        <Icon name="x" size={11} strokeWidth={2.4} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="subtask-add">
                  <input
                    className="input"
                    placeholder="New category…"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newCategory.trim()) {
                        e.preventDefault()
                        if (!settings.categories.includes(newCategory.trim())) {
                          updateSettings({ categories: [...settings.categories, newCategory.trim()] })
                        }
                        setNewCategory('')
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => {
                      if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
                        updateSettings({ categories: [...settings.categories, newCategory.trim()] })
                      }
                      setNewCategory('')
                    }}
                  >
                    <Icon name="plus" size={15} />
                  </button>
                </div>
              </section>

              <section className="card">
                <SectionTitle title="Suggested tags" subtitle="Quick tags offered in the task form" icon="hash" />
                <div className="tag-editor">
                  {settings.tags.map((t) => (
                    <span key={t} className="tag tag--active">
                      #{t}
                      <button
                        type="button"
                        onClick={() => updateSettings({ tags: settings.tags.filter((x) => x !== t) })}
                        aria-label={`Remove ${t}`}
                      >
                        <Icon name="x" size={11} strokeWidth={2.4} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="subtask-add">
                  <input
                    className="input"
                    placeholder="New tag…"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTag.trim()) {
                        e.preventDefault()
                        const v = newTag.trim().replace(/^#/, '')
                        if (!settings.tags.includes(v)) updateSettings({ tags: [...settings.tags, v] })
                        setNewTag('')
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => {
                      const v = newTag.trim().replace(/^#/, '')
                      if (v && !settings.tags.includes(v)) updateSettings({ tags: [...settings.tags, v] })
                      setNewTag('')
                    }}
                  >
                    <Icon name="plus" size={15} />
                  </button>
                </div>
              </section>
            </>
          )}

          {tab === 'data' && (
            <>
              <section className="card">
                <SectionTitle title="Your data" subtitle="Everything is stored locally in your browser" icon="database" />
                <div className="data-stats">
                  <div>
                    <strong>{tasks.length}</strong>
                    <span>Tasks</span>
                  </div>
                  <div>
                    <strong>{projects.length}</strong>
                    <span>Projects</span>
                  </div>
                  <div>
                    <strong>{state.notifications.length}</strong>
                    <span>Notifications</span>
                  </div>
                  <div>
                    <strong>{stats.completionRate}%</strong>
                    <span>Completion</span>
                  </div>
                </div>
                <p className="hint-block">
                  <Icon name="info" size={14} /> Data lives in <code>localStorage</code> under the key <code>taskflow-pro:v1</code>.
                </p>
                <div className="data-actions">
                  <button type="button" className="btn btn--primary" onClick={exportData}>
                    <Icon name="download" size={16} /> Export JSON
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
                    <Icon name="upload" size={16} /> Import JSON
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/json"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) onImport(file)
                      e.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() =>
                      openConfirmModal({
                        title: 'Load demo data?',
                        message: 'This replaces all current tasks and projects with the sample workspace.',
                        confirmLabel: 'Load demo data',
                        onConfirm: () => {
                          resetDemoData()
                          pushToast({ tone: 'success', title: 'Demo data loaded', message: 'Sample workspace restored.' })
                        },
                      })
                    }
                  >
                    <Icon name="refresh" size={16} /> Reset demo data
                  </button>
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() =>
                      openConfirmModal({
                        title: 'Delete everything?',
                        message: 'All tasks, projects and notifications will be permanently removed.',
                        confirmLabel: 'Delete all data',
                        tone: 'danger',
                        onConfirm: () => clearAllData(),
                      })
                    }
                  >
                    <Icon name="trash" size={16} /> Clear all data
                  </button>
                </div>
              </section>

              <section className="card">
                <SectionTitle title="Import or restore" subtitle="Replace the workspace with a backup file" icon="upload" />
                <p className="hint-block">
                  Export a backup before switching devices. Restoring a file replaces the current workspace.
                </p>
                <div className="data-actions">
                  <button type="button" className="btn btn--ghost" onClick={() => restoreRef.current?.click()}>
                    <Icon name="rotate" size={16} /> Restore from backup
                  </button>
                  <input
                    ref={restoreRef}
                    type="file"
                    accept="application/json"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      if (!file) return
                      try {
                        const parsed = JSON.parse(await readFileAsText(file))
                        if (!Array.isArray(parsed.tasks)) throw new Error('invalid')
                        replaceData({ tasks: parsed.tasks, projects: parsed.projects || [], notifications: parsed.notifications || [] })
                        pushToast({ tone: 'success', title: 'Workspace restored', message: `${parsed.tasks.length} task(s) loaded.` })
                      } catch {
                        pushToast({ tone: 'danger', title: 'Restore failed', message: 'The file is not a valid TaskFlow backup.' })
                      }
                    }}
                  />
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <button type="button" className={cn('toggle', checked && 'is-on')} onClick={() => onChange(!checked)}>
      <span className="toggle__track">
        <i />
      </span>
      <span className="toggle__text">
        <strong>{label}</strong>
        <em>{desc}</em>
      </span>
    </button>
  )
}
