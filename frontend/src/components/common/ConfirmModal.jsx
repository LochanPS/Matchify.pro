import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Spinner from '../Spinner';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-gradient-to-r from-red-500 to-rose-600',
  icon = <ExclamationTriangleIcon style={{ width: 28, height: 28, color: '#F87171' }} />,
  loading = false
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'linear-gradient(145deg, #0C1220, #0A0F1A)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, maxWidth: 420, width: '100%', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: 28 }}>
          {/* Icon + Title */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              {icon}
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{title}</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{message}</p>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1, padding: '12px 16px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
                borderRadius: 12, fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1, transition: 'all 0.15s'
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={confirmButtonClass}
              style={{
                flex: 1, padding: '12px 16px',
                color: '#fff', borderRadius: 12, border: 'none',
                fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.15s', boxShadow: '0 4px 14px rgba(239,68,68,0.3)'
              }}
            >
              {loading ? (<><Spinner size="sm" /> Processing…</>) : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
