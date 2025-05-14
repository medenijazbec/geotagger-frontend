/* ──────────────────────────────────────────────────────────
   Fully typed – no TS errors
   ────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './home.module.css';
import { API_BASE } from '../../config';

/* ── assets ─────────────────────────────────────────────── */
import gradientLogo      from '../../assets/logo_gradient.png';
import avatarPlaceholder from '../../assets/profile_white.png';
import plusIcon          from '../../assets/plus.png';
import placeholder1      from '../../assets/placeholder_places1.png';
import placeholder2      from '../../assets/placeholder_places2.png';
import placeholder3      from '../../assets/placeholder_places3.png';

const PLACEHOLDERS = [placeholder1, placeholder2, placeholder3];

/* ── API DTOs ───────────────────────────────────────────── */
interface BestGuessDto {
  distanceMeters: number;
  imageUrl?: string;
}
interface LocationDto {
  locationId: number;
  imageUrl: string;
}

/* ── helpers ────────────────────────────────────────────── */
const authHeader = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const HomePage: React.FC = () => {
  const nav = useNavigate();

  /* state */
  const [points,       setPoints]       = useState<number>(0);
  const [bestGuesses,  setBestGuesses]  = useState<BestGuessDto[]>([]);
  const [newLocations, setNewLocations] = useState<LocationDto[]>([]);
  const [page,         setPage]         = useState(1);

  /* first load */
  useEffect(() => {
    (async () => {
      try {
        /* profile / points */
        const p = await fetch(`${API_BASE}/api/Profile`, {
          headers: authHeader(),
        });
        if (p.ok) {
          const { points } = await p.json();
          setPoints(points ?? 0);
        }

        /* best three guesses */
        const g = await fetch(
          `${API_BASE}/api/Guesses/personal-best?page=1&pageSize=3`,
          { headers: authHeader() }
        );
        if (g.ok) setBestGuesses(await g.json());

        /* first batch of locations */
        loadLocations(1);
      } catch {
        /* ignore – placeholders will show */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLocations = async (p: number) => {
    try {
      const r = await fetch(
        `${API_BASE}/api/Locations?page=${p}&pageSize=9`,
        { headers: authHeader() }
      );
      if (r.ok) {
        const rows: LocationDto[] = await r.json();
        setNewLocations((prev) => [...prev, ...rows]);
      }
    } catch {/* ignore */}
  };

  /* ui handlers */
  const handleLoadMoreLocations = () => {
    const next = page + 1;
    setPage(next);
    loadLocations(next);
  };
  const handleLogout       = () => { localStorage.removeItem('token'); nav('/signin'); };
  const handleAddLocation  = () => nav('/add-location');

  /* render helpers */
  const bestCards = bestGuesses.length
    ? bestGuesses
    : [256, 544, 755].map((d, i) => ({
        distanceMeters: d,
        imageUrl: PLACEHOLDERS[i % 3],
      }));

  const locationCards = newLocations.length
    ? newLocations
    : Array.from({ length: 9 }, (_, i) => ({
        /* negative id so it never matches a real one */
        locationId: -i - 1,
        imageUrl: PLACEHOLDERS[i % 3],
      }));

  /* ── JSX ── */
  return (
    <div className={styles.home}>
      {/* ── TOP BAR ───────────────────────────────────── */}
      <header className={styles.topbar}>
        <div className={styles.topbar__left}>
          <img src={gradientLogo} alt="Geotagger" className={styles.logo__icon}/>
          <span className={styles.logo__text}>
            <span className={styles['logo__text--primary']}>Geo</span>tagger
          </span>
        </div>

        <nav className={styles.topbar__nav}>
          <Link to="/home"    className={styles.topbar__link}>Home</Link>
          <Link to="/profile" className={styles.topbar__link}>Profile settings</Link>
            <button
            onClick={handleLogout}
            className={styles.topbar__link}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
            Logout
            </button>

          <div className={styles.topbar__points}>
            <div className={styles.points__avatar}>
              <img src={avatarPlaceholder} alt="Avatar" className={styles.points__icon}/>
            </div>
            <span className={styles.points__value}>{points}</span>
          </div>

          <button onClick={handleAddLocation} className={`${styles.btn} ${styles['btn--icon']}`}>
            <img src={plusIcon} alt="Add"/>
          </button>
        </nav>
      </header>

      {/* ── MAIN ──────────────────────────────────────── */}
      <main className={styles.main}>
        {/* Personal best */}
        <section className={styles.section}>
          <h2 className={styles.section__title}>Personal best guesses</h2>
          <p  className={styles.section__subtitle}>
            Your personal best guesses appear here. Go on and try to beat your personal records or set a new one!
          </p>

          <div className={`${styles.cards} ${styles['cards--best']}`}>
            {bestCards.map((g, i) => (
              <div
                key={i}
                className={styles.card}
                style={{ backgroundImage: `url(${g.imageUrl})` }}
              >
                <span className={styles.card__label}>{g.distanceMeters} m</span>
              </div>
            ))}
          </div>

          {/* left for future paging */}
          <button className={`${styles.btn} ${styles['btn--outline']} ${styles.section__btn}`}>
            Load more
          </button>
        </section>

        {/* New locations */}
        <section className={styles.section}>
          <h2 className={styles.section__title}>New locations</h2>
          <p  className={styles.section__subtitle}>
            New uploads from users. Try to guess all the locations by pressing on a picture.
          </p>

          <div className={`${styles.cards} ${styles['cards--grid']}`}>
            {locationCards.map((loc) => (
              <div
                key={loc.locationId}
                className={styles.card}
                style={{ backgroundImage: `url(${loc.imageUrl})` }}
                onClick={() => loc.locationId > 0 && nav(`/guess-location/${loc.locationId}`)}
              />
            ))}
          </div>

          <button
            className={`${styles.btn} ${styles['btn--outline']} ${styles.section__btn}`}
            onClick={handleLoadMoreLocations}
          >
            Load more
          </button>
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footer__left}>© 2025 Geotagger</div>
        <div className={styles.footer__right}>
          All Rights Reserved&nbsp;|&nbsp;
          <a href="https://skillupmentor.com" target="_blank" rel="noopener noreferrer">
            skillupmentor.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
