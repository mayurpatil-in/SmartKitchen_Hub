import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from '../redux/slices/authSlice';
import { addToast } from '../redux/slices/notificationSlice';
import API from '../api';
import { Mail, Lock, LogIn, Eye, EyeOff, ChefHat } from 'lucide-react';

/* ─────────────────────────────────────────────
   Animated floating particles canvas
───────────────────────────────────────────── */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.4,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.45 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${p.alpha})`;
        ctx.fill();
      });

      // Draw subtle connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(52, 211, 153, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
};



/* ─────────────────────────────────────────────
   Feature highlights for left panel
───────────────────────────────────────────── */
const FEATURES = [
  { icon: '📊', text: 'Real-time Sales Analytics' },
  { icon: '🧾', text: 'AI-powered Quotation PDFs' },
  { icon: '🏭', text: 'Inventory Warehouse Audit' },
  { icon: '🔧', text: 'AMC Service Scheduling' },
];

/* ─────────────────────────────────────────────
   Main Login Component
───────────────────────────────────────────── */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [focused, setFocused] = useState({ email: false, password: false });

  const { isLoading, isAuthenticated } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Email and password are required.' }));
      return;
    }
    dispatch(loginStart());
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.success) {
        dispatch(loginSuccess(res.data));
        dispatch(addToast({ type: 'success', message: `Welcome back, ${res.data.user.first_name}! 🎉` }));
        navigate(from, { replace: true });
      }
    } catch (err) {
      dispatch(loginFailure(err.message));
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };



  return (
    <>
      {/* ── Google Font import ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        .skh-login-root {
          font-family: 'Inter', system-ui, sans-serif;
          min-height: 100vh;
          width: 100%;
          display: flex;
          background: #080c14;
          position: relative;
          overflow: hidden;
        }

        /* ── Animated gradient background blobs ── */
        .skh-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          animation: blobPulse 8s ease-in-out infinite alternate;
        }
        .skh-blob-1 {
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%);
          top: -200px; left: -200px;
          animation-delay: 0s;
        }
        .skh-blob-2 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%);
          bottom: -150px; right: -150px;
          animation-delay: -4s;
        }
        .skh-blob-3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          animation-delay: -2s;
        }
        @keyframes blobPulse {
          from { transform: scale(1) translate(0, 0); }
          to   { transform: scale(1.15) translate(20px, 20px); }
        }
        .skh-blob-1 { animation: blobPulse1 10s ease-in-out infinite alternate; }
        .skh-blob-3 { animation: blobPulse3 12s ease-in-out infinite alternate; }
        @keyframes blobPulse1 {
          from { transform: scale(1) translate(0, 0); }
          to   { transform: scale(1.1) translate(30px, 20px); }
        }
        @keyframes blobPulse3 {
          from { transform: scale(1) translate(-50%, -50%); }
          to   { transform: scale(1.2) translate(calc(-50% + 15px), calc(-50% - 10px)); }
        }

        /* ── Grid overlay ── */
        .skh-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(52,211,153,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(52,211,153,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        /* ── Left brand panel ── */
        .skh-left {
          width: 48%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 56px;
          position: relative;
          z-index: 2;
          border-right: 1px solid rgba(52,211,153,0.07);
        }

        /* ── Logo ── */
        .skh-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .skh-logo-icon {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 24px rgba(16,185,129,0.4);
          animation: logoPulse 3s ease-in-out infinite;
        }
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 0 24px rgba(16,185,129,0.4); }
          50%       { box-shadow: 0 0 40px rgba(16,185,129,0.65); }
        }
        .skh-logo-text { line-height: 1.1; }
        .skh-logo-brand {
          font-size: 14px; font-weight: 800;
          color: #fff; letter-spacing: 0.5px;
        }
        .skh-logo-sub {
          font-size: 10px; font-weight: 500;
          color: #34d399; letter-spacing: 2px;
          text-transform: uppercase;
        }

        /* ── Hero text ── */
        .skh-hero { margin: auto 0; }
        .skh-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(52,211,153,0.08);
          border: 1px solid rgba(52,211,153,0.2);
          border-radius: 100px;
          padding: 5px 14px;
          font-size: 10px;
          font-weight: 700;
          color: #34d399;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 28px;
        }
        .skh-badge-dot {
          width: 6px; height: 6px;
          background: #34d399;
          border-radius: 50%;
          animation: dotPulse 2s ease-in-out infinite;
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.7); }
        }
        .skh-h1 {
          font-size: clamp(28px, 3vw, 46px);
          font-weight: 900;
          color: #fff;
          line-height: 1.1;
          letter-spacing: -1.5px;
          margin: 0 0 20px;
        }
        .skh-h1 span { color: #34d399; }
        .skh-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.8;
          max-width: 380px;
          font-weight: 400;
          margin-bottom: 44px;
        }

        /* ── Feature pills ── */
        .skh-features {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .skh-feature {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .skh-feature:hover {
          background: rgba(52,211,153,0.05);
          border-color: rgba(52,211,153,0.15);
          color: #cbd5e1;
          transform: translateY(-1px);
        }
        .skh-feature-icon { font-size: 18px; }

        /* ── Footer ── */
        .skh-footer {
          font-size: 11px;
          color: #334155;
          font-weight: 600;
        }
        .skh-footer span { color: #34d399; }

        /* ── Right form panel ── */
        .skh-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          position: relative;
          z-index: 2;
        }

        /* ── Glass card ── */
        .skh-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 28px;
          padding: 44px 40px;
          backdrop-filter: blur(24px);
          box-shadow:
            0 0 0 1px rgba(52,211,153,0.04),
            0 32px 64px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.06);
          animation: cardFadeIn 0.6s cubic-bezier(0.16,1,0.3,1) both;
        }
        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .skh-card-header { margin-bottom: 36px; }
        .skh-card-eyebrow {
          font-size: 10px;
          font-weight: 700;
          color: #34d399;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .skh-card-title {
          font-size: 26px;
          font-weight: 800;
          color: #f1f5f9;
          letter-spacing: -0.8px;
          margin: 0 0 6px;
        }
        .skh-card-subtitle {
          font-size: 12.5px;
          color: #475569;
          font-weight: 400;
        }

        /* ── Form fields ── */
        .skh-field { margin-bottom: 18px; }
        .skh-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .skh-input-wrap {
          position: relative;
          transition: all 0.2s ease;
        }
        .skh-input-wrap.focused::after {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 15px;
          background: transparent;
          border: 1.5px solid #34d399;
          pointer-events: none;
          box-shadow: 0 0 20px rgba(52,211,153,0.15);
        }
        .skh-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #334155;
          pointer-events: none;
          transition: color 0.2s;
          display: flex;
          align-items: center;
        }
        .skh-input-wrap.focused .skh-icon { color: #34d399; }
        .skh-input {
          width: 100%;
          box-sizing: border-box;
          background: rgba(255,255,255,0.025);
          border: 1.5px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 14px 16px 14px 46px;
          color: #f1f5f9;
          font-size: 13.5px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          outline: none;
          transition: all 0.25s ease;
        }
        .skh-input::placeholder { color: #1e293b; }
        .skh-input:focus {
          background: rgba(52,211,153,0.04);
          border-color: transparent;
        }
        .skh-eye-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #334155;
          display: flex;
          align-items: center;
          padding: 4px;
          border-radius: 6px;
          transition: color 0.2s;
        }
        .skh-eye-btn:hover { color: #34d399; }

        /* ── Submit button ── */
        .skh-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.3px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 28px;
          transition: all 0.25s ease;
          box-shadow: 0 4px 24px rgba(16,185,129,0.35);
          position: relative;
          overflow: hidden;
        }
        .skh-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.25s;
        }
        .skh-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(16,185,129,0.5);
        }
        .skh-btn:hover::before { opacity: 1; }
        .skh-btn:active { transform: translateY(0); }
        .skh-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 4px 16px rgba(16,185,129,0.2);
        }
        .skh-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Mobile-only logo (hidden on desktop) ── */
        .skh-mobile-logo {
          display: none;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 28px;
        }

        /* ── Card footer credit ── */
        .skh-card-footer {
          margin-top: 28px;
          padding-top: 18px;
          border-top: 1px solid rgba(255,255,255,0.04);
          text-align: center;
          font-size: 11px;
          font-weight: 500;
          color: #475569;
          letter-spacing: 0.3px;
        }
        .skh-card-footer span {
          color: #64748b;
          font-weight: 600;
        }
        .skh-card-footer strong {
          color: #34d399;
          font-weight: 700;
        }
        .skh-credit-link {
          color: #34d399;
          font-weight: 700;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .skh-credit-link:hover {
          color: #6ee7b7;
          border-bottom-color: #6ee7b7;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .skh-login-root { flex-direction: column; }
          .skh-left { display: none; }
          .skh-mobile-logo { display: flex; }
          .skh-right {
            flex: 1;
            min-height: 100vh;
            padding: 40px 20px 32px;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .skh-card { padding: 36px 28px; width: 100%; }
        }
        @media (max-width: 480px) {
          .skh-right { padding: 32px 16px 24px; }
          .skh-card { padding: 28px 20px; border-radius: 20px; }
        }

      `}</style>

      <div className="skh-login-root">
        {/* Background elements */}
        <div className="skh-blob skh-blob-1" />
        <div className="skh-blob skh-blob-2" />
        <div className="skh-blob skh-blob-3" />
        <div className="skh-grid" />
        <ParticleCanvas />

        {/* ── LEFT BRAND PANEL ── */}
        <div className="skh-left">
          {/* Logo */}
          <div className="skh-logo">
            <div className="skh-logo-icon">
              <ChefHat size={22} color="#fff" strokeWidth={2.5} />
            </div>
            <div className="skh-logo-text">
              <div className="skh-logo-brand">SmartKitchen Hub</div>
              <div className="skh-logo-sub">Enterprise Platform</div>
            </div>
          </div>

          {/* Hero */}
          <div className="skh-hero">
            <div className="skh-badge">
              <div className="skh-badge-dot" />
              B2B Commercial Kitchen Suite
            </div>
            <h1 className="skh-h1">
              Manage Your<br />
              Kitchen Empire<br />
              <span>Smarter.</span>
            </h1>
            <p className="skh-desc">
              The all-in-one enterprise platform for commercial kitchen equipment businesses — from intelligent inventory management to automated PDF quotations and AMC scheduling.
            </p>
            <div className="skh-features">
              {FEATURES.map((f) => (
                <div className="skh-feature" key={f.text}>
                  <span className="skh-feature-icon">{f.icon}</span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="skh-footer">
            © 2026 <span>SmartKitchen Hub</span> Solutions Ltd. All rights reserved.
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div className="skh-right">

          {/* Mobile-only logo */}
          <div className="skh-mobile-logo">
            <div className="skh-logo-icon">
              <ChefHat size={22} color="#fff" strokeWidth={2.5} />
            </div>
            <div className="skh-logo-text">
              <div className="skh-logo-brand">SmartKitchen Hub</div>
              <div className="skh-logo-sub">Enterprise Platform</div>
            </div>
          </div>

          <div className="skh-card">
            <div className="skh-card-header">
              <div className="skh-card-eyebrow">Secure Access Portal</div>
              <h2 className="skh-card-title">Welcome back 👋</h2>
              <p className="skh-card-subtitle">Sign in to your SmartKitchen Hub account</p>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off">
              {/* Email */}
              <div className="skh-field">
                <label className="skh-label" htmlFor="skh-email">Email Address</label>
                <div className={`skh-input-wrap ${focused.email ? 'focused' : ''}`}>
                  <span className="skh-icon">
                    <Mail size={16} strokeWidth={2} />
                  </span>
                  <input
                    id="skh-email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="your@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused((f) => ({ ...f, email: true }))}
                    onBlur={() => setFocused((f) => ({ ...f, email: false }))}
                    className="skh-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="skh-field">
                <label className="skh-label" htmlFor="skh-password">Password</label>
                <div className={`skh-input-wrap ${focused.password ? 'focused' : ''}`}>
                  <span className="skh-icon">
                    <Lock size={16} strokeWidth={2} />
                  </span>
                  <input
                    id="skh-password"
                    type={showPw ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused((f) => ({ ...f, password: true }))}
                    onBlur={() => setFocused((f) => ({ ...f, password: false }))}
                    className="skh-input"
                    style={{ paddingRight: '46px' }}
                  />
                  <button
                    type="button"
                    className="skh-eye-btn"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                id="skh-signin-btn"
                type="submit"
                disabled={isLoading}
                className="skh-btn"
              >
                {isLoading ? (
                  <span className="skh-spinner" />
                ) : (
                  <>
                    <LogIn size={16} strokeWidth={2.5} />
                    Sign In to Dashboard
                  </>
                )}
              </button>
            </form>

            {/* Copyright footer */}
            <div className="skh-card-footer">
              <span>© {new Date().getFullYear()} SmartKitchen Hub</span>{' · Designed by '}<a href="https://www.mayurpatil.in" target="_blank" rel="noopener noreferrer" className="skh-credit-link">Mayur Patil</a>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
