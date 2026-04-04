import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Wallet, Bell, Calendar, Target, TrendingUp, User } from 'lucide-react';

function Sidebar() {
  return (
    <div className="sidebar">
      {/* App logo */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
        <img src="/src/images/logo.png" alt="FinTrack" style={{ width: '130px', objectFit: 'contain' }} />
      </div>

      {/* Top nav links — takes all available space */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <NavLink to="/" end className="nav-link">
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/expenses" className="nav-link">
          <Receipt size={18} />
          <span>Expenses</span>
        </NavLink>
        <NavLink to="/income" className="nav-link">
          <Wallet size={18} />
          <span>Income</span>
        </NavLink>
        <NavLink to="/upcoming" className="nav-link">
          <Bell size={18} />
          <span>Upcoming</span>
        </NavLink>
        <NavLink to="/calendar" className="nav-link">
          <Calendar size={18} />
          <span>Calendar</span>
        </NavLink>
        <NavLink to="/goals" className="nav-link">
          <Target size={18} />
          <span>Goals</span>
        </NavLink>
        <NavLink to="/investments" className="nav-link">
          <TrendingUp size={18} />
          <span>Investments</span>
        </NavLink>
      </div>

      {/* Profile at bottom */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
        <NavLink to="/profile" className="nav-link">
          <User size={18} />
          <span>Profile</span>
        </NavLink>
      </div>
    </div>
  );
}

export default Sidebar;
