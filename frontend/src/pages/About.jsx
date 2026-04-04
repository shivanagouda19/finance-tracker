import { Shield, Sun, Moon, BarChart2, Receipt, Wallet, Bell, Target, Bot, Upload, TrendingUp, Calendar as CalendarIcon, Moon as MoonIcon } from 'lucide-react';

const MoonIconComponent = () => <Moon size={15} />;
const SunIconComponent = () => <Sun size={15} />;

export default function About({ theme, toggleTheme, onNavigateToAuth }) {
  const features = [
    { icon: <BarChart2 size={40} />, title: 'Dashboard & Analytics', desc: 'Visual overview of your finances with pie charts and spending summaries.' },
    { icon: <Receipt size={40} />, title: 'Expense Tracking', desc: 'Add, edit and delete expenses with category badges and date filters.' },
    { icon: <Wallet size={40} />, title: 'Income Tracking', desc: 'Track all your income sources and monitor your total earnings.' },
    { icon: <Bell size={40} />, title: 'Upcoming Payments & Alerts', desc: 'Never miss a bill with overdue tracking and smart alerts.' },
    { icon: <Target size={40} />, title: 'Goal Setting', desc: 'Set financial goals with progress bars and monthly saving suggestions.' },
    { icon: <Bot size={40} />, title: 'AI Budget Advisor', desc: 'Gemini-powered insights that analyze your spending and suggest improvements.' },
    { icon: <Upload size={40} />, title: 'Bank Statement Import', desc: 'Upload your bank statement and auto-import transactions using AI.' },
    { icon: <TrendingUp size={40} />, title: 'Angel One Investment Tracking', desc: 'Connect your Angel One account and monitor your stock portfolio in real time.' },
    { icon: <Shield size={40} />, title: 'JWT Authentication', desc: 'All sessions are secured with JSON Web Tokens. Your credentials are never stored in plain text.' }
  ];

  const stack = [
    'React + Vite',
    'Node.js + Express',
    'MongoDB',
    'Google Gemini AI',
    'Angel One SmartAPI',
    'JWT Authentication',
  ];

  return (
    <div className="landing-page">
      {/* Top Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-content">
          <h2 className="landing-logo">FinTrack</h2>
          <div className="landing-nav-actions">
            <button className="btn btn-secondary theme-toggle" onClick={toggleTheme}>
              {theme === "dark" ? <><SunIconComponent /> Light</> : <><MoonIconComponent /> Dark</>}
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigateToAuth('login')}>
              Log In
            </button>
            <button className="btn btn-primary" onClick={() => onNavigateToAuth('signup')}>
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">FinTrack</h1>
          <p className="landing-hero-subtitle">
            Your all-in-one personal finance tracker. Manage expenses, track investments, set goals, and make smarter financial decisions with AI-powered insights.
          </p>
          <div className="landing-hero-actions">
            <button className="btn btn-primary btn-large" onClick={() => onNavigateToAuth('signup')}>
              Get Started Free
            </button>
            <button className="btn btn-secondary btn-large" onClick={() => onNavigateToAuth('login')}>
              Log In
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-section">
        <div className="landing-container">
          <h2 className="landing-section-title">Everything You Need to Manage Your Finances</h2>
          <div className="landing-features-grid">
            {features.map((feature, i) => (
              <div className="landing-feature-card" key={i}>
                <div className="landing-feature-icon">{feature.icon}</div>
                <h3 className="landing-feature-title">{feature.title}</h3>
                <p className="landing-feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="landing-section landing-section-alt">
        <div className="landing-container">
          <h2 className="landing-section-title">Built With Modern Technology</h2>
          <div className="landing-stack-grid">
            {stack.map((tech, i) => (
              <div className="landing-stack-badge" key={i}>
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="landing-container">
          <h2 className="landing-cta-title">Ready to Take Control of Your Finances?</h2>
          <p className="landing-cta-subtitle">Join FinTrack today and start your journey to financial freedom.</p>
          <button className="btn btn-primary btn-large" onClick={() => onNavigateToAuth('signup')}>
            Create Your Account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <p>© 2025 FinTrack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
