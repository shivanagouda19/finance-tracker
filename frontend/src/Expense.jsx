import { useState, useEffect } from "react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import BankImporter from './components/BankImporter';

const CATEGORIES = [
  { label: "Food", color: "#f97316" },
  { label: "Travel", color: "#3b82f6" },
  { label: "Shopping", color: "#a855f7" },
  { label: "Bills", color: "#ef4444" },
  { label: "Health", color: "#22c55e" },
  { label: "Other", color: "#6b7280" },
];

function CategoryBadge({ category }) {
  const cat = CATEGORIES.find(c => c.label === category) || CATEGORIES[CATEGORIES.length - 1];
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "999px",
      fontSize: "0.72rem",
      fontWeight: 600,
      letterSpacing: "0.03em",
      backgroundColor: cat.color + "22",
      color: cat.color,
      border: `1px solid ${cat.color}55`,
    }}>
      {cat.label}
    </span>
  );
}

export default function Expense({ token, onUnauthorized, expenses, setExpenses, setIncomeList, setTotalRecived }) {

  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("Food");

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("Food");

  const [showImporter, setShowImporter] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [showAll, setShowAll] = useState(false);

  // load expenses from backend
  useEffect(() => {
    fetch("http://localhost:5000/expenses", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async (res) => {
        const data = await res.json();

        if (res.status === 401) {
          onUnauthorized();
          return [];
        }

        return Array.isArray(data) ? data : [];
      })
      .then((data) => setExpenses(data));
  }, [token, onUnauthorized]);

  // add expense to backend
  async function addNewExpense() {
    const errors = {};
    if (!newTitle || newTitle.trim() === "") {
      errors.title = "Description is required";
    }
    if (!newAmount || Number(newAmount) <= 0) {
      errors.amount = "Amount must be greater than 0";
    } else if (isNaN(newAmount)) {
      errors.amount = "Amount must be a number";
    }
    if (!newCategory) {
      errors.category = "Category is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const expense = {
      title: newTitle,
      amount: Number(newAmount),
      category: newCategory,
    };

    const res = await fetch("http://localhost:5000/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(expense)
    });

    if (res.status === 401) {
      onUnauthorized();
      return;
    }

    const saved = await res.json();
    if (!res.ok) return;
    setExpenses(prev => [...prev, saved]);

    setNewTitle("");
    setNewAmount("");
    setNewCategory("Food");
    setFormErrors({});
  }

  function handleAddExpenseKeyDown(event) {
    if (event.key === "Enter") {
      addNewExpense();
    }
  }

  // delete from backend
  async function deleteExpense(id) {
    const res = await fetch(`http://localhost:5000/expenses/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      onUnauthorized();
      return;
    }

    if (!res.ok) return;

    setExpenses(prev => prev.filter(exp => exp._id !== id));
  }

  function startEdit(exp) {
    setEditingId(exp._id);
    setEditTitle(exp.title);
    setEditAmount(exp.amount);
    setEditCategory(exp.category || "Other");
  }

  async function saveEdit(id) {
    const errors = {};
    if (!editTitle || editTitle.trim() === "") {
      errors.title = "Description is required";
    }
    if (!editAmount || Number(editAmount) <= 0) {
      errors.amount = "Amount must be greater than 0";
    } else if (isNaN(editAmount)) {
      errors.amount = "Amount must be a number";
    }
    if (!editCategory) {
      errors.category = "Category is required";
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    setEditErrors({});
    const updated = {
      title: editTitle,
      amount: Number(editAmount),
      category: editCategory,
    };

    const res = await fetch(`http://localhost:5000/expenses/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updated)
    });

    if (res.status === 401) {
      onUnauthorized();
      return;
    }

    setExpenses(prev =>
      prev.map(exp =>
        exp._id === id
          ? { ...exp, ...updated }
          : exp
      )
    );

    setEditingId(null);
    setEditErrors({});
  }

  const filtered = showAll ? expenses : expenses.filter(exp => {
    if (!exp.createdAt) return false;
    const d = new Date(exp.createdAt);
    return d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear;
  });

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" }
  ];

  function downloadPDF() {
    const doc = new jsPDF();
    const period = showAll ? 'All Time' : `${months.find(m => m.value === filterMonth)?.label} ${filterYear}`;
    
    doc.setFontSize(18);
    doc.text('Expense Report', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Period: ${period}`, 14, 28);
    
    const rows = filtered.map(exp => [
      exp.createdAt ? new Date(exp.createdAt).toLocaleDateString('en-IN') : 'N/A',
      exp.category || 'Other',
      exp.title,
      `Rs. ${exp.amount.toLocaleString('en-IN')}`
    ]);

    const total = filtered.reduce((s, e) => s + e.amount, 0);
    rows.push(['', '', 'Total', `Rs. ${total.toLocaleString('en-IN')}`]);

    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Category', 'Name', 'Amount']],
      body: rows,
      headStyles: { fillColor: [15, 32, 39], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 245, 255] },
      footStyles: { fontStyle: 'bold', fillColor: [220, 230, 240] },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30 },
        2: { cellWidth: 70 },
        3: { halign: 'right', fontStyle: 'bold', cellWidth: 40 }
      },
      styles: { fontSize: 10, cellPadding: 3 }
    });

    const filename = showAll ? 'expense-report-all.pdf' : `expense-report-${filterMonth}-${filterYear}.pdf`;
    doc.save(filename);
  }

  return (
    <div className="expense-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="section-title" style={{ margin: 0 }}>Add New Expense</h3>
        <button className="btn btn-secondary" onClick={() => setShowImporter(true)} style={{ fontSize: '0.85rem' }}>
          📄 Import Statement
        </button>
      </div>

      <div className="expense-form">
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <input
            placeholder="Expense name"
            value={newTitle}
            onChange={e => { setNewTitle(e.target.value); setFormErrors(prev => ({ ...prev, title: "" })); }}
            onKeyDown={handleAddExpenseKeyDown}
          />
          {formErrors.title && <span className="field-error">{formErrors.title}</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <input
            placeholder="Amount"
            type="number"
            value={newAmount}
            onChange={e => { setNewAmount(e.target.value); setFormErrors(prev => ({ ...prev, amount: "" })); }}
            onKeyDown={handleAddExpenseKeyDown}
          />
          {formErrors.amount && <span className="field-error">{formErrors.amount}</span>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <select
            value={newCategory}
            onChange={e => { setNewCategory(e.target.value); setFormErrors(prev => ({ ...prev, category: "" })); }}
            style={{
              padding: "0.6rem 0.75rem",
              borderRadius: "0.6rem",
              border: "1px solid var(--border, #2a3a4a)",
              background: "var(--input-bg, #1a2a3a)",
              color: "var(--text, #e2e8f0)",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            {CATEGORIES.map(cat => (
              <option key={cat.label} value={cat.label}>{cat.label}</option>
            ))}
          </select>
          {formErrors.category && <span className="field-error">{formErrors.category}</span>}
        </div>

        <button className="btn btn-primary" onClick={addNewExpense}>Add Expense</button>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px",
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        background: "var(--surface-2)",
        marginBottom: "12px",
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-1)" }}>Filter:</span>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", color: "var(--text-2)" }}>
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            Show All
          </label>
          {!showAll && (
            <>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.6rem",
                  border: "1px solid var(--border)",
                  background: "var(--surface-0)",
                  color: "var(--text-1)",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.6rem",
                  border: "1px solid var(--border)",
                  background: "var(--surface-0)",
                  color: "var(--text-1)",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </>
          )}
        </div>
        <button className="btn btn-secondary" onClick={downloadPDF}>
          ⬇ Download PDF
        </button>
      </div>

      <ul className="expense-list">
        {filtered.length === 0 && (
          <li style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-2)',
            fontSize: '0.95rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '2.5rem' }}>📭</span>
            <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>No expenses found</span>
            <span style={{ fontSize: '0.85rem' }}>
              {showAll ? 'Add your first expense above' : 'No expenses for this period — try Show All or add a new one'}
            </span>
          </li>
        )}
        {filtered.map(exp => (
          <li key={exp._id} className="expense-item">
            {editingId === exp._id ? (
              <>
                <div className="edit-fields" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px', flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <input
                      value={editTitle}
                      onChange={e => { setEditTitle(e.target.value); setEditErrors(prev => ({ ...prev, title: "" })); }}
                    />
                    {editErrors.title && <span className="field-error">{editErrors.title}</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <input
                      type="number"
                      value={editAmount}
                      onChange={e => { setEditAmount(e.target.value); setEditErrors(prev => ({ ...prev, amount: "" })); }}
                    />
                    {editErrors.amount && <span className="field-error">{editErrors.amount}</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                    <select
                      value={editCategory}
                      onChange={e => { setEditCategory(e.target.value); setEditErrors(prev => ({ ...prev, category: "" })); }}
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.6rem",
                        border: "1px solid var(--border, #2a3a4a)",
                        background: "var(--input-bg, #1a2a3a)",
                        color: "var(--text, #e2e8f0)",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                      }}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.label} value={cat.label}>{cat.label}</option>
                      ))}
                    </select>
                    {editErrors.category && <span className="field-error">{editErrors.category}</span>}
                  </div>
                </div>
                <div className="item-actions">
                  <button className="btn btn-primary" onClick={() => saveEdit(exp._id)}>Save</button>
                  <button className="btn btn-secondary" onClick={() => { setEditingId(null); setEditErrors({}); }}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className="item-main">
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span className="item-title">{exp.title}</span>
                    <CategoryBadge category={exp.category || "Other"} />
                  </div>
                  <span className="item-amount">₹{exp.amount}</span>
                </div>
                <div className="item-actions">
                  <button className="btn btn-secondary" onClick={() => startEdit(exp)}>Edit</button>
                  <button className="btn btn-danger" onClick={() => deleteExpense(exp._id)}>Delete</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {showImporter && (
        <BankImporter
          token={token}
          onClose={() => setShowImporter(false)}
          onImportExpenses={(newExpenses) => {
            setExpenses(prev => [...newExpenses, ...prev]);
          }}
          onImportIncome={(newIncome) => {
            setIncomeList(prev => [...newIncome, ...prev]);
            setTotalRecived(prev => prev + newIncome.reduce((s, i) => s + i.amount, 0));
          }}
        />
      )}
    </div>
  );
}