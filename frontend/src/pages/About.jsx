export default function About() {
  const features = [
    { icon: '📊', title: 'Dashboard & Analytics', desc: 'Visual overview of your finances with pie charts and spending summaries.' },
    { icon: '💸', title: 'Expense Tracking', desc: 'Add, edit and delete expenses with category badges and date filters.' },
    { icon: '💰', title: 'Income Tracking', desc: 'Track all your income sources and monitor your total earnings.' },
    { icon: '🔔', title: 'Upcoming Payments', desc: 'Never miss a bill with overdue tracking and smart alerts.' },
    { icon: '🎯', title: 'Goal Setting', desc: 'Set financial goals with progress bars and monthly saving suggestions.' },
    { icon: '🤖', title: 'AI Budget Advisor', desc: 'Gemini-powered insights that analyze your spending and suggest improvements.' },
    { icon: '🏦', title: 'Bank Statement Import', desc: 'Upload your bank statement and auto-import transactions using AI.' },
    { icon: '📈', title: 'Investment Tracking', desc: 'Connect your Angel One account and monitor your stock portfolio in real time.' },
    { icon: '📅', title: 'Calendar View', desc: 'See your expenses and payments on an interactive calendar.' },
    { icon: '🌙', title: 'Dark / Light Mode', desc: 'Easy on the eyes with full dark and light theme support.' },
  ];

  const stack = [
    { label: 'Frontend', value: 'React + Vite + React Router' },
    { label: 'Backend', value: 'Node.js + Express' },
    { label: 'Database', value: 'MongoDB' },
    { label: 'AI', value: 'Google Gemini 2.0 Flash' },
    { label: 'Investments', value: 'Angel One SmartAPI' },
    { label: 'Auth', value: 'JWT + Email OTP Verification' },
    { label: 'Email', value: 'Nodemailer + Gmail SMTP' },
    { label: 'Styling', value: 'CSS Variables + Dark/Light Mode' },
  ];

  return (
    <div className="about-page">

      {/* Hero */}
      <div className="about-hero">
        <h1>FinTrack</h1>
        <p>A full-stack personal finance tracker built to help you manage expenses, track investments, set goals, and make smarter financial decisions — all in one place.</p>
      </div>

      {/* Features */}
      <section className="about-section">
        <h2 className="about-section-title">Features</h2>
        <div className="about-features-grid">
          {features.map((f, i) => (
            <div className="about-feature-card" key={i}>
              <span className="about-feature-icon">{f.icon}</span>
              <div>
                <strong>{f.title}</strong>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="about-section">
        <h2 className="about-section-title">Tech Stack</h2>
        <div className="about-stack">
          {stack.map((s, i) => (
            <div className="about-stack-row" key={i}>
              <span className="about-stack-label">{s.label}</span>
              <span className="about-stack-value">{s.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Version */}
      <section className="about-section">
        <h2 className="about-section-title">App Info</h2>
        <div className="about-stack">
          <div className="about-stack-row">
            <span className="about-stack-label">Version</span>
            <span className="about-stack-value">1.0.0</span>
          </div>
          <div className="about-stack-row">
            <span className="about-stack-label">Last Updated</span>
            <span className="about-stack-value">April 2025</span>
          </div>
          <div className="about-stack-row">
            <span className="about-stack-label">License</span>
            <span className="about-stack-value">MIT</span>
          </div>
        </div>
      </section>

    </div>
  );
}
