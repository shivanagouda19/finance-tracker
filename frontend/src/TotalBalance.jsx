export default function TotalBalance({
  expenses,
  totalRecived,
  currency = '₹'
}) {
  const totalSpent = expenses.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  const balance = totalRecived - totalSpent;

  return (
    <div className={`summary-card balance ${balance < 0 ? "negative" : "positive"}`}>
      <div className="summary-top">
        <span className="summary-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="presentation">
            <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Zm12 4.5h6v3h-6a1.5 1.5 0 0 1 0-3Zm0 1.5h.01" />
          </svg>
        </span>
        <span>Total Balance</span>
      </div>
      <strong>{currency}{Math.round(balance)}</strong>
    </div>
  );
}
