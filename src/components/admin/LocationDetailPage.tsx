import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Admin.module.css";
import { API_BASE } from "../../config";

interface LocationDetail {
  locationId: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  s3OriginalKey: string;
  s3ThumbnailKey?: string;
  uploaderName: string;
  createdAt: string;
  isActive: boolean;
}

const LocationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const jwt = localStorage.getItem("token");
  const navigate = useNavigate();

  const [location, setLocation] = useState<LocationDetail | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/Admin/locations/${id}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((r) => r.json())
      .then((data: LocationDetail) => {
        setLocation(data);
        setForm({
          title: data.title,
          description: data.description,
          isActive: data.isActive,
        });
      });
  }, [id, jwt]);

  // -------- TYPE-SAFE CHANGE HANDLER --------
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      // Only HTMLInputElement has checked, not HTMLTextAreaElement
      setForm((f) => ({
        ...f,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setForm((f) => ({
        ...f,
        [name]: value,
      }));
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    await fetch(`${API_BASE}/api/Admin/locations/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        isActive: form.isActive,
      }),
    });
    alert("Saved!");
    // Optionally refetch or navigate back
  };

  const handleDelete = async () => {
    if (!confirm("Delete this location?")) return;
    await fetch(`${API_BASE}/api/Admin/locations/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    });
    navigate("/admin/locations", { replace: true });
  };

  if (!location) return <p className={styles.message}>Loading…</p>;

  const imageUrl = location.s3OriginalKey.startsWith("http")
    ? location.s3OriginalKey
    : `/images/${location.s3OriginalKey.split("/").pop()}`;

  return (
    <div className={styles.container}>
      <div className={styles.imageContainer}>
        <img src={imageUrl} alt={location.title} />
      </div>
      <form className={styles.infoContainer} onSubmit={handleSave}>
        <div className={styles.topSection}>
          <label>Title</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
          />

          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            required
          />

          <label>
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />
            Active
          </label>

          <div className={styles.formActions}>
            <button type="submit">Save Changes</button>
            <button
              type="button"
              onClick={handleDelete}
              style={{ background: "#e74c3c", color: "#fff" }}
            >
              Delete Location
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LocationDetailPage;
