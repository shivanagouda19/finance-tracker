import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import ExpensePage from './components/ExpensePage';
import IncomePage from './components/IncomePage';
import UpcomingPayments from './pages/UpcomingPayments';
import CalendarPage from './pages/CalendarPage';
import Profile from './pages/Profile';
import Goals from './pages/Goals';
import Investments from './pages/Investments';
import About from './pages/About';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import "./App.css";

import { Sun, Moon } from 'lucide-react';

const MoonIcon = () => <Moon size={15} />;
const SunIcon = () => <Sun size={15} />;

function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const [expenses, setExpenses] = useState([]);
  const [incomeList, setIncomeList] = useState([]);
  const [urgentAlerts, setUrgentAlerts] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authMessage, setAuthMessage] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [totalRecived, setTotalRecived] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [currency, setCurrency] = useState('₹');
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => { localStorage.setItem("theme", theme); }, [theme]);

  return (
    <BrowserRouter>
      <AppContent
        theme={theme}
        setTheme={setTheme}
        expenses={expenses}
        setExpenses={setExpenses}
        incomeList={incomeList}
        setIncomeList={setIncomeList}
        urgentAlerts={urgentAlerts}
        setUrgentAlerts={setUrgentAlerts}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        isLoginMode={isLoginMode}
        setIsLoginMode={setIsLoginMode}
        authMessage={authMessage}
        setAuthMessage={setAuthMessage}
        token={token}
        setToken={setToken}
        totalRecived={totalRecived}
        setTotalRecived={setTotalRecived}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
        currency={currency}
        setCurrency={setCurrency}
        showAuthForm={showAuthForm}
        setShowAuthForm={setShowAuthForm}
        authLoading={authLoading}
        setAuthLoading={setAuthLoading}
      />
    </BrowserRouter>
  );
}

