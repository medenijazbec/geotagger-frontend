// src/components/landingPage/landingPage.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './landing.module.css';
import { makeImgUrl } from '../../utils/img';
// ── assets ──────────────────────────────────────────────────────
import logoGradient from '../../assets/logo_gradient.png';
import worldMapImg from '../../assets/worldmap.png';
import padlockPng from '../../assets/padlock.png';
import { logUserAction } from "../../utils/logUserAction";

interface Location {
  locationId: number;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
}
const PLACEHOLDERS: Location[] = [
  {
    locationId: -1,
    title: "Coming soon",
    description: "",
    latitude: 0,
    longitude: 0,
    imageUrl: "/images/placeholder_places1.png",
  },
  {
    locationId: -2,
    title: "Coming soon",
    description: "",
    latitude: 0,
    longitude: 0,
    imageUrl: "/images/placeholder_places2.png",
  },
  {
    locationId: -3,
    title: "Coming soon",
    description: "",
    latitude: 0,
    longitude: 0,
    imageUrl: "/images/placeholder_places3.png",
  },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const goSignin = () => navigate('/signin');

  // Fetch 3 demo locations
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);


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

useEffect(() => {
  const fetchRandomLocations = async () => {
    setLoading(true);

    try {
      /* --------------------------------------------
         Keep requesting /api/Locations/random until
         we have THREE *unique* locationIds.
         A safety cap (MAX_ATTEMPTS) prevents any
         endless loop if the API has <3 active pics.
      -------------------------------------------- */
      const found = new Map<number, Location>();
      let attempts = 0;
      const MAX_ATTEMPTS = 12;               // ~4 network round-trips

      while (found.size < 3 && attempts < MAX_ATTEMPTS) {
        attempts += 1;
        const res = await fetch('/api/Locations/random');
        if (!res.ok) continue;               // ignore network / 404 errors

        const loc = (await res.json()) as Location;
        found.set(loc.locationId, loc);      // Map dedupes by id
      }

      /* If the backend returned <3 *unique* locations
         we fill the remainder by repeating the ones we got,
         so the UI still shows exactly three cards.          */
      const list: Location[] = [...found.values()];
      while (list.length < 3 && list.length > 0) {
        list.push(list[list.length % found.size]);
      }

      setLocations(list);
    } catch {
      setLocations([]);                      // fallback – keep previous placeholders
    } finally {
      setLoading(false);
    }
  };

  fetchRandomLocations();
}, []);



  //skeleton/fallback for cards while loading
  const demoCards = loading
    ? Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={`${styles.demo__card} ${styles[`card--${i + 1}`]} ${styles.demo__card__loading}`}
          style={{ background: '#e7ece9' }}
        >
          <div className={styles.demo__overlay}>
            <span className={styles.iconLock} style={{ opacity: 0.3 }} />
          </div>
        </div>
      ))
    : (locations && locations.length > 0
        ? locations.map((loc, i) => (
<div
  key={loc.locationId}
  className={styles.demo__card}
  onClick={goSignin}
  title={loc.title}
  style={{ position: 'relative' }}
>
  {/* Background image */}
  <div
    className={styles.demo__cardBg}
    style={{
      backgroundImage: `url(${makeImgUrl(loc.imageUrl)})`  // ← FIX
    }}
  />

  {/* Green overlay */}
  <div className={styles.demo__overlay__green}>
    <span
      className={styles.iconLock}
      style={{ backgroundImage: `url(${padlockPng})` }}
    />
  </div>
</div>


          ))
        : // fallback to static placeholders if API fails
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`${styles.demo__card} ${styles[`card--${i + 1}`]}`}
              onClick={goSignin}
            >
              <div className={styles.demo__overlay__green}>
                <span
                  className={styles.iconLock}
                  style={{ backgroundImage: `url(${padlockPng})` }}
                ></span>
              </div>
            </div>
          ))
      );

  return (
    <div className={styles.container}>
      {/* ───────────── HEADER ───────────── */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <img src={logoGradient} alt="Geotagger icon" className={styles.logo__icon} />
<span className={styles.logo__text}>
  <span className={styles['logo__text--primary']}>Geo</span>tagger
</span>

        </div>

<nav className={styles.nav}>
  <Link
    to="/signin"
    className={styles.nav__link}
    onClick={() => {
      logUserAction({
        actionType: "click",
        componentType: "link",
        newValue: "sign_in",
        url: window.location.pathname,
      });
    }}
  >
    Sign in
  </Link>
  <span className={styles.nav__sep}>or</span>
  <Link
    to="/signup"
    className={`${styles.btn} ${styles['btn--primary']}`}
    onClick={() => {
      logUserAction({
        actionType: "click",
        componentType: "link",
        newValue: "sign_up",
        url: window.location.pathname,
      });
    }}
  >
    Sign up
  </Link>
</nav>

      </header>

      {/* ───────────── MAIN ───────────── */}
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

          <div className={styles.hero__imageWrapper}>
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
            {demoCards}
          </div>

          <Link to="/signup" className={`${styles.btn} ${styles['btn--primary']}`}>
            Sign up
          </Link>
        </section>
      </main>

      {/* ───────────── FOOTER ───────────── */}
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
