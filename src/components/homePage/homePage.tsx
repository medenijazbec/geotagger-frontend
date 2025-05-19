/* ──────────────────────────────────────────────────────────
   Fully typed – no TS errors
   ────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './home.module.css';
import { API_BASE } from '../../config';
import { useAuth } from "../../utils/useAuth";
/* ── assets ─────────────────────────────────────────────── */
import gradientLogo      from '../../assets/logo_gradient.png';
import avatarPlaceholder from '../../assets/profile_white.png';
import plusIcon          from '../../assets/plus.png';
import placeholder1      from '../../assets/placeholder_places1.png';
import placeholder2      from '../../assets/placeholder_places2.png';
import placeholder3      from '../../assets/placeholder_places3.png';

const PLACEHOLDERS = [placeholder1, placeholder2, placeholder3];

/* ── API DTOs ───────────────────────────────────────────── */
interface UserGuessDto {
  locationId: number;
  imageUrl: string;
  errorMeters: number;
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
  const location = useLocation();
  const PAGE_SIZE = 3;
  // Points/profile state
  const [points, setPoints] = useState<number>(0);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  //const [isAdmin, setIsAdmin] = useState(false);
  // User guesses (paginated)
  const [guesses, setGuesses] = useState<UserGuessDto[]>([]);
  const [guessesPage, setGuessesPage] = useState(1);
  const [hasMoreGuesses, setHasMoreGuesses] = useState(true);
  const [guessesLoading, setGuessesLoading] = useState(false);
  const [guessesLoadedOnce, setGuessesLoadedOnce] = useState(false);
  const { isAdmin } = useAuth();
  // New locations (unchanged)
  const [newLocations, setNewLocations] = useState<LocationDto[]>([]);
  const [page, setPage] = useState(1);

 // --- Handle token from OAuth redirect ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const externalSuccess = params.get('externalLogin') === 'success';
    const token = params.get('token');
    if (externalSuccess && token) {
      localStorage.setItem('token', token);
      // Remove the query string for a clean Home URL
      nav('/home', { replace: true });
    }
    // Optional: handle error from /home?externalLogin=error&message=...
  }, [location.search, nav]);

useEffect(() => {
  if (!localStorage.getItem('token')) {
    nav('/signin', { replace: true });
  }
}, [nav]);




  // --- Fetch profile points and profile pic exactly as LocationGuessPage does ---
  const fetchProfile = async () => {
    try {
      // Fetch profile picture (from /api/Profile/me)
      const me = await fetch(
        `${API_BASE}/api/Profile/me`,
        { headers: authHeader() }
      ).then(r => r.ok ? r.json() : null);
      if (me) setProfilePic(me.profilePictureUrl ?? null);
      //useAuth(.isAdmin);
      // Fetch points (from /api/Profile/wallet)
      const w = await fetch(
        `${API_BASE}/api/Profile/wallet`,
        { headers: authHeader() }
      ).then(r => r.ok ? r.json() : null);
      if (w) setPoints(w.points ?? 0);
    } catch {
      // Ignore
    }
  };

  // --- Fetch user's ALL guesses, paginated ---
const loadGuesses = async (pageNum: number) => {
  setGuessesLoading(true);
  try {
    const res = await fetch(
      `${API_BASE}/api/guess/personal-best?page=${pageNum}&pageSize=${PAGE_SIZE}`,
      { headers: authHeader() }
    );
      if (res.ok) {
        const data: UserGuessDto[] = await res.json();
        if (pageNum === 1) setGuesses(data);
        else setGuesses((prev) => [...prev, ...data]);
        setHasMoreGuesses(data.length === PAGE_SIZE);
      } else {
        setHasMoreGuesses(false);
      }
    } catch {
      setHasMoreGuesses(false);
    }
    setGuessesLoading(false);
    setGuessesLoadedOnce(true);

    // Always fetch latest points (in case they changed)
    fetchProfile();
  };

  // --- Fetch new locations (unchanged) ---
const loadLocations = async (p: number) => {
  try {
    const r = await fetch(
      `${API_BASE}/api/Locations?page=${p}&pageSize=9`,
      { headers: authHeader() }
    );
    if (r.ok) {
      const rows: LocationDto[] = await r.json();
      setNewLocations(prev => {
        // Deduplicate by locationId
        const seen = new Set(prev.map(loc => loc.locationId));
        const filtered = rows.filter(loc => !seen.has(loc.locationId));
        return [...prev, ...filtered];
      });
    }
  } catch {/* ignore */}
};


  // --- First load ---
  useEffect(() => {
    fetchProfile();
    loadGuesses(1);
    loadLocations(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- UI handlers ---
  const handleLoadMoreLocations = () => {
    const next = page + 1;
    setPage(next);
    loadLocations(next);
  };

  const handleLoadMoreGuesses = () => {
    const next = guessesPage + 1;
    setGuessesPage(next);
    loadGuesses(next);
  };

  const handleLogout       = () => { localStorage.removeItem('token'); nav('/signin'); };
  const handleAddLocation  = () => nav('/add-location');

  // --- Render helpers ---
  const guessCards = guesses.length
    ? guesses
    : [];

  const locationCards = newLocations.length
    ? newLocations
    : Array.from({ length: 9 }, (_, i) => ({
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
{isAdmin && (
  <Link to="/admin" className={styles.topbar__link}>
    Admin Panel
  </Link>
)}
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
              <img
                src={ profilePic
                  ? `${API_BASE}${profilePic}`
                  : avatarPlaceholder }
                alt="Avatar"
                className={styles.points__icon}
              />
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
        {/* All user guesses */}
        <section className={styles.section}>
          <h2 className={styles.section__title}>Personal best guesses</h2>

          <p  className={styles.section__subtitle}>
            Every guess you’ve made appears here, sorted by most recent. Try to beat your personal records or set a new one!
          </p>

          {guessesLoading && !guessesLoadedOnce && (
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
              Loading your guesses...
            </div>
          )}

          {!guessesLoading && guessCards.length === 0 && (
            <div style={{ textAlign: 'center', margin: '2rem 0', color: '#888' }}>
              You haven't guessed any locations yet.<br/>
              Start playing by picking a new location below!
            </div>
          )}

      {/* personal-best grid */}
      <div className={`${styles.cards} ${styles['cards--best']}`}>
        {guessCards.map((g, i) => (
          <div
            key={g.locationId ?? i}
            className={styles.card}
            style={{ backgroundImage: `url(${g.imageUrl})` }}
            onClick={() => nav(`/guess-location/${g.locationId}`)}
          >
            <span className={styles.card__label}>{g.errorMeters} m</span>
          </div>
        ))}
      </div>

          {guessCards.length > 0 && (
            <button
              className={`${styles.btn} ${styles['btn--outline']} ${styles.section__btn}`}
              onClick={handleLoadMoreGuesses}
              disabled={!hasMoreGuesses || guessesLoading}
              style={{ marginTop: '1rem' }}
            >
              {guessesLoading ? 'Loading...' : (hasMoreGuesses ? 'Load more' : 'No more guesses')}
            </button>
          )}

        
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
