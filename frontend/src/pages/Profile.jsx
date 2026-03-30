import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>
        {title}
      </h2>
      <div className="card" style={{ padding: '24px' }}>
        {children}
      </div>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
    }}>
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '32px', maxWidth: '400px', width: '90%'
      }}>
        <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '16px' }}>⚠️</div>
        <p style={{ color: 'var(--text-1)', textAlign: 'center', marginBottom: '8px', fontWeight: 600, fontSize: '1rem' }}>
          Are you sure?
        </p>
        <p style={{ color: 'var(--text-2)', textAlign: 'center', marginBottom: '24px', fontSize: '0.9rem' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm}>Yes, proceed</button>
        </div>
      </div>
    </div>
  );
}

export default function Profile({ token, onUnauthorized, onLogout, setExpenses, setTotalRecived, setIncomeList }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || '₹');
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    fetch('http://localhost:5000/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) { onUnauthorized(); return null; }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        setEmail(data.email);
        setJoinedDate(new Date(data._id.toString().substring(0, 8).padEnd(24, '0')).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }));
      });
  }, [token, onUnauthorized]);

  async function changePassword() {
    const errors = {};
    if (!currentPassword || currentPassword.trim() === '') {
      errors.currentPassword = 'Current password is required';
    }
    if (!newPassword || newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (currentPassword === newPassword) {
      errors.newPassword = 'New password must be different';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      setPasswordMsg('');
      setPasswordError(false);
      return;
    }
    setPasswordErrors({});
    setPasswordMsg('');
    setPasswordError(false);
    const res = await fetch('http://localhost:5000/profile/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) { setPasswordMsg(data.error); setPasswordError(true); return; }
    setPasswordMsg('Password updated successfully!');
    setPasswordError(false);
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setPasswordErrors({});
  }

  async function handleReset(type) {
    const actions = {
      expenses: { url: '/expenses/all', method: 'DELETE', msg: 'This will permanently delete all your expenses.' },
      income: { url: '/received/reset', method: 'PUT', msg: 'This will delete all your income entries and reset total to Rs.0.' },
      upcoming: { url: '/upcoming/all', method: 'DELETE', msg: 'This will delete all your upcoming payments.' },
      goals: { url: '/goals/all', method: 'DELETE', msg: 'This will permanently delete all your goals.' },
      all: { url: null, msg: 'This will delete ALL your data — expenses, income and upcoming payments. This cannot be undone.' },
      account: { url: '/account', method: 'DELETE', msg: 'This will permanently delete your account and all data. This cannot be undone.' }
    };

    setConfirm({
      message: actions[type].msg,
      onConfirm: async () => {
        setConfirm(null);
        if (type === 'all') {
          await Promise.all([
            fetch('http://localhost:5000/expenses/all', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
            fetch('http://localhost:5000/received/reset', { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }),
            fetch('http://localhost:5000/upcoming/all', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
            fetch('http://localhost:5000/goals/all', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
            fetch('http://localhost:5000/income/all', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
          ]);
          setExpenses([]);
          setTotalRecived(0);
          setIncomeList([]);
          setSuccessMsg('All data has been reset successfully!');
          return;
        }
        const res = await fetch(`http://localhost:5000${actions[type].url}`, {
          method: actions[type].method,
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.status === 401) { onUnauthorized(); return; }
        if (type === 'expenses') { setExpenses([]); }
        if (type === 'income') { setTotalRecived(0); setIncomeList([]); }
        if (type === 'account') { onLogout(); return; }
        setSuccessMsg(`${type.charAt(0).toUpperCase() + type.slice(1)} reset successfully!`);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    });
  }

  const dangerButtons = [
    { label: '🗑️ Clear All Expenses', type: 'expenses', color: '#f97316' },
    { label: '💰 Reset Income to ₹0', type: 'income', color: '#f97316' },
    { label: '📅 Clear Upcoming Payments', type: 'upcoming', color: '#f97316' },
    { label: '🎯 Clear All Goals', type: 'goals', color: '#f97316' },
    { label: '⚠️ Reset Everything', type: 'all', color: '#ef4444' },
    { label: '🔴 Delete My Account', type: 'account', color: '#ef4444' },
  ];

  return (
    <div>
      {confirm && <ConfirmDialog message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}

      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 6px' }}>Profile</h1>
      <p style={{ color: 'var(--text-2)', marginBottom: '32px' }}>Manage your account and preferences</p>

      {successMsg && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: '#22c55e22', border: '1px solid #22c55e55', color: '#22c55e', marginBottom: '24px', fontWeight: 600 }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Account Info */}
      <Section title="Account Info">
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>Email</span>
            <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <span style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>Member since</span>
            <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{joinedDate}</span>
          </div>
        </div>
      </Section>

      {/* Change Password */}
      <Section title="Change Password">
        <div style={{ display: 'grid', gap: '12px', maxWidth: '400px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <input type="password" placeholder="Current password" value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); setPasswordErrors(prev => ({ ...prev, currentPassword: '' })); }} />
            {passwordErrors.currentPassword && <span className="field-error">{passwordErrors.currentPassword}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <input type="password" placeholder="New password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setPasswordErrors(prev => ({ ...prev, newPassword: '' })); }} />
            {passwordErrors.newPassword && <span className="field-error">{passwordErrors.newPassword}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setPasswordErrors(prev => ({ ...prev, confirmPassword: '' })); }} />
            {passwordErrors.confirmPassword && <span className="field-error">{passwordErrors.confirmPassword}</span>}
          </div>
          {passwordMsg && (
            <p style={{ fontSize: '0.85rem', color: passwordError ? '#ef4444' : '#22c55e', margin: 0 }}>{passwordMsg}</p>
          )}
          <button className="btn btn-primary" style={{ width: 'fit-content' }} onClick={changePassword}>
            Update Password
          </button>
        </div>
      </Section>

      {/* Preferences */}
      <Section title="Preferences">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <div>
            <span style={{ color: 'var(--text-1)', fontWeight: 600, display: 'block' }}>Currency</span>
            <span style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>Choose your preferred currency symbol</span>
          </div>
          <select
            value={currency}
            onChange={e => {
              setCurrency(e.target.value);
              localStorage.setItem('currency', e.target.value);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--surface-2)',
              color: 'var(--text-1)',
              fontSize: '0.9rem',
              cursor: 'pointer',
              minWidth: '120px'
            }}
          >
            <option value="₹">₹ Indian Rupee</option>
            <option value="$">$ US Dollar</option>
            <option value="€">€ Euro</option>
            <option value="£">£ British Pound</option>
            <option value="¥">¥ Japanese Yen</option>
          </select>
        </div>
      </Section>

      {/* Session */}
      <Section title="Session">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: 'var(--text-1)', fontWeight: 600, display: 'block' }}>Logout</span>
            <span style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>Sign out of your account</span>
          </div>
          <button
            className="btn btn-secondary"
            onClick={onLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            ↪ Logout
          </button>
        </div>
      </Section>

      {/* Danger Zone */}
      <Section title="⚠️ Danger Zone">
        <div style={{ display: 'grid', gap: '12px' }}>
          {dangerButtons.map(({ label, type, color }) => (
            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: `1px solid ${color}33`, background: `${color}08` }}>
              <span style={{ color: 'var(--text-1)', fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>
              <button
                onClick={() => handleReset(type)}
                style={{ padding: '6px 16px', borderRadius: 'var(--radius-md)', border: `1px solid ${color}`, background: 'transparent', color, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {type === 'account' ? 'Delete' : 'Reset'}
              </button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
