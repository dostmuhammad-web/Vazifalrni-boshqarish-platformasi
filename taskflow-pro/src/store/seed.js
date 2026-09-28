import { DEFAULT_CATEGORIES, DEFAULT_TAGS } from './constants'
import { addDays, nowISO, toISODate, uid } from '../lib/utils'

const PROJECTS = [
  { name: 'Atlas Web Platform', color: '#6366f1', description: 'Marketing website rebuild with a new design system and CMS.' },
  { name: 'Mobile App v3', color: '#8b5cf6', description: 'React Native app rewrite with offline-first sync.' },
  { name: 'Q1 Campaign', color: '#ec4899', description: 'Multi-channel product launch campaign.' },
  { name: 'Internal Ops', color: '#10b981', description: 'Process automation and internal tooling.' },
  { name: 'Customer Research', color: '#f59e0b', description: 'Interviews, NPS analysis and usability testing.' },
]

const BLUEPRINTS = [
  ['Design onboarding flow', 'Redraw the 4-step onboarding with progressive disclosure and empty states.', 'Design', 'high', 1, ['Research', 'In progress'], ['ux', 'q1'], ['Wireframes', 'Prototype', 'Usability test']],
  ['Fix checkout time-out bug', 'Checkout fails after 90s on 3G. Add retry logic and telemetry.', 'Bug', 'urgent', -1, ['QA', 'In progress'], ['client', 'urgent'], ['Reproduce', 'Patch', 'Regression test']],
  ['Prepare weekly stakeholder report', 'Compile metrics, risks and next steps into the Monday report.', 'Operations', 'medium', 0, ['Ready'], ['internal'], ['Pull metrics', 'Write summary']],
  ['Audit landing page SEO', 'Review title tags, meta descriptions, and Core Web Vitals.', 'Marketing', 'medium', 2, ['Ready'], ['q1', 'internal'], ['Keyword research', 'Technical audit']],
  ['Build analytics tracking plan', 'Define events, properties and naming conventions for the new stack.', 'Development', 'high', 3, ['Ready'], ['backend', 'internal'], ['Event list', 'Naming doc']],
  ['Customer interview synthesis', 'Tag and synthesise 12 recorded interviews into themes.', 'Research', 'high', 4, ['Scheduled'], ['internal'], ['Tag transcripts', 'Affinity map']],
  ['API pagination refactor', 'Replace page-based pagination with cursor based pagination.', 'Development', 'high', 5, ['In progress'], ['backend'], ['Benchmarks', 'Migration script', 'Docs']],
  ['Social launch announcement', 'Schedule the launch announcement across 4 channels.', 'Marketing', 'low', 6, ['Ready'], ['q2', 'client'], ['Copy', 'Design assets']],
  ['Design system tokens', 'Consolidate colours, spacing and typography into CSS variables.', 'Design', 'medium', 8, ['Ready'], ['frontend', 'ux'], ['Colour scale', 'Type scale']],
  ['Set up release pipeline', 'CI with preview deploys and automated smoke tests.', 'Development', 'urgent', 1, ['In progress'], ['backend', 'urgent'], ['CI config', 'Preview env', 'Smoke suite']],
  ['Review Q1 budget', 'Reallocate remaining marketing budget toward paid search.', 'Operations', 'low', 9, ['Ready'], ['internal'], ['Spend report']],
  ['Polish empty states', 'Add illustrations and helpful copy for every empty view.', 'Design', 'low', 11, ['Ready'], ['ux', 'q1'], ['Copy', 'Illustrations']],
  ['Migrate support macros', 'Move 60 help centre macros into the new helpdesk.', 'Content', 'medium', 3, ['Ready'], ['client'], ['Export', 'Import', 'QA']],
  ['Accessibility pass on forms', 'Fix labels, focus order and contrast in all forms.', 'Development', 'high', 2, ['Review'], ['frontend', 'ux'], ['Keyboard nav', 'Screen reader test']],
  ['Quarterly roadmap workshop', 'Facilitate the workshop and publish the roadmap doc.', 'Meeting', 'medium', 5, ['Ready'], ['internal'], ['Agenda', 'Facilitate', 'Publish']],
  ['Optimise image CDN', 'Move to AVIF with responsive srcset generation.', 'Development', 'medium', 7, ['Ready'], ['backend', 'frontend'], ['Benchmark', 'Rollout']],
  ['Write onboarding email series', 'Five emails that activate new workspace admins.', 'Content', 'medium', 10, ['Ready'], ['q1'], ['Copy', 'Design', 'QA']],
  ['Mobile offline sync spike', 'Evaluate CRDT options for offline task editing.', 'Research', 'high', 13, ['Ready'], ['backend', 'q2'], ['Compare libs', 'Prototype', 'Report']],
  ['Fix timezone drift in calendar', 'Calendar view showed wrong day for UTC+5 users.', 'Bug', 'urgent', 0, ['Review'], ['urgent', 'client'], ['Root cause', 'Fix', 'Verify']],
  ['Brand asset library', 'Organise logos, illustrations and usage guidelines.', 'Design', 'low', 14, ['Ready'], ['ux', 'internal'], ['Folder', 'Guidelines']],
  ['Weekly data backup check', 'Verify automated backups and document the restore drill.', 'Operations', 'low', -3, ['Ready'], ['internal', 'backend'], ['Verify job', 'Restore test']],
  ['Dark mode rollout', 'Ship the dark theme across web and mobile.', 'Development', 'high', 12, ['In progress'], ['frontend', 'q1'], ['Tokens', 'Components', 'Docs']],
  ['Competitor feature matrix', 'Track the top 8 competitors and their new releases.', 'Research', 'low', 15, ['Ready'], ['q2', 'internal'], ['Collect', 'Compare']],
  ['Payment retry improvements', 'Smart retry schedule plus customer notification email.', 'Development', 'urgent', 1, ['In progress'], ['backend', 'client'], ['Schedule', 'Email', 'Dashboard']],
  ['NPS survey automation', 'Trigger the NPS survey 14 days after onboarding.', 'Development', 'medium', 6, ['Ready'], ['backend'], ['Trigger', 'Template']],
  ['Team onboarding checklist', 'Standard 30-60-90 checklist for new team members.', 'Operations', 'low', 18, ['Ready'], ['internal'], ['Draft', 'Review']],
  ['Dashboard performance fix', 'Chart rendering blocked interaction on large datasets.', 'Bug', 'high', 2, ['Done'], ['frontend', 'urgent'], ['Profile', 'Memoise', 'Ship']],
  ['Pricing page A/B test', 'Test annual-first vs monthly-first layout.', 'Marketing', 'medium', 8, ['Done'], ['q1'], ['Variant A', 'Variant B', 'Analysis']],
  ['Content audit blog', 'Refresh 24 posts and consolidate duplicates.', 'Content', 'low', 12, ['Done'], ['q1', 'internal'], ['Inventory', 'Rewrite']],
  ['Feature flags cleanup', 'Remove stale flags and document the naming scheme.', 'Development', 'medium', 16, ['Done'], ['backend', 'internal'], ['Inventory', 'Remove', 'Document']],
  ['Design tokens audit', 'Map every hard-coded colour to a semantic token.', 'Design', 'medium', 20, ['Done'], ['frontend', 'ux'], ['Scan', 'Map', 'Remove']],
  ['Load test release pipeline', 'Simulate 50 parallel preview deploys.', 'Operations', 'low', 24, ['Done'], ['internal', 'backend'], ['Script', 'Report']],
]

