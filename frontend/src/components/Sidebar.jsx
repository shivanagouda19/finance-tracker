import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Receipt, Wallet, Bell, Calendar, Target, TrendingUp, User } from 'lucide-react';

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when route changes on mobile
  const closeSidebar = () => setIsOpen(false);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && !e.target.closest('.sidebar') && !e.target.closest('.hamburger-btn')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger button — only visible on mobile */}
      <button
        className="hamburger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
        
      </button>

      {/* Overlay — only on mobile when sidebar is open */}
      {isOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        
         {/* App title */}
      <div style={{ marginBottom: '32px', marginLeft: '47px' }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
          FinTrack
        </h1>
        </div>
        

        {/* Top nav links — takes all available space */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <NavLink to="/" end className="nav-link" onClick={closeSidebar}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/expenses" className="nav-link" onClick={closeSidebar}>
            <Receipt size={18} />
            <span>Expenses</span>
          </NavLink>
          <NavLink to="/income" className="nav-link" onClick={closeSidebar}>
            <Wallet size={18} />
            <span>Income</span>
          </NavLink>
          <NavLink to="/upcoming" className="nav-link" onClick={closeSidebar}>
            <Bell size={18} />
            <span>Upcoming</span>
          </NavLink>
          <NavLink to="/calendar" className="nav-link" onClick={closeSidebar}>
            <Calendar size={18} />
            <span>Calendar</span>
          </NavLink>
          <NavLink to="/goals" className="nav-link" onClick={closeSidebar}>
            <Target size={18} />
            <span>Goals</span>
          </NavLink>
          <NavLink to="/investments" className="nav-link" onClick={closeSidebar}>
            <TrendingUp size={18} />
            <span>Investments</span>
          </NavLink>
        </div>

        {/* Profile at bottom */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
          <NavLink to="/profile" className="nav-link" onClick={closeSidebar}>
            <User size={18} />
            <span>Profile</span>
          </NavLink>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
