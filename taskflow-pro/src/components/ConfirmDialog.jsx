import { Modal } from './ui'

export default function ConfirmDialog({ open, onClose, config }) {
  if (!config) return null
  const tone = config.tone || 'accent'
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xs"
      icon={tone === 'danger' ? 'alert' : 'info'}
      title={config.title || 'Are you sure?'}
      footer={
        <div className="modal__foot-right">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'btn btn--danger' : 'btn btn--primary'}
            onClick={() => {
              config.onConfirm?.()
              onClose()
            }}
          >
            {config.confirmLabel || 'Confirm'}
          </button>
        </div>
      }
    >
      <p className="confirm-text">{config.message}</p>
      {config.extra}
    </Modal>
  )
}