const STATUS_KEYS = {
  Ready: 'todo',
  Scheduled: 'todo',
  'In progress': 'progress',
  Review: 'review',
  Done: 'done',
}

export function buildSeedState() {
  const today = new Date()
  const projects = PROJECTS.map((p, i) => ({
    id: `prj_${i + 1}`,
    name: p.name,
    description: p.description,
    color: p.color,
    createdAt: addDays(today, -90 + i * 6).toISOString(),
    archived: false,
  }))

  const tasks = BLUEPRINTS.map((bp, index) => {
    const [title, description, category, priority, dueOffset, statusKeys, tags, subs] = bp
    const status = STATUS_KEYS[statusKeys[0]] || 'todo'
    const createdOffset = -(35 - (index % 34))
    const due = addDays(today, dueOffset)
    const createdAt = addDays(today, createdOffset)
    const completedAt = status === 'done' ? addDays(createdAt, Math.min(-createdOffset - 1, 20)) : null
    return {
      id: `tsk_seed_${index + 1}`,
      title,
      description,
      status,
      priority,
      category,
      projectId: projects[index % projects.length].id,
      dueDate: toISODate(due),
      createdAt: createdAt.toISOString(),
      updatedAt: completedAt ? completedAt.toISOString() : createdAt.toISOString(),
      completedAt: completedAt ? completedAt.toISOString() : null,
      tags,
      starred: index % 9 === 0,
      estimate: 2 + ((index * 3) % 12),
      assignee: 'Me',
      order: index,
      archived: false,
      notified: { due: false, overdue: false },
      activity: [
        {
          id: uid('act'),
          kind: 'created',
          text: 'Task created',
          at: createdAt.toISOString(),
        },
      ],
      subtasks: subs.map((s, i) => ({
        id: uid('sub'),
        title: s,
        done: status === 'done' ? true : i === 0 && index % 3 === 0,
      })),
    }
  })

  const notifications = [
    {
      id: uid('ntf'),
      type: 'overdue',
      title: 'Task overdue',
      message: 'Fix checkout time-out bug is 1 day overdue.',
      taskId: 'tsk_seed_2',
      at: nowISO(),
      read: false,
    },
    {
      id: uid('ntf'),
      type: 'due',
      title: 'Due today',
      message: 'Prepare weekly stakeholder report is due today.',
      taskId: 'tsk_seed_3',
      at: nowISO(),
      read: false,
    },
    {
      id: uid('ntf'),
      type: 'status',
      title: 'Moved to Review',
      message: 'Accessibility pass on forms moved to Review.',
      taskId: 'tsk_seed_14',
      at: addDays(today, -1).toISOString(),
      read: true,
    },
    {
      id: uid('ntf'),
      type: 'done',
      title: 'Task completed',
      message: 'Dashboard performance fix was completed.',
      taskId: 'tsk_seed_27',
      at: addDays(today, -2).toISOString(),
      read: true,
    },
    {
      id: uid('ntf'),
      type: 'team',
      title: 'New team member',
      message: 'Dilnoza joined Internal Ops.',
      taskId: null,
      at: addDays(today, -3).toISOString(),
      read: true,
    },
  ]

  const settings = {
    theme: 'light',
    accent: '#6366f1',
    density: 'comfortable',
    weekStart: 1,
    pageSize: 10,
    defaultProject: projects[0].id,
    defaultPriority: 'medium',
    defaultStatus: 'todo',
    defaultDue: 'today',
    categories: DEFAULT_CATEGORIES,
    tags: DEFAULT_TAGS,
    showAvatars: true,
    animate: true,
    compactSidebar: false,
    notify: {
      taskCreated: false,
      taskCompleted: true,
      statusChanged: false,
      dueSoon: true,
      overdue: true,
      dailyDigest: false,
    },
    profile: {
      name: 'Aziz Karimov',
      email: 'aziz@taskflow.pro',
      role: 'Product Lead',
      timezone: 'Asia/Tashkent',
      weekGoal: 12,
    },
  }

  return { tasks, projects, notifications, settings }
}

export const EMPTY_SETTINGS = buildSeedState().settings
