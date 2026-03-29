import { useState, useEffect } from 'react';

const API = 'http://localhost:5000';

const STEPS = [
  {
    step: 1,
    title: 'Create a SmartAPI Account',
    desc: 'Go to smartapi.angelbroking.com and click "New Login" to register using your Angel One Client ID and MPIN.',
    link: 'https://smartapi.angelbroking.com',
    linkText: 'Open SmartAPI →',
  },
  {
    step: 2,
    title: 'Enable TOTP',
    desc: 'Click "Enable TOTP" in the navbar. Scan the QR code with Google Authenticator. Save the 32-character secret key shown below the QR code — this is your TOTP Secret.',
    link: 'https://smartapi.angelbroking.com/enable-totp',
    linkText: 'Enable TOTP →',
  },
  {
    step: 3,
    title: 'Enter Your Credentials Below',
    desc: 'Fill in your Client ID, MPIN, and TOTP Secret in the form below and click Connect.',
  },
];

export default function Investments() {
  const [tab, setTab] = useState('portfolio');
  const [holdings, setHoldings] = useState([]);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [form, setForm] = useState({ clientCode: '', pin: '', totpSecret: '' });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => { checkStatus(); }, []);

  const checkStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch(`${API}/angel/status`, { headers });
      const data = await res.json();
      if (data.connected && !data.expired) {
        setConnected(true);
        fetchHoldings();
      } else if (data.connected && data.expired) {
        setTokenExpired(true);
        setConnected(false);
      }
    } catch (e) {}
    setCheckingStatus(false);
  };

  const saveCredentials = async () => {
    if (!form.clientCode || !form.pin || !form.totpSecret) {
      setError('Please fill in all fields.'); return;
    }
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/angel/connect`, {
        method: 'POST', headers,
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setConnected(true);
      setTokenExpired(false);
      fetchHoldings();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const disconnect = async () => {
    if (!confirm('Disconnect your Angel One account?')) return;
    await fetch(`${API}/angel/disconnect`, { method: 'POST', headers });
    setConnected(false);
    setHoldings([]); setTrades([]);
  };

  const fetchHoldings = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/angel/holdings`, { headers });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setError('MARKET_CLOSED');
        setLoading(false);
        return;
      }
      if (data.error === 'TOKEN_EXPIRED') {
        setTokenExpired(true);
        setConnected(false);
        return;
      }
      if (data.error) throw new Error(data.error);
      setHoldings(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const fetchTrades = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/angel/trades`, { headers });
      const data = await res.json();
      if (data.error === 'TOKEN_EXPIRED') {
        setTokenExpired(true);
        setConnected(false);
        return;
      }
      if (data.error) throw new Error(data.error);
      setTrades(Array.isArray(data) ? data : []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleTabChange = (t) => {
    setTab(t);
    if (t === 'portfolio') fetchHoldings();
    else fetchTrades();
  };

  const importTrades = async () => {
    setImporting(true); setImportMsg('');
    try {
      const res = await fetch(`${API}/angel/import-trades`, { method: 'POST', headers });
      const data = await res.json();
      if (data.error === 'TOKEN_EXPIRED') {
        setTokenExpired(true);
        setConnected(false);
        setImportMsg('❌ Session expired. Please reconnect.');
        return;
      }
      if (data.error) throw new Error(data.error);
      setImportMsg(`✅ Imported ${data.imported} trade(s) to your records!`);
    } catch (e) { setImportMsg(`❌ ${e.message}`); }
    setImporting(false);
  };

  const totalInvested = holdings.reduce((s, h) => s + parseFloat(h.quantity || 0) * parseFloat(h.averageprice || 0), 0);
  const totalCurrent = holdings.reduce((s, h) => s + parseFloat(h.quantity || 0) * parseFloat(h.ltp || 0), 0);
  const totalPnL = totalCurrent - totalInvested;

  if (checkingStatus) return <div className="investments-page"><div className="inv-loading">Loading...</div></div>;

  if (!connected) return (
    <div className="investments-page">
      <h2 className="page-title">📈 Investments</h2>
      <p className="page-subtitle">Connect your Angel One account to view your portfolio</p>

      {/* Token expired banner */}
      {tokenExpired && (
        <div className="angel-expired-banner">
          ⏰ Your Angel One session has expired (tokens last 24 hours). Please reconnect with your credentials.
        </div>
      )}

      {/* Guide toggle */}
      <div className="angel-guide-toggle">
        <span>Don't have credentials yet?</span>
        <button onClick={() => setShowGuide(!showGuide)}>
          {showGuide ? 'Hide Guide ▲' : 'Show Step-by-Step Guide ▼'}
        </button>
      </div>

      {/* Step by step guide */}
      {showGuide && (
        <div className="angel-guide">
          {STEPS.map((s) => (
            <div className="angel-guide-step" key={s.step}>
              <div className="angel-step-num">{s.step}</div>
              <div className="angel-step-content">
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
                {s.link && <a href={s.link} target="_blank" rel="noreferrer">{s.linkText}</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect form */}
      <div className="angel-form-card">
        <h3>🔗 Connect Angel One</h3>
        <p className="angel-form-note">Your credentials are used once to get a token and never stored. Tokens expire in 24 hours.</p>
        {error && <div className="inv-error">{error}</div>}
        <div className="angel-form-grid">
          <div className="angel-field">
            <label>Client ID</label>
            <input placeholder="e.g. AAAA123456" value={form.clientCode} onChange={e => setForm({...form, clientCode: e.target.value})} />
          </div>
          <div className="angel-field">
            <label>MPIN (4-digit)</label>
            <input type="password" placeholder="Your Angel One MPIN" value={form.pin} onChange={e => setForm({...form, pin: e.target.value})} />
          </div>
          <div className="angel-field" style={{ gridColumn: '1 / -1' }}>
            <label>TOTP Secret</label>
            <input placeholder="32-char key from Enable TOTP page" value={form.totpSecret} onChange={e => setForm({...form, totpSecret: e.target.value})} />
          </div>
        </div>
        <button className="import-btn" onClick={saveCredentials} disabled={saving}>
          {saving ? 'Connecting...' : '🔗 Connect Account'}
        </button>
      </div>
    </div>
  );

  // Connected view
  return (
    <div className="investments-page">
      <div className="inv-header">
        <div>
          <h2 className="page-title">📈 Investments</h2>
          <p className="page-subtitle">Angel One portfolio via SmartAPI</p>
        </div>
        <button className="angel-disconnect-btn" onClick={disconnect}>Disconnect</button>
      </div>

      {tab === 'portfolio' && holdings.length > 0 && (
        <div className="inv-summary">
          <div className="inv-card">
            <span>Invested</span>
            <strong>₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
          </div>
          <div className="inv-card">
            <span>Current Value</span>
            <strong>₹{totalCurrent.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
          </div>
          <div className={`inv-card ${totalPnL >= 0 ? 'gain' : 'loss'}`}>
            <span>Total P&L</span>
            <strong>{totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
          </div>
        </div>
      )}

      <div className="inv-tabs">
        <button className={tab === 'portfolio' ? 'active' : ''} onClick={() => handleTabChange('portfolio')}>Portfolio</button>
        <button className={tab === 'trades' ? 'active' : ''} onClick={() => handleTabChange('trades')}>Today's Trades</button>
      </div>

      {tab === 'trades' && (
        <div className="inv-import-row">
          <button className="import-btn" onClick={importTrades} disabled={importing}>
            {importing ? 'Importing...' : '⬇ Import Trades to Records'}
          </button>
          {importMsg && <span className="import-msg">{importMsg}</span>}
        </div>
      )}

      {error === 'MARKET_CLOSED' ? (
        <div className="market-closed-box">
          <div className="market-closed-icon">🕐</div>
          <h4>Market is Closed</h4>
          <p>Holdings data is available during market hours</p>
          <span>Monday - Friday, 9:15 AM - 3:30 PM IST</span>
        </div>
      ) : error ? (
        <div className="inv-error">⚠️ {error}</div>
      ) : null}
      {loading && <div className="inv-loading">Loading...</div>}

      {tab === 'portfolio' && !loading && (
        <div className="inv-table-wrap">
          {holdings.length === 0 ? <p className="inv-empty">No holdings found.</p> : (
            <table className="inv-table">
              <thead><tr><th>Stock</th><th>Qty</th><th>Avg Price</th><th>LTP</th><th>Current Value</th><th>P&L</th></tr></thead>
              <tbody>
                {holdings.map((h, i) => {
                  const invested = parseFloat(h.quantity) * parseFloat(h.averageprice);
                  const current = parseFloat(h.quantity) * parseFloat(h.ltp);
                  const pnl = current - invested;
                  return (
                    <tr key={i}>
                      <td><strong>{h.tradingsymbol}</strong><br /><small>{h.exchange}</small></td>
                      <td>{h.quantity}</td>
                      <td>₹{parseFloat(h.averageprice).toFixed(2)}</td>
                      <td>₹{parseFloat(h.ltp).toFixed(2)}</td>
                      <td>₹{current.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                      <td className={pnl >= 0 ? 'gain' : 'loss'}>{pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'trades' && !loading && (
        <div className="inv-table-wrap">
          {trades.length === 0 ? <p className="inv-empty">No trades today.</p> : (
            <table className="inv-table">
              <thead><tr><th>Stock</th><th>Type</th><th>Qty</th><th>Price</th><th>Value</th><th>Time</th></tr></thead>
              <tbody>
                {trades.map((t, i) => (
                  <tr key={i}>
                    <td><strong>{t.tradingsymbol}</strong><br /><small>{t.exchange}</small></td>
                    <td><span className={`badge ${t.transactiontype === 'BUY' ? 'badge-buy' : 'badge-sell'}`}>{t.transactiontype}</span></td>
                    <td>{t.quantity}</td>
                    <td>₹{parseFloat(t.tradeprice).toFixed(2)}</td>
                    <td>₹{(parseFloat(t.quantity) * parseFloat(t.tradeprice)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td>{t.updatetime || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
