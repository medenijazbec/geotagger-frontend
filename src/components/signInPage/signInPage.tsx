// src/components/signInPage/signInPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import styles from './signIn.module.css';
import { API_BASE } from '../../config';
import { logUserAction } from "../../utils/logUserAction";

// static asset imports
import gradientLogo       from '../../assets/logo_gradient.png';
import logoGradientWhite  from '../../assets/logo_gradient_white.png';
import googleIcon         from '../../assets/google-icon.png';
import facebookIcon       from '../../assets/facebook-icon.png';
import RotatingGlobe from '../RotatingGlobe';

interface LoginResponse {
  token?: string;
  error?: string;
  message?: string;
}

type Msg = { type: 'error' | 'success'; text: string } | null;

const SigninPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // form state
  //const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg]           = useState<Msg>(null);

  const [email, setEmail] = useState(() => location.state?.email || "");
useEffect(() => {
  const handleScroll = () => {
    logUserAction({
      actionType: "scroll",
      componentType: null,
      url: window.location.pathname
    });
  };
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  // Handle OAuth redirect after backend completes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const externalSuccess = params.get('externalLogin') === 'success';
    const token = params.get('token');
    const externalError = params.get('externalLogin') === 'error';
    const message = params.get('message');


    
    if (externalSuccess && token) {
      localStorage.setItem('token', token);
      setMsg({ type: 'success', text: 'Login successful! Redirecting…' });
      setTimeout(() => navigate('/home', { replace: true }), 1200);
    } else if (externalError) {
      setMsg({ type: 'error', text: decodeURIComponent(message || 'External login failed.') });
    }
  }, [location.search, navigate]);

  // basic validation
  const isLoginValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length > 0;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    try {
      const resp = await fetch(`${API_BASE}/api/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await resp.json();

 // Look for "Please confirm your email before signing in."
    if (!resp.ok || !data.token) {
      setMsg({
        type: 'error',
        text: data.error || data.message || 'Login failed.',
      });
      return;
    }


      if (!resp.ok || !data.token) {
        setMsg({
          type: 'error',
          text: data.error || data.message || 'Login failed.',
        });
        return;
      }

      localStorage.setItem('token', data.token);
      setMsg({ type: 'success', text: 'Login successful! Redirecting…' });

      setTimeout(() => navigate('/home', { replace: true }), 1200);
    } catch {
      setMsg({ type: 'error', text: 'Network error. Please try again.' });
    }
  };

  // These will redirect to your backend's external OAuth flow
  const handleGoogle = () => {
    window.location.href = `${API_BASE}/api/Auth/ExternalLogin?provider=Google&returnUrl=/home`;
  };
  const handleFacebook = () => {
    window.location.href = `${API_BASE}/api/Auth/ExternalLogin?provider=Facebook&returnUrl=/home`;
  };

  return (
    <div className={styles.signup}>
      {/* LEFT PANEL: form */}
      <div className={`${styles.panel} ${styles['panel--left']}`}>
        <header className={styles['signup__header']}>
          <img
            src={gradientLogo}
            alt="Geotagger logo"
            className={styles.logo__icon}
          />
          <span className={styles.logo__text}>
            <span className={styles['logo__text--primary']}>Geo</span>tagger
          </span>
        </header>

        <form className={styles['signup__form']} onSubmit={handleLogin}>
          <h1 className={styles['signup__title']}>Sign in</h1>
          <p className={styles['signup__subtitle']}>
            Welcome back to Geotagger. We are glad that you are here.
          </p>

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

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="example@geotagger.com"
              required
              value={email}
              onChange={e => {
  logUserAction({
    actionType: "changed_value",
    componentType: "textbox",
    newValue: e.target.value,
    url: window.location.pathname
  });
  setEmail(e.target.value);
}}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <div className={styles['input-icon']}>
    <input
                type="password"
                id="password"
                placeholder="•••••••••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <span className={`${styles.icon} ${styles['icon--eye']}`}></span>
            </div>
          </div>
          <p className={styles['signup__footer-text']}>
<span
  className={styles['link--secondary']}
  style={{ cursor: "pointer" }}
  onClick={() => {
    logUserAction({
      actionType: "click",
      componentType: "link",
      newValue: "forgot_password",
      url: window.location.pathname
    });
    navigate("/reset-password", { state: { email } });
  }}
>
  Forgot password?
</span>


          </p>

          <button
            type="submit"
            className={`${styles.btn} ${styles['btn--primary']} ${styles['btn--full']}`}
            disabled={!isLoginValid}
          >
            Sign in
          </button>

<button
  type="button"
  className={`${styles.btn} ${styles['btn--outline']} ${styles['btn--full']} ${styles.social} ${styles['social--google']}`}
  onClick={() => {
    logUserAction({
      actionType: "click",
      componentType: "button",
      newValue: "signin_google",
      url: window.location.pathname
    });
    handleGoogle();
  }}
>
  <img src={googleIcon} alt="" className={styles.social__icon} />
  Sign in with Google
</button>

<button
  type="button"
  className={`${styles.btn} ${styles['btn--outline']} ${styles['btn--full']} ${styles.social} ${styles['social--facebook']}`}
  onClick={() => {
    logUserAction({
      actionType: "click",
      componentType: "button",
      newValue: "signin_facebook",
      url: window.location.pathname
    });
    handleFacebook();
  }}
>
  <img src={facebookIcon} alt="" className={styles.social__icon} />
  Sign in with Facebook
</button>


          <p className={styles['signup__footer-text']}>
            Do you want to create an account?
            <Link to="/signup" className={styles['link--primary']}>
              Sign up
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

export default SigninPage;
