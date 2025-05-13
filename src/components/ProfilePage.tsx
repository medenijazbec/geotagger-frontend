import React, {
  useEffect,
  useState,
  useRef,
  ChangeEvent,
  FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import Cropper, { Area } from "react-easy-crop";
import getCroppedImg from "../utils/getCroppedImg";
import styles from "./ProfilePage.module.css";
import { API_BASE } from "../config";

const CROP_PX = 180;

interface UserMe {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePictureUrl?: string;
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};
const Modal: React.FC<ModalProps> = ({ open, onClose, children }) =>
  !open ? null : (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalBody} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

const ProfilePage: React.FC = () => {
  const nav = useNavigate();
  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  // ─── state ─────────────────────────────────────────
  const [me, setMe] = useState<UserMe | null>(null);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [mail, setMail] = useState("");
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(
    null
  );

  // ─── modal state ───────────────────────────────────
  const [pwOpen, setPwOpen] = useState(false);
  const [picOpen, setPicOpen] = useState(false);

  // ─── cropping state ────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const cropperRef = useRef<HTMLDivElement>(null);

  // ─── fetch profile once ─────────────────────────────
  useEffect(() => {
    if (!token) {
      nav("/login");
      return;
    }
    fetch(`${API_BASE}/api/Profile/me`, auth)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((u: UserMe) => {
        setMe(u);
        setFirst(u.firstName);
        setLast(u.lastName);
        setMail(u.email);
      })
      .catch(() => setFlash({ ok: false, text: "Could not load profile." }))
      .finally(() => setLoading(false));
  }, [token, nav]);

  if (loading)
    return (
      <div className={styles.emptyState}>
        <h3>Loading…</h3>
      </div>
    );
  if (!me)
    return (
      <div className={styles.emptyState}>
        <h3 className={styles.emptyStateTitle}>Oops, nothing here!</h3>
        <p className={styles.emptyStateDesc}>
          We couldn’t fetch your profile. Please try again.
        </p>
        <button
          className={styles.retryBtn}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );

    const isProfileValid =
    first.length >= 2 && first.length <= 50 &&
    last.length  >= 2 && last.length  <= 50 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);

  // ─── save basic profile ─────────────────────────────
  const saveProfile = async () => {

      

    setFlash(null);
    try {
      const resp = await fetch(`${API_BASE}/api/Profile/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...auth.headers },
        body: JSON.stringify({
          firstName: first,
          lastName: last,
          email: mail,
        }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const msg =
          data.error ?? data[0]?.description ?? "Could not save profile.";
        setFlash({ ok: false, text: msg });
        return;
      }
      setFlash({ ok: true, text: "Profile saved." });
    } catch {
      setFlash({ ok: false, text: "Network error. Please try again." });
    }
  };

  // ─── password change ─────────────────────────────────
  const changePw = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    try {
      const r = await fetch(`${API_BASE}/api/Profile/update-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...auth.headers },
        body: JSON.stringify({
          currentPassword: d.get("current"),
          newPassword: d.get("new"),
          confirmNewPassword: d.get("confirm"),
        }),
      });
      if (!r.ok) throw new Error();
      setPwOpen(false);
      setFlash({ ok: true, text: "Password updated." });
    } catch {
      setFlash({ ok: false, text: "Password change failed." });
    }
  };

  // ─── picture select ──────────────────────────────────
  const onSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    //enforce 10 MB max + only common image types ---
    const maxBytes = 10 * 1024 * 1024; // 10 MB
    const allowed = ["image/jpeg", "image/png", "image/gif"];
    if (f.size > maxBytes) {
      alert("File too large (max 10 MB).");
      return;
    }
    if (!allowed.includes(f.type)) {
        alert("Invalid file type. Only JPEG, PNG, GIF allowed.");
        return;
      }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setShowCropper(true);
  };

  const onCropComplete = (_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  };

  const handleCrop = async () => {
    if (!preview || !croppedAreaPixels) return;
    const { blob, file } = await getCroppedImg(preview, croppedAreaPixels);
    setFile(file);
    setPreview(URL.createObjectURL(blob));
    setShowCropper(false);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  // ─── picture upload ──────────────────────────────────
  const savePic = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const up = await fetch(`${API_BASE}/api/ImageUpload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!up.ok) throw new Error("upload");
      const { url } = await up.json();
      await fetch(`${API_BASE}/api/Profile/me`, {
        method: "PUT",
        headers: {
          ...auth.headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profilePictureUrl: url }),
      });
      setMe((m) => (m ? { ...m, profilePictureUrl: url } : m));
      setPicOpen(false);
      setFile(null);
      setPreview(null);
    } catch {
      setFlash({ ok: false, text: "Upload failed." });
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    nav("/login", { replace: true });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Profile settings</h1>

      {/* basic info */}
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label>Name</label>
          <input
            type="text"
            value={first}
            onChange={e => setFirst(e.target.value)}
            minLength={2}
            maxLength={50}
            required
          />
          {(first.length > 0 && (first.length < 2 || first.length > 50)) && (
            <p className={styles.error}>
              First name must be 2–50 characters.
            </p>
          )}
        </div>
        <div className={styles.formGroup}>
          <label>Surname</label>
                    <input
            type="text"
            value={last}
            onChange={e => setLast(e.target.value)}
            minLength={2}
            maxLength={50}
            required
          />
          {(last.length > 0 && (last.length < 2 || last.length > 50)) && (
            <p className={styles.error}>
              Surname must be 2–50 characters.
            </p>
          )}
        </div>
      </div>
      <div className={styles.formCol}>
        <label>Email</label>
        <input
          type="email"
          value={mail}
          onChange={e => setMail(e.target.value)}
          required
        />
        {(mail.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) && (
          <p className={styles.error}>
            Must be a valid email address.
          </p>
        )}
      </div>

      <button className={styles.linkBtn} onClick={() => setPwOpen(true)}>
        Change password
      </button>
      <button className={styles.linkBtn} onClick={() => setPicOpen(true)}>
        Change profile picture
      </button>

      <div className={styles.footer}>
      <button className={styles.cancelBtn} onClick={() => nav(-1)}>
          Cancel
        </button>
        <button
          className={styles.saveBtn}
          onClick={saveProfile}
          disabled={!isProfileValid}
        >
          Save changes
        </button>
      </div>

      {flash && (
        <p className={flash.ok ? styles.okMsg : styles.errMsg}>{flash.text}</p>
      )}

      {/* password modal */}
      <Modal open={pwOpen} onClose={() => setPwOpen(false)}>
        <h2 className={styles.modalTitle}>Change password</h2>
        <form onSubmit={changePw} className={styles.modalForm}>
          <label>Current password</label>
          <input name="current" type="password" required />
          <label>New password</label>
          <input name="new" type="password" required />
          <label>Repeat new password</label>
          <input name="confirm" type="password" required />
          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => setPwOpen(false)}
            >
              Cancel
            </button>
            <button className={styles.saveBtn}>Save changes</button>
          </div>
        </form>
      </Modal>

      {/* picture modal */}
      <Modal
        open={picOpen}
        onClose={() => {
          setPicOpen(false);
          setFile(null);
          setPreview(null);
          setShowCropper(false);
        }}
      >
        <h2 className={styles.modalTitle}>Change profile picture</h2>

        {showCropper && preview ? (
          <div
            ref={cropperRef}
            className={styles.cropContainer}
            style={{
              width: CROP_PX,
              height: CROP_PX,
            }} /* <- add explicit size */
          >
            <Cropper
              image={preview}
              crop={crop}
              zoom={zoom}
              aspect={1}
              /*make crop area = wrapper & round */
              cropShape="round"
              cropSize={{ width: CROP_PX, height: CROP_PX }}
              showGrid={false}
              restrictPosition={false}
              zoomWithScroll
              zoomSpeed={0.2}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
        ) : (
          <img
            className={styles.avatar}
            src={
              preview ??
              (me.profilePictureUrl
                ? `${API_BASE}${me.profilePictureUrl}`
                : "/placeholder.png")
            }
            alt="preview"
          />
        )}

        <input
          id="fileInput"
          type="file"
          accept="image/*"
          hidden
          onChange={onSelect}
        />
        <label htmlFor="fileInput" className={styles.uploadBtn}>
          {showCropper ? "Choose a different file" : "Upload new picture"}
        </label>

        <div className={styles.modalFooter}>
          <button
            className={styles.cancelBtn}
            onClick={() => {
              setPicOpen(false);
              setFile(null);
              setPreview(null);
              setShowCropper(false);
            }}
          >
            Cancel
          </button>
          {showCropper ? (
            <button
              className={styles.saveBtn}
              disabled={!croppedAreaPixels}
              onClick={handleCrop}
            >
              Crop
            </button>
          ) : (
            <button
              className={styles.saveBtn}
              disabled={!file}
              onClick={savePic}
            >
              Save changes
            </button>
          )}
        </div>
      </Modal>

      <div className={styles.bottomRow}>
        <button className={styles.logout} onClick={logout}>
          Log out
        </button>
        <button className={styles.logout} onClick={() => nav("/")}>
          Back to homepage
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
