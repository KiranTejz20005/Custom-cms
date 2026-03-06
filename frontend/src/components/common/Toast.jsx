import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const c = type === 'error'
        ? { bg: '#fef2f2', border: '#dc2626', text: '#b91c1c', icon: '⊘' }
        : { bg: '#f0fdf4', border: '#16a34a', text: '#15803d', icon: '✓' };

    return (
        <div style={{
            position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, display: 'flex', alignItems: 'center', gap: '10px',
            background: c.bg, borderLeft: `4px solid ${c.border}`, borderRadius: '8px',
            padding: '12px 20px', minWidth: '360px', maxWidth: '500px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
            <span style={{ color: c.border, fontWeight: '700' }}>{c.icon}</span>
            <span style={{ color: c.text, fontWeight: '500', fontSize: '14px', flex: 1 }}>{message}</span>
            <span onClick={onClose} style={{ cursor: 'pointer', color: c.text, fontWeight: '700' }}>×</span>
        </div>
    );
}
