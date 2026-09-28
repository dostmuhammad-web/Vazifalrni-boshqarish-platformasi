import Icon from './Icon'
import { useApp } from '../store/context'
import { cn } from '../lib/utils'

const TONE_ICON = {
  success: 'check-circle',
  danger: 'trash',
  info: 'info',
  warn: 'alert',
}

export default function Toasts() {
  const { toasts, dismissToast } = useApp()
  if (!toasts.length) return null

  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={cn('toast', `toast--${t.tone}`)}>
          <span className="toast__icon">
            <Icon name={TONE_ICON[t.tone] || 'check-circle'} size={16} strokeWidth={2.2} />
          </span>
          <div className="toast__body">
            {t.title && <strong>{t.title}</strong>}
            {t.message && <p>{t.message}</p>}
          </div>
          {t.action && (
            <button
              type="button"
              className="toast__action"
              onClick={() => {
                t.action.onClick()
                dismissToast(t.id)
              }}
            >
              {t.action.label}
            </button>
          )}
          <button type="button" className="toast__close" onClick={() => dismissToast(t.id)} aria-label="Dismiss">
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
