/*  src/components/ProfilePage/ProfilePage.tsx */
import React, {
  useEffect, useState, FormEvent, ChangeEvent, useRef,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cropper, { Area } from 'react-easy-crop';
import styles from './profilePage.module.css';
import { API_BASE } from '../../config';
import getCroppedImg from '../../utils/getCroppedImg';
import { logUserAction } from "../../utils/logUserAction";

/* ─ assets ─ */
import gradientLogo      from '../../assets/logo_gradient.png';
import avatarPlaceholder from '../../assets/profile_white.png';
import plusIcon          from '../../assets/plus.png';
import pencilIcon        from '../../assets/pencil.png';
import xIcon             from '../../assets/x.png';
import { useAuth } from '../../utils/useAuth';

/* ─ DTOs ─ */
interface ProfileDto {
  firstName: string;
  lastName : string;
  email    : string;
  points   : number;
  profilePictureUrl?: string;
}
interface PersonalBestDto {
  locationId : number;
  errorMeters: number;
  imageUrl   : string;
}
interface UploadDto {
  locationId: number;
  imageUrl  : string;
}

/* ─ simple fullscreen modal ─ */
const Modal: React.FC<{
  open: boolean; onClose: () => void; children: React.ReactNode;
}> = ({ open, onClose, children }) =>
  !open ? null : (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBody} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

const PAGE_SIZE = 4;

const ProfilePage: React.FC = () => {
  const nav   = useNavigate();
  const token = localStorage.getItem('token') || '';
  if (!token) { nav('/signin'); return null; }
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const { isExternal } = useAuth();
  // ─── PROFILE/POINTS ───────────────────────────────────────────────────
  const [profile , setProfile ] = useState<ProfileDto | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [profilePic, setProfilePic] = useState<string | null>(null);

  // ─── PERSONAL BEST GUESSES ────────────────────────────────────────────
  const [bestGuesses , setBestGuesses ] = useState<PersonalBestDto[]>([]);
  const [bestGuessesPage, setBestGuessesPage] = useState(1);
  const [hasMoreBestGuesses, setHasMoreBestGuesses] = useState(true);
  const [bestGuessesLoading, setBestGuessesLoading] = useState(false);
  const [bestGuessesLoadedOnce, setBestGuessesLoadedOnce] = useState(false);

  // ─── UPLOADS ──────────────────────────────────────────────────────────
  const [uploads , setUploads ] = useState<UploadDto[]>([]);
  const [uploadsPage, setUploadsPage] = useState(1);
  const [uploadsHasMore, setUploadsHasMore] = useState(true);

  // ─── MODALS, FORMS, UI ────────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState<number| null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [flash   , setFlash   ] = useState<string | null>(null);

  /* hover menu */
  const [menuOpen, setMenuOpen] = useState(false);

  /* modals */
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen  , setPwOpen  ] = useState(false);
  const [picOpen , setPicOpen ] = useState(false);

  /* edit form */
  const [first, setFirst] = useState('');
  const [last , setLast ] = useState('');
  const [mail , setMail ] = useState('');

  /* cropper */
  const [file,        setFile]        = useState<File | null>(null);
  const [preview,     setPreview]     = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop,        setCrop]        = useState({ x: 0, y: 0 });
  const [zoom,        setZoom]        = useState(1);
  const [areaPx,      setAreaPx]      = useState<Area | null>(null);
  const cropWrapRef = useRef<HTMLDivElement>(null);
  const CROP = 180;

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


  // ─── FETCH PROFILE (for points, pfp, info) ────────────────────────────
  const fetchProfile = async () => {
    try {
      // Fetch profile main info (name, mail, pfp)
      const me = await fetch(`${API_BASE}/api/Profile/me`, auth).then(r => r.ok ? r.json() : null);
      if (me) {
        setProfile(me);
        setFirst(me.firstName);
        setLast(me.lastName);
        setMail(me.email);
        setProfilePic(me.profilePictureUrl ?? null);
      }
      // Fetch wallet/points
      const wallet = await fetch(`${API_BASE}/api/Profile/wallet`, auth).then(r => r.ok ? r.json() : null);
      if (wallet && typeof wallet.points === 'number') setPoints(wallet.points);
    } catch {
      setFlash('Network error. Try again.');
    }
  };

  // ─── FETCH PERSONAL BEST GUESSES ──────────────────────────────────────
  const fetchPersonalBestGuesses = async (pageNum: number) => {
    setBestGuessesLoading(true);
    try {
      // Notice API endpoint spelling/pagination must match backend
      const res = await fetch(
        `${API_BASE}/api/guess/personal-best?page=${pageNum}&pageSize=${PAGE_SIZE}`,
        auth
      );
      if (res.ok) {
        const data: PersonalBestDto[] = await res.json();
        if (pageNum === 1) setBestGuesses(data);
        else setBestGuesses(prev => [...prev, ...data]);
        setHasMoreBestGuesses(data.length === PAGE_SIZE);
      } else {
        setHasMoreBestGuesses(false);
      }
    } catch {
      setHasMoreBestGuesses(false);
    }
    setBestGuessesLoading(false);
    setBestGuessesLoadedOnce(true);
    // Always refresh profile after loading bests (to update points/pfp/etc)
    fetchProfile();
  };

  // ─── UPLOADS FETCH ────────────────────────────────────────────────────
  const loadUploads = async (pageNum: number) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/Profile/locations?page=${pageNum}&pageSize=${PAGE_SIZE}`,
        auth
      );
      if (res.ok) {
        const arr: UploadDto[] = await res.json();
        if (pageNum === 1) setUploads(arr);
        else setUploads(u => [...u, ...arr]);
        setUploadsHasMore(arr.length === PAGE_SIZE);
      }
    } catch {
      setUploadsHasMore(false);
    }
  };

  // ─── ON MOUNT: Load all relevant info ────────────────────────────────
  useEffect(() => {
    fetchProfile();
    fetchPersonalBestGuesses(1);
    loadUploads(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─ helpers ─ */
  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : '';

  // ─── PAGINATION HANDLERS ──────────────────────────────────────────────
  const handleLoadMoreBestGuesses = () => {
    const next = bestGuessesPage + 1;
    setBestGuessesPage(next);
    fetchPersonalBestGuesses(next);
  };

  const handleLoadMoreUploads = () => {
    const next = uploadsPage + 1;
    setUploadsPage(next);
    loadUploads(next);
  };

  // ─── DELETE LOGIC ─────────────────────────────────────────────────────
  const handleDeleteClick = (locId: number) => {
    setDeleteId(locId);
    setShowConfirm(true);
  };
  const handleCancelDelete = () => {
    setShowConfirm(false);
    setDeleteId(null);
  };
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(
      `${API_BASE}/api/locations/${deleteId}`,
      { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.ok) {
      setUploads(u => u.filter(x => x.locationId !== deleteId));
      setShowConfirm(false);
      setShowDeleted(true);
      // refresh points after deletion (optional)
      fetchProfile();
    } else {
      setFlash('Delete failed.');
    }
  };
  const handleDismissDeleted = () => {
    setShowDeleted(false);
  };

  // ─── PROFILE INFO SAVE ────────────────────────────────────────────────
  const saveProfile = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/Profile/me`, {
        method : 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth.headers },
        body   : JSON.stringify({ firstName: first, lastName: last, email: mail }),
      });
      if (!r.ok) throw new Error();
      setEditOpen(false);
      setProfile(p => p ? { ...p, firstName: first, lastName: last, email: mail } : p);
      setFlash('Information saved.');
      fetchProfile();
    } catch { setFlash('Save failed.'); }
  };

  // ─── PASSWORD CHANGE ─────────────────────────────────────────────────
  const changePw = async (e: FormEvent) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget as HTMLFormElement);
    try {
      const r = await fetch(`${API_BASE}/api/Profile/update-password`, {
        method : 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth.headers },
        body   : JSON.stringify({
          currentPassword   : d.get('current'),
          newPassword       : d.get('new'),
          confirmNewPassword: d.get('confirm'),
        }),
      });
      if (!r.ok) throw new Error();
      setPwOpen(false);
      setFlash('Password updated.');
    } catch { setFlash('Password change failed.'); }
  };

  // ─── CROPPER LOGIC ───────────────────────────────────────────────────
  const pickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setShowCropper(true);
  };
  const onCropComplete = (_: Area, px: Area) => setAreaPx(px);

  const handleCrop = async () => {
    if (!preview || !areaPx) return;
    const { blob, file } = await getCroppedImg(preview, areaPx);
    setFile(file);
    setPreview(URL.createObjectURL(blob));
    setShowCropper(false);
  };

  const uploadPic = async () => {
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const up = await fetch(`${API_BASE}/api/ImageUpload`, {
        method : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body   : fd,
      });
      if (!up.ok) throw new Error();
      const { url } = await up.json();

      await fetch(`${API_BASE}/api/Profile/me`, {
        method : 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth.headers },
        body   : JSON.stringify({ profilePictureUrl: url }),
      });
      setProfile(p => p ? { ...p, profilePictureUrl: url } : p);
      setPicOpen(false); setFile(null); setPreview(null);
      fetchProfile();
    } catch { setFlash('Upload failed.'); }
  };

  const logout = () => { localStorage.removeItem('token'); nav('/signin'); };

  /* ─ render ─ */
  return (
    <div className={styles.home}>

      {/* ─── TOPBAR ───────────────────────────────────────────── */}
      <header className={styles.topbar}>
        <div className={styles.topbar__left}>
          <img src={gradientLogo} alt="Geotagger" className={styles.logo__icon}/>
<span className={styles.logo__text}>
  <span className={styles['logo__text--primary']}>Geo</span>tagger
</span>
        </div>

        <nav className={styles.topbar__nav}>
          <Link to="/home" className={styles.topbar__link}>Home</Link>
          <button
            onClick={() => setMenuOpen(true)}
            className={styles.topbar__link}
          >
            {fullName || 'Profile settings'}
          </button>
          <button onClick={logout} className={styles.topbar__link}>Logout</button>
          <div className={styles.topbar__points}>
            <div className={styles.points__avatar}>
              <img
                src={profilePic
                  ? `${API_BASE}${profilePic}`
                  : avatarPlaceholder}
                alt="avatar"
              />
            </div>
            <span className={styles.points__value}>{typeof points === 'number' ? points : (profile?.points ?? 0)}</span>
          </div>
          <button
            className={styles['btn--icon']}
            onClick={() => nav('/add-location')}
          >
            <img src={plusIcon} alt="Add"/>
          </button>
        </nav>
      </header>

      {/* ─── HOVER MENU ───────────────────────────────────────── */}
      {menuOpen && (
        <div
          className={styles.dropdownMenu}
          onMouseLeave={() => setMenuOpen(false)}
        >
          <button
            className={styles.dropdownItem}
            onClick={() => { setEditOpen(true); setMenuOpen(false); }}
          >
            Change info
          </button>
             <button
      className={styles.dropdownItem}
      onClick={() => { setPicOpen(true); setMenuOpen(false); }}
    >
      Change picture
    </button>

    {/* external accounts can’t change the password */}
    {!isExternal && (
      <button
        className={styles.dropdownItem}
        onClick={() => { setPwOpen(true); setMenuOpen(false); }}
      >
        Change password
      </button>
    )}
        </div>
      )}

      {/* ─── PROFILE HEADER ───────────────────────────────────── */}
      <div className={styles['profile-header']}>
        <div className={styles['profile-avatar']}>
          <img
            src={profilePic
              ? `${API_BASE}${profilePic}`
              : avatarPlaceholder}
            alt={fullName}
          />
        </div>
        <h1 className={styles['profile-name']}>{fullName}</h1>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────────────────── */}
      <main className={styles.main}>

        {/* BEST GUESSES */}
        <section className={styles.section}>
          <h2 className={styles.section__title}>My best guesses</h2>
          {bestGuessesLoading && !bestGuessesLoadedOnce && (
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
              Loading your best guesses...
            </div>
          )}
          {!bestGuessesLoading && bestGuesses.length === 0 && (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No best guesses yet!</p>
              <p className={styles.emptySubtitle}>
                Start a new game and guess the location of a picture to see results here.
              </p>
              <button
                className={`${styles.btn} ${styles['btn--outline']}`}
                onClick={() => nav('/home')}
              >
                Go to locations
              </button>
            </div>
          )}
          <div className={`${styles.cards} ${styles['cards--best']}`}>
            {bestGuesses.map((g) => (
              <div
                key={g.locationId}
                className={styles.card}
                style={{ backgroundImage: `url(${API_BASE}${g.imageUrl})` }}
              >
                <span className={styles.card__label}>{g.errorMeters} m</span>
              </div>
            ))}
          </div>
          {hasMoreBestGuesses && bestGuesses.length > 0 && (
            <button
              className={`${styles.btn} ${styles['btn--outline']} ${styles['section__btn']}`}
              onClick={handleLoadMoreBestGuesses}
              disabled={bestGuessesLoading}
            >
              {bestGuessesLoading ? 'Loading...' : 'Load more'}
            </button>
          )}
          {!hasMoreBestGuesses && bestGuesses.length > 0 && (
            <button
              className={`${styles.btn} ${styles['btn--outline']} ${styles['section__btn']}`}
              disabled
            >
              No more
            </button>
          )}
        </section>

        {/* MY UPLOADS */}
        <section className={styles.section}>
          <h2 className={styles.section__title}>My uploads</h2>
          {uploads.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No uploads yet!</p>
              <p className={styles.emptySubtitle}>
                Upload a new location with the button below
                or press “+” in the navigation bar.
              </p>
              <button
                className={`${styles.btn} ${styles['btn--outline']}`}
                onClick={() => nav('/add-location')}
              >
                Add location
              </button>
            </div>
          ) : (
            <>
              <div className={`${styles.cards} ${styles['cards--uploads']}`}>
                {uploads.map(u => (
                  <div
                    key={u.locationId}
                    className={`${styles.card} ${styles['upload-card']}`}
                    style={{ backgroundImage: `url(${API_BASE}${u.imageUrl})` }}
                  >
                    <button
                      className={styles['edit-btn']}
                      onClick={() => nav(`/edit-location/${u.locationId}`)}
                    >
                      <img src={pencilIcon} alt="Edit"/>
                    </button>
                    <button
                      className={styles['delete-btn']}
                      onClick={() => handleDeleteClick(u.locationId)}
                    >
                      <img src={xIcon} alt="Delete"/>
                    </button>
                  </div>
                ))}
              </div>
              {uploadsHasMore && (
                <button
                  className={`${styles.btn} ${styles['btn--outline']} ${styles['section__btn']}`}
                  onClick={handleLoadMoreUploads}
                  disabled={!uploadsHasMore}
                >
                  Load more
                </button>
              )}
              {!uploadsHasMore && uploads.length > 0 && (
                <button
                  className={`${styles.btn} ${styles['btn--outline']} ${styles['section__btn']}`}
                  disabled
                >
                  Looks like you have reached the end.
                </button>
              )}
            </>
          )}
        </section>

        {/* ─── CONFIRMATION MODAL ─────────────────────────────── */}
        {showConfirm && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h2 className={styles.modalTitle}>Are you sure?</h2>
              <p className={styles.modalText}>
                This location will be deleted. There is no undo of this action.
              </p>
              <div className={styles.modalActions}>
                <button
                  className={styles.btnLink}
                  onClick={handleCancelDelete}
                >
                  Cancel
                </button>
                <button
                  className={styles.btnSubmit}
                  onClick={handleConfirmDelete}
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── DELETED FEEDBACK MODAL ─────────────────────────── */}
        {showDeleted && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <p className={styles.modalText}>Your location was deleted.</p>
              <div className={styles.modalActions}>
                <button
                  className={styles.btnSubmit}
                  onClick={handleDismissDeleted}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ─── FOOTER ───────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.footer__left}>© 2025 Geotagger</div>
        <div className={styles.footer__right}>
          All Rights Reserved&nbsp;|&nbsp;
          <a href="https://skillupmentor.com" target="_blank" rel="noopener noreferrer">
            skillupmentor.com
          </a>
        </div>
      </footer>

      {/* ───  EDIT INFO  MODAL ────────────────────────────────── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <h2 data-highlight="settings.">Profile </h2>
        <p>Change your information.</p>
        <form
          className={styles.editForm}
          onSubmit={e => { e.preventDefault(); saveProfile(); }}
        >
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              value={mail}
              readOnly={isExternal}
              onChange={e => {
                logUserAction({
                  actionType: "changed_value",
                  componentType: "textbox",
                  newValue: e.target.value,
                  url: window.location.pathname
                });
                setMail(e.target.value);
              }}
              required
              style={isExternal ? { cursor:"not-allowed", opacity:.55 } : {}}
            />

          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>First name</label>
              <input
                type="text"
                value={first}
                onChange={e => {
  logUserAction({
    actionType: "changed_value",
    componentType: "textbox",
    newValue: e.target.value,
    url: window.location.pathname
  });
  setFirst(e.target.value);
}}
                minLength={2}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Last name</label>
              <input
                type="text"
                value={last}
                onChange={e => {
  logUserAction({
    actionType: "changed_value",
    componentType: "textbox",
    newValue: e.target.value,
    url: window.location.pathname
  });
  setLast(e.target.value);
}}
                minLength={2}
                required
              />
            </div>
          </div>
<div className={styles.links}>
  {/* Only render if NOT external */}
  {!isExternal && (
    <button
      type="button"
      className={styles.linkBtn}
      onClick={() => { setPwOpen(true); setEditOpen(false); }}
    >
      Change password
    </button>
  )}
  <button
    type="button"
    className={styles.linkBtn}
    onClick={() => { setPicOpen(true); setEditOpen(false); }}
  >
    Change profile picture
  </button>
