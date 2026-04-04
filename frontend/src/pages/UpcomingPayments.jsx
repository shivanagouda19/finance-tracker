import { useState, useEffect } from 'react';

import { Bell, CheckCircle } from 'lucide-react';

const statusColor = {
  Pending: '#f97316',
  Paid: '#22c55e'
};

const typeColor = {
  Bill: '#3b82f6',
  Debt: '#a855f7'
};

export default function UpcomingPayments({ token, onUnauthorized, onPaymentChange, currency = '₹' }) {
  const [payments, setPayments] = useState([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState('Bill');

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editType, setEditType] = useState('Bill');

  const [formErrors, setFormErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  useEffect(() => {
    fetch('http://localhost:5000/upcoming', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (res.status === 401) { onUnauthorized(); return []; }
        return res.json();
      })
      .then(data => Array.isArray(data) && setPayments(data));
  }, [token, onUnauthorized]);

  async function addPayment() {
    const errors = {};
    if (!name || name.trim() === '') {
      errors.name = 'Title is required';
    }
    if (!amount || Number(amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    } else if (isNaN(amount)) {
      errors.amount = 'Amount must be a number';
    }
    if (!dueDate) {
      errors.dueDate = 'Due date is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    const res = await fetch('http://localhost:5000/upcoming', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, amount, dueDate, type })
    });
    if (res.status === 401) { onUnauthorized(); return; }
    const saved = await res.json();
    setPayments(prev => [...prev, saved].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
    setName(''); setAmount(''); setDueDate(''); setType('Bill');
    setFormErrors({});
    onPaymentChange();
  }

  async function markPaid(id) {
    const res = await fetch(`http://localhost:5000/upcoming/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'Paid' })
    });
    if (res.status === 401) { onUnauthorized(); return; }
    const updated = await res.json();
    setPayments(prev => prev.map(p => p._id === id ? updated : p));
    onPaymentChange();
  }

  function startEdit(payment) {
    setEditingId(payment._id);
    setEditName(payment.name);
    setEditAmount(payment.amount);
    setEditDueDate(payment.dueDate.split('T')[0]);
    setEditType(payment.type);
  }

  async function saveEdit(id) {
    const errors = {};
    if (!editName || editName.trim() === '') {
      errors.name = 'Title is required';
    }
    if (!editAmount || Number(editAmount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    } else if (isNaN(editAmount)) {
      errors.amount = 'Amount must be a number';
    }
    if (!editDueDate) {
      errors.dueDate = 'Due date is required';
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    setEditErrors({});
    const res = await fetch(`http://localhost:5000/upcoming/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ 
        name: editName, 
        amount: editAmount, 
        dueDate: editDueDate, 
        type: editType 
      })
    });
    if (res.status === 401) { onUnauthorized(); return; }
    const updated = await res.json();
    setPayments(prev => prev.map(p => p._id === id ? updated : p).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
    setEditingId(null);
    setEditErrors({});
    onPaymentChange();
  }

  function cancelEdit() {
    setEditingId(null);
    setEditErrors({});
  }

  async function deletePayment(id) {
    const res = await fetch(`http://localhost:5000/upcoming/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) { onUnauthorized(); return; }
    setPayments(prev => prev.filter(p => p._id !== id));
    onPaymentChange();
  }

  function getDaysUntil(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: '#ef4444' };
    if (diff === 0) return { label: 'Due today', color: '#f97316' };
    if (diff <= 3) return { label: `Due in ${diff}d`, color: '#f97316' };
    return { label: `Due in ${diff}d`, color: '#22c55e' };
  }

  const pending = payments.filter(p => p.status === 'Pending');
  const paid = payments.filter(p => p.status === 'Paid');
  const totalPending = pending.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 6px' }}>
        Upcoming Payments
      </h1>
      <p style={{ color: 'var(--text-2)', marginBottom: '24px' }}>
        Track pending bills and debts
      </p>

      {/* Add form */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', color: 'var(--text-1)' }}>Add Payment</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <input placeholder="Payment name" value={name} onChange={e => { setName(e.target.value); setFormErrors(prev => ({ ...prev, name: '' })); }} />
            {formErrors.name && <span className="field-error">{formErrors.name}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <input placeholder="Amount" type="number" value={amount} onChange={e => { setAmount(e.target.value); setFormErrors(prev => ({ ...prev, amount: '' })); }} />
            {formErrors.amount && <span className="field-error">{formErrors.amount}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <input type="date" value={dueDate} onChange={e => { setDueDate(e.target.value); setFormErrors(prev => ({ ...prev, dueDate: '' })); }} />
            {formErrors.dueDate && <span className="field-error">{formErrors.dueDate}</span>}
          </div>
          <select value={type} onChange={e => setType(e.target.value)}>
            <option value="Bill">Bill</option>
            <option value="Debt">Debt</option>
          </select>
          <button className="btn btn-primary" onClick={addPayment}>Add</button>
        </div>
      </div>

      {/* Summary */}
      {pending.length > 0 && (
        <div style={{
          padding: '16px 20px', borderRadius: 'var(--radius-md)',
          background: '#ef444420', border: '1px solid #ef444440',
          marginBottom: '24px', display: 'flex', justifyContent: 'space-between'
        }}>
          <span style={{ color: 'var(--text-1)' }}>Total Pending</span>
          <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.1rem' }}>{currency}{totalPending}</span>
        </div>
      )}

      {/* Pending list */}
      <h3 style={{ color: 'var(--text-2)', fontSize: '0.8rem', letterSpacing: '0.08em', marginBottom: '12px' }}>
        PENDING ({pending.length})
      </h3>

      {pending.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-2)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <CheckCircle size={48} strokeWidth={1.5} style={{ color: '#22c55e' }} />
          </div>
          <p>No pending payments!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px', marginBottom: '32px' }}>
          {pending.map(p => {
            const days = getDaysUntil(p.dueDate);
            
            if (editingId === p._id) {
              return (
                <div key={p._id} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <input placeholder="Payment name" value={editName} onChange={e => { setEditName(e.target.value); setEditErrors(prev => ({ ...prev, name: '' })); }} />
                      {editErrors.name && <span className="field-error">{editErrors.name}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <input placeholder="Amount" type="number" value={editAmount} onChange={e => { setEditAmount(e.target.value); setEditErrors(prev => ({ ...prev, amount: '' })); }} />
                      {editErrors.amount && <span className="field-error">{editErrors.amount}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <input type="date" value={editDueDate} onChange={e => { setEditDueDate(e.target.value); setEditErrors(prev => ({ ...prev, dueDate: '' })); }} />
                      {editErrors.dueDate && <span className="field-error">{editErrors.dueDate}</span>}
                    </div>
                    <select value={editType} onChange={e => setEditType(e.target.value)}>
                      <option value="Bill">Bill</option>
                      <option value="Debt">Debt</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => saveEdit(p._id)}>Save</button>
                    <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              );
            }
            
            return (
              <div key={p._id} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{p.name}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', background: typeColor[p.type] + '22', color: typeColor[p.type], border: `1px solid ${typeColor[p.type]}55` }}>{p.type}</span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', background: days.color + '22', color: days.color, border: `1px solid ${days.color}55` }}>{days.label}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>Due: {new Date(p.dueDate).toLocaleDateString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-1)' }}>{currency}{p.amount}</span>
                  <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => startEdit(p)}>Edit</button>
                  <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => markPaid(p._id)}>Mark Paid</button>
                  <button className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => deletePayment(p._id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paid list */}
      {paid.length > 0 && (
        <>
          <h3 style={{ color: 'var(--text-2)', fontSize: '0.8rem', letterSpacing: '0.08em', marginBottom: '12px' }}>
            PAID ({paid.length})
          </h3>
          <div style={{ display: 'grid', gap: '12px', opacity: 0.6 }}>
            {paid.map(p => (
              <div key={p._id} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-1)', textDecoration: 'line-through' }}>{p.name}</span>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '4px' }}>Paid <CheckCircle size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 700, color: '#22c55e' }}>{currency}{p.amount}</span>
                  <button className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => deletePayment(p._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
