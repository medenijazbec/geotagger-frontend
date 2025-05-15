// src/components/signUpPage/singUpPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './signup.module.css';
import { API_BASE } from '../../config';

/* ── assets ── */
import gradientLogo       from '../../assets/logo_gradient.png';
import avatarPlaceholder  from '../../assets/profile_white.png';
import mapImage           from '../../assets/signinMap.png';
import logoGradientWhite  from '../../assets/logo_gradient_white.png';
import RotatingGlobe from '../RotatingGlobe';

/* ── helpers ── */
const emailRx  = /^\S+@\S+\.\S+$/;
const pwdRx    = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,100}$/;

interface ApiMessage {
  Errors?: { Description: string }[];
  Message?: string;
}
type Msg = { type: 'error' | 'success'; text: string } | null;

const SignupPage: React.FC = () => {
  const nav = useNavigate();

  /* form state */
  const [email,       setEmail]       = useState('');
  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [password,    setPassword]    = useState('');
  const [password2,   setPassword2]   = useState('');
  const [msg,         setMsg]         = useState<Msg>(null);

  /* validation flags */
  const vEmail      = emailRx.test(email);
  const vFirst      = firstName.length >= 2 && firstName.length <= 50;
  const vLast       = lastName.length  >= 2 && lastName.length  <= 50;
  const vPwd        = pwdRx.test(password);
  const vPwdMatch   = password === password2;

  const formValid   = vEmail && vFirst && vLast && vPwd && vPwdMatch;

  /* submit */
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setMsg(null);

  // proper validation
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailValid || firstName.length < 2 || lastName.length < 2 || password.length < 8 || password !== password2) {
    setMsg({ type: 'error', text: 'Please correctly fill all fields.' });
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/Auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: firstName,
        surname: lastName,
        email,
        password,
        confirmPassword: password2,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setMsg({
        type: 'error',
        text: data.Errors?.[0]?.Description || data.Message || 'Registration failed.',
      });
      return;
    }

    setMsg({ type: 'success', text: 'Registration successful! Redirecting…' });
    setTimeout(() => nav('/signin', { replace: true }), 1500);
  } catch (err) {
    setMsg({ type: 'error', text: 'Network error. Please try again.' });
    console.error("Error:", err);
  }
};


  /* ── render ── */
  return (
    <div className={styles.signup}>
      {/* LEFT panel */}
      <div className={styles['panel--left']}>
        <header className={styles.signup__header}>
          <img src={gradientLogo} alt="Geotagger" className={styles.logo__icon} />
<span className={styles.logo__text}>
  <span className={styles['logo__text--primary']}>Geo</span>tagger
</span>
        </header>

        <form className={styles.signup__form} onSubmit={handleSubmit}>
          <h1 className={styles.signup__title}>Sign up</h1>
          <p className={styles.signup__subtitle}>
            Your name will appear on posts and your public profile.
          </p>

          <div className={styles.avatar}>
            <img src={avatarPlaceholder} alt="" />
          </div>

          {msg && (
            <p
              style={{
                color: msg.type === 'error' ? 'red' : 'green',
                textAlign: 'center',
                marginBottom: '1rem',
              }}
            >
              {msg.text}
            </p>
          )}

          {/* E-mail */}
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              placeholder="hey@geotagger.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            {!vEmail && email && (
              <small style={{ color: 'red' }}>Enter a valid e-mail address</small>
            )}
          </div>

          {/* Names */}
<div className={styles['field-group']}>
  <div className={`${styles.field} ${styles.half}`}>
    <label>First name</label>
    <input
      type="text"
      placeholder="John"
      value={firstName}
      onChange={e => setFirstName(e.target.value)}
      required
      aria-invalid={!vFirst && !!firstName}
    />
    {!vFirst && firstName && (
      <small style={{ color: 'red' }}>2 – 50 characters</small>
    )}
    {vFirst && firstName && (
      <small style={{ color: 'green' }}>✓</small>
    )}
  </div>
  <div className={`${styles.field} ${styles.half}`}>
    <label>Last name</label>
    <input
      type="text"
      placeholder="Doe"
      value={lastName}
      onChange={e => setLastName(e.target.value)}
      required
      aria-invalid={!vLast && !!lastName}
    />
    {!vLast && lastName && (
      <small style={{ color: 'red' }}>2 – 50 characters</small>
    )}
    {vLast && lastName && (
      <small style={{ color: 'green' }}>✓</small>
    )}
  </div>
</div>


          {/* Password */}
          <div className={styles.field}>
            <label>Password</label>
            <div className={styles.inputIcon}>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <span className={`${styles.icon} ${styles['icon--eye']}`} />
            </div>
            {!vPwd && password && (
              <small style={{ color: 'red' }}>
                8+ chars, 1 upper, 1 lower, 1 digit, 1 symbol
              </small>
            )}
          </div>

          {/* Repeat */}
          <div className={styles.field}>
            <label>Repeat password</label>
            <div className={styles.inputIcon}>
              <input
                type="password"
                placeholder="••••••••"
                value={password2}
                onChange={e => setPassword2(e.target.value)}
                required
              />
              <span className={`${styles.icon} ${styles['icon--eye']}`} />
            </div>
            {!vPwdMatch && password2 && (
              <small style={{ color: 'red' }}>Passwords don’t match</small>
            )}
          </div>

          <button
            type="submit"
            className={`${styles.btn} ${styles['btn--primary']} ${styles['btn--full']}`}
            disabled={!formValid}
          >
            Sign up
          </button>

          <p className={styles.signup__footerText}>
            Already have an account?
            <Link to="/signin" className={styles['link--primary']}>
              &nbsp;Sign in
            </Link>
          </p>
        </form>
      </div>

      {/* RIGHT PANEL: tinted map + white logo */}
<div className={styles['panel--right']}>
  <div className={styles['rotating-globe-container']}>
    <RotatingGlobe />
  </div>
   {/* <div className={styles.overlay}></div> */}
  <div className={styles['right-logo-wrapper']}>
    <img src={logoGradientWhite} alt="Geotagger" className={styles['right-logo']} />
  </div>
</div>

    </div>
  );
};

export default SignupPage;
