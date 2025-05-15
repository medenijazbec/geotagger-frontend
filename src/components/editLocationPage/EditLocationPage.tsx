// src/components/editLocationPage/EditLocationPage.tsx
import React, { useState, useEffect, ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styles from './location-edit.module.css';
import { API_BASE } from '../../config';

// static asset imports:
import gradientLogo      from '../../assets/logo_gradient.png';
import avatarPlaceholder from '../../assets/profile_white.png';
import plusIcon          from '../../assets/plus.png';

interface ProfileDto {
  profilePictureUrl?: string;
}
interface WalletDto {
  points: number;
}
interface LocationDto {
  locationId: number;
  title: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
}

const EditLocationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const nav    = useNavigate();
  const token  = localStorage.getItem('token') || '';
  if (!token) { nav('/signin'); return null; }
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const [profilePic, setProfilePic] = useState<string|null>(null);
  const [points,     setPoints]     = useState<number>(0);
  const [location,   setLocation]   = useState<LocationDto|null>(null);
  const [preview,    setPreview]    = useState<string>('');
  const [previewFile,setPreviewFile]= useState<File|null>(null);

  // load profile + wallet + this location
  useEffect(() => {
    (async () => {
      try {
        const [meRes, wRes, uRes] = await Promise.all([
          fetch(`${API_BASE}/api/Profile/me`, auth),
          fetch(`${API_BASE}/api/Profile/wallet`, auth),
          fetch(`${API_BASE}/api/Profile/locations?page=1&pageSize=100`, auth),
        ]);

        if (meRes.ok) {
          const p: ProfileDto = await meRes.json();
          setProfilePic(p.profilePictureUrl ?? null);
        }
        if (wRes.ok) {
          const wb: WalletDto = await wRes.json();
          setPoints(wb.points);
        }
        if (uRes.ok) {
          const list: LocationDto[] = await uRes.json();
          const loc = list.find(x => x.locationId === Number(id));
          if (loc) {
            setLocation(loc);
            // Normalize to a full URL for the banner
            setPreview(
              loc.imageUrl.startsWith('http')
                ? loc.imageUrl
                : `${API_BASE}${loc.imageUrl}`
            );
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id]);

  // when the user picks a new file
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    setPreviewFile(f);
  };

  // call the new PUT endpoint
  const handleSave = async () => {
    if (!location || !previewFile) return;

    const fd = new FormData();
    fd.append('Title',     location.title);
    fd.append('Latitude',  String(location.latitude));
    fd.append('Longitude', String(location.longitude));
    fd.append('Image',     previewFile);

    const res = await fetch(
      `${API_BASE}/api/locations/${location.locationId}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      }
    );

    if (res.ok) {
      nav('/profile');
    } else {
      console.error('Update failed', await res.json());
    }
  };

  const handleCancel = () => nav('/profile');

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
          <Link to="/profile" className={styles.topbar__link}>Profile settings</Link>
          <button
            onClick={() => { localStorage.removeItem('token'); nav('/signin'); }}
            className={styles.topbar__link}
          >
            Logout
          </button>

          <div className={styles.topbar__points}>
            <div className={styles.points__avatar}>
              <img
                src={profilePic ? `${API_BASE}${profilePic}` : avatarPlaceholder}
                alt="Avatar"
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

      {/* EDIT LOCATION MAIN */}
      <main className={styles['edit-location']}>
        <h1 className={styles['edit-location__title']}>
          Edit <span className={styles['edit-location__highlight']}>location</span>.
        </h1>

        <div className={styles['edit-location__banner']}>
          <img src={preview} alt="Current location" />
        </div>

        <p className={styles['edit-location__info']}>
          Location: {location?.title ?? '—'}
        </p>

        <div className={styles['upload-btn-wrapper']}>
          <label className={`${styles.btn} ${styles['btn--outline']}`}>
            Upload image
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleFile}
            />
          </label>
        </div>

        <div className={styles['edit-location__actions']}>
          <button
            className={`${styles.btn} ${styles['btn--primary']}`}
            onClick={handleSave}
          >
            Save
          </button>
          <button
            className={`${styles.btn} ${styles['btn--link']}`}
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </main>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footer__left}>© 2025 Geotagger</div>
        <div className={styles.footer__right}>
          All Rights Reserved |{' '}
          <a href="https://skillupmentor.com" target="_blank" rel="noopener noreferrer">
            skillupmentor.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default EditLocationPage;
