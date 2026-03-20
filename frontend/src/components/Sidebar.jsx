import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="sidebar">
      {/* App title */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
          Expense Tracker
        </h2>
      </div>

      {/* Top nav links — takes all available space */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <NavLink to="/" end className="nav-link">
          <span>📊</span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/expenses" className="nav-link">
          <span>💸</span>
          <span>Expenses</span>
        </NavLink>
        <NavLink to="/income" className="nav-link">
          <span>💰</span>
          <span>Income</span>
        </NavLink>
        <NavLink to="/upcoming" className="nav-link">
          <span>🔔</span>
          <span>Upcoming</span>
        </NavLink>
        <NavLink to="/calendar" className="nav-link">
          <span>📅</span>
          <span>Calendar</span>
        </NavLink>
        <NavLink to="/goals" className="nav-link">
          <span>🎯</span>
          <span>Goals</span>
        </NavLink>
      </div>

      {/* Profile at bottom */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
        <NavLink to="/profile" className="nav-link">
          <span>👤</span>
          <span>Profile</span>
        </NavLink>
      </div>
    </div>
  );
}

export default Sidebar;
