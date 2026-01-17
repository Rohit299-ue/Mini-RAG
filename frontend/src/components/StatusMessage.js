import React, { useEffect } from 'react';

function StatusMessage({ type, message, onClose, autoClose = true, duration = 5000 }) {
  // Auto-close after duration
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`status-message status-${type}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>{getIcon()}</span>
        <span style={{ flex: 1 }}>{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              color: 'inherit',
              opacity: 0.7,
              padding: '0',
              lineHeight: 1
            }}
            title="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default StatusMessage;