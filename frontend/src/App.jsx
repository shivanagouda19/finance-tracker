import { useEffect, useState } from "react";
import Expense from "./Expense";
import DigitalClock from "./DigitalClock";
import TotalBalance from "./TotalBalance";
import TotalRecived from "./TotalRecived";
import TotalReceivedCard from "./TotalReceivedCard";
import TotalSpent from "./TotalSpent";
import ExpenseChart from "./ExpenseChart";
import "./App.css";

// ── Icon helpers ──────────────────────────────────────────
const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

// ── App ───────────────────────────────────────────────────
function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  const [expenses, setExpenses] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authMessage, setAuthMessage] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [totalRecived, setTotalRecived] = useState(0);

  useEffect(() => { localStorage.setItem("theme", theme); }, [theme]);

  function toggleTheme() {
    setTheme(prev => prev === "light" ? "dark" : "light");
  }

  async function handleAuthSubmit() {
    if (!email.trim() || !password) {
      setAuthMessage("Email and password are required.");
      return;
    }

    const endpoint = isLoginMode ? "login" : "signup";
    const response = await fetch(`http://localhost:5000/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password })
    });

    const data = await response.json();

    if (!response.ok) {
      setAuthMessage(data.error || "Authentication failed.");
      return;
    }

    if (!isLoginMode) {
      setAuthMessage("Account created. Please log in.");
      setIsLoginMode(true);
      setPassword("");
      return;
    }

    localStorage.setItem("token", data.token);
    setToken(data.token);
    setAuthMessage("");
    setPassword("");
  }

  function handleAuthKeyDown(e) {
    if (e.key === "Enter") handleAuthSubmit();
  }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setExpenses([]);
    setTotalRecived(0);
  }

  // ── Auth Screen ──────────────────────────────────────────
  if (!token) {
    return (
      <div className="app-shell" data-theme={theme}>
        <div className="app auth-app">
          <div className="top-controls">
            <button className="btn btn-secondary theme-toggle" onClick={toggleTheme}>
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </div>

          <header className="app-header auth-header">
            <h1>Expense Tracker</h1>
            <p>{isLoginMode ? "Welcome back — log in to continue" : "Create your account to get started"}</p>
          </header>

          <section className="card auth-card">
            <div className="auth-form">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleAuthKeyDown}
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleAuthKeyDown}
                autoComplete={isLoginMode ? "current-password" : "new-password"}
              />
              <button className="btn" onClick={handleAuthSubmit}>
                {isLoginMode ? "Log in" : "Create account"}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => { setIsLoginMode(p => !p); setAuthMessage(""); }}
              >
                {isLoginMode ? "Need an account? Sign up" : "Already have an account? Log in"}
              </button>
              {authMessage && <p className="auth-message">{authMessage}</p>}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────
  return (
    <>
    <div className="app-shell" data-theme={theme}>
      <div className="app">

        {/* Top bar */}
        <div className="top-controls">
          <button className="btn btn-secondary theme-toggle" onClick={toggleTheme}>
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button className="btn btn-secondary logout-button" onClick={logout}>
            <LogoutIcon /> Logout
          </button>
        </div>

        {/* Header */}
        <header className="app-header dashboard-header">
          <h1>Expense Tracker</h1>
          <p>Financial dashboard — income, spending &amp; net balance</p>
          <DigitalClock />
        </header>

        {/* Summary row */}
        <section className="summary-section">
          <p className="section-kicker">Overview</p>
          <div className="summary-grid">
            <TotalSpent expenses={expenses} />
            <TotalReceivedCard totalRecived={totalRecived} />
            <TotalBalance expenses={expenses} totalRecived={totalRecived} />
          </div>
        </section>

        {/* Expense Chart */}
        <ExpenseChart expenses={expenses} />

        {/* Transactions */}
        <section className="dashboard-section">
          <p className="section-kicker">Transactions</p>
          <div className="dashboard-grid">
            <div className="card panel-expense">
              <Expense
                token={token}
                onUnauthorized={logout}
                expenses={expenses}
                setExpenses={setExpenses}
              />
            </div>
            <div className="card panel-income">
              <TotalRecived
                token={token}
                onUnauthorized={logout}
                setTotalRecived={setTotalRecived}
              />
            </div>
          </div>
        </section>

      </div>
    </div>
    </>
  );
}

export default App;