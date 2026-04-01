import { useState, useEffect } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000';

export default function VerifyEmail() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = location.state?.email || searchParams.get('email') || sessionStorage.getItem('verifyEmail') || '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) { setError('Please enter a valid 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVerified(true);
      setMessage(data.message);
      sessionStorage.removeItem('verifyEmail');
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true); setError(''); setMessage('');
    try {
      const res = await fetch(`${API}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessage('New OTP sent to your email!');
    } catch (e) { setError(e.message); }
    setResending(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg, #0f172a)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--surface-1, #1e293b)',
        border: '1px solid var(--border, #334155)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
        boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
      }}>
        {verified ? (
          <>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: 'var(--text-1)', marginBottom: '0.5rem' }}>Email Verified!</h2>
            <p style={{ color: 'var(--text-2)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{message}</p>
            <button className="btn" onClick={() => navigate('/')} style={{ width: '100%' }}>Go to Login</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📧</div>
            <h2 style={{ color: 'var(--text-1)', marginBottom: '0.5rem' }}>Verify Your Email</h2>
            <p style={{ color: 'var(--text-2)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              We sent a 6-digit OTP to <strong style={{ color: 'var(--text-1)' }}>{email}</strong>.<br />Enter it below to activate your account.
            </p>
            {error && (
              <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.88rem' }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.88rem' }}>
                {message}
              </div>
            )}
            <input
              type="text"
              maxLength={6}
              placeholder="• • • • • •"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              style={{
                width: '100%',
                textAlign: 'center',
                fontSize: '2.2rem',
                letterSpacing: '16px',
                fontWeight: '700',
                padding: '1rem',
                borderRadius: '12px',
                border: '2px solid var(--border, #334155)',
                background: 'var(--surface-2, #0f172a)',
                color: 'var(--text-1, #f1f5f9)',
                marginBottom: '1rem',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            <button
              className="btn"
              onClick={handleVerify}
              disabled={loading}
              style={{ width: '100%', marginBottom: '0.75rem' }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              onClick={handleResend}
              disabled={resending}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.88rem', textDecoration: 'underline' }}
            >
              {resending ? 'Sending...' : "Didn't receive OTP? Resend"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
