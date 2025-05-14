import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './locationGuess.module.css';
import { API_BASE } from '../../config';

/* ─ assets ─ */
import logoGradient from '../../assets/logo_gradient.png';
import avatarFallback from '../../assets/profile_white.png';
import plusIcon from '../../assets/plus.png';

/* ─ other components ─ */
import Leaderboard from '../Leaderboard';

/* ─ leaflet ─ */
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
} from 'react-leaflet';
import L, { LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// patch Leaflet icons for Vite
delete (L.Icon.Default as any).prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationDto {
  locationId: number;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
}

interface GuessResultDto {
  errorMeters: number;
  attemptNumber: number;
  remainingPoints: number;
}

const authHeader = (): HeadersInit => {
  const t = localStorage.getItem('token');
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const haversine = (
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number => {
  const R = 6_371_000;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const dφ = (lat2 - lat1) * Math.PI / 180;
  const dλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dφ/2)**2
    + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const GuessPicker: React.FC<{ onPick:(lat:number,lon:number)=>void }> =
  ({ onPick }) => {
    useMapEvents({
      dblclick(e: LeafletMouseEvent) {
        onPick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  };

const LocationGuessPage: React.FC = () => {
  const nav = useNavigate();
  const { id = '' } = useParams<{ id: string }>();

  const [loc, setLoc] = useState<LocationDto | null>(null);
  const [points, setPoints] = useState(0);
  const [profilePic, setProfilePic] = useState<string | null>(null);

  const [guessLat, setGuessLat] = useState<number | null>(null);
  const [guessLon, setGuessLon] = useState<number | null>(null);
  const [errorMeters, setError] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // ← NEW: this causes the leaderboard to re-fetch
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE}/api/Locations/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setLoc)
      .catch(() => nav('/home'));

    (async () => {
      try {
        const me = await fetch(
          `${API_BASE}/api/Profile/me`,
          { headers: authHeader() }
        ).then(r => r.ok ? r.json() : null);
        if (me) setProfilePic(me.profilePictureUrl ?? null);

        const w = await fetch(
          `${API_BASE}/api/Profile/wallet`,
          { headers: authHeader() }
        ).then(r => r.ok ? r.json() : null);
        if (w) setPoints(w.points ?? 0);
      } catch { /* ignore */ }
    })();
  }, [id, nav]);

  useEffect(() => {
    if (loc && guessLat !== null && guessLon !== null) {
      const d = haversine(loc.latitude, loc.longitude, guessLat, guessLon);
      setError(Math.round(d));
    }
  }, [loc, guessLat, guessLon]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loc || guessLat === null || guessLon === null) return;

    try {
      setBusy(true);
      const res = await fetch(`${API_BASE}/api/Guess`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', ...authHeader() },
        body: JSON.stringify({
          locationId: loc.locationId,
          latitude: guessLat,
          longitude: guessLon,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as GuessResultDto;

      setError(Math.round(data.errorMeters));
      setPoints(data.remainingPoints);

      // ← force leaderboard reload
      setRefreshKey(k => k + 1);
    } catch {
      /* optional toast… */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.home}>
      <header className={styles.topbar}>
        <div className={styles.topbar__left}>
          <img src={logoGradient} className={styles.logo__icon} alt="Geotagger"/>
          <span className={styles.logo__text}>
            <span className={styles['logo__text--primary']}>Geo</span>Tagger
          </span>
        </div>
        <nav className={styles.topbar__nav}>
          <button onClick={()=>nav('/home')} className={styles.topbar__link}>Home</button>
          <button onClick={()=>nav('/profile')} className={styles.topbar__link}>Profile settings</button>
          <button
            onClick={() => { localStorage.removeItem('token'); nav('/signin'); }}
            className={styles.topbar__link}
          >Logout</button>

          <div className={styles.topbar__points}>
            <div className={styles.points__avatar}>
              <img
                src={profilePic ? `${API_BASE}${profilePic}` : avatarFallback}
                className={styles.points__icon}
                alt="avatar"
              />
            </div>
            <span className={styles.points__value}>{points}</span>
          </div>

          <button onClick={()=>nav('/add-location')} className={styles['btn--icon']}>
            <img src={plusIcon} alt="Add"/>
          </button>
        </nav>
      </header>

      <div className={styles['guess-page']}>
        <section className={styles['guess-page__left']}>
          <h1 className={styles['guess-page__title']}>
            Take a <span className="highlight">guess</span>!
          </h1>

          <div className={styles.banner}>
            <img
              src={loc?.imageUrl ?? `${API_BASE}/images/placeholder_places3.png`}
              alt={loc?.title ?? 'Location'}
            />
          </div>

          <div className={styles['map-preview']}>
            <MapContainer
              center={[
                loc ? loc.latitude : 46.0569,
                loc ? loc.longitude : 14.5058,
              ]}
              zoom={5}
              style={{ width:'100%', height:'100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution="© OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <GuessPicker onPick={(la,lo)=>{ setGuessLat(la); setGuessLon(lo); }} />
              {guessLat !== null && guessLon !== null && (
                <Marker position={[guessLat, guessLon]} />
              )}
            </MapContainer>
          </div>

          {guessLat !== null && guessLon !== null && (
            <div className={styles.coordsDisplay}>
              Your guess: <strong>{guessLat.toFixed(5)}</strong>,&nbsp;
              <strong>{guessLon.toFixed(5)}</strong>
            </div>
          )}

          <form className={styles['guess-form']} onSubmit={submit}>
            <div className={styles['guess-form__group']}>
              <label htmlFor="g">Guessed location</label>
              <input
                id="g"
                type="text"
                value={
                  guessLat !== null && guessLon !== null
                    ? `${guessLat.toFixed(5)}, ${guessLon.toFixed(5)}`
                    : ''
                }
                readOnly
                placeholder="Double-click on map…"
              />
            </div>

            <div className={styles['guess-form__group']}>
              <label htmlFor="err">Error distance</label>
              <input
                id="err"
                type="text"
                value={errorMeters !== null ? `${errorMeters} m` : ''}
                readOnly
                placeholder="—"
              />
            </div>

            <button
              disabled={guessLat===null || busy}
              type="submit"
              className={`${styles.btn} ${styles['btn--primary']} ${styles['guess-form__btn']}`}
            >
              {busy ? 'Sending…' : 'Guess'}
            </button>
          </form>
        </section>

        <aside className={styles['guess-page__right']}>
          {loc && (
            <Leaderboard
              locationId={loc.locationId}
              refreshKey={refreshKey}
            />
          )}
        </aside>
      </div>

      <footer className={styles.footer}>
        <div>© 2025 Geotagger</div>
        <div>
          All Rights Reserved&nbsp;|&nbsp;
          <a href="https://skillupmentor.com" target="_blank" rel="noopener noreferrer">
            skillupmentor.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default LocationGuessPage;