function AppContent({
  theme,
  setTheme,
  expenses,
  setExpenses,
  incomeList,
  setIncomeList,
  urgentAlerts,
  setUrgentAlerts,
  email,
  setEmail,
  password,
  setPassword,
  isLoginMode,
  setIsLoginMode,
  authMessage,
  setAuthMessage,
  token,
  setToken,
  totalRecived,
  setTotalRecived,
  formErrors,
  setFormErrors,
  currency,
  setCurrency,
  showAuthForm,
  setShowAuthForm,
  authLoading,
  setAuthLoading,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const publicPaths = ['/verify-email', '/forgot-password', '/reset-password'];

  useEffect(() => {
    if (location.pathname === '/auth') {
      const mode = searchParams.get('mode');
      if (mode === 'signup') setIsLoginMode(false);
      else setIsLoginMode(true);
    }
  }, [location.pathname, searchParams]);

  function fetchAlerts() {
    if (!token) return;
    fetch('http://localhost:5000/upcoming', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const urgent = data.filter(p => {
          if (p.status === 'Paid') return false;
          const due = new Date(p.dueDate);
          due.setHours(0, 0, 0, 0);
          const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
          return diff <= 3;
        });
        setUrgentAlerts(urgent);
      });
  }

  useEffect(() => { fetchAlerts(); }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:5000/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => { if (data.currency) setCurrency(data.currency); })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;

    // Fetch expenses
    fetch('http://localhost:5000/expenses', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.status === 401 ? logout() : res.json())
      .then(data => Array.isArray(data) && setExpenses(data))
      .catch(() => {});

    // Fetch income and calculate total
    fetch('http://localhost:5000/income', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.status === 401 ? logout() : res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setIncomeList(data);
          setTotalRecived(data.reduce((sum, inc) => sum + inc.amount, 0));
        }
      })
      .catch(() => {});

  }, [token]);

  function toggleTheme() {
    setTheme(prev => prev === "light" ? "dark" : "light");
  }

  async function handleAuthSubmit() {
    const errors = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Valid email is required";
    }
    if (!password || password.trim() === "") {
      errors.password = "Password is required";
    } else if (!isLoginMode && password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setAuthMessage("");
      return;
    }
    setFormErrors({});

    setAuthLoading(true);
    try {
      const endpoint = isLoginMode ? "login" : "signup";
      const response = await fetch(`http://localhost:5000/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'EMAIL_NOT_VERIFIED') {
          setAuthMessage('Please verify your email before logging in. Check your inbox.');
        } else {
          setAuthMessage(data.error || "Authentication failed.");
        }
        setAuthLoading(false);
        return;
      }

      if (!isLoginMode) {
        // Navigate to verify-email page with email via state
        const nav = document.createElement('a');
        nav.href = '/verify-email';
        nav.click();
        sessionStorage.setItem('verifyEmail', email.trim());
        setAuthLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);
      setAuthMessage("");
      setPassword("");
      setAuthLoading(false);
    } catch (error) {
      setAuthMessage("Network error. Please try again.");
      setAuthLoading(false);
    }
  }

  function handleAuthKeyDown(e) {
    if (e.key === "Enter") handleAuthSubmit();
  }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setExpenses([]);
    setIncomeList([]);
    setTotalRecived(0);
    navigate('/about');
  }

  if (!token) {
    // Show about page for home and about paths
    if (location.pathname === '/' || location.pathname === '/about') {
  return (
    <div className="app-shell" data-theme={theme}>
      <About 
        theme={theme} 
        toggleTheme={toggleTheme}
        navigate={navigate}
        onNavigateToAuth={(mode) => {
          setIsLoginMode(mode === 'login');
          navigate('/auth');
        }}
      />
    </div>
  );
}
    // Show public auth pages
    if (publicPaths.some(path => location.pathname.startsWith(path))) {
      return (
        <div className="app-shell" data-theme={theme}>
          <Routes>
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </div>
      );
    }

    // Show login/signup form for /auth and all other paths
    return (
      <div className="app-shell" data-theme={theme}>
        <div className="app auth-app" style={{ maxWidth: '460px', margin: '0 auto', padding: '40px 20px' }}>
          {/* <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => { setShowAuthForm(false); window.history.pushState({}, '', '/'); }}>
              ← Back
            </button>
          </div> */}

          <header className="app-header auth-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <img src="/src/images/logo.png" alt="FinTrack" style={{ width: '220px', objectFit: 'contain' }} />
            <p style={{ color: 'var(--text-2)', margin: 0 }}>
              {isLoginMode ? "Welcome back — log in to continue" : "Create your account to get started"}
            </p>
          </header>

          <section className="card auth-card">
            <div className="auth-form">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => { setEmail(e.target.value); setFormErrors(prev => ({ ...prev, email: "" })); }}
                onKeyDown={handleAuthKeyDown}
                autoComplete="email"
              />
              {formErrors.email && <span className="field-error">{formErrors.email}</span>}
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => { setPassword(e.target.value); setFormErrors(prev => ({ ...prev, password: "" })); }}
                onKeyDown={handleAuthKeyDown}
                autoComplete={isLoginMode ? "current-password" : "new-password"}
              />
              {formErrors.password && <span className="field-error">{formErrors.password}</span>}
              <button className="btn" onClick={handleAuthSubmit} disabled={authLoading}>
                {isLoginMode 
                  ? (authLoading ? 'Logging in...' : 'Log in')
                  : (authLoading ? 'Creating account...' : 'Create account')
                }
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setIsLoginMode(p => !p); setAuthMessage(""); setFormErrors({}); }}
              >
                {isLoginMode ? "Need an account? Sign up" : "Already have an account? Log in"}
              </button>
              {isLoginMode && (
                <button
                  className="auth-link-btn"
                  onClick={() => window.location.href = '/forgot-password'}
                >
                  Forgot Password?
                </button>
              )}
              {authMessage && <p className="auth-message">{authMessage}</p>}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell" data-theme={theme}>
      <Sidebar />
      {token && <TopBar token={token} alerts={urgentAlerts} theme={theme} toggleTheme={toggleTheme} />}
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard expenses={expenses} totalRecived={totalRecived} token={token} currency={currency} />} />
          <Route path="/expenses" element={
            <ExpensePage
              token={token}
              onUnauthorized={logout}
              expenses={expenses}
              setExpenses={setExpenses}
              setIncomeList={setIncomeList}
              setTotalRecived={setTotalRecived}
              currency={currency}
            />
          } />
          <Route path="/income" element={<IncomePage token={token} onUnauthorized={logout} setTotalRecived={setTotalRecived} incomeList={incomeList} setIncomeList={setIncomeList} currency={currency} />} />
          <Route path="/upcoming" element={<UpcomingPayments token={token} onUnauthorized={logout} onPaymentChange={fetchAlerts} currency={currency} />} />
          <Route path="/calendar" element={<CalendarPage token={token} onUnauthorized={logout} expenses={expenses} currency={currency} />} />
          <Route path="/goals" element={<Goals token={token} onUnauthorized={logout} currency={currency} />} />
          <Route path="/investments" element={<Investments />} />
          <Route path="/profile" element={
            <Profile
              token={token}
              onUnauthorized={logout}
              onLogout={logout}
              setExpenses={setExpenses}
              setTotalRecived={setTotalRecived}
              setIncomeList={setIncomeList}
              currency={currency}
              setCurrency={setCurrency}
            />
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
