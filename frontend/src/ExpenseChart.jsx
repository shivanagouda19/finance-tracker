const CATEGORY_COLORS = {
  Food: '#f97316',
  Travel: '#3b82f6',
  Shopping: '#a855f7',
  Bills: '#ef4444',
  Health: '#22c55e',
  Other: '#6b7280'
};

function ExpenseChart({ expenses }) {
  if (!expenses || expenses.length === 0) {
    return (
      <div style={{
        padding: '20px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        background: 'var(--surface-1)',
        textAlign: 'center',
        color: 'var(--text-2)'
      }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-1)' }}>
          Spending by Category
        </h3>
        <p style={{ margin: '12px 0', fontSize: '0.92rem' }}>Add expenses to see the chart</p>
      </div>
    );
  }

  const categoryTotals = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    acc[category] = (acc[category] || 0) + Number(expense.amount || 0);
    return acc;
  }, {});

  const data = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Build conic-gradient segments for pie
  let cumulative = 0;
  const segments = data.map((d) => {
    const pct = (d.value / total) * 100;
    const start = cumulative;
    cumulative += pct;
    return { ...d, pct, start };
  });

  const conicGradient = segments
    .map((s) => `${CATEGORY_COLORS[s.name] || CATEGORY_COLORS.Other} ${s.start.toFixed(1)}% ${(s.start + s.pct).toFixed(1)}%`)
    .join(', ');

  return (
    <div style={{
      padding: '24px',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)',
      background: 'var(--surface-1)',
    }}>
      <h3 style={{ margin: '0 0 24px', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-1)' }}>
        Spending by Category
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
        {/* Pie */}
        <div style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: `conic-gradient(${conicGradient})`,
          flexShrink: 0,
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
        }} />

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          {segments.map((s) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '12px', height: '12px', borderRadius: '3px', flexShrink: 0,
                background: CATEGORY_COLORS[s.name] || CATEGORY_COLORS.Other
              }} />
              <span style={{ color: 'var(--text-1)', fontSize: '0.9rem', flex: 1 }}>{s.name}</span>
              <span style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>₹{s.value}</span>
              <span style={{
                fontSize: '0.78rem', fontWeight: 600,
                color: CATEGORY_COLORS[s.name] || CATEGORY_COLORS.Other
              }}>
                {s.pct.toFixed(1)}%
              </span>
            </div>
          ))}
          <div style={{
            marginTop: '8px', paddingTop: '12px',
            borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between'
          }}>
            <span style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>Total</span>
            <span style={{ color: 'var(--text-1)', fontWeight: 700 }}>₹{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpenseChart;