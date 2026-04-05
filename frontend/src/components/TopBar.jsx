import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon, CheckCircle } from 'lucide-react';

export default function TopBar({ token, alerts, theme, toggleTheme }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function getLabel(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: '#ef4444' };
    if (diff === 0) return { label: 'Due today', color: '#f97316' };
    return { label: `Due in ${diff}d`, color: '#f97316' };
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 220,
      right: 0,
      height: '56px',
      background: 'var(--surface-1)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 24px',
      paddingLeft: window.innerWidth <= 768 ? '56px' : undefined,
      zIndex: 99
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: 'var(--surface-2)',
            color: 'var(--text-1)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {theme === 'dark' ? <><Sun size={14} /> Light</> : <><Moon size={14} /> Dark</>}
        </button>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
        {/* Bell button */}
        <button
          onClick={() => setOpen(p => !p)}
          style={{
            position: 'relative',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Bell size={20} />
          {alerts.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '0.65rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {alerts.length}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {open && (
          <div style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            width: '300px',
            background: 'var(--surface-1)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            zIndex: 200
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              fontWeight: 700,
              color: 'var(--text-1)',
              fontSize: '0.9rem'
            }}>
              Payment Alerts
            </div>

            {alerts.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={32} />
                <span>No urgent payments!</span>
              </div>
            ) : (
              <>
                {alerts.map(p => {
                  const { label, color } = getLabel(p.dueDate);
                  return (
                    <div key={p._id} style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderLeft: `3px solid ${color}`
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: '0.9rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color, marginTop: '2px' }}>{label}</div>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>₹{p.amount}</span>
                    </div>
                  );
                })}
                <div
                  onClick={() => { navigate('/upcoming'); setOpen(false); }}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'center',
                    color: 'var(--accent)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderTop: '1px solid var(--border)'
                  }}
                >
                  View all upcoming payments →
                </div>
              </>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
