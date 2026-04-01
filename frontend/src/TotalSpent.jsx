export default function TotalSpent({ expenses, currency = '₹' }) {
  const total = expenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  return (
    <div className="summary-card spent">
      <div className="summary-top">
        <span className="summary-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="presentation">
            <path d="M3 6h18M6 6v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6M10 10v6M14 10v6" />
          </svg>
        </span>
        <span>Total Spent</span>
      </div>
      <strong>{currency}{Math.round(total)}</strong>
    </div>
  );
}
