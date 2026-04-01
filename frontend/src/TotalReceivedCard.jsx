export default function TotalReceivedCard({ totalRecived, currency = '₹' }) {
  return (
    <div className="summary-card received">
      <div className="summary-top">
        <span className="summary-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" role="presentation">
            <path d="M12 3v18M6.5 9.5a5.5 5.5 0 0 1 5.5-3.5c2.8 0 5 1.7 5 4 0 2-1.4 3.1-4.4 3.8l-1.7.4c-2.2.5-3.4 1.5-3.4 3.2 0 2.1 2 3.6 4.9 3.6a5.8 5.8 0 0 0 5.8-3.6" />
          </svg>
        </span>
        <span>Total Received</span>
      </div>
      <strong>{currency}{totalRecived}</strong>
    </div>
  );
}
