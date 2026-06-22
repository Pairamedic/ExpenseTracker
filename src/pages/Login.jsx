import { useState, useRef, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../firebase';
import { Phone, ArrowRight, RotateCcw } from 'lucide-react';

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function toE164(raw) {
  const digits = raw.replace(/\D/g, '');
  return `+1${digits}`;
}

export default function Login() {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const recaptchaRef = useRef(null);
  const verifierRef = useRef(null);

  useEffect(() => {
    // Clean up verifier on unmount
    return () => {
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }
    };
  }, []);

  async function sendCode() {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Enter a valid 10-digit US phone number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (!verifierRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: 'invisible',
          callback: () => {},
        });
      }
      const result = await signInWithPhoneNumber(auth, toE164(phone), verifierRef.current);
      setConfirmResult(result);
      setStep('otp');
    } catch (err) {
      console.error(err);
      setError('Failed to send code. Check your number and try again.');
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }
    }
    setLoading(false);
  }

  async function verifyCode() {
    if (otp.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await confirmResult.confirm(otp);
      // onAuthStateChanged in AuthContext will pick up the new user
    } catch (err) {
      console.error(err);
      setError('Invalid code. Please try again.');
    }
    setLoading(false);
  }

  function reset() {
    setStep('phone');
    setOtp('');
    setError('');
    setConfirmResult(null);
    if (verifierRef.current) {
      verifierRef.current.clear();
      verifierRef.current = null;
    }
  }

  return (
    <div style={{
      minHeight: '100svh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--bg)', padding: '1.5rem',
    }}>
      {/* invisible recaptcha anchor */}
      <div ref={recaptchaRef} />

      <div style={{ width: '100%', maxWidth: '22rem' }}>
        {/* Logo / title */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '3.5rem', height: '3.5rem', borderRadius: '1rem',
            backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1rem',
          }}>
            <Phone size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Budget Tracker
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--muted)', marginTop: '0.375rem' }}>
            {step === 'phone' ? 'Sign in with your phone number' : 'Enter the code we sent you'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '1.25rem', padding: '1.5rem',
        }}>
          {step === 'phone' ? (
            <>
              <label className="app-label">Phone Number</label>
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '0.9375rem', fontWeight: '600' }}>+1</span>
                <input
                  className="app-input"
                  style={{ paddingLeft: '2.75rem', fontSize: '1.125rem', letterSpacing: '0.03em' }}
                  type="tel"
                  inputMode="numeric"
                  placeholder="(555) 000-0000"
                  value={phone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    if (formatted.replace(/\D/g, '').length <= 10) setPhone(formatted);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                  autoFocus
                />
              </div>

              {error && (
                <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{error}</p>
              )}

              <button
                onClick={sendCode}
                disabled={loading}
                className="app-btn-primary"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Sending…' : <><ArrowRight size={18} /> Send Code</>}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                Sent to <span style={{ color: 'var(--text)', fontWeight: '700' }}>+1 {phone}</span>
              </p>

              <label className="app-label">Verification Code</label>
              <input
                className="app-input"
                style={{ fontSize: '1.75rem', textAlign: 'center', fontWeight: '800', letterSpacing: '0.4em', marginBottom: '1rem' }}
                type="tel"
                inputMode="numeric"
                maxLength={6}
                placeholder="······"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
                autoFocus
              />

              {error && (
                <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{error}</p>
              )}

              <button
                onClick={verifyCode}
                disabled={loading}
                className="app-btn-primary"
                style={{ marginBottom: '0.75rem', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Verifying…' : <><ArrowRight size={18} /> Confirm</>}
              </button>

              <button
                onClick={reset}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', width: '100%', padding: '0.75rem', background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.875rem', cursor: 'pointer' }}
              >
                <RotateCcw size={14} /> Use a different number
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
