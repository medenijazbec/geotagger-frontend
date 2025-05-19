import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import styles from "./Admin.module.css";
import { API_BASE } from "../../config";

interface LocationSummary {
  locationId: number;
  title: string;
  isActive: boolean;
}

interface UserDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string;
  locations: LocationSummary[];
}

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const jwt = localStorage.getItem("token");
  const nav = useNavigate();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profilePictureUrl: "",
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/Admin/users/${id}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    })
      .then((r) => r.json())
      .then((u: UserDetail) => {
        setUser(u);
        setForm({
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          profilePictureUrl: u.profilePictureUrl,
        });
      });
  }, [id, jwt]);

  const save = () => {
    fetch(`${API_BASE}/api/Admin/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(form),
    }).then((r) => {
      if (r.ok) {
        alert("Saved!");
        fetch(`${API_BASE}/api/Admin/users/${id}`, {
          headers: { Authorization: `Bearer ${jwt}` },
        })
          .then((r2) => r2.json())
          .then((u: UserDetail) => setUser(u));
      } else {
        alert("Error saving.");
      }
    });
  };

  const deleteLocation = (locationId: number) => {
    if (!confirm("Delete this location?")) return;
    fetch(`${API_BASE}/api/Admin/locations/${locationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    }).then((r) => {
      if (r.ok && user) {
        setUser({
          ...user,
          locations: user.locations.filter((a) => a.locationId !== locationId),
        });
      }
    });
  };

  if (!user) return <p>Loading…</p>;

  return (
    <div>
      <h2>Edit User</h2>
      <div className={styles.form}>
        <label>First Name</label>
        <input
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
        <label>Last Name</label>
        <input
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
        <label>Email</label>
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <label>Profile Picture URL</label>
        <input
          value={form.profilePictureUrl}
          onChange={(e) =>
            setForm({ ...form, profilePictureUrl: e.target.value })
          }
        />

        <div className={styles.formActions}>
          <button onClick={() => nav(-1)}>Back</button>
          <button onClick={save}>Save</button>
        </div>
      </div>

      <h3>This user’s locations</h3>
      {user.locations.length === 0 ? (
        <p>No locations uploaded by this user.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {user.locations.map((loc) => (
              <tr key={loc.locationId}>
                <td>
                  <Link to={`/admin/locations/${loc.locationId}`}>{loc.title}</Link>
                </td>
                <td>{loc.isActive ? "Active" : "Inactive"}</td>
                <td>
                  <Link to={`/admin/locations/${loc.locationId}`}>Edit</Link>{" "}
                  <button onClick={() => deleteLocation(loc.locationId)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserDetailPage;
