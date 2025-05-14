// src/components/ProfilePage/ProfilePage.tsx
import React, {
  useEffect,
  useState,
  FormEvent,
  ChangeEvent,
  useRef,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cropper, { Area } from 'react-easy-crop';
import styles from './profilePage.module.css';
import { API_BASE } from '../../config';
import getCroppedImg from '../../utils/getCroppedImg';

// assets
import gradientLogo      from '../../assets/logo_gradient.png';
import avatarPlaceholder from '../../assets/profile_white.png';
import plusIcon          from '../../assets/plus.png';
import pencilIcon        from '../../assets/pencil.png';
import xIcon             from '../../assets/x.png';
import placeholder from '../../assets/placeholder_places1.png';

// DTOs
interface ProfileDto {
  firstName: string;
  lastName: string;
  email: string;
  points: number;
  profilePictureUrl?: string;
}
interface BestGuessDto {
  distanceMeters: number;
  imageUrl: string;
}
interface UploadDto {
  locationId: number;
  imageUrl: string;
}

// simple fullscreen modal
const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, onClose, children }) =>
  !open ? null : (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBody} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

const ProfilePage: React.FC = () => {
  const nav = useNavigate();
  const token = localStorage.getItem('token') || '';
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [best, setBest] = useState<BestGuessDto[]>([]);
  const [uploads, setUploads] = useState<UploadDto[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  // pop-over menu on hover
  const [menuOpen, setMenuOpen] = useState(false);

  // edit modals
  const [editOpen,    setEditOpen]    = useState(false);
  const [pwOpen,      setPwOpen]      = useState(false);
  const [picOpen,     setPicOpen]     = useState(false);

  // form fields
  const [first, setFirst] = useState('');
  const [last,  setLast]  = useState('');
  const [mail,  setMail]  = useState('');

  // cropper
  const [file,       setFile]       = useState<File | null>(null);
  const [preview,    setPreview]    = useState<string | null>(null);
  const [showCropper,setShowCropper]= useState(false);
  const [crop,       setCrop]       = useState({ x:0, y:0 });
  const [zoom,       setZoom]       = useState(1);
  const [areaPx,     setAreaPx]     = useState<Area|null>(null);
  const cropWrapRef = useRef<HTMLDivElement>(null);
  const CROP = 180;

  useEffect(() => {
    if (!token) { nav('/signin'); return; }
    (async () => {
      try {
        // profile
        const p = await fetch(`${API_BASE}/api/Profile/me`, auth);
        if (p.ok) {
          const prof: ProfileDto = await p.json();
          setProfile(prof);
          setFirst(prof.firstName);
          setLast(prof.lastName);
          setMail(prof.email);
        }
        // best guesses
        const b = await fetch(
          `${API_BASE}/api/Guesses/personal-best?page=1&pageSize=4`,
          auth
        );
        if (b.ok) setBest(await b.json());
        // uploads
        const u = await fetch(
          `${API_BASE}/api/Locations/mine?page=1&pageSize=4`,
          auth
        );
        if (u.ok) setUploads(await u.json());
      } catch {
        setFlash('Network error. Try again.');
      }
    })();
  }, []);

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : '';

  const bestCards = best.length
    ? best
    : [{distanceMeters:256,imageUrl:avatarPlaceholder},{distanceMeters:544,imageUrl:avatarPlaceholder},{distanceMeters:755,imageUrl:avatarPlaceholder},{distanceMeters:900,imageUrl:avatarPlaceholder}];

  const uploadCards = uploads.length
    ? uploads
    : Array.from({length:4},(_,i)=>({locationId:-i-1,imageUrl:avatarPlaceholder}));

  // save profile info
  const saveProfile = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/Profile/me`, {
        method:'PUT',
        headers:{'Content-Type':'application/json',...auth.headers},
        body:JSON.stringify({ firstName:first, lastName:last, email:mail })
      });
      if (!r.ok) throw new Error();
      setEditOpen(false);
      setProfile(p=>p?{...p,firstName:first,lastName:last,email:mail}:p);
      setFlash('Information saved.');
    } catch {
      setFlash('Save failed.');
    }
  };

  // change password
  const changePw = async (e:FormEvent) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget as HTMLFormElement);
    try {
      const r = await fetch(`${API_BASE}/api/Profile/update-password`, {
        method:'PUT',
        headers:{'Content-Type':'application/json',...auth.headers},
        body:JSON.stringify({
          currentPassword:d.get('current'),
          newPassword:d.get('new'),
          confirmNewPassword:d.get('confirm')
        })
      });
      if (!r.ok) throw new Error();
      setPwOpen(false);
      setFlash('Password updated.');
    } catch {
      setFlash('Password change failed.');
    }
  };

  // picture crop/upload
  const pickFile = (e:ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setShowCropper(true);
  };
  const onCropComplete = (_:Area, px:Area)=>setAreaPx(px);
  const handleCrop = async () => {
    if (!preview||!areaPx) return;
    const {blob,file} = await getCroppedImg(preview,areaPx);
    setFile(file);
    setPreview(URL.createObjectURL(blob));
    setShowCropper(false);
  };
  const uploadPic = async () => {
    if (!file) return;
    const fd = new FormData(); fd.append('file',file);
    try {
      const up = await fetch(`${API_BASE}/api/ImageUpload`,{
        method:'POST',
        headers:{Authorization:`Bearer ${token}`},
        body:fd
      });
      if(!up.ok)throw new Error();
      const {url} = await up.json();
      await fetch(`${API_BASE}/api/Profile/me`,{
        method:'PUT',
        headers:{'Content-Type':'application/json',...auth.headers},
        body:JSON.stringify({profilePictureUrl:url})
      });
      setProfile(p=>p?{...p,profilePictureUrl:url}:p);
      setPicOpen(false);
      setFile(null);
      setPreview(null);
    }catch{
      setFlash('Upload failed.');
    }
  };

  const logout = ()=>{ localStorage.removeItem('token'); nav('/signin'); };

  return (
    <div className={styles.home}>
      {/* TOPBAR */}
      <header className={styles.topbar}>
        <div className={styles.topbar__left}>
          <img src={gradientLogo} alt="Geotagger" className={styles.logo__icon} />
          <span className={styles.logo__text}>
            <span className={styles['logo__text--primary']}>Geo</span>tagger
          </span>
        </div>
        <nav className={styles.topbar__nav}>
          <Link to="/home" className={styles.topbar__link}>Home</Link>
          <button onClick={()=>setMenuOpen(true)} className={styles.topbar__link}>
            {fullName || 'Profile settings'}
          </button>
          <button onClick={logout} className={styles.topbar__link}>Logout</button>
          <div className={styles.topbar__points}>
            <div className={styles.points__avatar}>
              <img
                src={profile?.profilePictureUrl
                  ? `${API_BASE}${profile.profilePictureUrl}`
                  : avatarPlaceholder}
                alt="avatar" className={styles.points__icon}
              />
            </div>
            <span className={styles.points__value}>
              {profile?.points ?? 0}
            </span>
          </div>
          <button className={styles['btn--icon']} onClick={()=>nav('/add-location')}>
            <img src={plusIcon} alt="Add" />
          </button>
        </nav>
      </header>

{/* HOVER MENU */}
{menuOpen && (
  <div
    className={styles.dropdownMenu}
    onMouseLeave={() => setMenuOpen(false)}
  >
    <button
      className={styles.dropdownItem}
      onClick={() => {
        setEditOpen(true);
        setMenuOpen(false);
      }}
    >
      Change info
    </button>

    <button
      className={styles.dropdownItem}
      onClick={() => {
        setPicOpen(true);
        setMenuOpen(false);
      }}
    >
      Change picture
    </button>

    <button
      className={styles.dropdownItem}
      onClick={() => {
        setPwOpen(true);
        setMenuOpen(false);
      }}
    >
      Change password
    </button>
  </div>
)}


      {/* PROFILE HEADER */}
      <div
        className={styles['profile-header']}
      >
        <div className={styles['profile-avatar']}>
          <img
            src={profile?.profilePictureUrl
              ? `${API_BASE}${profile.profilePictureUrl}`
              : avatarPlaceholder}
            alt={fullName}
          />
        </div>
        <h1 className={styles['profile-name']}>
          {fullName}
        </h1>
      </div>

      {/* MAIN CONTENT */}
      <main className={styles.main}>
        {/* BEST GUESSES */}
        <section className={styles.section}>
          <h2 className={styles.section__title}>My best guesses</h2>
          <div className={`${styles.cards} ${styles['cards--best']}`}>
            {bestCards.map((g,i)=>(
<div
          key={i}
          className={styles.card}
          style={{ backgroundImage: `url(${placeholder})` }}
        >
          <span className={styles.card__label}>
            {g.distanceMeters} m
          </span>
        </div>
            ))}
          </div>
          <button className={`${styles.btn} ${styles['btn--outline']} ${styles['section__btn']}`}>
            Load more
          </button>
        </section>

        {/* MY UPLOADS */}
        <section className={styles.section}>
          <h2 className={styles.section__title}>My uploads</h2>
          <div className={`${styles.cards} ${styles['cards--uploads']}`}>
            {uploadCards.map(u=>(
<div
          key={u.locationId}
          className={`${styles.card} ${styles['upload-card']}`}
          style={{ backgroundImage: `url(${placeholder})` }}
        >
          <button className={styles['edit-btn']}>
            <img src={pencilIcon} alt="Edit"/>
          </button>
          <button className={styles['delete-btn']}>
            <img src={xIcon} alt="Delete"/>
          </button>
        </div>
            ))}
          </div>
          <button className={`${styles.btn} ${styles['btn--outline']} ${styles['section__btn']}`}>
            Load more
          </button>
        </section>
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

   {/* EDIT INFO MODAL */}
<Modal open={editOpen} onClose={() => setEditOpen(false)}>
  <h2 data-highlight="settings.">Profile </h2>
  <p>Change your information.</p>

  <form
    className={styles.editForm}
    onSubmit={(e) => { e.preventDefault(); saveProfile(); }}
  >
    {/* email full width */}
    <div className={styles.field}>
      <label>Email</label>
      <input
        type="email"
        value={mail}
        onChange={e => setMail(e.target.value)}
        required
      />
    </div>

    {/* first + last on one row */}
    <div className={styles.row}>
      <div className={styles.field}>
        <label>First name</label>
        <input
          type="text"
          value={first}
          onChange={e => setFirst(e.target.value)}
          minLength={2}
          required
        />
      </div>
      <div className={styles.field}>
        <label>Last name</label>
        <input
          type="text"
          value={last}
          onChange={e => setLast(e.target.value)}
          minLength={2}
          required
        />
      </div>
    </div>

    {/* links */}
    <div className={styles.links}>
      <button
        type="button"
        className={styles.linkBtn}
        onClick={() => { setPwOpen(true); setEditOpen(false); }}
      >
        Change password
      </button>
      <button
        type="button"
        className={styles.linkBtn}
        onClick={() => { setPicOpen(true); setEditOpen(false); }}
      >
        Change profile picture
      </button>
    </div>

    {/* actions */}
    <div className={styles.actionRow}>
      <button
        type="button"
        className={styles.cancelBtn}
        onClick={() => setEditOpen(false)}
      >
        Cancel
      </button>
      <button type="submit" className={styles.saveBtn}>
        Submit
      </button>
    </div>
  </form>
</Modal>



{/* CHANGE PASSWORD MODAL */}
<Modal open={pwOpen} onClose={() => setPwOpen(false)}>
  <h2 data-highlight="settings.">Profile </h2>
  <p>Change your password.</p>

  <form
    className={styles.editForm}
    onSubmit={changePw}
  >
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
      <button type="submit" className={styles.saveBtn}>
        Submit
      </button>
    </div>
  </form>
</Modal>

{/* CHANGE PFP MODAL */}
<Modal open={picOpen} onClose={() => setPicOpen(false)}>
  <h2 data-highlight="settings.">Profile </h2>
  <p>Change your profile photo.</p>

  {/* Picture preview / cropper */}
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
          preview ??
          (profile?.profilePictureUrl
            ? `${API_BASE}${profile.profilePictureUrl}`
            : avatarPlaceholder)
        }
        alt="preview"
      />
    </div>
  )}

  {/* Upload button */}
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

  {/* Action row */}
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


{/* FLASH / confirmation */}
{flash && (
  <Modal open onClose={() => setFlash(null)}>
    <div className={styles.flashBody}>
      <h3 className={styles.flashTitle}>Information changed.</h3>
      <p className={styles.flashSubtitle}>Your settings are saved.</p>

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
