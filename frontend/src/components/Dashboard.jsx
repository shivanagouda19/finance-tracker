import DigitalClock from '../DigitalClock';
import TotalBalance from '../TotalBalance';
import TotalReceivedCard from '../TotalReceivedCard';
import TotalSpent from '../TotalSpent';
import ExpenseChart from '../ExpenseChart';
import AIInsights from './AIInsights';

function Dashboard({ expenses, totalRecived, token, currency }) {
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  return (
    <div className="app">
      <header className="app-header dashboard-header">
        <h1>Dashboard</h1>
        <p>Financial overview — income, spending & net balance</p>
        <DigitalClock />
      </header>

      <section className="summary-section">
        <p className="section-kicker">Overview</p>
        <div className="summary-grid">
          <TotalSpent expenses={expenses} currency={currency} />
          <TotalReceivedCard totalRecived={totalRecived} currency={currency} />
          <TotalBalance expenses={expenses} totalRecived={totalRecived} currency={currency} />
        </div>
      </section>

      <ExpenseChart expenses={expenses} />

      <AIInsights
        token={token}
        expenses={expenses}
        totalReceived={totalRecived}
        totalSpent={totalSpent}
      />
    </div>
  );
}

export default Dashboard;
