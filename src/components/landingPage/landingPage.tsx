// src/components/landingPage/landingPage.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './landing.module.css';

// ── assets ──────────────────────────────────────────────────────
import logoGradient    from '../../assets/logo_gradient.png';
import worldMapImg      from '../../assets/worldmap.png';
import card1Img         from '../../assets/placeholder_places1.png';
import card2Img         from '../../assets/placeholder_places2.png';
import card3Img         from '../../assets/placeholder_places3.png';
import padlockPng       from '../../assets/padlock.png';

/* helper for locked demo cards */
const cardBg = [card1Img, card2Img, card3Img];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const goSignin = () => navigate('/signin');

  return (
    <div className={styles.container /* body */}>
      {/* ───────────────── HEADER ───────────────── */}
      <header className={styles.header}>
        <div className={styles.logo}>          
          <img src={logoGradient} alt="Geotagger icon" className={styles.logo__icon} />
          <span className={styles.logo__text}>Geotagger</span>
        </div>

        <nav className={styles.nav}>
          <Link to="/signin" className={styles.nav__link}>Sign in</Link>
          <span className={styles.nav__sep}>or</span>
          <Link to="/signup" className={`${styles.btn} ${styles['btn--primary']}`}>
            Sign up
          </Link>
        </nav>
      </header>

      {/* ───────────────── MAIN ───────────────── */}
      <main className={styles.main}>
        {/* HERO */}
        <section className={styles.hero}>
          <div className={styles.hero__text}>
            <h1 className={styles.hero__title}>Explore the world with Geotagger!</h1>
            <p className={styles.hero__subtitle}>
              Geotagger is a website that allows you to post a picture and tag it on the map. Other users then
              try to locate it via Google&nbsp;Maps.
            </p>
            <Link
              to="/signup"
              className={`${styles.btn} ${styles['btn--primary']} ${styles['btn--large']}`}
            >
              Sign up
            </Link>
          </div>

          <div className={styles.hero__imageWrapper /* wrapper class uses camel‑case due to module */}>
            <img src={worldMapImg} alt="decorative world map" aria-hidden="true" className={styles.hero__image} />
          </div>
        </section>

        {/* DEMO (locked preview cards) */}
        <section className={styles.demo}>
          <h2 className={styles.demo__title}>Try yourself at Geotagger!</h2>
          <p className={styles.demo__desc}>
            Try to guess the location of an image by selecting a position on the map. When you guess it, it gives you the error distance.
          </p>

          <div className={styles.demo__cards}>
            {cardBg.map((src, i) => (
              <div
                key={i}
                className={`${styles.demo__card} ${styles[`card--${i + 1}`]}`}
                style={{ backgroundImage: `url(${src})` }}
                onClick={goSignin}
              >
                <div className={styles.demo__overlay}>
                  <span
                    className={styles.iconLock}
                    style={{ backgroundImage: `url(${padlockPng})` }}
                  ></span>
                </div>
              </div>
            ))}
          </div>

          <Link to="/signup" className={`${styles.btn} ${styles['btn--primary']}`}>
            Sign up
          </Link>
        </section>
      </main>

      {/* ───────────────── FOOTER ───────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footer__left}>© 2025 Geotagger</div>
        <div className={styles.footer__right}>
          All Rights Reserved |{' '}
          <a href="https://skillupmentor.com" target="_blank" rel="noreferrer">
            skillupmentor.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
