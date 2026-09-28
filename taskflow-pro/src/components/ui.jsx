import { useEffect } from 'react'
import Icon from './Icon'
import { cn } from '../lib/utils'

export function Badge({ tone = 'slate', children, className, icon, dot }) {
  return (
    <span className={cn('badge', `badge--${tone}`, className)}>
      {dot && <i className="badge__dot" />}
      {icon && <Icon name={icon} size={12} strokeWidth={2} />}
      {children}
    </span>
  )
}

export function PriorityBadge({ priority, size = 'md' }) {
  return (
    <span className={cn('prio', `prio--${priority}`, `prio--${size}`)}>
      <i className="prio__bars" aria-hidden="true">
        <i /><i /><i />
      </i>
      {size !== 'sm' && <span>{priority}</span>}
    </span>
  )
}

export function Avatar({ name = 'Me', size = 32, color }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const palette = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#a855f7', '#f43f5e']
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: color || palette[hash % palette.length], fontSize: size * 0.38 }}
      title={name}
    >
      {initials}
    </span>
  )
}

export function ProgressBar({ value, tone = 'accent', height = 6, showLabel = false }) {
  return (
    <div className="progress" style={{ '--bar-size': `${height}px` }}>
      <div className={cn('progress__fill', `progress__fill--${tone}`)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      {showLabel && <span className="progress__label">{value}%</span>}
    </div>
  )
}

export function EmptyState({ icon = 'inbox', title, description, action }) {
  return (
    <div className="empty">
      <div className="empty__icon">
        <Icon name={icon} size={26} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}

export function SectionTitle({ title, subtitle, icon, actions }) {
  return (
    <div className="section-title">
      <div className="section-title__main">
        {icon && (
          <span className="section-title__icon">
            <Icon name={icon} size={16} />
          </span>
        )}
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="section-title__actions">{actions}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md', icon }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal__backdrop" onClick={onClose} />
      <div className={cn('modal', `modal--${size}`)}>
        <header className="modal__head">
          <div className="modal__title">
            {icon && (
              <span className="modal__icon">
                <Icon name={icon} size={18} />
              </span>
            )}
            <div>
              <h2>{title}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <Icon name="x" size={18} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>
  )
}

export function Field({ label, hint, children, required, error }) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {required && <i className="field__req">*</i>}
      </span>
      {children}
      {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  )
}

export function SegmentedControl({ value, onChange, options, size = 'md' }) {
  return (
    <div className={cn('segmented', `segmented--${size}`)} role="tablist">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          className={cn('segmented__btn', value === opt.value && 'is-active')}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon && <Icon name={opt.icon} size={14} />}
          {opt.label}
          {opt.count !== undefined && <span className="segmented__count">{opt.count}</span>}
        </button>
      ))}
    </div>
  )
}
