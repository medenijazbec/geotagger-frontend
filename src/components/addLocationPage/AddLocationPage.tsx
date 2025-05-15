// src/pages/AddLocationPage.tsx
import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  FormEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './addLocationPage.module.css';
import { API_BASE } from '../../config';

// assets
import gradientLogo      from '../../assets/logo_gradient.png';
import avatarPlaceholder from '../../assets/profile_white.png';
import plusIcon          from '../../assets/plus.png';
import placeholderImg    from '../../assets/placeholder-image.png';

// leaflet
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L, { LeafletMouseEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
// fix icon paths in Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
// @ts-ignore
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Nominatim JSON shape
interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: { city?: string };
}

const LocationPicker: React.FC<{
  lat: number | null;
  lon: number | null;
  onPick: (lat: number, lon: number) => void;
}> = ({ lat, lon, onPick }) => {
  useMapEvents({
    dblclick(e: LeafletMouseEvent) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return lat !== null && lon !== null
    ? <Marker position={[lat, lon]} />
    : null;
};

const AddLocationPage: React.FC = () => {
  const nav   = useNavigate();
  const token = localStorage.getItem('token');
  if (!token) {
    // no token → go to signin
    nav('/signin');
    return null;
  }

  // profile
  const [profilePic, setProfilePic] = useState<string|null>(null);
  const [points,     setPoints]     = useState<number>(0);

  // form state
  const [title,       setTitle]       = useState('');
  const [description, setDesc]        = useState('');
  const [imageFile,   setFile]        = useState<File|null>(null);
  const [imgPreview,  setPrev]        = useState<string|null>(null);
  const [lat,         setLat]         = useState<number|null>(null);
  const [lon,         setLon]         = useState<number|null>(null);
  const [flash,       setFlash]       = useState<string|null>(null);
  const [busy,        setBusy]        = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

  // search/type-ahead
  const [searchTerm,  setSearchTerm]  = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // ---- load profile on mount ----
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // 1) points
        const p = await fetch(`${API_BASE}/api/Profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (p.ok) {
          const { points } = await p.json();
          setPoints(points ?? 0);
        }
        // 2) picture
        const me = await fetch(`${API_BASE}/api/Profile/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (me.ok) {
          const body = await me.json() as { profilePictureUrl?: string };
          setProfilePic(body.profilePictureUrl ?? null);
        }
      } catch {
        // ignore
      }
    };
    loadProfile();
  }, [token]);

  // ---- dismiss suggestions on outside click ----
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // ---- debounce + fetch suggestions ----
  useEffect(() => {
    if (searchTerm.length < 3) {
      setSuggestions([]);
      return;
    }
    const ctl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(searchTerm)}`,
          { signal: ctl.signal, headers: { 'User-Agent': 'geotagger-app' } }
        );
        if (!resp.ok) throw new Error();
        const data: NominatimResult[] = await resp.json();
        setSuggestions(data.slice(0, 5));
      } catch {
        // ignore
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      ctl.abort();
    };
  }, [searchTerm]);

  // ---- handle pick (dblclick or suggestion) ----
  const handlePick = async (la: number, lo: number) => {
    // 1) round to 6dp & clamp
    let rLat = Math.max(-90, Math.min(90, parseFloat(la.toFixed(6))));
    let rLon = Math.max(-180, Math.min(180, parseFloat(lo.toFixed(6))));


    // diagnostic: log to console
    console.log('User picked coords:', rLat, rLon);
    // clear search dropdown
    setSearchTerm('');
    setSuggestions([]);

    // update marker
    setLat(rLat);
    setLon(rLon);

    // reverse-geocode for a title
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${rLat}&lon=${rLon}`,
        { headers: { 'User-Agent': 'geotagger-app' } }
      );
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      const place =
        data.display_name ??
        data.address?.city ??
        `${rLat.toFixed(5)}, ${rLon.toFixed(5)}`;
      setTitle(place);
    } catch {
      setTitle(`${rLat.toFixed(5)}, ${rLon.toFixed(5)}`);
    }
  };

  // ---- file picker ----
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPrev(URL.createObjectURL(f));
  };

  // ---- submit ----
  const submit = async (e: FormEvent) => {
  e.preventDefault();
  if (!imageFile || lat === null || lon === null) {
    setFlash('Image and location are required.');
    return;
  }

  // Explicitly format coordinates with a fixed "." decimal separator
  const fd = new FormData();
  fd.append('title', title);
  fd.append('description', description);
  fd.append('latitude', lat.toFixed(6));
  fd.append('longitude', lon.toFixed(6));
  fd.append('image', imageFile);

  console.log("Sending coordinates:", lat.toFixed(6), lon.toFixed(6)); // diagnostic

  try {
    setBusy(true);
    const resp = await fetch(`${API_BASE}/api/Locations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!resp.ok) {
      const msg = await resp.text();
      throw new Error(msg || 'Upload failed');
    }
    //setFlash('Location added! ');
    setShowSuccessModal(true);
    setTitle(''); setDesc('');
    setFile(null); setPrev(null);
    setLat(null); setLon(null);
  } catch (err: any) {
    setFlash(err.message ?? 'Upload failed – check your network or file size (≤10 MB).');
  } finally {
    setBusy(false);
  }
};


  return (
    <div className={styles.home}>
      {/* TOPBAR */}
      <header className={styles.topbar}>
        <div className={styles.topbar__left}>
          <img src={gradientLogo} alt="Geotagger" className={styles.logo__icon}/>
<span className={styles.logo__text}>
  <span className={styles['logo__text--primary']}>Geo</span>tagger
</span>
        </div>
        <nav className={styles.topbar__nav}>
          <Link to="/home"    className={styles.topbar__link}>Home</Link>
          <Link to="/profile" className={styles.topbar__link}>Profile</Link>
          <button
            onClick={() => { localStorage.removeItem('token'); nav('/signin'); }}
            className={styles.topbar__link}
            style={{ background:'none', border:'none', padding:0, cursor:'pointer' }}
          >Logout</button>

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

          <button
            onClick={() => nav('/add-location')}
            className={`${styles.btn} ${styles['btn--icon']}`}
          >
            <img src={plusIcon} alt="Add"/>
          </button>
        </nav>
      </header>

      {/* MAIN */}
      <main className={styles['add-location']}>
        <h1 className={styles['add-location__title']}>
          Add a new <span className={styles['add-location__highlight']}>location</span>.
        </h1>

        {/* IMAGE PREVIEW */}
        <div className={styles['upload-preview']}>
          <img src={imgPreview ?? placeholderImg} alt="Upload preview"/>
        </div>
        <label className={`${styles.btn} ${styles['btn--outline']} ${styles['upload-preview__btn']}`}>
          Upload image
          <input type="file" accept="image/*" hidden onChange={handleFile}/>
        </label>

        {/* MAP */}
        <div className={styles['map-preview']}>
          <MapContainer
            center={[46.0569, 14.5058]}
            zoom={5}
            style={{ width:'100%', height:'100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='© OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker lat={lat} lon={lon} onPick={handlePick}/>
          </MapContainer>
        </div>

            {/* DIAGNOSTIC: show the last-picked coords */}
            {lat !== null && lon !== null && (
            <div className={styles.coordsDisplay}>
                Selected coordinates: <strong>Lat:</strong> {lat.toFixed(6)}, <strong>Lon:</strong> {lon.toFixed(6)}
            </div>
            )}


        {/* FORM */}
        <form className={styles['location-form']} onSubmit={submit}>
          <label htmlFor="location" className={styles['location-form__label']}>Location</label>
          <div ref={searchRef} className={styles.searchWrapper}>
            <input
              id="location"
              className={styles['location-form__input']}
              placeholder="Double-click map or search…"
              value={title}
              onChange={e => {
                setSearchTerm(e.target.value);
                setTitle(e.target.value);
              }}
              autoComplete="off"
              required
            />
            {suggestions.length > 0 && (
              <ul className={styles.suggestionsList}>
                {suggestions.map((s,i) => (
                  <li key={i} onClick={() => {
                    handlePick(parseFloat(s.lat), parseFloat(s.lon));
                    setSearchTerm('');
                  }}>
                    {s.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            disabled={busy}
            className={`${styles.btn} ${styles['btn--primary']} ${styles['add-location__btn']}`}
          >
            {busy ? 'Uploading…' : 'Add new'}
          </button>
        </form>
      </main>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footer__left}>© 2025 Geotagger</div>
        <div className={styles.footer__right}>
          All Rights Reserved&nbsp;|&nbsp;
          <a href="https://skillupmentor.com" target="_blank" rel="noopener noreferrer">
            skillupmentor.com
          </a>
        </div>
      </footer>

{/* SUCCESS-MODAL CARD */}
      {showSuccessModal && (
        <div
          className={styles.modalCardOverlay}
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className={styles.modalCard}
            onClick={e => e.stopPropagation()}
          >
            <p className={styles.modalCardText}>
              Location was successfully added.
            </p>
            <button
              className={`${styles.btn} ${styles['btn--primary']}`}
              onClick={() => setShowSuccessModal(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddLocationPage;