</div>


          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className={styles.saveBtn}>Submit</button>
          </div>
        </form>
      </Modal>

      {/* ───  CHANGE PASSWORD MODAL ───────────────────────────── */}
{/* Only mount Modal for native users */}
{pwOpen && !isExternal && (
  <Modal open={pwOpen} onClose={() => setPwOpen(false)}>
    <h2 data-highlight="settings.">Profile </h2>
    <p>Change your password.</p>
    <form className={styles.editForm} onSubmit={changePw}>
      <div className={styles.field}>
        <label>Current password</label>
        <input name="current" type="password" required />
      </div>
      <div className={styles.field}>
        <label>New password</label>
        <input name="new" type="password" required />
      </div>
      <div className={styles.field}>
        <label>Repeat new password</label>
        <input name="confirm" type="password" required />
      </div>
      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => setPwOpen(false)}
        >
          Cancel
        </button>
        <button type="submit" className={styles.saveBtn}>Submit</button>
      </div>
    </form>
  </Modal>
)}


      {/* ───  CHANGE PFP MODAL ───────────────────────────────── */}
      <Modal open={picOpen} onClose={() => setPicOpen(false)}>
        <h2 data-highlight="settings.">Profile </h2>
        <p>Change your profile photo.</p>
        {/* cropper or preview */}
        {showCropper && preview ? (
          <div
            ref={cropWrapRef}
            className={styles.cropContainer}
            style={{ width: CROP, height: CROP }}
          >
            <Cropper
              image={preview}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              cropSize={{ width: CROP, height: CROP }}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
        ) : (
          <div className={styles.pfpAvatar}>
<img
  src={
    profilePic
      ? (profilePic.startsWith("http") ? profilePic : `${API_BASE}${profilePic}`)
      : avatarPlaceholder
  }
  alt="avatar"
/>

          </div>
        )}
        {/* upload-file control */}
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          hidden
          onChange={pickFile}
        />
        <label htmlFor="fileInput" className={styles.uploadBtn}>
          {showCropper ? 'Choose another file' : 'Upload new picture'}
        </label>
        {/* action row */}
        <div className={styles.pfpActions}>
          <button
            onClick={() => setPicOpen(false)}
            className={styles.cancelBtn}
            type="button"
          >
            Cancel
          </button>
          {showCropper ? (
            <button
              onClick={handleCrop}
              disabled={!areaPx}
              className={styles.saveBtn}
              type="button"
            >
              Crop
            </button>
          ) : (
            <button
              onClick={uploadPic}
              disabled={!file}
              className={styles.saveBtn}
              type="button"
            >
              Submit
            </button>
          )}
        </div>
      </Modal>

      {/* ─── FLASH MESSAGE ────────────────────────────────────── */}
      {flash && (
        <Modal open onClose={() => setFlash(null)}>
          <div className={styles.flashBody}>
            <h3 className={styles.flashTitle}>{flash}</h3>
            <button
              onClick={() => setFlash(null)}
              className={`${styles.saveBtn} ${styles.flashCloseBtn}`}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ProfilePage;
