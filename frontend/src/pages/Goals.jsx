import { useState, useEffect } from 'react';

const GOAL_CATEGORIES = ['Travel', 'Electronics', 'Emergency', 'Education', 'Health', 'Other'];

const CATEGORY_COLORS = {
  Travel: '#3b82f6',
  Electronics: '#a855f7',
  Emergency: '#ef4444',
  Education: '#f97316',
  Health: '#22c55e',
  Other: '#6b7280'
};

function ProgressBar({ percent, color }) {
  const barColor = percent >= 75 ? '#22c55e' : percent >= 25 ? '#f97316' : '#ef4444';
  return (
    <div style={{ width: '100%', height: '8px', background: 'var(--border)', borderRadius: '999px', overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${Math.min(percent, 100)}%`,
        background: barColor,
        borderRadius: '999px',
        transition: 'width 0.5s ease'
      }} />
    </div>
  );
}

function smartSuggestion(goal) {
  if (!goal.targetDate) return null;
  const today = new Date();
  const due = new Date(goal.targetDate);
  const monthsLeft = Math.max(1, Math.ceil((due - today) / (1000 * 60 * 60 * 24 * 30)));
  const remaining = goal.targetAmount - goal.savedAmount;
  if (remaining <= 0) return null;
  const perMonth = Math.ceil(remaining / monthsLeft);
  return `Save ₹${perMonth.toLocaleString('en-IN')}/month to reach your goal`;
}

export default function Goals({ token, onUnauthorized, currency = '₹' }) {
  const [goals, setGoals] = useState([]);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [targetDate, setTargetDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [addMoneyId, setAddMoneyId] = useState(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');
  const [editingGoal, setEditingGoal] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [addMoneyError, setAddMoneyError] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/goals', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) { onUnauthorized(); return []; }
        return res.json();
      })
      .then(data => Array.isArray(data) && setGoals(data));
  }, [token]);

  async function addGoal() {
    const errors = {};
    if (!name || name.trim() === '') {
      errors.name = 'Goal name is required';
    }
    if (!targetAmount || Number(targetAmount) <= 0) {
      errors.targetAmount = 'Target amount must be greater than 0';
    } else if (isNaN(targetAmount)) {
      errors.targetAmount = 'Target amount must be a number';
    }
    if (savedAmount && Number(savedAmount) < 0) {
      errors.savedAmount = 'Current amount cannot be negative';
    }
    if (savedAmount && Number(savedAmount) > Number(targetAmount)) {
      errors.savedAmount = 'Cannot exceed target amount';
    }
    if (targetDate && new Date(targetDate) <= new Date()) {
      errors.targetDate = 'Deadline must be in the future';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    const res = await fetch('http://localhost:5000/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, targetAmount, savedAmount: savedAmount || 0, category, targetDate })
    });
    if (res.status === 401) { onUnauthorized(); return; }
    const saved = await res.json();
    if (!res.ok) return;
    setGoals(prev => [saved, ...prev]);
    setName(''); setTargetAmount(''); setSavedAmount(''); setCategory('Other'); setTargetDate('');
    setShowForm(false);
    setFormErrors({});
  }

  async function addMoney(id) {
    if (!addMoneyAmount || Number(addMoneyAmount) <= 0) {
      setAddMoneyError('Amount must be greater than 0');
      return;
    }
    if (isNaN(addMoneyAmount)) {
      setAddMoneyError('Amount must be a number');
      return;
    }
    setAddMoneyError('');
    const goal = goals.find(g => g._id === id);
    const newSaved = goal.savedAmount + Number(addMoneyAmount);
    const completed = newSaved >= goal.targetAmount;
    const res = await fetch(`http://localhost:5000/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ savedAmount: newSaved, completed })
    });
    if (res.status === 401) { onUnauthorized(); return; }
    const updated = await res.json();
    setGoals(prev => prev.map(g => g._id === id ? updated : g));
    setAddMoneyId(null);
    setAddMoneyAmount('');
    setAddMoneyError('');
  }

  async function deleteGoal(id) {
    const res = await fetch(`http://localhost:5000/goals/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) { onUnauthorized(); return; }
    setGoals(prev => prev.filter(g => g._id !== id));
  }

  async function saveEdit() {
    const errors = {};
    if (!editingGoal.name || editingGoal.name.trim() === '') {
      errors.name = 'Goal name is required';
    }
    if (!editingGoal.targetAmount || Number(editingGoal.targetAmount) <= 0) {
      errors.targetAmount = 'Target amount must be greater than 0';
    } else if (isNaN(editingGoal.targetAmount)) {
      errors.targetAmount = 'Target amount must be a number';
    }
    if (editingGoal.targetDate && new Date(editingGoal.targetDate) <= new Date()) {
      errors.targetDate = 'Deadline must be in the future';
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    setEditErrors({});
    const res = await fetch(`http://localhost:5000/goals/${editingGoal._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: editingGoal.name,
        targetAmount: editingGoal.targetAmount,
        category: editingGoal.category,
        targetDate: editingGoal.targetDate
      })
    });
    if (res.status === 401) { onUnauthorized(); return; }
    const updated = await res.json();
    setGoals(prev => prev.map(g => g._id === updated._id ? updated : g));
    setEditingGoal(null);
    setEditErrors({});
  }

  const active = goals.filter(g => !g.completed);
  const completed = goals.filter(g => g.completed);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 6px' }}>Goals</h1>
          <p style={{ color: 'var(--text-2)', margin: 0 }}>Track your savings for specific targets</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(p => !p)}>
          {showForm ? '✕ Cancel' : '+ New Goal'}
        </button>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px', color: 'var(--text-1)' }}>Create New Goal</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <input placeholder="Goal name (e.g. New Laptop)" value={name} onChange={e => { setName(e.target.value); setFormErrors(prev => ({ ...prev, name: '' })); }} />
              {formErrors.name && <span className="field-error">{formErrors.name}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <input placeholder="Target amount" type="number" value={targetAmount} onChange={e => { setTargetAmount(e.target.value); setFormErrors(prev => ({ ...prev, targetAmount: '' })); }} />
              {formErrors.targetAmount && <span className="field-error">{formErrors.targetAmount}</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <input placeholder="Already saved (optional)" type="number" value={savedAmount} onChange={e => { setSavedAmount(e.target.value); setFormErrors(prev => ({ ...prev, savedAmount: '' })); }} />
              {formErrors.savedAmount && <span className="field-error">{formErrors.savedAmount}</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px' }}>
            <select value={category} onChange={e => setCategory(e.target.value)}
              style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)', fontSize: '0.9rem' }}>
              {GOAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <input type="date" value={targetDate} onChange={e => { setTargetDate(e.target.value); setFormErrors(prev => ({ ...prev, targetDate: '' })); }}
                style={{ padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)', fontSize: '0.9rem' }} />
              {formErrors.targetDate && <span className="field-error">{formErrors.targetDate}</span>}
            </div>
            <button className="btn btn-primary" onClick={addGoal}>Create Goal</button>
          </div>
        </div>
      )}

      {/* Active Goals */}
      <p className="section-kicker" style={{ marginBottom: '12px' }}>ACTIVE GOALS ({active.length})</p>

      {active.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎯</div>
          <p style={{ color: 'var(--text-1)', fontWeight: 600, marginBottom: '4px' }}>No active goals</p>
          <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>Click "+ New Goal" to start tracking your savings</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          {active.map(goal => {
            const percent = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
            const suggestion = smartSuggestion(goal);
            const catColor = CATEGORY_COLORS[goal.category] || '#6b7280';
            const daysLeft = goal.targetDate ? Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;

            return (
              <div key={goal._id} className="card" style={{ padding: '20px' }}>
                {editingGoal?._id === goal._id ? (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <input value={editingGoal.name} onChange={e => { setEditingGoal(p => ({ ...p, name: e.target.value })); setEditErrors(prev => ({ ...prev, name: '' })); }} />
                      {editErrors.name && <span className="field-error">{editErrors.name}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <input type="number" value={editingGoal.targetAmount} onChange={e => { setEditingGoal(p => ({ ...p, targetAmount: e.target.value })); setEditErrors(prev => ({ ...prev, targetAmount: '' })); }} />
                      {editErrors.targetAmount && <span className="field-error">{editErrors.targetAmount}</span>}
                    </div>
                    <select value={editingGoal.category} onChange={e => setEditingGoal(p => ({ ...p, category: e.target.value }))}
                      style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)' }}>
                      {GOAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <input type="date" value={editingGoal.targetDate ? new Date(editingGoal.targetDate).toISOString().split('T')[0] : ''}
                        onChange={e => { setEditingGoal(p => ({ ...p, targetDate: e.target.value })); setEditErrors(prev => ({ ...prev, targetDate: '' })); }}
                        style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)' }} />
                      {editErrors.targetDate && <span className="field-error">{editErrors.targetDate}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveEdit}>Save</button>
                      <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setEditingGoal(null); setEditErrors({}); }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 6px', color: 'var(--text-1)', fontSize: '1.05rem', fontWeight: 700 }}>{goal.name}</h3>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', background: catColor + '22', color: catColor, border: `1px solid ${catColor}55` }}>
                          {goal.category}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => setEditingGoal(goal)}>Edit</button>
                        <button className="btn btn-danger" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => deleteGoal(goal._id)}>Delete</button>
                      </div>
                    </div>

                    {/* Progress */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>{currency}{goal.savedAmount.toLocaleString('en-IN')} saved</span>
                        <span style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: '0.85rem' }}>{currency}{goal.targetAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <ProgressBar percent={percent} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.78rem', color: percent >= 75 ? '#22c55e' : percent >= 25 ? '#f97316' : '#ef4444', fontWeight: 600 }}>
                          {percent.toFixed(1)}% complete
                        </span>
                        {daysLeft !== null && (
                          <span style={{ fontSize: '0.78rem', color: daysLeft < 0 ? '#ef4444' : daysLeft <= 30 ? '#f97316' : 'var(--text-2)' }}>
                            {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Smart suggestion */}
                    {suggestion && (
                      <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--surface-2)', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>💡 {suggestion}</span>
                      </div>
                    )}

                    {/* Add money */}
                    {addMoneyId === goal._id ? (
                      <div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="number"
                            placeholder="Amount to add"
                            value={addMoneyAmount}
                            onChange={e => { setAddMoneyAmount(e.target.value); setAddMoneyError(''); }}
                            style={{ flex: 1, padding: '6px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-1)' }}
                            autoFocus
                          />
                          <button className="btn btn-primary" style={{ fontSize: '0.82rem' }} onClick={() => addMoney(goal._id)}>Add</button>
                          <button className="btn btn-secondary" style={{ fontSize: '0.82rem' }} onClick={() => { setAddMoneyId(null); setAddMoneyAmount(''); setAddMoneyError(''); }}>✕</button>
                        </div>
                        {addMoneyError && <span className="field-error">{addMoneyError}</span>}
                      </div>
                    ) : (
                      <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }} onClick={() => setAddMoneyId(goal._id)}>
                        + Add Money
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Goals */}
      {completed.length > 0 && (
        <>
          <p className="section-kicker" style={{ marginBottom: '12px' }}>COMPLETED GOALS 🎉 ({completed.length})</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', opacity: 0.75 }}>
            {completed.map(goal => (
              <div key={goal._id} className="card" style={{ padding: '20px', borderLeft: '4px solid #22c55e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', color: 'var(--text-1)', fontSize: '1rem', fontWeight: 700, textDecoration: 'line-through' }}>{goal.name}</h3>
                    <span style={{ color: '#22c55e', fontSize: '0.85rem', fontWeight: 600 }}>✅ Goal reached — {currency}{goal.targetAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <button className="btn btn-danger" style={{ fontSize: '0.78rem', padding: '4px 10px' }} onClick={() => deleteGoal(goal._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
